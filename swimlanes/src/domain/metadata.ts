export type MetadataScalar = string | number | boolean | null
export type MetadataRecord = Record<string, MetadataScalar>

export const toMetadataRecord = (value: unknown): MetadataRecord => {
  if (!value || typeof value !== 'object') {
    return {}
  }

  const entries: Array<readonly [string, MetadataScalar]> = []
  for (const [key, rawValue] of Object.entries(value as Record<string, unknown>)) {
    if (typeof rawValue === 'string') {
      entries.push([key, rawValue])
      continue
    }

    if (typeof rawValue === 'number') {
      entries.push([key, rawValue])
      continue
    }

    if (typeof rawValue === 'boolean') {
      entries.push([key, rawValue])
      continue
    }

    if (rawValue === null) {
      entries.push([key, null])
    }
  }

  return Object.fromEntries(entries)
}

export const readStringMetadata = (
  metadata: MetadataRecord,
  key: string,
  fallback = '',
): string => {
  const value = metadata[key]
  return typeof value === 'string' ? value : fallback
}

export const readNumberMetadata = (metadata: MetadataRecord, key: string, fallback = 0): number => {
  const value = metadata[key]
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return fallback
}

export const readBooleanMetadata = (
  metadata: MetadataRecord,
  key: string,
  fallback = false,
): boolean => {
  const value = metadata[key]
  return typeof value === 'boolean' ? value : fallback
}
