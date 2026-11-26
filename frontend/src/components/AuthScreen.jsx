import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { GoogleIcon, EyeIcon, EyeOffIcon, ShieldIcon, SparkIcon, CodeIcon, CheckIcon } from './Icons'

const Page = styled.div`
  display: flex;
  min-height: 100vh;
  background: #ffffff;
`

const BrandPanel = styled.aside`
  width: 45%;
  flex: 0 0 45%;
  background-color: #0f172a;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
  background-size: 36px 36px;
  color: #f8fafc;
  padding: 40px clamp(28px, 4vw, 64px);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(160deg, rgba(37, 99, 235, 0.1), transparent 55%);
  }

  @media (max-width: 900px) {
    display: none;
  }
`

const BrandTop = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 700;
  position: relative;
  z-index: 1;
`

const LogoMark = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #2563eb;
  color: #fff;
  display: grid;
  place-items: center;
  font-family: 'Fira Code', ui-monospace, monospace;
  font-size: 15px;
  font-weight: 700;
`

const BrandBody = styled.div`
  margin: auto 0;
  max-width: 430px;
  position: relative;
  z-index: 1;
`

const BrandTitle = styled.h1`
  margin: 0 0 16px;
  font-size: clamp(32px, 3.4vw, 46px);
  line-height: 1.12;
  letter-spacing: -0.025em;
  font-weight: 700;
`

const BrandSub = styled.p`
  margin: 0 0 36px;
  color: #94a3b8;
  font-size: 16px;
  line-height: 1.6;
`

const FeatureList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 18px;
`

const Feature = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 12px;

  .icon {
    width: 32px;
    height: 32px;
    flex: 0 0 32px;
    border-radius: 8px;
    display: grid;
    place-items: center;
    background: rgba(37, 99, 235, 0.16);
    color: #93c5fd;
  }

  strong {
    display: block;
    font-size: 14px;
    font-weight: 600;
  }

  span {
    display: block;
    color: #94a3b8;
    font-size: 13px;
    margin-top: 2px;
  }
`

const BrandFoot = styled.div`
  position: relative;
  z-index: 1;
  color: #64748b;
  font-size: 12px;
`

const FormPanel = styled.main`
  width: 55%;
  flex: 1 1 55%;
  background: #ffffff;
  color: #0f172a;
  display: grid;
  place-items: center;
  padding: 32px 24px;

  @media (max-width: 900px) {
    width: 100%;
    flex-basis: 100%;
  }
`

const FormBox = styled.div`
  width: 100%;
  max-width: 400px;
`

const Heading = styled.h2`
  margin: 0 0 6px;
  font-size: 28px;
  letter-spacing: -0.02em;
  font-weight: 700;
`

const Subtext = styled.p`
  margin: 0 0 28px;
  color: #64748b;
  font-size: 14px;
`

const Button = styled.button`
  width: 100%;
  height: 44px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid transparent;
  transition: background 0.15s ease, border-color 0.15s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.primary {
    background: #2563eb;
    color: #ffffff;
  }

  &.primary:hover:not(:disabled) {
    background: #1d4ed8;
  }

  &.secondary {
    background: #ffffff;
    border-color: #e2e8f0;
    color: #0f172a;
  }

  &.secondary:hover:not(:disabled) {
    background: #f8fafc;
    border-color: #cbd5e1;
  }
`

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  margin: 20px 0;

  &::before,
  &::after {
    content: '';
    height: 1px;
    flex: 1;
    background: #e2e8f0;
  }
`

const Field = styled.div`
  margin-bottom: 16px;
`

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 7px;
  color: #334155;
`

const InputWrap = styled.div`
  position: relative;
`

const Input = styled.input`
  width: 100%;
  height: 44px;
  padding: 0 42px 0 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
  font-size: 14px;
  outline: none;

  &::placeholder {
    color: #94a3b8;
  }

  &:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  }
`

const EyeButton = styled.button`
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border: 0;
  background: transparent;
  color: #64748b;
  display: grid;
  place-items: center;
  border-radius: 6px;

  &:hover {
    background: #f1f5f9;
    color: #0f172a;
  }
`

const MetaRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin: -4px 0 20px;
`

const TextButton = styled.button`
  border: 0;
  background: transparent;
  padding: 0;
  color: #2563eb;
  font-size: 13px;
  font-weight: 600;

  &:hover {
    text-decoration: underline;
  }
`

const Notice = styled.div`
  margin-bottom: 16px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.45;

  &.error {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }

  &.info {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
  }
`

const FooterToggle = styled.p`
  margin: 24px 0 0;
  text-align: center;
  color: #64748b;
  font-size: 13px;
`

const HiddenGoogle = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
`

const features = [
  { title: 'Step-by-Step Explanations', text: 'Break down any snippet into clear, readable steps.', icon: <CodeIcon size={17} /> },
  { title: 'Bug & Refactor Insights', text: 'Spot issues early and get practical, minimal fixes.', icon: <SparkIcon size={17} /> },
  { title: 'Multi-Language Support', text: 'From JavaScript and Python to SQL, Go, and more.', icon: <ShieldIcon size={17} /> },
]

export default function AuthScreen({ onLogin, onRegister, onGuest, onGoogle }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const hiddenGoogleRef = useRef(null)

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (!clientId) return undefined
    let cancelled = false

    function ensureScript() {
      return new Promise((resolve) => {
        if (window.google?.accounts?.id) return resolve()
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = () => resolve()
        document.head.appendChild(script)
      })
    }

    ensureScript().then(() => {
      if (cancelled || !window.google?.accounts?.id || !hiddenGoogleRef.current) return
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            setBusy(true)
            setError('')
            await onGoogle(response.credential)
          } catch (e) {
            setError(e.message || 'Google sign-in failed')
          } finally {
            setBusy(false)
          }
        },
      })
      hiddenGoogleRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(hiddenGoogleRef.current, {
        theme: 'outline',
        size: 'large',
        width: 360,
      })
    })

    return () => { cancelled = true }
  }, [clientId, onGoogle])

  function switchMode(next) {
    setMode(next)
    setError('')
    setNotice('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    if (mode === 'register' && password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setBusy(true)
    try {
      if (mode === 'login') await onLogin(email, password)
      else await onRegister(email, password)
    } catch (e) {
      setError(e.message || 'Authentication failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleGuest() {
    setError('')
    setNotice('')
    setBusy(true)
    try {
      await onGuest()
    } catch (e) {
      setError(e.message || 'Could not start the live demo')
    } finally {
      setBusy(false)
    }
  }

  function handleGoogleClick() {
    setError('')
    if (!clientId) {
      setNotice('Google sign-in is not configured on this server. Use email sign-in or the live demo instead.')
      return
    }
    const button = hiddenGoogleRef.current?.querySelector('[role="button"]') || hiddenGoogleRef.current?.firstElementChild
    if (!button) {
      setNotice('Google sign-in is still loading. Please try again in a moment.')
      return
    }
    button.click()
  }

  return (
    <Page>
      <BrandPanel>
        <BrandTop>
          <LogoMark>{'</>'}</LogoMark>
          CodeSense
        </BrandTop>

        <BrandBody>
          <BrandTitle>Understand and debug code clearly.</BrandTitle>
          <BrandSub>
            A focused workspace for reading, fixing, and improving code — without the noise.
          </BrandSub>
          <FeatureList>
            {features.map((f) => (
              <Feature key={f.title}>
                <div className="icon">{f.icon}</div>
                <div>
                  <strong>{f.title}</strong>
                  <span>{f.text}</span>
                </div>
              </Feature>
            ))}
          </FeatureList>
        </BrandBody>

        <BrandFoot>© {new Date().getFullYear()} CodeSense</BrandFoot>
      </BrandPanel>

      <FormPanel>
        <FormBox>
          <Heading>{mode === 'login' ? 'Welcome back' : 'Create your account'}</Heading>
          <Subtext>
            {mode === 'login'
              ? 'Sign in to access your CodeSense workspace'
              : 'Start explaining and debugging code in seconds'}
          </Subtext>

          {error && <Notice className="error">{error}</Notice>}
          {notice && <Notice className="info">{notice}</Notice>}

          <Button type="button" className="secondary" onClick={handleGoogleClick} disabled={busy}>
            <GoogleIcon size={18} />
            Continue with Google
          </Button>
          <HiddenGoogle ref={hiddenGoogleRef} aria-hidden="true" />

          <Divider>OR</Divider>

          <form onSubmit={handleSubmit}>
            <Field>
              <Label htmlFor="auth-email">Email address</Label>
              <Input
                id="auth-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>

            <Field>
              <Label htmlFor="auth-password">Password</Label>
              <InputWrap>
                <Input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <EyeButton
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </EyeButton>
              </InputWrap>
            </Field>

            {mode === 'login' && (
              <MetaRow>
                <TextButton
                  type="button"
                  onClick={() => setNotice("Password reset isn't configured on this server yet. You can sign in with your password or use the live demo.")}
                >
                  Forgot password?
                </TextButton>
              </MetaRow>
            )}

            <Button type="submit" className="primary" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <div style={{ marginTop: 10 }}>
            <Button type="button" className="secondary" onClick={handleGuest} disabled={busy}>
              <CheckIcon size={16} />
              Try live demo
            </Button>
          </div>

          <FooterToggle>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <TextButton type="button" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </TextButton>
          </FooterToggle>
        </FormBox>
      </FormPanel>
    </Page>
  )
}
