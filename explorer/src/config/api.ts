import type { ArenaOptions, TokenProvider } from '@aredotna/sdk'

export const arenaConfig = {
  apiBaseUrl: import.meta.env.VITE_ARENA_API_BASE ?? 'https://api.are.na',
  authorizationBaseUrl: import.meta.env.VITE_ARENA_AUTHORIZATION_BASE ?? 'https://www.are.na',
} as const

export function getArenaConfig() {
  return arenaConfig
}

export function createArenaOptions(options?: { token?: TokenProvider }): ArenaOptions {
  const { token } = options || {}
  return {
    baseUrl: arenaConfig.apiBaseUrl,
    token,
  }
}
