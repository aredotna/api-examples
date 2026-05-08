const BASE64_URL_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'

const textEncoder = new TextEncoder()

const randomString = (length: number): string => {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)

  return Array.from(bytes, (byte) => BASE64_URL_CHARS[byte % BASE64_URL_CHARS.length]).join('')
}

const toBase64Url = (input: ArrayBuffer): string => {
  const bytes = new Uint8Array(input)
  const binary = Array.from(bytes)
    .map((byte) => String.fromCharCode(byte))
    .join('')

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

const createCodeChallenge = async (verifier: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(verifier))
  return toBase64Url(digest)
}

export interface PkceTransaction {
  state: string
  codeVerifier: string
  codeChallenge: string
}

export const createPkceTransaction = async (): Promise<PkceTransaction> => {
  const codeVerifier = randomString(96)
  const state = randomString(48)
  const codeChallenge = await createCodeChallenge(codeVerifier)

  return { state, codeVerifier, codeChallenge }
}
