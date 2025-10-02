import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb, createConversationIfNeeded, addMessage, listConversations, getConversationMessages } from './db.js';
import { OAuth2Client } from 'google-auth-library';

const app = express();
const PORT = process.env.PORT || 3002;
const USE_MOCK = String(process.env.USE_MOCK || 'false').toLowerCase() === 'true';
const USE_FALLBACK_ON_ERROR = String(process.env.USE_FALLBACK_ON_ERROR || 'true').toLowerCase() === 'true';

// ===== AI provider & key management (OpenAI or OpenRouter) =====
// AI_PROVIDER can be 'openai' or 'openrouter'. Default: 'openai'.
// Provide multiple keys via *_API_KEYS="key1,key2,..." (comma-separated),
// falling back to single *_API_KEY when only one key is used.
const AI_PROVIDER = String(process.env.AI_PROVIDER || 'openai').toLowerCase();
const OPENROUTER_SITE_URL = process.env.OPENROUTER_SITE_URL || (process.env.CLIENT_ORIGIN || 'http://localhost:5173');
const OPENROUTER_APP_NAME = process.env.OPENROUTER_APP_NAME || 'Code Whisperer';

const OPENAI_KEYS = String(process.env.OPENAI_API_KEYS || process.env.OPENAI_API_KEY || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const OPENROUTER_KEYS = String(process.env.OPENROUTER_API_KEYS || process.env.OPENROUTER_API_KEY || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
let openaiClient = null;
let openaiKeyIndex = 0;
const OPENAI_MAX_RETRIES = Number(process.env.OPENAI_MAX_RETRIES || 3);
const OPENAI_RETRY_BASE_MS = Number(process.env.OPENAI_RETRY_BASE_MS || 3000);

// ===== Simple in-memory rate limiter (per user or IP) =====
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 3);
const rateBuckets = new Map(); // key -> [timestamps]

function rateLimitKey(req) {
  // Prefer authenticated user; else use IP
  return req.userId ? `u:${req.userId}` : `ip:${req.ip || req.headers['x-forwarded-for'] || 'unknown'}`;
}

function rateLimit(req, res, next) {
  const key = rateLimitKey(req);
  const now = Date.now();
  let arr = rateBuckets.get(key) || [];
  // prune old
  arr = arr.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (arr.length >= RATE_LIMIT_MAX_REQUESTS) {
    const retryMs = RATE_LIMIT_WINDOW_MS - (now - arr[0]);
    res.setHeader('Retry-After', Math.ceil(retryMs / 1000));
    return res.status(429).json({ error: 'Rate limit exceeded', retryAfterMs: retryMs, windowMs: RATE_LIMIT_WINDOW_MS, maxRequests: RATE_LIMIT_MAX_REQUESTS });
  }
  arr.push(now);
  rateBuckets.set(key, arr);
  next();
}

function getKeys() {
  return AI_PROVIDER === 'openrouter' ? OPENROUTER_KEYS : OPENAI_KEYS;
}

function buildClientForCurrentKey() {
  const keys = getKeys();
  const key = keys[openaiKeyIndex];
  if (!key) return null;
  if (AI_PROVIDER === 'openrouter') {
    return new OpenAI({
      apiKey: key,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': OPENROUTER_SITE_URL,
        'X-Title': OPENROUTER_APP_NAME,
      },
    });
  }
  return new OpenAI({ apiKey: key });
}

function isRateLimitError(err) {
  const status = err?.status || err?.response?.status;
  const msg = err?.message || err?.response?.data?.error?.message || '';
  return status === 429 || /rate limit/i.test(String(msg));
}

function parseRetryAfter(err) {
  // Prefer explicit Retry-After header
  const h = err?.response?.headers || {};
  const ra = h['retry-after'] || h['Retry-After'];
  if (ra) {
    const sec = Number(ra);
    if (!Number.isNaN(sec) && sec > 0) return sec * 1000;
  }
  // Try to extract seconds from message like "Please try again in 20s"
  const msg = String(err?.message || err?.response?.data?.error?.message || '');
  const m = msg.match(/try again in\s*(\d+)s/i);
  if (m) {
    const sec = Number(m[1]);
    if (!Number.isNaN(sec) && sec > 0) return sec * 1000;
  }
  return 0;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function rotateOpenAIKey() {
  const keys = getKeys();
  if (keys.length <= 1) return false;
  openaiKeyIndex = (openaiKeyIndex + 1) % keys.length;
  openaiClient = null; // rebuild with new key lazily
  return true;
}

// Initialize OpenAI client lazily so the server can start without a key for non-chat endpoints
function getOpenAI() {
  if (USE_MOCK) return null;
  const keys = getKeys();
  if (!keys.length) {
    // If no key and not explicitly in mock mode, fallback to mock to keep local dev unblocked
    return null;
  }
  if (!openaiClient) {
    openaiClient = buildClientForCurrentKey();
  }
  return openaiClient;
}

function getModel() {
  if (AI_PROVIDER === 'openrouter') {
    return process.env.OPENROUTER_MODEL || process.env.OPENAI_MODEL || 'openai/gpt-4o-mini';
  }
  return process.env.OPENAI_MODEL || 'gpt-4o-mini';
}

async function withOpenAIRetry(fn) {
  let attempt = 0;
  let lastErr;
  const maxAttempts = Math.max(1, OPENAI_MAX_RETRIES);
  while (attempt < maxAttempts) {
    const client = getOpenAI();
    try {
      return await fn(client);
    } catch (e) {
      lastErr = e;
      if (!isRateLimitError(e)) throw e;

      // Rotate key if possible, otherwise backoff on the same key
      const rotated = rotateOpenAIKey();
      const retryAfterMs = parseRetryAfter(e);
      const backoff = retryAfterMs || OPENAI_RETRY_BASE_MS * Math.pow(2, attempt);
      attempt++;
      if (attempt >= maxAttempts) break;
      await sleep(backoff);
      if (!rotated) {
        // ensure client will be rebuilt (same key but after delay)
        openaiClient = null;
      }
      continue;
    }
  }
  throw lastErr;
}

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'code-whisperer-backend', time: new Date().toISOString(), mock: USE_MOCK });
});

// Google login with ID token (credential) from Google Identity Services
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body || {};
    if (!credential) return res.status(400).json({ error: 'credential is required' });
    if (!googleClient) return res.status(500).json({ error: 'GOOGLE_CLIENT_ID not configured' });

    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const email = String(payload.email || '').toLowerCase();
    if (!email) return res.status(400).json({ error: 'Google token missing email' });

    const db = getDb();
    // Insert user if not exists
    try {
      db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email, 'oauth:google');
    } catch {}
    const row = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email);
    if (!row) return res.status(500).json({ error: 'Failed to create user' });
    const token = signToken({ id: row.id, email: row.email });
    return res.json({ token, user: { id: row.id, email: row.email } });
  } catch (e) {
    console.error('Google auth error', e);
    return res.status(401).json({ error: 'Invalid Google credential' });
  }
});

// ===== Auth helpers & routes =====
const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function authOptional(req, _res, next) {
  const h = req.headers.authorization || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (m) {
    try {
      const payload = jwt.verify(m[1], JWT_SECRET);
      req.userId = payload.sub;
      req.userEmail = payload.email;
    } catch {
      // ignore invalid
    }
  }
  next();
}

function authRequired(req, res, next) {
  const h = req.headers.authorization || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return res.status(401).json({ error: 'Missing Authorization header' });
  try {
    const payload = jwt.verify(m[1], JWT_SECRET);
    req.userId = payload.sub;
    req.userEmail = payload.email;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const db = getDb();
  const hash = bcrypt.hashSync(String(password), 10);
  try {
    const info = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(String(email).toLowerCase(), hash);
    const user = { id: info.lastInsertRowid, email: String(email).toLowerCase() };
    const token = signToken(user);
    return res.json({ token, user: { id: user.id, email: user.email } });
  } catch (e) {
    if (String(e.message || '').includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    return res.status(500).json({ error: 'Failed to register' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const db = getDb();
  const row = db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?').get(String(email).toLowerCase());
  if (!row) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = bcrypt.compareSync(String(password), row.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = signToken({ id: row.id, email: row.email });
  return res.json({ token, user: { id: row.id, email: row.email } });
});

// Auto-auth: create an anonymous account and return a token (no email/password needed)
app.post('/api/auth/auto', (_req, res) => {
  const db = getDb();
  const rand = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const email = `anon_${rand}@local`; // unique fake email
  const password_hash = 'anon'; // placeholder, not used for login
  try {
    const info = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email, password_hash);
    const user = { id: info.lastInsertRowid, email };
    const token = signToken(user);
    return res.json({ token, user });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to auto-auth', details: e.message });
  }
});

// Streaming chat for faster perceived latency (Server-Sent Events)
app.post('/api/chat/stream', authOptional, rateLimit, async (req, res) => {
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages[] is required' });
    }

// Quick check for casual greetings
function isGreeting(text = '') {
  const t = String(text || '').trim().toLowerCase()
  if (!t) return false
  const re = /^(hi|hello|hey|yo|sup|hola|สวัสดี|hai|konnichiwa|bonjour|ciao)(\b|!|\.|\s|$)/i
  return re.test(t) || t.includes('say hi') || t.includes('say hello')
}

    const lastUser = messages.filter(m => (m.role || 'user') === 'user').slice(-1)[0]?.content || '';
    // Quick greeting path for streaming
    if (isGreeting(lastUser)) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();
      const greet = 'Hello! How can I help with your code today?';
      res.write(`data: ${JSON.stringify(greet)}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }
    if (!isCodeRelated(lastUser)) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();
      const policy = `I can only help with programming and code-related questions.\n\nPlease include code, an error message, or describe your programming task.`
      res.write(`data: ${JSON.stringify(policy)}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const client = getOpenAI();
    // Mock path: stream a canned message
    if (!client) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();
      const chunks = [
        'Mock mode active. ',
        'Set OPENAI_API_KEY/OPENAI_API_KEYS (or AI_PROVIDER=openrouter with OPENROUTER_API_KEY/OPENROUTER_API_KEYS) in backend/.env ',
        'to enable real responses.'
      ];
      for (const c of chunks) {
        res.write(`data: ${JSON.stringify(c)}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const chatMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(m => ({ role: m.role || 'user', content: String(m.content || '') }))
    ];
    const model = getModel();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      const stream = await withOpenAIRetry((c) => c.chat.completions.create({
        model,
        messages: chatMessages,
        temperature: 0.2,
        stream: true,
      }));

      let acc = '';
      for await (const part of stream) {
        const delta = part.choices?.[0]?.delta?.content || '';
        if (delta) {
          acc += delta;
          res.write(`data: ${JSON.stringify(delta)}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
      res.end();

      // Save after streaming completes if authenticated
      if (req.userId) {
        try {
          const userId = req.userId;
          let conversationId = req.body?.conversationId;
          if (!conversationId) {
            const title = String(messages.filter(m => (m.role || 'user') === 'user').slice(-1)[0]?.content || 'New chat').slice(0, 60);
            conversationId = createConversationIfNeeded(userId, title);
          }
          addMessage(conversationId, 'user', String(messages.filter(m => (m.role || 'user') === 'user').slice(-1)[0]?.content || ''));
          addMessage(conversationId, 'assistant', String(acc));
        } catch {}
      }
    } catch (apiErr) {
      console.error('OpenAI stream error:', apiErr?.response?.data || apiErr?.message || apiErr);
      if (USE_FALLBACK_ON_ERROR) {
        const outline = 'Streaming fallback: unable to reach AI service right now.';
        res.write(`data: ${JSON.stringify(outline)}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
      }
      res.status(502).json({ error: 'Upstream AI service failed', details: apiErr?.message });
    }
  } catch (err) {
    console.error('Stream chat error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream response', details: err.message });
    } else {
      try { res.end(); } catch {}
    }
  }
});

// (old getOpenAI removed; new implementation is above with multi-key support)

const SYSTEM_PROMPT = `You are Code Whisperer, an expert senior software engineer.
- Explain code clearly with concise steps and when helpful, short examples.
- Prefer practical, copy-pastable snippets.
- When asked for code, provide minimal viable solutions first, then improvements.
- Use markdown with fenced code blocks and brief bullet explanations.
`;

// Simple heuristic to detect whether a prompt is code-related
function isCodeRelated(text = '') {
  if (!text) return false;
  const t = String(text).toLowerCase();
  // Obvious indicators: code fences, common keywords, stack traces, file extensions
  const patterns = [
    /```[a-zA-Z]*[\s\S]*```/, // fenced code block
    /\b(function|const|let|var|class|interface|enum|import|export|require|console\.log)\b/,
    /\bdef\b|\bprint\(|\bimport\s+[a-z_][a-z0-9_]*\b/, // python
    /<\/?[a-z]+[^>]*>/, // html tags
    /\bpublic\s+static\s+void\b|System\.out\.println/, // java
    /#include\s+<[^>]+>/, // c/c++
    /\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b\s+FROM\b/i, // SQL
    /\bTypeError\b|\bReferenceError\b|\bNullPointerException\b|\bstack trace\b/i,
    /\.(js|jsx|ts|tsx|py|java|cs|cpp|c|go|rb|php|html|css|json|sql)\b/,
    /[{;}()]=?|=>/, // typical code symbols
  ];
  if (patterns.some((p) => p.test(t))) return true;

  // Also allow conceptual programming questions without code samples
  const languageAndTechTerms = [
    'python','javascript','typescript','java','c++','c#','go','golang','rust','ruby','php','swift','kotlin','scala','sql','html','css','bash','shell','regex','json','yaml','toml',
    'react','vue','svelte','angular','next.js','node','express','django','flask','fastapi','spring','laravel','rails','.net','kubernetes','docker',
    'algorithm','time complexity','space complexity','big o','data structure','binary tree','linked list','hash map','recursion','dynamic programming',
    'unit test','integration test','jest','pytest','unittest','mocha','vitest',
    'compiler','interpreter','runtime','package.json','npm','yarn','pnpm','pip','virtualenv','venv','gradle','maven','makefile','cmake',
    'api','ai','js','sdk','endpoint','database','query','orm','sql join','frontend','backend','transaction','index'
  ];
  if (languageAndTechTerms.some(term => t.includes(term))) return true;

  // Generic programming terms that indicate code context
  const generic = [
    'code','programming','software bug','exception','stacktrace','stack trace','refactor','debug','build error','lint','linter',
    // common CS concepts and terms a beginner may ask about
    'loop','for loop','while loop','do while','conditional','if statement','switch statement','variable','function','method','class','object','array','list','map','dictionary','set','stack','queue','pointer','recursion'
  ];
  return generic.some(term => t.includes(term));
}

// Lightweight greeting detector for quick replies without calling the model
function isGreeting(text = '') {
  const t = String(text || '').trim().toLowerCase();
  if (!t) return false;
  const re = /^(hi|hello|hey|yo|sup|hola|hai|konnichiwa|bonjour|ciao)(\b|!|\.|\s|$)/i;
  return re.test(t) || t.includes('say hi') || t.includes('say hello');
}

app.get('/api/history/:id', authRequired, (req, res) => {
  const convId = Number(req.params.id);
  const msgs = getConversationMessages(convId, 500);
  res.json({ messages: msgs });
});

app.get('/api/history', authRequired, (req, res) => {
  const convos = listConversations(req.userId, 50);
  res.json({ conversations: convos });
});

app.post('/api/history/start', authRequired, (req, res) => {
  const { title } = req.body || {};
  const t = String(title || 'New chat').slice(0, 60);
  const id = createConversationIfNeeded(req.userId, t);
  res.json({ conversationId: id });
});

app.post('/api/chat', authOptional, rateLimit, async (req, res) => {
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages[] is required' });
    }

    const lastUser = messages.filter(m => (m.role || 'user') === 'user').slice(-1)[0]?.content || '';
    // Quick greeting path
    if (isGreeting(lastUser)) {
      const reply = 'Hello! How can I help with your code today?';
      return res.json({ reply, model: 'local:greeting' });
    }
    if (!isCodeRelated(lastUser)) {
      const reply = `I can only help with programming and code-related questions.\n\nPlease include code, an error message, or describe your programming task.\n\nExamples I can help with:\n- Debugging a stack trace or error\n- Refactoring a function or component\n- Writing a script, query, or configuration\n- Explaining a code snippet or library usage`;
      return res.json({ reply, model: 'policy:code-only' });
    }

    const client = getOpenAI();
    // Mock reply path
    if (!client) {
      const lastUser = messages.filter(m => (m.role || 'user') === 'user').slice(-1)[0]?.content || '';
      const reply = `**Mock Response (no API key set)**\n\nYou asked:\n\n> ${lastUser}\n\nHere is how I'd approach this:\n\n1. Identify the goal and constraints.\n2. Draft a minimal working example.\n3. Iterate with tests.\n\nExample snippet:\n\n\n\n\`\`\`js\nfunction example() {\n  return 'Hello from mock mode!';\n}\nconsole.log(example());\n\`\`\`\n\nEnable real AI responses by setting \`OPENAI_API_KEY/OPENAI_API_KEYS\` (or set \`AI_PROVIDER=openrouter\` with \`OPENROUTER_API_KEY/OPENROUTER_API_KEYS\`) in \`backend/.env\`.\n`;
      return res.json({ reply, model: 'mock' });
    }

    // Ensure the conversation starts with our system prompt
    const chatMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(m => ({ role: m.role || 'user', content: String(m.content || '') }))
    ];

    // Choose a default model; allow override via env/provider
    const model = getModel();

    try {
      const completion = await withOpenAIRetry((c) => c.chat.completions.create({
        model,
        messages: chatMessages,
        temperature: 0.2,
      }));

      const reply = completion.choices?.[0]?.message?.content || '';

      // Persist history if authenticated
      const h = req.headers.authorization || '';
      const m = h.match(/^Bearer\s+(.+)$/i);
      if (m) {
        try {
          const payload = jwt.verify(m[1], JWT_SECRET);
          const userId = payload.sub;
          const db = getDb();
          let conversationId = req.body?.conversationId;
          if (!conversationId) {
            const title = String(lastUser).slice(0, 60) || 'New chat';
            conversationId = createConversationIfNeeded(userId, title);
          }
          addMessage(conversationId, 'user', String(lastUser));
          addMessage(conversationId, 'assistant', String(reply));
        } catch {}
      }

      return res.json({ reply, model });
    } catch (apiErr) {
      console.error('OpenAI API error:', apiErr?.response?.data || apiErr?.message || apiErr);
      if (USE_FALLBACK_ON_ERROR) {
        const lastUser = messages.filter(m => (m.role || 'user') === 'user').slice(-1)[0]?.content || '';
        const reason = apiErr?.response?.data?.error?.message || apiErr?.message || 'Unknown error';
        const reply = `**Mock Fallback (API error)**\n\nI couldn\'t reach the AI service. Here\'s a helpful outline instead.\n\nYou asked:\n\n> ${lastUser}\n\nSuggested steps:\n1. Clarify goal and constraints.\n2. Provide a minimal reproducible example.\n3. Iterate with tests and small changes.\n\nError detail (for dev): ${reason}`;
        return res.json({ reply, model: 'mock-fallback', error: reason });
      }
      // If fallback is disabled, surface a clear error to the client
      return res.status(502).json({ error: 'Upstream AI service failed', details: apiErr?.message });
    }
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to generate response', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
