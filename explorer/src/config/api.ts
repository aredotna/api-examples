import type { ArenaOptions, TokenProvider } from '@aredotna/sdk'

export type ArenaEnvironment = 'production' | 'staging' | 'local'

const ENVIRONMENTS = {
  production: {
    apiBaseUrl: 'https://api.are.na',
    authorizationBaseUrl: 'https://www.are.na',
  },
  staging: {
    apiBaseUrl: 'https://staging-api.are.na',
    authorizationBaseUrl: 'https://staging.are.na',
  },
  local: {
    apiBaseUrl: 'http://localhost:3111',
    authorizationBaseUrl: 'http://localhost:3000',
  },
} as const

export function getArenaEnvironment(): ArenaEnvironment {
  const environment = import.meta.env.VITE_API_ENV
  return environment === 'local' || environment === 'staging' ? environment : 'production'
}

export function getArenaEnvironmentConfig(environment: ArenaEnvironment = getArenaEnvironment()) {
  return ENVIRONMENTS[environment]
}

export function createArenaOptions(options?: {
  environment?: ArenaEnvironment
  token?: TokenProvider
}): ArenaOptions {
  const { environment = getArenaEnvironment(), token } = options || {}
  return {
    baseUrl: getArenaEnvironmentConfig(environment).apiBaseUrl,
    token,
  }
}
