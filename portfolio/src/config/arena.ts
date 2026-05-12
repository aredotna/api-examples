import 'server-only'

import { createArena } from '@aredotna/sdk'

const DEFAULT_CHANNEL_SLUG = 'arena-influences'
const DEFAULT_API_BASE_URL = 'https://api.are.na'
const DEFAULT_SITE_URL = 'http://127.0.0.1:5175'

function requiredValue(value: string | undefined, fallback: string, name: string) {
  const resolved = value?.trim() || fallback

  if (!resolved) {
    throw new Error(`${name} must be set`)
  }

  return resolved
}

function validUrl(value: string | undefined, fallback: string, name: string) {
  const resolved = requiredValue(value, fallback, name)

  try {
    return new URL(resolved).toString().replace(/\/$/, '')
  } catch {
    throw new Error(`${name} must be a valid URL`)
  }
}

export function getRootChannelSlug() {
  return requiredValue(process.env.ARENA_CHANNEL_SLUG, DEFAULT_CHANNEL_SLUG, 'ARENA_CHANNEL_SLUG')
}

export function getArenaApiBaseUrl() {
  return validUrl(process.env.ARENA_API_BASE_URL, DEFAULT_API_BASE_URL, 'ARENA_API_BASE_URL')
}

export function getSiteUrl() {
  return validUrl(process.env.NEXT_PUBLIC_SITE_URL, DEFAULT_SITE_URL, 'NEXT_PUBLIC_SITE_URL')
}

export const arena = createArena({
  baseUrl: getArenaApiBaseUrl(),
  retry: {
    maxRetries: 2,
    respectRateLimits: true,
  },
})
