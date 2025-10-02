import axios from 'axios'

// Use environment variable for API URL
// Development: http://localhost:3002
// Production: https://codesense-backend-4fbk.onrender.com
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3002'

console.log('[api] Using backend:', baseURL)

// Simple token helpers
const TOKEN_KEY = 'cw_token'
export const auth = {
  getToken() { return localStorage.getItem(TOKEN_KEY) || '' },
  setToken(t) { if (t) localStorage.setItem(TOKEN_KEY, t) },
  clear() { localStorage.removeItem(TOKEN_KEY) },
}

function authHeaders() {
  const t = auth.getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export const api = {
  async chat(history, { conversationId } = {}) {
    try {
      const { data } = await axios.post(`${baseURL}/api/chat`, { messages: history, conversationId }, { headers: authHeaders() })
      return data.reply
    } catch (err) {
      // Surface more useful Axios error messages to the UI
      if (err.response) {
        // Server responded with a status outside 2xx
        const msg = err.response.data?.error || `HTTP ${err.response.status}`
        throw new Error(msg)
      }
      if (err.request) {
        // Request made but no response received (CORS, network, server down)
        throw new Error('Unable to reach API. Is the backend running?')
      }
      throw err
    }
  },

  // Stream chat using Server-Sent Events for faster perceived latency
  async chatStream(history, onChunk, { signal, conversationId } = {}) {
    const resp = await fetch(`${baseURL}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ messages: history, conversationId }),
      signal,
    })
    if (!resp.ok || !resp.body) {
      throw new Error(`HTTP ${resp.status}`)
    }
    const reader = resp.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let idx
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const raw = buffer.slice(0, idx).trim()
        buffer = buffer.slice(idx + 2)
        if (!raw.startsWith('data:')) continue
        const payload = raw.slice(5).trim()
        if (payload === '[DONE]') return
        try {
          const chunk = JSON.parse(payload)
          onChunk?.(chunk)
        } catch {
          // If not JSON, pass raw text
          onChunk?.(payload)
        }
      }
    }
  },

  // Auth endpoints
  async googleLogin(credential) {
    try {
      const { data } = await axios.post(`${baseURL}/api/auth/google`, { credential })
      return data
    } catch (err) {
      if (err.response) {
        const msg = err.response.data?.error || `HTTP ${err.response.status}`
        throw new Error(msg)
      }
      if (err.request) {
        throw new Error('Unable to reach API. Is the backend running?')
      }
      throw err
    }
  },
  async auto() {
    try {
      const { data } = await axios.post(`${baseURL}/api/auth/auto`)
      return data
    } catch (err) {
      if (err.response) {
        const msg = err.response.data?.error || `HTTP ${err.response.status}`
        throw new Error(msg)
      }
      if (err.request) {
        throw new Error('Unable to reach API. Is the backend running?')
      }
      throw err
    }
  },
  async register(email, password) {
    try {
      const { data } = await axios.post(`${baseURL}/api/auth/register`, { email, password })
      return data
    } catch (err) {
      if (err.response) {
        const msg = err.response.data?.error || `HTTP ${err.response.status}`
        throw new Error(msg)
      }
      if (err.request) {
        throw new Error('Unable to reach API. Is the backend running?')
      }
      throw err
    }
  },
  async login(email, password) {
    try {
      const { data } = await axios.post(`${baseURL}/api/auth/login`, { email, password })
      return data
    } catch (err) {
      if (err.response) {
        const msg = err.response.data?.error || `HTTP ${err.response.status}`
        throw new Error(msg)
      }
      if (err.request) {
        throw new Error('Unable to reach API. Is the backend running?')
      }
        throw err
    }
  },

  // History endpoints
  async historyStart(title) {
    const { data } = await axios.post(`${baseURL}/api/history/start`, { title }, { headers: authHeaders() })
    return data.conversationId
  },
  async historyList() {
    const { data } = await axios.get(`${baseURL}/api/history`, { headers: authHeaders() })
    return data.conversations || []
  },
  async historyGet(id) {
    const { data } = await axios.get(`${baseURL}/api/history/${id}`, { headers: authHeaders() })
    return data.messages || []
  },
}