import { useApp } from '../context/AppContext'

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  )
}

function FlaskIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3v5L4 18a2 2 0 002 2h12a2 2 0 002-2L15 8V3"/>
      <path d="M9 3h6"/>
    </svg>
  )
}

function DnaIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3c0 12 12 18 12 18M18 3c0 12-12 18-12 18"/>
      <path d="M6 9h12M6 15h12"/>
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="1.5"/>
      <circle cx="16" cy="6" r="1.5"/>
      <circle cx="12" cy="12" r="1.5"/>
      <circle cx="18" cy="16" r="1.5"/>
      <circle cx="6" cy="18" r="1.5"/>
      <path d="M3 21V3"/>
      <path d="M21 21H3"/>
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 01-9 9 8.97 8.97 0 01-6.36-2.64"/>
      <path d="M3 12a9 9 0 019-9 8.97 8.97 0 016.36 2.64"/>
      <path d="M21 3v5h-5M3 21v-5h5"/>
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 00-3-3.87"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  )
}

const navItems = [
  { label: 'Overview', icon: HomeIcon },
  { label: 'Discovery', icon: FlaskIcon },
  { label: 'Synthetic Biology', icon: DnaIcon },
  { label: 'Performance Plot', icon: ChartIcon },
  { label: 'Feedback Loop', icon: RefreshIcon },
  { label: 'Collaboration', icon: UsersIcon },
  { label: 'Settings', icon: SettingsIcon },
]

interface SidebarProps {
  active: string
  onTabChange: (tab: string) => void
}

function Sidebar({ active, onTabChange }: SidebarProps) {
  return (
    <aside className="w-full min-h-screen flex flex-col bg-black/40 border-r border-white/10">
      <div className="px-6 pt-6 pb-8">
        <button 
          onClick={() => onTabChange('Overview')} 
          className="font-headline text-xl font-semibold bg-clip-text text-transparent hover:opacity-80 transition block text-left" 
          style={{ backgroundImage: 'linear-gradient(to left, #6366f1, #a855f7, #fcd34d)' }}
        >
          CatalystIQ
        </button>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = active === item.label
          return (
            <button
              key={item.label}
              onClick={() => onTabChange(item.label)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? 'text-foreground bg-white/[0.06] shadow-[inset_3px_0_0_0_#a855f7]'
                  : 'text-foreground/70 hover:text-foreground hover:bg-white/[0.04]'
              }`}
            >
              <Icon />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="px-4 pb-6 pt-4 border-t border-white/10">
        <UserSection />
      </div>
    </aside>
  )
}

function UserSection() {
  const { user, authLoading, loginWithGoogle, logout } = useApp()

  if (authLoading) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-white/5 animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-white/5 rounded w-1/2 animate-pulse" />
          <div className="h-2 bg-white/5 rounded w-1/3 animate-pulse" />
        </div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center justify-between gap-3 group">
        <div className="flex items-center gap-3 min-w-0">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-9 h-9 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-semibold text-white shrink-0">
              {user.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground truncate">{user.displayName || 'User'}</div>
            <div className="text-xs text-foreground/50 truncate">Researcher</div>
          </div>
        </div>
        <button
          onClick={logout}
          title="Sign out"
          className="p-1.5 rounded-md text-foreground/40 hover:text-red-400 hover:bg-white/5 transition opacity-0 group-hover:opacity-100"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={loginWithGoogle}
      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      Sign in with Google
    </button>
  )
}

export default Sidebar
