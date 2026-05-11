const FALLBACK_REDIRECT_URI = 'http://127.0.0.1:5174/auth/callback'

const resolveDefaultRedirectUri = (): string => {
  if (typeof window === 'undefined') {
    return FALLBACK_REDIRECT_URI
  }

  return `${window.location.origin}/auth/callback`
}

export const appConfig = {
  apiBaseUrl: import.meta.env.VITE_ARENA_API_BASE ?? 'http://127.0.0.1:3111',
  oauthAuthorizeUrl:
    import.meta.env.VITE_ARENA_OAUTH_AUTHORIZE_URL ?? 'https://www.are.na/oauth/authorize',
  oauthClientId: import.meta.env.VITE_ARENA_CLIENT_ID ?? '',
  oauthRedirectUri: import.meta.env.VITE_ARENA_REDIRECT_URI ?? resolveDefaultRedirectUri(),
} as const

export const isOauthConfigured = appConfig.oauthClientId.trim().length > 0
