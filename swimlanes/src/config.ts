import { OAuth } from '@aredotna/sdk/oauth'

const FALLBACK_REDIRECT_URI = 'http://127.0.0.1:5174/auth/callback'

const resolveDefaultRedirectUri = (): string => {
  if (typeof window === 'undefined') {
    return FALLBACK_REDIRECT_URI
  }

  return `${window.location.origin}/auth/callback`
}

export const appConfig = {
  apiBaseUrl: import.meta.env.VITE_ARENA_API_BASE ?? 'https://api.are.na',
  oauthAuthorizationBaseUrl: import.meta.env.VITE_ARENA_AUTHORIZATION_BASE ?? 'https://www.are.na',
  oauthClientId: import.meta.env.VITE_ARENA_CLIENT_ID ?? '',
  oauthRedirectUri: resolveDefaultRedirectUri(),
} as const

export const getOAuthClient = (): OAuth =>
  new OAuth({
    apiBaseUrl: appConfig.apiBaseUrl,
    authorizationBaseUrl: appConfig.oauthAuthorizationBaseUrl,
    clientId: appConfig.oauthClientId,
    redirectUri: appConfig.oauthRedirectUri,
  })

export const isOauthConfigured = appConfig.oauthClientId.trim().length > 0
