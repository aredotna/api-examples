export interface CardDragData extends Record<string, unknown> {
  entity: 'card'
  cardId: number
  laneId: number
  connectionId: number
  index: number
}

export interface LaneDragData extends Record<string, unknown> {
  entity: 'lane'
  laneId: number
  connectionId: number
  index: number
}

export interface LaneDropData extends Record<string, unknown> {
  target: 'lane'
  laneId: number
  itemCount: number
}

export interface CardDropData extends Record<string, unknown> {
  target: 'card'
  laneId: number
  index: number
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const asObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  return value as Record<string, unknown>
}

export const isCardDragData = (value: unknown): value is CardDragData => {
  const record = asObject(value)
  if (!record) {
    return false
  }

  return (
    record.entity === 'card' &&
    isFiniteNumber(record.cardId) &&
    isFiniteNumber(record.laneId) &&
    isFiniteNumber(record.connectionId) &&
    isFiniteNumber(record.index)
  )
}

export const isLaneDragData = (value: unknown): value is LaneDragData => {
  const record = asObject(value)
  if (!record) {
    return false
  }

  return (
    record.entity === 'lane' &&
    isFiniteNumber(record.laneId) &&
    isFiniteNumber(record.connectionId) &&
    isFiniteNumber(record.index)
  )
}

export const isLaneDropData = (value: unknown): value is LaneDropData => {
  const record = asObject(value)
  if (!record) {
    return false
  }

  return (
    record.target === 'lane' && isFiniteNumber(record.laneId) && isFiniteNumber(record.itemCount)
  )
}

export const isCardDropData = (value: unknown): value is CardDropData => {
  const record = asObject(value)
  if (!record) {
    return false
  }

  return record.target === 'card' && isFiniteNumber(record.laneId) && isFiniteNumber(record.index)
}
