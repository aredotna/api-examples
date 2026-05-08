import createClient from 'openapi-fetch'
import { appConfig } from '../config'
import type { paths } from './openapi.generated'

export class ArenaApiError extends Error {
  readonly status: number

  constructor(message: string, status = 500) {
    super(message)
    this.name = 'ArenaApiError'
    this.status = status
  }
}

const stringifyUnknown = (value: unknown): string => {
  if (!value) {
    return 'Unknown API error'
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    const nestedError =
      (typeof record.error === 'string' && record.error) ||
      (typeof record.message === 'string' && record.message) ||
      (typeof record.error_description === 'string' && record.error_description)

    if (nestedError) {
      return nestedError
    }

    return JSON.stringify(record)
  }

  return 'Unknown API error'
}

export const unwrapApiResult = <T>(
  result: {
    data?: T
    error?: unknown
    response: Response
  },
  context: string,
): T => {
  if (result.error || result.data === undefined) {
    throw new ArenaApiError(`${context}: ${stringifyUnknown(result.error)}`, result.response.status)
  }

  return result.data
}

export const createArenaClient = (accessToken: string) => {
  const client = createClient<paths>({
    baseUrl: appConfig.apiBaseUrl,
  })

  client.use({
    onRequest({ request }) {
      request.headers.set('Authorization', `Bearer ${accessToken}`)
      request.headers.set('Accept', 'application/json')
      return request
    },
  })

  return client
}

export type ArenaClient = ReturnType<typeof createArenaClient>
