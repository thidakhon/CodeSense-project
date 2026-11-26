import React, { useCallback, useEffect, useState } from 'react'
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components'
import { api, auth } from './api'
import AuthScreen from './components/AuthScreen.jsx'
import Workspace from './components/Workspace.jsx'

const lightTheme = {
  scheme: 'light',
  colors: {
    appBg: '#f8fafc',
    surface: '#ffffff',
    surfaceAlt: '#f1f5f9',
    surfaceHover: '#f8fafc',
    border: '#e2e8f0',
    borderStrong: '#cbd5e1',
    text: '#0f172a',
    muted: '#64748b',
    accent: '#2563eb',
    accentHover: '#1d4ed8',
    accentSoft: '#eff6ff',
    accentBorder: '#bfdbfe',
    danger: '#dc2626',
    codeBg: '#f8fafc',
    codeText: '#0f172a',
    codeBorder: '#e2e8f0',
    shadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
  },
}

const darkTheme = {
  scheme: 'dark',
  colors: {
    appBg: '#0b0f19',
    surface: '#111827',
    surfaceAlt: '#0f172a',
    surfaceHover: '#1f2937',
    border: '#1f2937',
    borderStrong: '#334155',
    text: '#e2e8f0',
    muted: '#94a3b8',
    accent: '#3b82f6',
    accentHover: '#60a5fa',
    accentSoft: '#172554',
    accentBorder: '#1e40af',
    danger: '#f87171',
    codeBg: '#0b0f19',
    codeText: '#e2e8f0',
    codeBorder: '#1f2937',
    shadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
  },
}

const Global = createGlobalStyle`
  html { color-scheme: ${(p) => p.theme.scheme}; }
`

const CheckWrap = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: ${(p) => p.theme.colors.appBg};
  color: ${(p) => p.theme.colors.muted};
`

const CheckCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
`

const Spinner = styled.div`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid ${(p) => p.theme.colors.border};
  border-top-color: ${(p) => p.theme.colors.accent};
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`

function parseJwt(token) {
  try {
    const payload = token.split('.')[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(atob(base64).split('').map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`).join(''))
    return JSON.parse(json)
  } catch {
    return {}
  }
}

function App() {
  const [themeMode, setThemeMode] = useState(() => (localStorage.getItem('cw_theme') === 'dark' ? 'dark' : 'light'))
  const [user, setUser] = useState(null)
  const [checkingSession, setCheckingSession] = useState(() => Boolean(auth.getToken()))

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode
    localStorage.setItem('cw_theme', themeMode)
  }, [themeMode])

  useEffect(() => {
    document.title = checkingSession
      ? 'CodeSense'
      : user
        ? 'CodeSense — Workspace'
        : 'CodeSense — Sign In'
  }, [checkingSession, user])

  useEffect(() => {
    const token = auth.getToken()
    if (!token) {
      setCheckingSession(false)
      return
    }
    api.historyList()
      .then(() => {
        const payload = parseJwt(token)
        setUser({ id: payload.sub, email: payload.email || 'user' })
        setCheckingSession(false)
      })
      .catch(() => {
        auth.clear()
        setUser(null)
        setCheckingSession(false)
      })
  }, [])

  const persistSession = useCallback(async (token, nextUser) => {
    auth.setToken(token)
    const payload = parseJwt(token)
    setUser(nextUser || { id: payload.sub, email: payload.email || 'user' })
  }, [])

  const handleLogin = useCallback(async (email, password) => {
    const { token, user: nextUser } = await api.login(email, password)
    await persistSession(token, nextUser)
  }, [persistSession])

  const handleRegister = useCallback(async (email, password) => {
    const { token, user: nextUser } = await api.register(email, password)
    await persistSession(token, nextUser)
  }, [persistSession])

  const handleGuest = useCallback(async () => {
    const { token, user: nextUser } = await api.auto()
    await persistSession(token, nextUser)
  }, [persistSession])

  const handleGoogle = useCallback(async (credential) => {
    const { token, user: nextUser } = await api.googleLogin(credential)
    await persistSession(token, nextUser)
  }, [persistSession])

  const handleSignOut = useCallback(() => {
    auth.clear()
    localStorage.removeItem('cw_conversation_id')
    setUser(null)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeMode((mode) => (mode === 'light' ? 'dark' : 'light'))
  }, [])

  return (
    <ThemeProvider theme={themeMode === 'dark' ? darkTheme : lightTheme}>
      <Global />
      {checkingSession ? (
        <CheckWrap>
          <CheckCard>
            <Spinner />
            Checking your session…
          </CheckCard>
        </CheckWrap>
      ) : user ? (
        <Workspace
          user={user}
          themeMode={themeMode}
          onToggleTheme={toggleTheme}
          onSignOut={handleSignOut}
        />
      ) : (
        <AuthScreen
          onLogin={handleLogin}
          onRegister={handleRegister}
          onGuest={handleGuest}
          onGoogle={handleGoogle}
        />
      )}
    </ThemeProvider>
  )
}

export default App
