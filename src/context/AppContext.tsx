import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { auth, googleProvider } from '../firebase'
import { signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth'

export interface AnalysisResult {
  direction: 'catalysis' | 'biology'
  candidates: Record<string, unknown>[]
  params: { reaction: string; temperature?: number; pressure?: number; organism?: string; goal?: string }
  timestamp: number
}

export interface FeedbackEntry {
  candidate_name: string
  predicted: { activity: number; selectivity: number; stability: number }
  actual: { activity: number; selectivity: number; stability: number }
  notes: string
  timestamp: number
}

interface ToastState {
  message: string
  type: 'success' | 'error'
  key: number
}

interface AppState {
  lastAnalysis: AnalysisResult | null
  feedbackLogs: FeedbackEntry[]
  user: User | null
  authLoading: boolean
}

interface AppContextValue extends AppState {
  setLastAnalysis: (r: AnalysisResult) => void
  addFeedbackLog: (e: FeedbackEntry) => void
  toast: ToastState | null
  showToast: (message: string, type: 'success' | 'error') => void
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const LS_KEY = 'catalystiq_state'

function loadState(): Pick<AppState, 'lastAnalysis' | 'feedbackLogs'> {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { lastAnalysis: null, feedbackLogs: [] }
}

function saveState(s: Pick<AppState, 'lastAnalysis' | 'feedbackLogs'>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ lastAnalysis: s.lastAnalysis, feedbackLogs: s.feedbackLogs }))
  } catch { /* ignore */ }
}

const AppCtx = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Pick<AppState, 'lastAnalysis' | 'feedbackLogs'>>(loadState)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => { saveState(state) }, [state])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const loginWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider)
      showToast('Successfully signed in', 'success')
    } catch (err: any) {
      showToast(err.message || 'Failed to sign in', 'error')
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await signOut(auth)
      showToast('Successfully signed out', 'success')
    } catch (err: any) {
      showToast(err.message || 'Failed to sign out', 'error')
    }
  }, [])

  const setLastAnalysis = useCallback((r: AnalysisResult) => {
    setState(prev => ({ ...prev, lastAnalysis: r }))
  }, [])

  const addFeedbackLog = useCallback((e: FeedbackEntry) => {
    setState(prev => ({ ...prev, feedbackLogs: [...prev.feedbackLogs, e] }))
  }, [])

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type, key: Date.now() })
    setTimeout(() => setToast(null), 4000)
  }, [])

  return (
    <AppCtx.Provider value={{ ...state, user, authLoading, setLastAnalysis, addFeedbackLog, toast, showToast, loginWithGoogle, logout }}>
      {children}
    </AppCtx.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}
