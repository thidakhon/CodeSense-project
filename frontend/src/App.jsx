import React, { useEffect, useRef, useState } from 'react'
import styled, { ThemeProvider, createGlobalStyle, keyframes } from 'styled-components'
import { api, auth } from './api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'
import HeroSection from './components/Hero.jsx'
import FeaturesGrid from './components/FeaturesGrid.jsx'
import AboutUs from './components/AboutUs.jsx'
import heroImage from '/hero.png'

const LS_CONV = 'cw_conversation_id'

const theme = {
  colors: {
    // Background and surfaces
    bg: '#0b0b14',
    bgGradientFrom: '#0b0b14',
    bgGradientTo: '#141430',
    surface: 'rgba(20,20,48,0.8)',
    surfaceElevated: 'rgba(30,30,70,0.75)',
    // Text
    text: '#e6e6f0',
    dim: 'rgba(230,230,240,0.65)',
    aiText: '#c0f4ff',
    // Accents (purple → cyan gradient)
    accentA: '#7b61ff',
    accentB: '#00d0ff',
    accentHoverA: '#6a52ef',
    accentHoverB: '#00b9e6',
    border: 'rgba(255,255,255,0.08)'
  },
  radius: '18px',
}

const Global = createGlobalStyle`
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  html, body, #root { height: 100%; }
  html { scroll-behavior: smooth; }
  body {
    margin: 0;
    min-height: 100vh;
    /* Background now comes from CSS variables and tokens.css */
    background: linear-gradient(180deg, var(--bg-900) 0%, var(--bg-800) 100%);
    color: ${(p) => p.theme.colors.text};
    font-family: 'Porsche Next', system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
  }
  /* scroll reveal base */
  section[data-reveal] { opacity: 0; transform: translateY(10px); transition: opacity .5s ease, transform .5s ease; }
  section[data-reveal].show { opacity: 1; transform: translateY(0); }
  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    section[data-reveal] { opacity: 1 !important; transform: none !important; }
  }
`

const Page = styled.div`
  min-height: 100%;
  display: flex;
  flex-direction: column; /* stack sections vertically */
  align-items: center;    /* center sections horizontally */
  justify-content: flex-start; /* start from top */
  gap: 24px;              /* consistent spacing between sections */
  padding: 24px;
  position: relative;
  @media (max-width: 600px) {
    padding: 8px;
    gap: 16px;
  }
`

// Full-screen animated background color gradients (no image)
const Hero = styled.div`
  position: fixed;
  inset: 0;
  background:
    radial-gradient(1000px 600px at 15% -10%, rgba(255,62,200,0.10), transparent 60%),
    radial-gradient(900px 500px at 90% 10%, rgba(0,230,255,0.10), transparent 60%),
    linear-gradient(180deg, var(--bg-900) 0%, var(--bg-800) 100%);
  opacity: 1;
  pointer-events: none;
  z-index: 0;
  animation: bgFloat 30s ease-in-out infinite alternate;

  &:after {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(1200px 700px at 20% -10%, rgba(133,79,108,0.16), transparent 60%),
      radial-gradient(900px 600px at 100% 0%, rgba(0,230,255,0.12), transparent 65%),
      linear-gradient(160deg, transparent 0%, rgba(0,0,0,0.22) 100%);
    mix-blend-mode: screen;
  }

  @keyframes bgFloat {
    from { transform: scale(1) translateY(0px); }
    to   { transform: scale(1.05) translateY(-10px); }
  }
`

// Soft animated glow orbs
const GlowOrb = styled.div`
  position: fixed;
  z-index: 0;
  pointer-events: none;
  filter: blur(30px);
  opacity: 0.6;
  background: radial-gradient(closest-side, rgba(123,97,255,0.45), transparent 70%);
  width: 420px; height: 420px; border-radius: 50%;
  left: -120px; top: 20%;
  animation: drift 18s ease-in-out infinite alternate;

  &.cyan {
    background: radial-gradient(closest-side, rgba(0,208,255,0.35), transparent 70%);
    width: 500px; height: 500px;
    right: -160px; left: auto; top: 8%;
    animation-duration: 22s;
  }

  @keyframes drift {
    from { transform: translateY(0) translateX(0) scale(1); }
    to   { transform: translateY(-30px) translateX(20px) scale(1.05); }
  }
`

const Navbar = styled.nav`
  position: fixed;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  width: min(1200px, 92vw);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 12px;
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
  backdrop-filter: blur(10px);
  border: 1px solid ${(p) => p.theme.colors.border};
  box-shadow: 0 10px 40px rgba(0,0,0,0.35);
  z-index: 10;
  @media (max-width: 600px) {
    left: 8px;
    right: 8px;
    transform: none;
    width: auto;
    padding: 6px 10px;
    border-radius: 14px;
  }
`

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  letter-spacing: 0.2px;
`

const BrandMark = styled.div`
  width: 36px; height: 36px; border-radius: 12px;
  background: url(${heroImage}) center / cover no-repeat;
  box-shadow: 0 6px 18px rgba(0,0,0,0.35);
`

const NavActions = styled.div`
  display: flex;
  gap: 10px;
  @media (max-width: 600px) {
    gap: 6px;
  }
`

const GlassBtn = styled.button`
  height: 38px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid ${(p) => p.theme.colors.border};
  background: rgba(255,255,255,0.04);
  color: ${(p) => p.theme.colors.text};
  font-weight: 600;
  cursor: pointer;
  transition: all .2s ease;
  &:hover { background: rgba(255,255,255,0.08); }
  @media (max-width: 600px) {
    height: 32px;
    padding: 0 12px;
    font-size: 12px;
  }
`

// ===== Added: components for auth modal and history sidebar =====
const Sidebar = styled.aside`
  position: fixed;
  left: 14px;
  top: 70px;
  bottom: 14px;
  width: 260px;
  padding: 12px;
  border-radius: 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid ${(p) => p.theme.colors.border};
  backdrop-filter: blur(6px);
  overflow: auto;
  z-index: 5;
  @media (max-width: 900px) {
    left: 0;
    right: 0;
    width: auto;
    top: 60px;
    bottom: 0;
    border-radius: 0;
    z-index: 20;
  }
`

const SidebarItem = styled.button`
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  border-radius: 10px;
  margin-bottom: 6px;
  background: rgba(0,0,0,0.25);
  border: 1px solid ${(p) => p.theme.colors.border};
  color: ${(p) => p.theme.colors.text};
  cursor: pointer;
  &:hover { background: rgba(0,0,0,0.35); }
`

const ModalBackdrop = styled.div`
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 20;
`

const ModalCard = styled.div`
  width: 360px; padding: 16px;
  border-radius: 12px;
  background: ${(p) => p.theme.colors.surface};
  border: 1px solid ${(p) => p.theme.colors.border};
`

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid ${(p) => p.theme.colors.border};
  background: rgba(0,0,0,0.25);
  color: ${(p) => p.theme.colors.text};
`

const ChatShell = styled.div`
  width: min(1200px, 92vw); /* match section width */
  height: auto;              /* natural height */
  min-height: clamp(520px, 60vh, 760px); /* balanced responsive height */
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 28px;
  box-shadow: 0 0 30px rgba(123,97,255,0.22), 0 0 60px rgba(0,208,255,0.12), inset 0 1px 0 rgba(255,255,255,0.03);
  backdrop-filter: blur(12px);
  display: grid;
  grid-template-rows: auto 1fr auto;
  overflow: hidden;
  position: relative;
  @media (max-width: 600px) {
    width: 100%;
    height: calc(100vh - 80px);
    border-radius: 18px;
  }
`

const Header = styled.header`
  padding: 12px 16px;
  display: flex;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.03);
  backdrop-filter: blur(8px);
`

const Logo = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: url(${heroImage}) center / cover no-repeat;
  box-shadow: 0 6px 18px rgba(0,0,0,0.35);
`

const Title = styled.h1`
  font-size: 18px;
  margin: 0;
  font-weight: 700;
  letter-spacing: 0.2px;
  h1, h2, h3, h4 { margin: 2px 0; line-height: 1; font-weight: 700; }
`

const ChatScroll = styled.div`
  padding: 10px 12px;
  overflow: auto;
  scroll-behavior: smooth;
`

const Bubble = styled.div`
  max-width: 78%;
  width: fit-content;
  padding: 10px 12px;
  border-radius: 12px;
  line-height: 1.18;
  box-shadow: 0 2px 12px rgba(0,0,0,0.35);
  border: 1px solid rgba(255,255,255,0.10);
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: anywhere;

  &.user {
    margin-left: auto;
    background: rgba(0,0,0,0.25);
  }
  &.ai {
    background: rgba(0, 188, 212, 0.06);
    color: ${(p) => p.theme.colors.aiText};
    max-width: 80%;
    font-size: 0.95rem;
  }
  /* Tight paragraph line spacing */
  p { margin: 0; line-height: 1.12; }
  /* Space only between consecutive paragraphs */
  p + p { margin-top: 1px; }
  p:last-child { margin-bottom: 0; }
  ul, ol { margin: 0 0 1px 0; padding-left: 16px; }
  ul { list-style: disc outside; }
  ol { list-style: decimal outside; }
  li { margin: 0; padding-left: 0; white-space: normal; line-height: 1.18; }
  /* Keep list item paragraphs inline but allow wrapping */
  li > p { margin: 0; display: inline; white-space: normal; }
  /* Compact headings inside messages */
  h1, h2, h3, h4 { margin: 0; line-height: 1.06; font-weight: 700; }
  h1 { font-size: 1rem; }
  h2 { font-size: 0.98rem; }
  h3 { font-size: 0.96rem; }
  h4 { font-size: 0.94rem; }
  /* Inline code should wrap if needed and not push outside */
  li > code, li :not(pre) > code {
    display: inline;
    max-width: 100%;
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  /* Allow wrapping on small screens */
  @media (max-width: 900px) {
    &.ai, &.user { max-width: 100%; }
    li { white-space: normal; }
    li > p { white-space: normal; }
  }
  :not(pre) > code {
    background: rgba(0,0,0,0.45);
    border: 1px solid ${(p) => p.theme.colors.border};
    border-radius: 6px;
    padding: 1px 6px;
  }
  pre {
    background: rgba(0,0,0,0.35);
    padding: 6px 8px;
    border-radius: 8px;
    overflow: auto;
    border: 1px solid ${(p) => p.theme.colors.border};
    margin: 2px 0;
  }
`

const Row = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-end;
  margin: 8px 0;
`

const InputBar = styled.form`
  padding: 10px 12px;
  border-top: 1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.03);
  backdrop-filter: blur(8px);
  display: flex;
  gap: 8px;
  align-items: center;
  @media (max-width: 600px) {
    padding: 8px;
    gap: 6px;
  }
`

const TextArea = styled.textarea`
  resize: none;
  min-height: 48px;
  max-height: 200px;
  flex: 1;
  border: 0;
  background: transparent;
  color: ${(p) => p.theme.colors.text};
  padding: 6px 12px 6px 14px;
  outline: none;
  transition: border-color 0.2s ease;
  font-size: 0.95rem;
  line-height: 1.35;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  

  &::placeholder { color: rgba(255,255,255,0.45); }
  &:focus {
    outline: none;
    line-height: 1.35;
  }
  @media (max-width: 600px) {
    min-height: 44px;
    font-size: 0.92rem;
  }
`

const SendBtn = styled.button`
  height: 44px;
  width: 44px;
  padding: 0;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.18);
  background: linear-gradient(135deg, ${(p) => p.theme.colors.accentA}, ${(p) => p.theme.colors.accentB});
  color: #111;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.06s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 28px rgba(0,230,255,0.18), 0 0 16px rgba(255,62,200,0.22);
  &:hover { transform: translateY(-2px) scale(1.03); }
  &:active { transform: translateY(1px); }
`

const Small = styled.div`
  opacity: 0.65;
  font-size: 12px;
`

const LogosRow = styled.div`
  display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; align-items: center;
  opacity: 0.6;
  @media (max-width: 900px) { grid-template-columns: repeat(3, 1fr); }
`

const LogoBox = styled.div`
  height: 40px; border-radius: 10px;
  border: 1px solid ${(p) => p.theme.colors.border};
  background: rgba(255,255,255,0.04);
  display: flex; align-items: center; justify-content: center;
  padding: 0 8px;
  position: relative;
  overflow: hidden;
  img { max-height: 18px; max-width: 110px; opacity: 0.9; }
`

// subtle fade-up animation for sections
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`

// wrapper for landing sections
const SectionWrap = styled.section`
  background: rgba(255,255,255,0.04);
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: 24px;
  padding: clamp(16px, 4vw, 28px);
  box-shadow: 0 10px 40px rgba(0,0,0,0.25);
  & > * { animation: ${fadeUp} .6s ease both; }
`

function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! Paste your code or ask a programming question. I will explain with concise steps.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const streamAbortRef = useRef(null)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)
  const [history, setHistory] = useState([])
  const [conversationId, setConversationId] = useState(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const googleBtnRef = useRef(null)
  // Responsive: track if viewport is narrow (<= 900px)
  const [isNarrow, setIsNarrow] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 900 : false))
  useEffect(() => {
    function onResize() { setIsNarrow(window.innerWidth <= 900) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  // Voice
  const [listening, setListening] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [autoPunct, setAutoPunct] = useState(true)
  const [dictationBuffer, setDictationBuffer] = useState('')
  const recognitionRef = useRef(null)

  // Google Sign-In: render button when auth modal is open
  useEffect(() => {
    const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!showAuth || !CLIENT_ID) return
    let cancelled = false

    const ensureScript = () => new Promise((resolve) => {
      if (window.google && window.google.accounts && window.google.accounts.id) return resolve()
      const s = document.createElement('script')
      s.src = 'https://accounts.google.com/gsi/client'
      s.async = true
      s.defer = true
      s.onload = () => resolve()
      document.head.appendChild(s)
    })

    const render = async () => {
      await ensureScript()
      if (cancelled) return
      if (!window.google?.accounts?.id || !googleBtnRef.current) return
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (resp) => {
          try {
            const { token, user: u } = await api.googleLogin(resp.credential)
            auth.setToken(token)
            setUser(u)
            setShowAuth(false)
            const convos = await api.historyList().catch(() => [])
            setHistory(convos)
          } catch (e) {
            alert('Google sign-in failed')
          }
        },
      })
      // clear container then render button
      googleBtnRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(googleBtnRef.current, { theme: 'outline', size: 'large', width: 320 })
    }

    render()
    return () => { cancelled = true }
  }, [showAuth])

  function setActiveConversation(id) {
    setConversationId(id)
    if (id) localStorage.setItem(LS_CONV, String(id))
    else localStorage.removeItem(LS_CONV)
  }

  async function newChat() {
    if (!user) return openLogin()
    try {
      const title = 'New chat'
      const id = await api.historyStart(title)
      setActiveConversation(id)
      setHistory((prev) => [{ id, title, created_at: new Date().toISOString() }, ...prev])
      setShowSidebar(true)
      // Reset messages to greeting bubble
      setMessages([{ role: 'assistant', content: 'Hi! Paste your code or ask a programming question. I will explain, fix, and generate code with concise steps.' }])
    } catch (e) {
      alert('Failed to start a new conversation')
    }
  }

  function openLogin() {
    setAuthMode('login')
    setShowAuth(true)
  }

  // No anonymous auto-login; treat user presence as authenticated

  // Decode JWT to show user email without extra API
  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))
      return JSON.parse(jsonPayload)
    } catch { return {} }
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  // Load auth from storage and fetch history; if no token, remain signed out (like ChatGPT)
  useEffect(() => {
    const t = auth.getToken()
    if (!t) return
    const payload = parseJwt(t)
    api.historyList().then(async (convos) => {
      setUser({ email: payload?.email || 'user' })
      setHistory(convos)
      // Attempt to restore last active conversation
      const savedId = Number(localStorage.getItem(LS_CONV) || 0)
      if (savedId) {
        try { await openConversation(savedId) } catch {}
      }
    }).catch(() => {
      // token invalid -> sign out locally
      auth.clear(); setUser(null)
    })
  }, [])

  async function handleAuthSubmit(e) {
    e.preventDefault()
    try {
      const fn = authMode === 'login' ? api.login : api.register
      const { token, user: u } = await fn(email, password)
      auth.setToken(token)
      setUser(u)
      setShowAuth(false)
      setEmail('')
      setPassword('')
      const convos = await api.historyList().catch(() => [])
      setHistory(convos)
      // Restore last conversation if any
      const savedId = Number(localStorage.getItem(LS_CONV) || 0)
      if (savedId) {
        try { await openConversation(savedId) } catch {}
      }
    } catch (err) {
      alert(err.message || 'Auth failed')
    }
  }

  // Guest login via backend /api/auth/auto
  async function continueAsGuest() {
    try {
      const { token, user: u } = await api.auto()
      auth.setToken(token)
      setUser(u)
      setShowAuth(false)
      const convos = await api.historyList().catch(() => [])
      setHistory(convos)
      // Optionally start a new chat automatically for better UX
      if (!conversationId) {
        try {
          const id = await api.historyStart('New chat')
          setActiveConversation(id)
          setHistory((prev) => [{ id, title: 'New chat', created_at: new Date().toISOString() }, ...prev])
        } catch {}
      }
    } catch (e) {
      alert('Guest sign-in failed')
    }
  }

  async function openConversation(id) {
    try {
      const msgs = await api.historyGet(id)
      const converted = msgs.map(m => ({ role: m.role, content: m.content }))
      setMessages(converted.length ? converted : [{ role: 'assistant', content: 'New conversation loaded.' }])
      setActiveConversation(id)
    } catch (e) {
      alert('Failed to load conversation')
    }
  }

  async function sendMessage(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    // Cancel any in-flight stream
    if (streamAbortRef.current) {
      try { streamAbortRef.current.abort() } catch {}
    }

    const next = [...messages, { role: 'user', content: text }, { role: 'assistant', content: '' }]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      // If logged-in and there is no active conversation, create one so history is saved
      let convId = conversationId
      if (user && !convId) {
        try {
          const title = text.slice(0, 60) || 'New chat'
          convId = await api.historyStart(title)
          setActiveConversation(convId)
          // refresh history list
          // Optimistically show it immediately in the sidebar
          setHistory((prev) => [{ id: convId, title, created_at: new Date().toISOString() }, ...prev])
          setShowSidebar(true)
          // Also refresh from server in background to ensure consistency
          api.historyList().then(setHistory).catch(() => {})
        } catch {}
      }
      // Stream into the last assistant bubble
      const controller = new AbortController()
      streamAbortRef.current = controller
      let acc = ''
      await api.chatStream(next, (chunk) => {
        acc += typeof chunk === 'string' ? chunk : String(chunk)
        setMessages((curr) => {
          const copy = curr.slice()
          // last item is assistant placeholder
          copy[copy.length - 1] = { role: 'assistant', content: acc }
          return copy
        })
      }, { signal: controller.signal, conversationId: convId })
      // After the stream finishes, refresh history in case the server auto-created/saved it
      if (user) {
        api.historyList().then(setHistory).catch(() => {})
      }
      // Speak the assistant reply if TTS is enabled
      if (ttsEnabled && acc) speak(acc)
    } catch (err) {
      setMessages((curr) => {
        const copy = curr.slice()
        copy[copy.length - 1] = { role: 'assistant', content: `Error: ${err.message}` }
        return copy
      })
    } finally {
      setLoading(false)
      streamAbortRef.current = null
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      sendMessage(e)
    }
  }

  // Autosize the input textarea as the user types
  function autoResize(el) {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }

  function handleInputChange(e) {
    setInput(e.target.value)
    autoResize(e.target)
  }

  useEffect(() => {
    if (inputRef.current) autoResize(inputRef.current)
  }, [input])

  // ---- Speech-to-text helpers ----
  function capitalizeSmart(s) {
    if (!s) return s
    // Capitalize start of sentence and after punctuation
    return s.replace(/(^\s*[a-z])|([\.\!?\n]\s+[a-z])/g, (m) => m.toUpperCase())
  }

  function applyPunctuation(raw, finalize) {
    let t = raw
    // Common dictation words -> punctuation
    t = t.replace(/\b(new\s*line|line break)\b/gi, '\n')
    t = t.replace(/\b(period|full stop|dot)\b/gi, '.')
    t = t.replace(/\b(comma)\b/gi, ',')
    t = t.replace(/\b(question\s*mark)\b/gi, '?')
    t = t.replace(/\b(exclamation\s*mark|exclamation)\b/gi, '!')
    // Remove filler words often misrecognized
    t = t.replace(/\b(uh|um|erm)\b/gi, '')
    // Space cleanup around punctuation
    t = t.replace(/\s*([,\.\!?])/g, '$1 ')
    // Collapse repeated punctuation artifacts: ". . ." -> "."
    t = t.replace(/([,\.\!?])\s*\1+/g, '$1')
    t = t.replace(/\s+/g, ' ').replace(/\s+\n/g, '\n').replace(/\n\s+/g, '\n').trimStart()
    if (finalize) {
      // Ensure sentence ends with terminal punctuation if it looks like a sentence
      if (t && !/[\.\!?\n]$/.test(t)) t += '.'
    }
    return capitalizeSmart(t)
  }

  // Initialize SpeechRecognition lazily
  function ensureRecognition() {
    if (recognitionRef.current) return recognitionRef.current
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return null
    const rec = new SR()
    rec.lang = import.meta.env.VITE_STT_LANG || 'en-US'
    rec.interimResults = true
    rec.continuous = true
    rec.onresult = (e) => {
      let finalText = ''
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const alt = e.results[i][0]
        const conf = typeof alt.confidence === 'number' ? alt.confidence : 1
        if (conf < 0.8) continue // drop more low-confidence noise
        const t = alt.transcript
        if (e.results[i].isFinal) finalText += t
        else interim += t
      }
      const processedFinal = autoPunct ? applyPunctuation(finalText, true) : finalText
      const processedInterim = autoPunct ? applyPunctuation(interim, false) : interim
      // Append only the finalized chunk to the buffer, and show buffer + interim in the textbox
      setDictationBuffer((buf) => (processedFinal ? (buf + (buf && processedFinal ? ' ' : '') + processedFinal).trimStart() : buf))
      setInput((_) => {
        const buf = (typeof _ === 'string') ? _ : ''
        const base = dictationBuffer // latest committed
        const live = processedInterim
        return ((base || '') + (base && live ? ' ' : '') + (live || '')).trimStart()
      })
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    recognitionRef.current = rec
    return rec
  }

  function toggleListening() {
    const rec = ensureRecognition()
    if (!rec) {
      alert('Speech recognition is not supported in this browser. Try Chrome on desktop.')
      return
    }
    if (listening) {
      try { rec.stop() } catch {}
      setListening(false)
      // Commit buffer to input on stop (remove any trailing interim)
      setInput(dictationBuffer.trim())
    } else {
      setDictationBuffer('')
      try { rec.start(); setListening(true) } catch {}
    }
  }

  function speak(text) {
    try {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'en-US'
      u.onstart = () => setSpeaking(true)
      u.onend = () => setSpeaking(false)
      u.onerror = () => setSpeaking(false)
      window.speechSynthesis.speak(u)
    } catch {}
  }

  function stopSpeaking() {
    try { window.speechSynthesis.cancel() } catch {}
    setSpeaking(false)
  }

  // If user toggles TTS off while speaking, stop immediately
  useEffect(() => {
    if (!ttsEnabled && speaking) stopSpeaking()
  }, [ttsEnabled])

  // Reveal animations on scroll for sections
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('section[data-reveal]'))
    if (!els.length) return
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('show')
          obs.unobserve(e.target)
        }
      }
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 })
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <Global />
      <Page>
        <GlowOrb />
        <GlowOrb className="cyan" />
        <Hero aria-hidden="true" />
        <Navbar>
          <Brand>
            <BrandMark /> CodeSense
          </Brand>
          <NavActions>
            <GlassBtn
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); user ? setShowSidebar(s => !s) : openLogin() }}
              aria-label="History"
              title={user ? 'Show history' : 'Login to use history'}
            >
              {showSidebar ? 'Hide History' : 'History'}
            </GlassBtn>
            {user ? (
              <>
                <GlassBtn type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); newChat() }}>New Chat</GlassBtn>
                <GlassBtn
                  type="button"
                  onClick={() => {
                    auth.clear();
                    setUser(null);
                    setHistory([]);
                    setActiveConversation(null); // clears cw_conversation_id
                    setShowSidebar(false);
                    setMessages([{ role: 'assistant', content: 'Hi! Paste your code or ask a programming question. I will explain concise steps.' }]);
                    setInput('');
                  }}
                >
                  Logout
                </GlassBtn>
              </>
            ) : (
              <>
                <GlassBtn type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAuthMode('login'); setShowAuth(true); }}>Login</GlassBtn>
                <GlassBtn type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAuthMode('register'); setShowAuth(true); }}>Sign Up</GlassBtn>
              </>
            )}
          </NavActions>
        </Navbar>
        {showSidebar && (
          <Sidebar>
            <div style={{fontWeight:700, marginBottom:8}}>History</div>
            {history.map(h => (
              <SidebarItem key={h.id} onClick={() => { openConversation(h.id); if (isNarrow) setShowSidebar(false) }}>
                {h.title || `Conversation ${h.id}`}
                <div style={{opacity:0.6, fontSize:12}}>{new Date(h.created_at).toLocaleString()}</div>
              </SidebarItem>
            ))}
            {!history.length && <div style={{opacity:0.6}}>No conversations yet</div>}
          </Sidebar>
        )}
        {/* Landing sections */}
        <HeroSection />
        <FeaturesGrid />
        <AboutUs />
        <ChatShell id="app-chat">
          <Header>
            <Logo />
            <div>
              <Title>CodeSense</Title>
              <Small>Explain & Ask</Small>
            </div>
          </Header>

          <ChatScroll ref={scrollRef}>
            {messages.map((m, i) => (
              <Row key={i}>
                <Bubble className={m.role === 'user' ? 'user' : 'ai'}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSanitize, rehypeHighlight]}
                  >
                    {m.content}
                  </ReactMarkdown>
                </Bubble>
              </Row>
            ))}
            {loading && (
              <Row>
                <Bubble className="ai">Thinking…</Bubble>
              </Row>
            )}
          </ChatScroll>

          <InputBar onSubmit={sendMessage}>
            <TextArea
              ref={inputRef}
              placeholder="Paste your code or ask a question..."
              value={input}
              onChange={handleInputChange}
              onKeyDown={onKeyDown}
            />
            {speaking && (
              <GlassBtn type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); stopSpeaking() }} title="Stop speaking now">
                Stop
              </GlassBtn>
            )}
            <SendBtn type="submit" aria-label="Send">
              ▶ 
            </SendBtn>
          </InputBar>
        </ChatShell>
      </Page>
      {showAuth && (
        <ModalBackdrop onClick={() => setShowAuth(false)}>
          <ModalCard onClick={e => e.stopPropagation()}>
            <h3 style={{marginTop:0}}>{authMode === 'login' ? 'Login' : 'Register'}</h3>
            {/* Google Sign-In Button (if configured) */}
            {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <div style={{display:'grid', gap:8, marginBottom:8}}>
                <div ref={googleBtnRef} />
                <div style={{display:'flex', alignItems:'center', gap:8, opacity:0.7}}>
                  <div style={{height:1, background:'rgba(255,255,255,0.2)', flex:1}} />
                  <div>OR</div>
                  <div style={{height:1, background:'rgba(255,255,255,0.2)', flex:1}} />
                </div>
              </div>
            )}
            <form onSubmit={handleAuthSubmit}>
              <div style={{display:'grid', gap:8}}>
                <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                <div style={{display:'flex', gap:8, justifyContent:'space-between'}}>
                  <GlassBtn type="submit">{authMode === 'login' ? 'Login' : 'Register'}</GlassBtn>
                  <GlassBtn type="button" onClick={() => setAuthMode(m => m === 'login' ? 'register' : 'login')}>
                    {authMode === 'login' ? 'Create account' : 'Have an account? Login'}
                  </GlassBtn>
                </div>
                <div style={{display:'flex', gap:8}}>
                  <GlassBtn type="button" onClick={(e) => { e.preventDefault(); continueAsGuest() }}>
                    Continue as Guest
                  </GlassBtn>
                </div>
              </div>
            </form>
          </ModalCard>
        </ModalBackdrop>
      )}
    </ThemeProvider>
  )
}

export default App
