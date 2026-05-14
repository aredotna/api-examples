import { layout, type PreparedText, prepare } from '@chenglou/pretext'

export type MasonryGridItem = {
  description?: string
  href: string
  id: number
  image?: {
    height?: number | null
    src: string
    width?: number | null
  } | null
  title: string
}

export type PositionedMasonryItem = {
  fallbackHeight?: number
  height: number
  item: MasonryGridItem
  mediaHeight?: number
  metaHeight: number
  width: number
  x: number
  y: number
}

export type MasonryLayout = {
  height: number
  items: PositionedMasonryItem[]
}

type PreparedItem = MasonryGridItem & {
  preparedCaption: PreparedText
  preparedFallback: PreparedText
}

export const MASONRY_DEFAULT_CONTAINER_WIDTH = 1216

const GAP = 64
const MIN_COLUMN_WIDTH = 220
const MAX_COLUMNS = 3
const BODY_FONT = '16px Areal'
const BODY_LINE_HEIGHT = 22.4
const CAPTION_FONT = '12px Areal'
const CAPTION_LINE_HEIGHT = 16.8
const FALLBACK_PADDING = 16
const FALLBACK_BORDER = 1
const META_MARGIN_TOP = 12
const MOBILE_MAX_WIDTH = 640

export function prepareMasonryItems(items: MasonryGridItem[]) {
  return items.map((item) => ({
    ...item,
    preparedCaption: prepare(item.title, CAPTION_FONT),
    preparedFallback: prepare(item.description || item.title, BODY_FONT),
  }))
}

function getColumnCount(containerWidth: number) {
  if (containerWidth <= MOBILE_MAX_WIDTH - GAP) {
    return 1
  }

  return Math.min(
    MAX_COLUMNS,
    Math.max(1, Math.floor((containerWidth + GAP) / (MIN_COLUMN_WIDTH + GAP))),
  )
}

function measuredTextHeight(prepared: PreparedText, width: number, lineHeight: number) {
  const { lineCount } = layout(prepared, width, lineHeight)
  return Math.max(1, lineCount) * lineHeight
}

export function computeMasonryLayout(items: PreparedItem[], containerWidth: number): MasonryLayout {
  const columnCount = getColumnCount(containerWidth)
  const columnWidth = (containerWidth - GAP * (columnCount - 1)) / columnCount
  const columnHeights = new Float64Array(columnCount)
  const positionedItems: PositionedMasonryItem[] = []

  for (const item of items) {
    let columnIndex = 0

    for (let index = 1; index < columnCount; index += 1) {
      if (columnHeights[index] < columnHeights[columnIndex]) {
        columnIndex = index
      }
    }

    const captionHeight = measuredTextHeight(item.preparedCaption, columnWidth, CAPTION_LINE_HEIGHT)
    const metaHeight = META_MARGIN_TOP + captionHeight
    const mediaRatio =
      item.image?.width && item.image.height ? item.image.height / item.image.width : 1
    const mediaHeight = item.image ? columnWidth * mediaRatio : undefined
    const fallbackText = item.description || item.title
    const fallbackContentWidth = columnWidth - FALLBACK_PADDING * 2 - FALLBACK_BORDER * 2
    const fallbackHeight = item.image
      ? undefined
      : measuredTextHeight(item.preparedFallback, fallbackContentWidth, BODY_LINE_HEIGHT) +
        FALLBACK_PADDING * 2 +
        FALLBACK_BORDER * 2
    const itemHeight = (mediaHeight ?? fallbackHeight ?? 0) + metaHeight
    const x = columnIndex * (columnWidth + GAP)
    const y = columnHeights[columnIndex]

    positionedItems.push({
      fallbackHeight,
      height: itemHeight,
      item: {
        description: fallbackText,
        href: item.href,
        id: item.id,
        image: item.image,
        title: item.title,
      },
      mediaHeight,
      metaHeight,
      width: columnWidth,
      x,
      y,
    })

    columnHeights[columnIndex] += itemHeight + GAP
  }

  return {
    height: Math.max(0, ...columnHeights) - (items.length > 0 ? GAP : 0),
    items: positionedItems,
  }
}
