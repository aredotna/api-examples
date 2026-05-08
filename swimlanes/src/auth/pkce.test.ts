import { describe, expect, it } from 'vitest'
import { createPkceTransaction } from './pkce'

describe('createPkceTransaction', () => {
  it('returns verifier/challenge/state with PKCE-safe characters', async () => {
    const tx = await createPkceTransaction()

    expect(tx.codeVerifier.length).toBeGreaterThanOrEqual(43)
    expect(tx.codeVerifier.length).toBeLessThanOrEqual(128)
    expect(tx.codeChallenge.length).toBeGreaterThan(20)
    expect(tx.state.length).toBeGreaterThan(10)

    expect(tx.codeVerifier).toMatch(/^[A-Za-z0-9\-._~]+$/)
    expect(tx.codeChallenge).toMatch(/^[A-Za-z0-9\-_]+$/)
    expect(tx.state).toMatch(/^[A-Za-z0-9\-._~]+$/)
  })
})
