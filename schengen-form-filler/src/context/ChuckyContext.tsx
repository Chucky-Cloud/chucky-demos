import { createContext, useContext, ReactNode, useCallback, useState } from 'react'
import { useChuckyAssistant } from '../hooks/useChuckyAssistant'

interface FileAttachment {
  name: string
  type: string
  base64: string
}

interface ToolCall {
  name: string
  args: unknown
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  attachments?: FileAttachment[]
  toolCalls?: ToolCall[]
}

interface ChuckyContextValue {
  messages: Message[]
  isConnected: boolean
  isLoading: boolean
  error: Error | null
  currentActivity: string | null
  token: string | null
  sessionId: string | null
  sendMessage: (content: string, files?: File[]) => Promise<void>
  clearMessages: () => void
  setToken: (token: string) => void
}

const ChuckyContext = createContext<ChuckyContextValue | null>(null)

// ============================================================================
// TOKEN & SESSION MANAGEMENT
// ============================================================================
// Token priority:
// 1. URL parameter ?token=xxx (also saves to localStorage)
// 2. localStorage (persisted from previous URL token)
// 3. Fallback hardcoded token (for development)
//
// Session resumption:
// - URL parameter ?session=xxx will resume an existing session
//
// IMPORTANT: We extract URL params at MODULE LOAD TIME (before React runs)
// to avoid issues with React Strict Mode double-mounting components.
// ============================================================================

const TOKEN_STORAGE_KEY = 'chucky_jwt_token'

interface InitParams {
  token: string | null
  sessionId: string | null
}

// Extract URL params ONCE at module load time (before React mounts)
// This avoids issues with React Strict Mode double-mounting
function extractInitParams(): InitParams {
  const urlParams = new URLSearchParams(window.location.search)
  let token: string | null = null
  let sessionId: string | null = null
  let urlModified = false

  // 1. Check URL for token parameter
  const urlToken = urlParams.get('token')
  if (urlToken) {
    token = urlToken
    // Save to localStorage for persistence
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, urlToken)
      console.log('[Chucky] Token saved from URL to localStorage')
    } catch (e) {
      console.warn('[Chucky] Failed to save token to localStorage:', e)
    }
    urlModified = true
  } else {
    // 2. Check localStorage for token
    try {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
      if (storedToken) {
        console.log('[Chucky] Using token from localStorage')
        token = storedToken
      }
    } catch (e) {
      console.warn('[Chucky] Failed to read token from localStorage:', e)
    }
  }

  // 3. Fallback to default demo token (for initial free usage)
  if (!token) {
    const FALLBACK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZW1vLXVzZXIiLCJpc3MiOiJqZDc3YXowNDl4andzdjBwYmpxYnJrZmp3czd6NTEzNiIsImlhdCI6MTc2ODMyNTk2NywiZXhwIjoxNzY4NDEyMzY3LCJidWRnZXQiOnsiYWkiOjUwMDAwMDAsImNvbXB1dGUiOjcyMDAsIndpbmRvdyI6ImRheSIsIndpbmRvd1N0YXJ0IjoiMjAyNi0wMS0xM1QxNzozOToyNy40NDRaIn19.EJef_wuPoef-Jwm20EKVXGOqVUJ0QSYR5FIum0wk7RM'
    console.log('[Chucky] Using default demo token')
    token = FALLBACK_TOKEN
  }

  // Check URL for session parameter (for resumption)
  const urlSession = urlParams.get('session')
  if (urlSession) {
    sessionId = urlSession
    console.log('[Chucky] Session ID from URL:', urlSession)
    urlModified = true
  }

  // Clean up URL (remove token param for security, keep session for resumption)
  if (urlModified) {
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.delete('token')
    // Keep session param in URL for resumption/refresh
    window.history.replaceState({}, '', newUrl.toString())
  }

  return { token, sessionId }
}

// Extract params ONCE at module load time - this runs before React
const INIT_PARAMS = extractInitParams()
console.log('[Chucky] Module init params:', { token: INIT_PARAMS.token ? '(present)' : '(none)', sessionId: INIT_PARAMS.sessionId || '(none)' })

const DEMO_MODE = false

// Helper to add session ID to URL (for sharing/bookmarking)
function addSessionIdToUrl(sessionId: string) {
  const newUrl = new URL(window.location.href)
  newUrl.searchParams.set('session', sessionId)
  window.history.replaceState({}, '', newUrl.toString())
  console.log('[Chucky] Session ID added to URL:', sessionId)
}

export function ChuckyProvider({ children }: { children: ReactNode }) {
  // Token state - initialized from module-level params
  const [token, setTokenState] = useState<string | null>(INIT_PARAMS.token)

  // Function to update token (saves to localStorage and state)
  const setToken = useCallback((newToken: string) => {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, newToken)
      console.log('[Chucky] Token saved to localStorage')
    } catch (e) {
      console.warn('[Chucky] Failed to save token to localStorage:', e)
    }
    setTokenState(newToken)
  }, [])

  // Callback when a new session is created - add to URL for sharing
  const handleSessionCreated = useCallback((sessionId: string) => {
    addSessionIdToUrl(sessionId)
  }, [])

  // Use the assistant hook with current token
  const assistant = useChuckyAssistant({
    token: token || undefined,
    sessionId: INIT_PARAMS.sessionId || undefined,
    demoMode: DEMO_MODE || !token,
    onSessionCreated: handleSessionCreated,
  })

  // Add token, sessionId, and setToken to the context value
  const contextValue: ChuckyContextValue = {
    ...assistant,
    token,
    setToken,
  }

  return (
    <ChuckyContext.Provider value={contextValue}>
      {children}
    </ChuckyContext.Provider>
  )
}

export function useChucky() {
  const context = useContext(ChuckyContext)
  if (!context) {
    throw new Error('useChucky must be used within a ChuckyProvider')
  }
  return context
}
