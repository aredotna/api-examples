import { arenaQueryKeys, useInvalidateArena, useMe } from '@aredotna/react-query'
import type { User } from '@aredotna/sdk/api'
import { generatePKCE } from '@aredotna/sdk/oauth'
import { useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { getOAuthClient, isOnOAuthRedirectOrigin, redirectToOAuthOrigin } from '../config/oauth'
import {
  clearAuthStorage,
  clearCodeVerifier,
  getCodeVerifier,
  getStoredAccessToken,
  persistTokenResponse,
  setCodeVerifier,
} from '../lib/authStorage'

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  accessToken: string | null
  user: User | null
  error: string | null
}

interface OAuthCallbackParams {
  code?: string | null
  error?: string | null
  errorDescription?: string | null
}

interface AuthContextValue extends AuthState {
  login: () => Promise<void>
  logout: () => void
  handleOAuthCallback: (params: OAuthCallbackParams) => Promise<void>
  isReady: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const invalidateArena = useInvalidateArena()

  const oauthClient = useMemo(() => getOAuthClient(), [])

  // Initialize state with token from sessionStorage (synchronous)
  const [authState, setAuthState] = useState<AuthState>(() => {
    const savedToken = getStoredAccessToken()
    if (savedToken) {
      return {
        isAuthenticated: false, // Will be set to true after user validation
        isLoading: true,
        accessToken: savedToken,
        user: null,
        error: null,
      }
    }

    return {
      isAuthenticated: false,
      isLoading: false,
      accessToken: null,
      user: null,
      error: null,
    }
  })

  const clearSession = useCallback(() => {
    clearAuthStorage()
  }, [])

  const clearArenaQueryCache = useCallback(() => {
    queryClient.removeQueries({ queryKey: arenaQueryKeys.all })
  }, [queryClient])

  const setUnauthenticated = useCallback(
    (message?: string) => {
      clearSession()
      clearArenaQueryCache()
      void invalidateArena()
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        accessToken: null,
        user: null,
        error: message ?? null,
      })
    },
    [clearArenaQueryCache, clearSession, invalidateArena],
  )

  const me = useMe({ enabled: Boolean(authState.accessToken) })

  // Keep auth state in sync with the canonical current-user query.
  // IMPORTANT: every branch must bail out via functional setState if the
  // resulting state is identical, otherwise we churn the provider value on
  // every render and starve sibling subscribers (notably react-router's
  // <Routes>) of commit time.
  useEffect(() => {
    if (!authState.accessToken) {
      setAuthState((prev) => (prev.isLoading ? { ...prev, isLoading: false, error: null } : prev))
      return
    }

    if (me.data) {
      setAuthState((prev) => {
        if (
          prev.isAuthenticated &&
          !prev.isLoading &&
          prev.user === me.data &&
          prev.accessToken === authState.accessToken &&
          prev.error === null
        ) {
          return prev
        }
        return {
          isAuthenticated: true,
          isLoading: false,
          accessToken: authState.accessToken,
          user: me.data,
          error: null,
        }
      })
      return
    }

    if (me.isError) {
      console.error('Failed to validate auth:', me.error)
      setUnauthenticated()
      return
    }

    if (me.isLoading || me.isFetching) {
      setAuthState((prev) => (prev.isLoading ? prev : { ...prev, isLoading: true, error: null }))
    }
  }, [
    authState.accessToken,
    me.data,
    me.error,
    me.isError,
    me.isFetching,
    me.isLoading,
    setUnauthenticated,
  ])

  // Initiate OAuth login flow
  const login = useCallback(async () => {
    try {
      setAuthState((prev) => ({ ...prev, error: null }))

      if (!isOnOAuthRedirectOrigin()) {
        redirectToOAuthOrigin()
        return
      }

      const { codeVerifier, codeChallenge } = await generatePKCE()

      // Store verifier for later use in token exchange
      setCodeVerifier(codeVerifier)

      window.location.href = oauthClient.authorizeUrl({
        codeChallenge,
        scope: 'write',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initiate login'
      setAuthState((prev) => ({ ...prev, error: message }))
    }
  }, [oauthClient])

  // Handle OAuth callback (exchange code for token)
  const handleOAuthCallback = useCallback(
    async ({ code, error, errorDescription }: OAuthCallbackParams) => {
      const callbackError = errorDescription || error

      if (callbackError) {
        setUnauthenticated(callbackError)
        clearCodeVerifier()
        return
      }

      if (!code) {
        setUnauthenticated('Missing authorization code.')
        clearCodeVerifier()
        return
      }

      try {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }))

        const codeVerifier = getCodeVerifier()
        if (!codeVerifier) {
          throw new Error('Code verifier not found. Please try logging in again.')
        }

        const tokenResponse = await oauthClient.exchangeCode({
          code,
          codeVerifier,
        })
        persistTokenResponse(tokenResponse)
        clearArenaQueryCache()
        setAuthState({
          isAuthenticated: false,
          isLoading: true,
          accessToken: tokenResponse.access_token,
          user: null,
          error: null,
        })
        void invalidateArena()

        navigate('/', { replace: true })
      } catch (err) {
        console.error('OAuth callback error:', err)
        const message = err instanceof Error ? err.message : 'Authentication failed'

        setUnauthenticated(message)
      } finally {
        clearCodeVerifier()
      }
    },
    [clearArenaQueryCache, invalidateArena, navigate, oauthClient, setUnauthenticated],
  )

  // Logout
  const logout = useCallback(() => {
    setUnauthenticated()

    navigate('/')
  }, [navigate, setUnauthenticated])

  const value = useMemo<AuthContextValue>(
    () => ({
      ...authState,
      login,
      logout,
      handleOAuthCallback,
      isReady: !authState.isLoading,
    }),
    [authState, login, logout, handleOAuthCallback],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
