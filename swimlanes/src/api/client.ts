import { type Arena, createArena } from '@aredotna/sdk'
import { loadToken } from '@/auth/session'
import { appConfig } from '@/config'

export type ArenaClient = Arena

export const createArenaClient = (): ArenaClient =>
  createArena({
    baseUrl: appConfig.apiBaseUrl,
    token: async () => loadToken()?.access_token,
  })
