import React from 'react'

const base = (size) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
})

export const MenuIcon = ({ size = 20 }) => (
  <svg {...base(size)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
)

export const PanelIcon = ({ size = 20 }) => (
  <svg {...base(size)}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></svg>
)

export const PlusIcon = ({ size = 18 }) => (
  <svg {...base(size)}><path d="M12 5v14M5 12h14" /></svg>
)

export const SearchIcon = ({ size = 16 }) => (
  <svg {...base(size)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
)

export const TrashIcon = ({ size = 15 }) => (
  <svg {...base(size)}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
)

export const EyeIcon = ({ size = 18 }) => (
  <svg {...base(size)}><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" /><circle cx="12" cy="12" r="2.5" /></svg>
)

export const EyeOffIcon = ({ size = 18 }) => (
  <svg {...base(size)}><path d="M3 3l18 18M10.6 6.2A9.7 9.7 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.6M6.2 6.2C3.5 8 2 12 2 12s3.6 6 10 6a10 10 0 0 0 3.8-.7" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>
)

export const SunIcon = ({ size = 18 }) => (
  <svg {...base(size)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
)

export const MoonIcon = ({ size = 18 }) => (
  <svg {...base(size)}><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" /></svg>
)

export const CopyIcon = ({ size = 15 }) => (
  <svg {...base(size)}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>
)

export const CheckIcon = ({ size = 15 }) => (
  <svg {...base(size)}><path d="m5 12 4 4L19 6" /></svg>
)

export const SendIcon = ({ size = 18 }) => (
  <svg {...base(size)}><path d="m4 12 16-8-6 16-2.6-6.2L4 12Z" /><path d="m11.4 13.8 3.2-3.2" /></svg>
)

export const CodeIcon = ({ size = 18 }) => (
  <svg {...base(size)}><path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" /></svg>
)

export const BugIcon = ({ size = 18 }) => (
  <svg {...base(size)}><rect x="7" y="8" width="10" height="12" rx="5" /><path d="M9 8V6a3 3 0 0 1 6 0v2M3 12h4M17 12h4M5 7l2.5 2M19 7l-2.5 2M5 17l2.5-2M19 17l-2.5-2" /></svg>
)

export const RefactorIcon = ({ size = 18 }) => (
  <svg {...base(size)}><path d="M4 7h11a4 4 0 0 1 0 8H9M4 7l3-3M4 7l3 3M20 17H9a4 4 0 0 1 0-8h6M20 17l-3-3M20 17l-3 3" /></svg>
)

export const ChatIcon = ({ size = 18 }) => (
  <svg {...base(size)}><path d="M20 15a3 3 0 0 1-3 3H9l-5 3v-6a3 3 0 0 1-1-2.2V7a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3v8Z" /></svg>
)

export const KeyIcon = ({ size = 16 }) => (
  <svg {...base(size)}><circle cx="8" cy="15" r="4" /><path d="m11 12 8-8M16 7l2 2M14 9l2 2" /></svg>
)

export const LogoutIcon = ({ size = 16 }) => (
  <svg {...base(size)}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 8l-4 4 4 4M6 12h10" /></svg>
)

export const CloseIcon = ({ size = 18 }) => (
  <svg {...base(size)}><path d="M6 6l12 12M18 6 6 18" /></svg>
)

export const ClipboardIcon = ({ size = 17 }) => (
  <svg {...base(size)}><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4V3h6v1M9 10h6M9 14h6" /></svg>
)

export const SparkIcon = ({ size = 18 }) => (
  <svg {...base(size)}><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM19 16l.6 1.4L21 18l-1.4.6L19 20l-.6-1.4L17 18l1.4-.6L19 16Z" /></svg>
)

export const ShieldIcon = ({ size = 18 }) => (
  <svg {...base(size)}><path d="M12 3 5 6v6c0 4.2 2.9 7.7 7 9 4.1-1.3 7-4.8 7-9V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>
)

export const GoogleIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4Z" />
    <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1a5.9 5.9 0 0 1-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
    <path fill="#FBBC05" d="M6.4 14A6 6 0 0 1 6.1 12c0-.7.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14Z" />
    <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10A5.9 5.9 0 0 1 12 5.9Z" />
  </svg>
)
