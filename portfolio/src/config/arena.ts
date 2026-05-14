import 'server-only'

import { createArena } from '@aredotna/sdk'

const ARENA_API_BASE_URL = 'https://api.are.na'
const DEFAULT_CHANNEL_SLUG = 'arena-influences'
const LOCAL_SITE_URL = 'http://127.0.0.1:5175'

function requiredValue(value: string | undefined, fallback: string, name: string) {
  const resolved = value?.trim() || fallback

  if (!resolved) {
    throw new Error(`${name} must be set`)
  }

  return resolved
}

export function getRootChannelSlug() {
  return requiredValue(process.env.ARENA_CHANNEL_SLUG, DEFAULT_CHANNEL_SLUG, 'ARENA_CHANNEL_SLUG')
}

export function getSiteUrl() {
  return process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : LOCAL_SITE_URL
}

export const arena = createArena({
  baseUrl: ARENA_API_BASE_URL,
  retry: {
    maxRetries: 2,
    respectRateLimits: true,
  },
})
