import { appConfig } from '../config'
import type { OAuthToken } from '../domain/model'
import { createPkceTransaction } from './pkce'
import {
  clearPkceTransaction,
  loadPkceTransaction,
  savePkceTransaction,
  saveToken,
} from './session'

const OAUTH_RESPONSE_TYPE = 'code'
const exchangeByCode = new Map<string, Promise<OAuthToken>>()

export class OAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OAuthError'
  }
}

export const beginOAuthLogin = async (): Promise<never> => {
  const tx = await createPkceTransaction()

  savePkceTransaction({
    state: tx.state,
    codeVerifier: tx.codeVerifier,
    createdAt: Date.now(),
  })

  const url = new URL(appConfig.oauthAuthorizeUrl)
  url.searchParams.set('client_id', appConfig.oauthClientId)
  url.searchParams.set('redirect_uri', appConfig.oauthRedirectUri)
  url.searchParams.set('response_type', OAUTH_RESPONSE_TYPE)
  url.searchParams.set('scope', 'write')
  url.searchParams.set('state', tx.state)
  url.searchParams.set('code_challenge', tx.codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')

  window.location.assign(url.toString())

  throw new OAuthError('Redirecting to OAuth provider')
}

export const maybeFinishOAuthCallback = async (callbackUrl: URL): Promise<OAuthToken | null> => {
  const hasCode = callbackUrl.searchParams.has('code')
  const hasError = callbackUrl.searchParams.has('error')

  if (!hasCode && !hasError) {
    return null
  }

  const error = callbackUrl.searchParams.get('error')
  if (error) {
    clearPkceTransaction()
    throw new OAuthError(
      callbackUrl.searchParams.get('error_description') ?? `OAuth error: ${error}`,
    )
  }

  const code = callbackUrl.searchParams.get('code')
  const state = callbackUrl.searchParams.get('state')
  const tx = loadPkceTransaction()

  if (!code || !state || !tx) {
    clearPkceTransaction()
    throw new OAuthError('Missing PKCE transaction or callback parameters.')
  }

  if (state !== tx.state) {
    clearPkceTransaction()
    throw new OAuthError('Invalid OAuth state parameter.')
  }

  const existingExchange = exchangeByCode.get(code)
  if (existingExchange) {
    return existingExchange
  }

  const exchangePromise = (async (): Promise<OAuthToken> => {
    const form = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: appConfig.oauthClientId,
      code,
      redirect_uri: appConfig.oauthRedirectUri,
      code_verifier: tx.codeVerifier,
    })

    const response = await fetch(`${appConfig.apiBaseUrl}/v3/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
    })

    const data = (await response.json()) as
      | OAuthToken
      | {
          error?: string
          error_description?: string
        }

    if (!response.ok || !('access_token' in data)) {
      clearPkceTransaction()
      const message =
        'error_description' in data && typeof data.error_description === 'string'
          ? data.error_description
          : 'OAuth token exchange failed.'

      throw new OAuthError(message)
    }

    clearPkceTransaction()
    saveToken(data)

    return data
  })()

  exchangeByCode.set(code, exchangePromise)

  try {
    return await exchangePromise
  } finally {
    exchangeByCode.delete(code)
  }
}
