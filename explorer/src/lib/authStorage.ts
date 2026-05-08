import type { OAuthTokenResponse } from '@aredotna/sdk/oauth'

const STORAGE_KEYS = {
  CODE_VERIFIER: 'oauth_code_verifier',
  ACCESS_TOKEN: 'oauth_access_token',
} as const

export const getStoredAccessToken = () => sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)

export const setCodeVerifier = (verifier: string) =>
  sessionStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, verifier)

export const getCodeVerifier = () => sessionStorage.getItem(STORAGE_KEYS.CODE_VERIFIER)

export const clearCodeVerifier = () => sessionStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER)

const setAccessToken = (token: string) => sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token)
const clearAccessToken = () => sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)

export const persistTokenResponse = (tokenResponse: OAuthTokenResponse) => {
  setAccessToken(tokenResponse.access_token)
}

export const clearAuthStorage = () => {
  clearAccessToken()
  clearCodeVerifier()
}
