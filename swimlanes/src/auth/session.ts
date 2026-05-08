import type { OAuthToken } from '../domain/model'

const TOKEN_KEY = 'swimlane.oauth-token'
const TX_KEY = 'swimlane.oauth-pkce-tx'

export interface StoredPkceTransaction {
  state: string
  codeVerifier: string
  createdAt: number
}

const safeSessionStorage = (): Storage | null => {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export const loadToken = (): OAuthToken | null => {
  const storage = safeSessionStorage()
  if (!storage) {
    return null
  }

  const raw = storage.getItem(TOKEN_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as OAuthToken
  } catch {
    storage.removeItem(TOKEN_KEY)
    return null
  }
}

export const saveToken = (token: OAuthToken): void => {
  const storage = safeSessionStorage()
  if (!storage) {
    return
  }

  storage.setItem(TOKEN_KEY, JSON.stringify(token))
}

export const clearToken = (): void => {
  const storage = safeSessionStorage()
  storage?.removeItem(TOKEN_KEY)
}

export const savePkceTransaction = (tx: StoredPkceTransaction): void => {
  const storage = safeSessionStorage()
  if (!storage) {
    return
  }

  storage.setItem(TX_KEY, JSON.stringify(tx))
}

export const loadPkceTransaction = (): StoredPkceTransaction | null => {
  const storage = safeSessionStorage()
  if (!storage) {
    return null
  }

  const raw = storage.getItem(TX_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as StoredPkceTransaction
  } catch {
    storage.removeItem(TX_KEY)
    return null
  }
}

export const clearPkceTransaction = (): void => {
  const storage = safeSessionStorage()
  storage?.removeItem(TX_KEY)
}
