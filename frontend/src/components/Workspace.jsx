import React, { useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { api, auth } from '../api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import rehypeHighlight from 'rehype-highlight'
import {
  MenuIcon, PanelIcon, PlusIcon, SearchIcon, TrashIcon, SunIcon, MoonIcon,
  CopyIcon, CheckIcon, SendIcon, CodeIcon, BugIcon, RefactorIcon, ChatIcon,
  KeyIcon, LogoutIcon, CloseIcon, ClipboardIcon, SparkIcon,
} from './Icons'

const LS_CONV = 'cw_conversation_id'
const GREETING = 'Hi! Paste your code or ask a programming question. I will explain with concise steps.'

const MODES = [
  { id: 'explain', label: 'Explain Code', icon: CodeIcon },
  { id: 'bugs', label: 'Find Bugs', icon: BugIcon },
  { id: 'refactor', label: 'Refactor', icon: RefactorIcon },
  { id: 'general', label: 'General Q&A', icon: ChatIcon },
]

const MODE_PROMPTS = {
  explain: "Explain the code in the user's latest message step by step. Describe what it does, highlight key details, and note any important edge cases.",
  bugs: "Find bugs and potential issues in the user's latest code. Explain each issue and suggest a minimal fix.",
  refactor: "Refactor the user's latest code for clarity and maintainability. Show an improved version and explain the changes.",
  general: '',
}

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 'go', 'rust',
  'php', 'ruby', 'html', 'css', 'sql', 'bash', 'json', 'text',
]

function textFromChildren(node) {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textFromChildren).join('')
  if (node && typeof node === 'object' && node.props) return textFromChildren(node.props.children)
  return ''
}

function CodeBlock({ language, className, children }) {
  const [copied, setCopied] = useState(false)
  const code = textFromChildren(children).replace(/\n$/, '')

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const area = document.createElement('textarea')
      area.value = code
      document.body.appendChild(area)
      area.select()
      try { document.execCommand('copy') } catch {}
      document.body.removeChild(area)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <CodeWrap>
      <CodeHead>
        <CodeLang>{language || 'code'}</CodeLang>
        <CopyBtn type="button" onClick={copy}>
          {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </CopyBtn>
      </CodeHead>
      <Pre><code className={`hljs ${className || ''}`}>{children}</code></Pre>
    </CodeWrap>
  )
}

const markdownComponents = {
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children, ...props }) => {
    const match = /language-([\w+#-]+)/.exec(className || '')
    const isBlock = Boolean(match) || String(textFromChildren(children)).includes('\n')
    if (isBlock) {
      return <CodeBlock language={match?.[1] || 'text'} className={className}>{children}</CodeBlock>
    }
    return <code className={className} {...props}>{children}</code>
  },
  a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>,
}

const Shell = styled.div`
  display: flex;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: ${(p) => p.theme.colors.appBg};
  color: ${(p) => p.theme.colors.text};
`

const Sidebar = styled.aside`
  width: ${(p) => (p.$open ? '260px' : '0px')};
  flex: 0 0 ${(p) => (p.$open ? '260px' : '0px')};
  background: ${(p) => p.theme.colors.surface};
  border-right: 1px solid ${(p) => p.theme.colors.border};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.2s ease, flex-basis 0.2s ease;

  @media (max-width: 900px) {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 50;
    width: min(280px, 85vw);
    flex-basis: auto;
    transform: translateX(${(p) => (p.$open ? '0' : '-100%')});
    transition: transform 0.2s ease;
    box-shadow: ${(p) => (p.$open ? p.theme.colors.shadow : 'none')};
  }
`

const SidebarInner = styled.div`
  width: 260px;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 14px 12px 12px;
`

const BrandLine = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 16px;
  padding: 2px 4px 16px;
`

const LogoMark = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: ${(p) => p.theme.colors.accent};
  color: #fff;
  display: grid;
  place-items: center;
  font-family: 'Fira Code', ui-monospace, monospace;
  font-size: 12px;
  font-weight: 700;
`

const NewButton = styled.button`
  width: 100%;
  height: 38px;
  border-radius: 8px;
  border: 0;
  background: ${(p) => p.theme.colors.accent};
  color: #fff;
  font-weight: 600;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover { background: ${(p) => p.theme.colors.accentHover}; }
`

const SearchWrap = styled.div`
  margin: 12px 0 10px;
  position: relative;
`

const SearchInput = styled.input`
  width: 100%;
  height: 36px;
  padding: 0 10px 0 34px;
  border-radius: 8px;
  border: 1px solid ${(p) => p.theme.colors.border};
  background: ${(p) => p.theme.colors.surfaceAlt};
  color: ${(p) => p.theme.colors.text};
  font-size: 13px;
  outline: none;

  &::placeholder { color: ${(p) => p.theme.colors.muted}; }
  &:focus { border-color: ${(p) => p.theme.colors.accent}; }
`

const SearchIconWrap = styled.span`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: ${(p) => p.theme.colors.muted};
  display: flex;
`

const HistoryArea = styled.div`
  flex: 1;
  overflow-y: auto;
  margin: 0 -4px;
  padding: 0 4px;
`

const GroupLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${(p) => p.theme.colors.muted};
  padding: 12px 8px 6px;
`

const HistoryRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 7px 6px 7px 10px;
  border-radius: 8px;
  cursor: pointer;
  background: ${(p) => (p.$active ? p.theme.colors.accentSoft : 'transparent')};

  &:hover { background: ${(p) => p.theme.colors.surfaceHover}; }
`

const HistoryMain = styled.div`
  flex: 1;
  min-width: 0;
`

const HistoryTitle = styled.div`
  font-size: 13px;
  font-weight: ${(p) => (p.$active ? 600 : 500)};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const HistoryDate = styled.div`
  font-size: 11px;
  color: ${(p) => p.theme.colors.muted};
  margin-top: 1px;
`

const IconBtn = styled.button`
  width: 30px;
  height: 30px;
  border-radius: 7px;
  border: 1px solid transparent;
  background: transparent;
  color: ${(p) => p.theme.colors.muted};
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;

  &:hover {
    color: ${(p) => p.theme.colors.text};
    background: ${(p) => p.theme.colors.surfaceHover};
    border-color: ${(p) => p.theme.colors.border};
  }

  &.danger:hover {
    color: ${(p) => p.theme.colors.danger};
  }
`

const EmptyHistory = styled.div`
  color: ${(p) => p.theme.colors.muted};
  font-size: 13px;
  padding: 16px 8px;
`

const SidebarFooter = styled.div`
  border-top: 1px solid ${(p) => p.theme.colors.border};
  padding-top: 12px;
  margin-top: 8px;
`

const ProfileCard = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 6px;
`

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${(p) => p.theme.colors.accentSoft};
  color: ${(p) => p.theme.colors.accent};
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 13px;
  flex: 0 0 auto;
`

const ProfileEmail = styled.div`
  flex: 1;
  min-width: 0;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const ProfileActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 4px 2px;
`

const MiniButton = styled.button`
  flex: 1;
  height: 32px;
  border-radius: 7px;
  border: 1px solid ${(p) => p.theme.colors.border};
  background: ${(p) => p.theme.colors.surface};
  color: ${(p) => p.theme.colors.text};
  font-size: 11px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover { background: ${(p) => p.theme.colors.surfaceHover}; }
`

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  z-index: 40;

  @media (min-width: 901px) { display: none; }
`

const Main = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
`

const TopBar = styled.header`
  height: 56px;
  flex: 0 0 56px;
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
  background: ${(p) => p.theme.colors.surface};
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
`

const SessionTitle = styled.div`
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 190px;
  flex: 0 1 auto;

  @media (max-width: 700px) { display: none; }
`

const Tabs = styled.div`
  display: flex;
  gap: 2px;
  margin-left: auto;
  padding: 3px;
  border-radius: 9px;
  background: ${(p) => p.theme.colors.surfaceAlt};
  border: 1px solid ${(p) => p.theme.colors.border};
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar { display: none; }
`

const Tab = styled.button`
  height: 30px;
  padding: 0 11px;
  border-radius: 6px;
  border: 0;
  white-space: nowrap;
  background: ${(p) => (p.$active ? p.theme.colors.surface : 'transparent')};
  color: ${(p) => (p.$active ? p.theme.colors.text : p.theme.colors.muted)};
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: ${(p) => (p.$active ? p.theme.colors.shadow : 'none')};

  @media (max-width: 620px) {
    padding: 0 9px;
    font-size: 0;
    gap: 0;
  }
`

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
`

const Stream = styled.div`
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
  padding: 32px 20px 40px;

  @media (max-width: 600px) { padding: 22px 14px 30px; }
`

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 28px 0 12px;
`

const EmptyMark = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 13px;
  background: ${(p) => p.theme.colors.accent};
  color: #fff;
  display: grid;
  place-items: center;
  font-family: 'Fira Code', ui-monospace, monospace;
  font-weight: 700;
  font-size: 18px;
  margin-bottom: 18px;
`

const EmptyTitle = styled.h2`
  margin: 0 0 8px;
  font-size: 24px;
  letter-spacing: -0.02em;
`

const EmptySub = styled.p`
  margin: 0 0 28px;
  color: ${(p) => p.theme.colors.muted};
  max-width: 460px;
`

const QuickGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  width: 100%;

  @media (max-width: 600px) { grid-template-columns: 1fr; }
`

const QuickCard = styled.button`
  text-align: left;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid ${(p) => p.theme.colors.border};
  background: ${(p) => p.theme.colors.surface};
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    border-color: ${(p) => p.theme.colors.accentBorder};
    box-shadow: ${(p) => p.theme.colors.shadow};
  }
`

const QuickIcon = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: ${(p) => p.theme.colors.accentSoft};
  color: ${(p) => p.theme.colors.accent};
  margin-bottom: 10px;
`

const QuickTitle = styled.div`
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 3px;
`

const QuickText = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.colors.muted};
`

const MessageBlock = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 22px;
  align-items: flex-start;

  &.user { flex-direction: row-reverse; }
`

const MsgAvatar = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 8px;
  flex: 0 0 30px;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
  background: ${(p) => p.theme.colors.surfaceAlt};
  color: ${(p) => p.theme.colors.muted};
  border: 1px solid ${(p) => p.theme.colors.border};

  &.assistant {
    background: ${(p) => p.theme.colors.accent};
    border-color: transparent;
    color: #fff;
  }
`

const UserBubble = styled.div`
  max-width: 82%;
  padding: 10px 14px;
  border-radius: 10px;
  background: ${(p) => p.theme.colors.accentSoft};
  border: 1px solid ${(p) => p.theme.colors.accentBorder};
  color: ${(p) => p.theme.colors.text};
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 14px;
`

const AssistantBody = styled.div`
  flex: 1;
  min-width: 0;
  font-size: 14px;
  line-height: 1.65;
`

const MarkdownBody = styled.div`
  p { margin: 0 0 10px; }
  p:last-child { margin-bottom: 0; }
  ul, ol { margin: 0 0 12px; padding-left: 22px; }
  li { margin-bottom: 4px; }
  h1, h2, h3, h4 { margin: 18px 0 8px; line-height: 1.3; }
  h1 { font-size: 20px; }
  h2 { font-size: 18px; }
  h3 { font-size: 16px; }
  h4 { font-size: 14px; }
  a { color: ${(p) => p.theme.colors.accent}; }
  blockquote {
    margin: 0 0 12px;
    padding-left: 12px;
    border-left: 3px solid ${(p) => p.theme.colors.border};
    color: ${(p) => p.theme.colors.muted};
  }
  :not(pre) > code {
    font-family: 'Fira Code', ui-monospace, monospace;
    font-size: 0.88em;
    background: ${(p) => p.theme.colors.surfaceAlt};
    border: 1px solid ${(p) => p.theme.colors.border};
    border-radius: 5px;
    padding: 1px 5px;
  }
  table { border-collapse: collapse; width: 100%; margin-bottom: 12px; }
  th, td { border: 1px solid ${(p) => p.theme.colors.border}; padding: 6px 8px; text-align: left; }
`

const CodeWrap = styled.div`
  margin: 12px 0;
  border: 1px solid ${(p) => p.theme.colors.codeBorder};
  border-radius: 10px;
  overflow: hidden;
  background: ${(p) => p.theme.colors.codeBg};
`

const CodeHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-bottom: 1px solid ${(p) => p.theme.colors.codeBorder};
  background: ${(p) => p.theme.colors.surfaceAlt};
`

const CodeLang = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: ${(p) => p.theme.colors.muted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const CopyBtn = styled.button`
  border: 0;
  background: transparent;
  color: ${(p) => p.theme.colors.muted};
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 6px;
  border-radius: 5px;

  &:hover { color: ${(p) => p.theme.colors.text}; background: ${(p) => p.theme.colors.surfaceHover}; }
`

const Pre = styled.pre`
  margin: 0;
  padding: 14px;
  overflow-x: auto;
  font-family: 'Fira Code', 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12.5px;
  line-height: 1.6;
  color: ${(p) => p.theme.colors.codeText};
`

const Thinking = styled.div`
  color: ${(p) => p.theme.colors.muted};
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
`

const ComposerWrap = styled.div`
  border-top: 1px solid ${(p) => p.theme.colors.border};
  background: ${(p) => p.theme.colors.surface};
  padding: 12px 20px 16px;

  @media (max-width: 600px) { padding: 10px 12px 12px; }
`

const Composer = styled.form`
  max-width: 820px;
  margin: 0 auto;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  border: 1px solid ${(p) => p.theme.colors.borderStrong};
  border-radius: 12px;
  background: ${(p) => p.theme.colors.surface};
  padding: 8px;
  box-shadow: ${(p) => p.theme.colors.shadow};

  &:focus-within { border-color: ${(p) => p.theme.colors.accent}; }
`

const PasteButton = styled.button`
  height: 38px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid ${(p) => p.theme.colors.border};
  background: ${(p) => p.theme.colors.surfaceAlt};
  color: ${(p) => p.theme.colors.text};
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  flex: 0 0 auto;

  &:hover { background: ${(p) => p.theme.colors.surfaceHover}; }

  @media (max-width: 560px) {
    width: 38px;
    padding: 0;
    justify-content: center;
    font-size: 0;
    gap: 0;
  }
`

const TextArea = styled.textarea`
  flex: 1;
  min-height: 38px;
  max-height: 180px;
  resize: none;
  border: 0;
  outline: none;
  background: transparent;
  color: ${(p) => p.theme.colors.text};
  padding: 9px 6px;
  font-size: 14px;
  line-height: 1.45;
  overflow-y: auto;

  &::placeholder { color: ${(p) => p.theme.colors.muted}; }
`

const SendButton = styled.button`
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  border-radius: 8px;
  border: 0;
  background: ${(p) => p.theme.colors.accent};
  color: #fff;
  display: grid;
  place-items: center;

  &:hover:not(:disabled) { background: ${(p) => p.theme.colors.accentHover}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(15, 23, 42, 0.5);
  display: grid;
  place-items: center;
  padding: 20px;
`

const ModalCard = styled.div`
  width: min(640px, 100%);
  max-height: min(86vh, 700px);
  overflow: auto;
  border-radius: 12px;
  background: ${(p) => p.theme.colors.surface};
  border: 1px solid ${(p) => p.theme.colors.border};
  box-shadow: ${(p) => p.theme.colors.shadow};
`

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
`

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 16px;
`

const ModalBody = styled.div`
  padding: 18px;
`

const FieldLabel = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: ${(p) => p.theme.colors.muted};
  margin-bottom: 7px;
`

const Select = styled.select`
  width: 100%;
  height: 40px;
  border-radius: 8px;
  border: 1px solid ${(p) => p.theme.colors.borderStrong};
  background: ${(p) => p.theme.colors.surfaceAlt};
  color: ${(p) => p.theme.colors.text};
  padding: 0 10px;
  margin-bottom: 14px;
`

const CodeTextarea = styled.textarea`
  width: 100%;
  min-height: 220px;
  resize: vertical;
  border-radius: 8px;
  border: 1px solid ${(p) => p.theme.colors.borderStrong};
  background: ${(p) => p.theme.colors.codeBg};
  color: ${(p) => p.theme.colors.codeText};
  padding: 12px;
  font-family: 'Fira Code', ui-monospace, monospace;
  font-size: 13px;
  line-height: 1.5;
  outline: none;

  &:focus { border-color: ${(p) => p.theme.colors.accent}; }
`

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 0 18px 18px;
`

const ActionButton = styled.button`
  height: 38px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid ${(p) => p.theme.colors.border};
  background: ${(p) => p.theme.colors.surface};
  color: ${(p) => p.theme.colors.text};
  font-size: 13px;
  font-weight: 600;

  &.primary {
    background: ${(p) => p.theme.colors.accent};
    border-color: transparent;
    color: #fff;
  }

  &.primary:hover { background: ${(p) => p.theme.colors.accentHover}; }
`

const SettingRow = styled.div`
  padding: 12px 0;
  border-bottom: 1px solid ${(p) => p.theme.colors.border};

  &:last-child { border-bottom: 0; }
`

const SettingLabel = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.colors.muted};
  margin-bottom: 3px;
`

const SettingValue = styled.div`
  font-size: 13px;
  font-weight: 600;
`

function groupHistory(items) {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)

  const groups = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Earlier', items: [] },
  ]

  for (const item of items) {
    const date = new Date(item.created_at)
    if (date >= startOfToday) groups[0].items.push(item)
    else if (date >= startOfYesterday) groups[1].items.push(item)
    else groups[2].items.push(item)
  }
  return groups.filter((g) => g.items.length)
}

export default function Workspace({ user, themeMode, onToggleTheme, onSignOut }) {
  const [messages, setMessages] = useState([{ role: 'assistant', content: GREETING }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const streamAbortRef = useRef(null)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  const [history, setHistory] = useState([])
  const [conversationId, setConversationId] = useState(null)
  const [showSidebar, setShowSidebar] = useState(() => typeof window === 'undefined' ? true : window.innerWidth > 900)
  const [isNarrow, setIsNarrow] = useState(() => typeof window === 'undefined' ? false : window.innerWidth <= 900)
  const [mode, setMode] = useState('explain')
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [codeModal, setCodeModal] = useState(false)
  const [snippet, setSnippet] = useState('')
  const [snippetLang, setSnippetLang] = useState('javascript')
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Voice state kept from the original implementation
  const [listening, setListening] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [autoPunct, setAutoPunct] = useState(true)
  const [dictationBuffer, setDictationBuffer] = useState('')
  const recognitionRef = useRef(null)

  useEffect(() => {
    function onResize() { setIsNarrow(window.innerWidth <= 900) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, loading])

  useEffect(() => {
    api.historyList().then(async (convos) => {
      setHistory(convos)
      const savedId = Number(localStorage.getItem(LS_CONV) || 0)
      if (savedId) {
        try { await openConversation(savedId) } catch {}
      }
    }).catch(() => {})
  }, [])

  function setActiveConversation(id) {
    setConversationId(id)
    if (id) localStorage.setItem(LS_CONV, String(id))
    else localStorage.removeItem(LS_CONV)
  }

  async function newChat() {
    try {
      const title = 'New chat'
      const id = await api.historyStart(title)
      setActiveConversation(id)
      setHistory((prev) => [{ id, title, created_at: new Date().toISOString() }, ...prev])
      setMessages([{ role: 'assistant', content: GREETING }])
      setInput('')
      if (isNarrow) setShowSidebar(false)
    } catch {
      window.alert('Failed to start a new conversation')
    }
  }

  async function openConversation(id) {
    try {
      const msgs = await api.historyGet(id)
      const converted = msgs.map((m) => ({ role: m.role, content: m.content }))
      setMessages(converted.length ? converted : [{ role: 'assistant', content: 'New conversation loaded.' }])
      setActiveConversation(id)
    } catch {
      window.alert('Failed to load conversation')
    }
  }

  async function handleDelete(id) {
    setDeletingId(id)
    try {
      await api.historyDelete(id)
      setHistory((prev) => prev.filter((h) => h.id !== id))
      if (conversationId === id) {
        setActiveConversation(null)
        setMessages([{ role: 'assistant', content: GREETING }])
      }
    } catch (e) {
      window.alert(e.message || 'Failed to delete conversation')
    } finally {
      setDeletingId(null)
    }
  }

  async function sendMessage(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    if (streamAbortRef.current) {
      try { streamAbortRef.current.abort() } catch {}
    }

    const next = [...messages, { role: 'user', content: text }, { role: 'assistant', content: '' }]
    // Mode instructions go in a system message so saved history keeps the user's raw text.
    const payload = mode === 'general'
      ? next
      : [{ role: 'system', content: MODE_PROMPTS[mode] }, ...next]

    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      let convId = conversationId
      if (!convId) {
        try {
          const title = text.slice(0, 60) || 'New chat'
          convId = await api.historyStart(title)
          setActiveConversation(convId)
          setHistory((prev) => [{ id: convId, title, created_at: new Date().toISOString() }, ...prev])
          api.historyList().then(setHistory).catch(() => {})
        } catch {}
      }

      const controller = new AbortController()
      streamAbortRef.current = controller
      let acc = ''
      await api.chatStream(payload, (chunk) => {
        acc += typeof chunk === 'string' ? chunk : String(chunk)
        setMessages((curr) => {
          const copy = curr.slice()
          copy[copy.length - 1] = { role: 'assistant', content: acc }
          return copy
        })
      }, { signal: controller.signal, conversationId: convId })

      api.historyList().then(setHistory).catch(() => {})
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
    if (e.key === 'Enter' && !e.shiftKey) sendMessage(e)
  }

  function autoResize(el) {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 180) + 'px'
  }

  function handleInputChange(e) {
    setInput(e.target.value)
    autoResize(e.target)
  }

  useEffect(() => {
    if (inputRef.current) autoResize(inputRef.current)
  }, [input])

  // ---- Speech-to-text helpers (preserved from the original app) ----
  function capitalizeSmart(s) {
    if (!s) return s
    return s.replace(/(^\s*[a-z])|([\.\!?\n]\s+[a-z])/g, (m) => m.toUpperCase())
  }

  function applyPunctuation(raw, finalize) {
    let t = raw
    t = t.replace(/\b(new\s*line|line break)\b/gi, '\n')
    t = t.replace(/\b(period|full stop|dot)\b/gi, '.')
    t = t.replace(/\b(comma)\b/gi, ',')
    t = t.replace(/\b(question\s*mark)\b/gi, '?')
    t = t.replace(/\b(exclamation\s*mark|exclamation)\b/gi, '!')
    t = t.replace(/\b(uh|um|erm)\b/gi, '')
    t = t.replace(/\s*([,\.\!?])/g, '$1 ')
    t = t.replace(/([,\.\!?])\s*\1+/g, '$1')
    t = t.replace(/\s+/g, ' ').replace(/\s+\n/g, '\n').replace(/\n\s+/g, '\n').trimStart()
    if (finalize && t && !/[\.\!?\n]$/.test(t)) t += '.'
    return capitalizeSmart(t)
  }

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
        if (conf < 0.8) continue
        const t = alt.transcript
        if (e.results[i].isFinal) finalText += t
        else interim += t
      }
      const processedFinal = autoPunct ? applyPunctuation(finalText, true) : finalText
      const processedInterim = autoPunct ? applyPunctuation(interim, false) : interim
      setDictationBuffer((buf) => (processedFinal ? (buf + (buf && processedFinal ? ' ' : '') + processedFinal).trimStart() : buf))
      setInput((current) => {
        const base = dictationBuffer
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
      window.alert('Speech recognition is not supported in this browser. Try Chrome on desktop.')
      return
    }
    if (listening) {
      try { rec.stop() } catch {}
      setListening(false)
      setInput(dictationBuffer.trim())
    } else {
      setDictationBuffer('')
      try { rec.start(); setListening(true) } catch {}
    }
  }

  function speak(text) {
    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.onstart = () => setSpeaking(true)
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)
      window.speechSynthesis.speak(utterance)
    } catch {}
  }

  function stopSpeaking() {
    try { window.speechSynthesis.cancel() } catch {}
    setSpeaking(false)
  }

  useEffect(() => {
    if (!ttsEnabled && speaking) stopSpeaking()
  }, [ttsEnabled])

  function useQuickPrompt(prompt, nextMode) {
    setMode(nextMode)
    setInput(prompt)
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  function insertSnippet() {
    const code = snippet.trim()
    if (!code) return
    const block = `\`\`\`${snippetLang}\n${code}\n\`\`\``
    setInput((prev) => (prev.trim() ? `${prev.trim()}\n\n${block}` : block))
    setCodeModal(false)
    setSnippet('')
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  const groupedHistory = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = history.filter((h) => !q || String(h.title || '').toLowerCase().includes(q))
    return groupHistory(filtered)
  }, [history, search])

  const activeTitle = history.find((h) => h.id === conversationId)?.title || 'New session'
  const userInitial = (user?.email || 'U').trim().charAt(0).toUpperCase()

  function handleSignOut() {
    try { streamAbortRef.current?.abort() } catch {}
    localStorage.removeItem(LS_CONV)
    auth.clear()
    onSignOut()
  }

  const quickCards = [
    { mode: 'explain', icon: CodeIcon, title: 'Explain a snippet', text: 'Understand what a block of code does, line by line.', prompt: 'Explain this code step by step:\n\n' },
    { mode: 'bugs', icon: BugIcon, title: 'Find a bug', text: 'Track down errors and get a minimal, practical fix.', prompt: 'Find bugs in this code and suggest a fix:\n\n' },
    { mode: 'refactor', icon: RefactorIcon, title: 'Refactor code', text: 'Make code cleaner without changing what it does.', prompt: 'Refactor this code for clarity:\n\n' },
    { mode: 'general', icon: SparkIcon, title: 'Ask anything', text: 'Get clear answers about languages, tools, and concepts.', prompt: '' },
  ]

  const isEmpty = messages.length === 1 && messages[0].role === 'assistant' && messages[0].content === GREETING

  return (
    <Shell>
      {showSidebar && isNarrow && <Backdrop onClick={() => setShowSidebar(false)} />}

      <Sidebar $open={showSidebar}>
        <SidebarInner>
          <BrandLine>
            <LogoMark>{'</>'}</LogoMark>
            CodeSense
          </BrandLine>

          <NewButton type="button" onClick={newChat}>
            <PlusIcon size={16} />
            New Session
          </NewButton>

          <SearchWrap>
            <SearchIconWrap><SearchIcon /></SearchIconWrap>
            <SearchInput
              placeholder="Search sessions"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </SearchWrap>

          <HistoryArea>
            {groupedHistory.map((group) => (
              <div key={group.label}>
                <GroupLabel>{group.label}</GroupLabel>
                {group.items.map((h) => (
                  <HistoryRow
                    key={h.id}
                    role="button"
                    tabIndex={0}
                    $active={h.id === conversationId}
                    onClick={() => { openConversation(h.id); if (isNarrow) setShowSidebar(false) }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openConversation(h.id)
                      }
                    }}
                  >
                    <HistoryMain>
                      <HistoryTitle $active={h.id === conversationId}>{h.title || `Session ${h.id}`}</HistoryTitle>
                      <HistoryDate>{new Date(h.created_at).toLocaleString()}</HistoryDate>
                    </HistoryMain>
                    <IconBtn
                      type="button"
                      className="danger"
                      title="Delete session"
                      aria-label={`Delete session ${h.title || h.id}`}
                      disabled={deletingId === h.id}
                      onClick={(e) => { e.stopPropagation(); handleDelete(h.id) }}
                    >
                      <TrashIcon />
                    </IconBtn>
                  </HistoryRow>
                ))}
              </div>
            ))}
            {!groupedHistory.length && <EmptyHistory>No sessions yet. Start a new one above.</EmptyHistory>}
          </HistoryArea>

          <SidebarFooter>
            <ProfileCard>
              <Avatar>{userInitial}</Avatar>
              <ProfileEmail title={user?.email}>{user?.email || 'Guest user'}</ProfileEmail>
            </ProfileCard>
            <ProfileActions>
              <MiniButton type="button" onClick={() => setSettingsOpen(true)}>
                <KeyIcon />
                API Key / Settings
              </MiniButton>
              <MiniButton type="button" onClick={handleSignOut}>
                <LogoutIcon />
                Sign out
              </MiniButton>
            </ProfileActions>
          </SidebarFooter>
        </SidebarInner>
      </Sidebar>

      <Main>
        <TopBar>
          <IconBtn
            type="button"
            onClick={() => setShowSidebar((v) => !v)}
            title={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
            aria-label="Toggle sidebar"
          >
            {showSidebar ? <PanelIcon /> : <MenuIcon />}
          </IconBtn>
          <SessionTitle>{activeTitle}</SessionTitle>

          <Tabs role="tablist" aria-label="Assistant mode">
            {MODES.map((m) => {
              const Icon = m.icon
              return (
                <Tab
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={mode === m.id}
                  title={m.label}
                  $active={mode === m.id}
                  onClick={() => setMode(m.id)}
                >
                  <Icon size={15} />
                  {m.label}
                </Tab>
              )
            })}
          </Tabs>

          <IconBtn
            type="button"
            onClick={onToggleTheme}
            title={themeMode === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
            aria-label="Toggle theme"
          >
            {themeMode === 'light' ? <MoonIcon /> : <SunIcon />}
          </IconBtn>
        </TopBar>

        <Content ref={scrollRef}>
          <Stream>
            {isEmpty ? (
              <EmptyState>
                <EmptyMark>{'</>'}</EmptyMark>
                <EmptyTitle>What can I help you understand?</EmptyTitle>
                <EmptySub>
                  Choose a starting point below, or paste code with the button at the bottom of the screen.
                </EmptySub>
                <QuickGrid>
                  {quickCards.map((card) => {
                    const Icon = card.icon
                    return (
                      <QuickCard key={card.title} type="button" onClick={() => useQuickPrompt(card.prompt, card.mode)}>
                        <QuickIcon><Icon size={17} /></QuickIcon>
                        <QuickTitle>{card.title}</QuickTitle>
                        <QuickText>{card.text}</QuickText>
                      </QuickCard>
                    )
                  })}
                </QuickGrid>
              </EmptyState>
            ) : (
              messages.map((m, i) => (
                <MessageBlock key={i} className={m.role === 'user' ? 'user' : 'assistant'}>
                  <MsgAvatar className={m.role === 'assistant' ? 'assistant' : ''}>
                    {m.role === 'user' ? userInitial : 'CS'}
                  </MsgAvatar>
                  {m.role === 'user' ? (
                    <UserBubble>{m.content}</UserBubble>
                  ) : (
                    <AssistantBody>
                      <MarkdownBody>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeSanitize, rehypeHighlight]}
                          components={markdownComponents}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </MarkdownBody>
                    </AssistantBody>
                  )}
                </MessageBlock>
              ))
            )}

            {loading && (
              <MessageBlock>
                <MsgAvatar className="assistant">CS</MsgAvatar>
                <AssistantBody><Thinking>Thinking…</Thinking></AssistantBody>
              </MessageBlock>
            )}

            {speaking && (
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <ActionButton type="button" onClick={stopSpeaking}>Stop speaking</ActionButton>
              </div>
            )}
          </Stream>
        </Content>

        <ComposerWrap>
          <Composer onSubmit={sendMessage}>
            <PasteButton type="button" onClick={() => setCodeModal(true)} title="Paste a code snippet">
              <ClipboardIcon />
              Paste Code
            </PasteButton>
            <TextArea
              ref={inputRef}
              rows={1}
              placeholder="Ask a question or paste code…"
              value={input}
              onChange={handleInputChange}
              onKeyDown={onKeyDown}
              aria-label="Message"
            />
            {listening && (
              <ActionButton type="button" onClick={toggleListening}>Stop dictation</ActionButton>
            )}
            <SendButton type="submit" disabled={!input.trim() || loading} title="Send message" aria-label="Send message">
              <SendIcon />
            </SendButton>
          </Composer>
        </ComposerWrap>
      </Main>

      {codeModal && (
        <ModalBackdrop onMouseDown={(e) => { if (e.target === e.currentTarget) setCodeModal(false) }}>
          <ModalCard>
            <ModalHeader>
              <ModalTitle>Paste code</ModalTitle>
              <IconBtn type="button" onClick={() => setCodeModal(false)} aria-label="Close"><CloseIcon /></IconBtn>
            </ModalHeader>
            <ModalBody>
              <FieldLabel htmlFor="snippet-lang">Language</FieldLabel>
              <Select id="snippet-lang" value={snippetLang} onChange={(e) => setSnippetLang(e.target.value)}>
                {LANGUAGES.map((lang) => <option key={lang} value={lang}>{lang}</option>)}
              </Select>
              <FieldLabel htmlFor="snippet-code">Code snippet</FieldLabel>
              <CodeTextarea
                id="snippet-code"
                value={snippet}
                onChange={(e) => setSnippet(e.target.value)}
                placeholder="Paste your code here…"
                autoFocus
              />
            </ModalBody>
            <ModalFooter>
              <ActionButton type="button" onClick={() => setCodeModal(false)}>Cancel</ActionButton>
              <ActionButton type="button" className="primary" onClick={insertSnippet} disabled={!snippet.trim()}>
                Insert snippet
              </ActionButton>
            </ModalFooter>
          </ModalCard>
        </ModalBackdrop>
      )}

      {settingsOpen && (
        <ModalBackdrop onMouseDown={(e) => { if (e.target === e.currentTarget) setSettingsOpen(false) }}>
          <ModalCard style={{ maxWidth: 480 }}>
            <ModalHeader>
              <ModalTitle>API Key & Settings</ModalTitle>
              <IconBtn type="button" onClick={() => setSettingsOpen(false)} aria-label="Close"><CloseIcon /></IconBtn>
            </ModalHeader>
            <ModalBody>
              <SettingRow>
                <SettingLabel>Signed in as</SettingLabel>
                <SettingValue>{user?.email || 'Guest user'}</SettingValue>
              </SettingRow>
              <SettingRow>
                <SettingLabel>AI provider</SettingLabel>
                <SettingValue>OpenRouter (server configured)</SettingValue>
              </SettingRow>
              <SettingRow>
                <SettingLabel>API key</SettingLabel>
                <SettingValue>Stored securely in backend/.env</SettingValue>
              </SettingRow>
              <SettingRow>
                <SettingLabel>Sessions in this workspace</SettingLabel>
                <SettingValue>{history.length}</SettingValue>
              </SettingRow>
              <p style={{ color: 'var(--muted)', fontSize: 12, margin: '14px 0 0' }}>
                To change the model or key, update the backend environment file and restart the server.
              </p>
            </ModalBody>
            <ModalFooter>
              <ActionButton type="button" onClick={() => setSettingsOpen(false)}>Close</ActionButton>
            </ModalFooter>
          </ModalCard>
        </ModalBackdrop>
      )}
    </Shell>
  )
}
