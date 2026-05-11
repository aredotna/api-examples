import {
  generatePKCE,
  generateState,
  OAuthError,
  OAuthMissingCodeError,
  OAuthProviderError,
  parseOAuthCallback,
} from '@aredotna/sdk/oauth'
import { getOAuthClient } from '../config'
import type { OAuthToken } from '../domain/model'
import {
  clearPkceTransaction,
  loadPkceTransaction,
  savePkceTransaction,
  saveToken,
} from './session'

const exchangeByCode = new Map<string, Promise<OAuthToken>>()

export const beginOAuthLogin = async (): Promise<never> => {
  const { codeVerifier, codeChallenge } = await generatePKCE()
  const state = generateState()

  savePkceTransaction({
    state,
    codeVerifier,
    createdAt: Date.now(),
  })

  window.location.assign(
    getOAuthClient().authorizeUrl({
      codeChallenge,
      scope: 'write',
      state,
    }),
  )

  throw new OAuthError('Redirecting to OAuth provider')
}

export const maybeFinishOAuthCallback = async (callbackUrl: URL): Promise<OAuthToken | null> => {
  const hasCode = callbackUrl.searchParams.has('code')
  const hasError = callbackUrl.searchParams.has('error')

  if (!hasCode && !hasError) {
    return null
  }

  const callback = parseOAuthCallback(callbackUrl)
  if (!callback.ok) {
    clearPkceTransaction()
    throw callback.error === 'missing_code'
      ? new OAuthMissingCodeError()
      : new OAuthProviderError(callback)
  }

  const tx = loadPkceTransaction()

  if (!callback.state || !tx) {
    clearPkceTransaction()
    throw new OAuthError('Missing PKCE transaction or callback parameters.')
  }

  const callbackState = callback.state
  const existingExchange = exchangeByCode.get(callback.code)
  if (existingExchange) {
    return existingExchange
  }

  const exchangePromise = (async (): Promise<OAuthToken> => {
    const token = await getOAuthClient().exchangeCode({
      code: callback.code,
      codeVerifier: tx.codeVerifier,
      expectedState: tx.state,
      state: callbackState,
    })

    saveToken(token)

    return token
  })()

  exchangeByCode.set(callback.code, exchangePromise)

  try {
    return await exchangePromise
  } finally {
    clearPkceTransaction()
    exchangeByCode.delete(callback.code)
  }
}
