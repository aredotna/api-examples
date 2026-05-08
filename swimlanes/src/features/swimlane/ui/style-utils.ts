export const toHexAlphaColor = (rawColor: string, alphaHex: string): string => {
  const color = rawColor.trim()

  if (/^#[0-9a-fA-F]{6}$/.test(color)) {
    return `${color}${alphaHex}`
  }

  if (/^#[0-9a-fA-F]{3}$/.test(color)) {
    const expanded = color
      .slice(1)
      .split('')
      .map((segment) => `${segment}${segment}`)
      .join('')

    return `#${expanded}${alphaHex}`
  }

  return color
}

export const formatTimestamp = (rawValue: unknown): string => {
  if (typeof rawValue !== 'string' || rawValue.trim().length === 0) {
    return 'No timestamp'
  }

  const parsed = new Date(rawValue)
  if (Number.isNaN(parsed.getTime())) {
    return rawValue
  }

  return parsed.toLocaleString()
}

export const createQuickTimestampLabel = (): string =>
  new Date().toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
