'use client'

import Link from 'next/link'
import { type CSSProperties, useCallback, useLayoutEffect, useRef, useState } from 'react'
import {
  computeMasonryLayout,
  type MasonryGridItem,
  type MasonryLayout,
  type PositionedMasonryItem,
  prepareMasonryItems,
} from '@/lib/masonryLayout'

type MasonryGridClientProps = {
  initialLayout: MasonryLayout
  items: MasonryGridItem[]
}

export function MasonryGridClient({ initialLayout, items }: MasonryGridClientProps) {
  const containerRef = useRef<HTMLElement>(null)
  const preparedItemsRef = useRef<ReturnType<typeof prepareMasonryItems> | null>(null)
  const [masonryLayout, setMasonryLayout] = useState(initialLayout)

  const updateLayout = useCallback(() => {
    const container = containerRef.current
    preparedItemsRef.current ??= prepareMasonryItems(items)

    if (!container) {
      return
    }

    setMasonryLayout(computeMasonryLayout(preparedItemsRef.current, container.clientWidth))
  }, [items])

  useLayoutEffect(() => {
    let isCancelled = false

    async function prepareAndUpdateLayout() {
      await Promise.all([document.fonts.load('16px Areal'), document.fonts.load('12px Areal')])

      if (isCancelled) {
        return
      }

      preparedItemsRef.current = prepareMasonryItems(items)
      updateLayout()
    }

    prepareAndUpdateLayout()

    const container = containerRef.current

    if (!container) {
      return () => {
        isCancelled = true
      }
    }

    const resizeObserver = new ResizeObserver(updateLayout)
    resizeObserver.observe(container)

    return () => {
      isCancelled = true
      resizeObserver.disconnect()
    }
  }, [items, updateLayout])

  return (
    <section
      aria-label="Blocks"
      className="thumbnail-grid"
      ref={containerRef}
      style={{ height: masonryLayout.height }}
    >
      {masonryLayout.items.map((positionedItem) => (
        <Thumbnail key={positionedItem.item.id} positionedItem={positionedItem} />
      ))}
    </section>
  )
}

function Thumbnail({ positionedItem }: { positionedItem: PositionedMasonryItem }) {
  const { fallbackHeight, item, mediaHeight, metaHeight, width, x, y } = positionedItem
  const thumbnailStyle = {
    height: positionedItem.height,
    transform: `translate3d(${x}px, ${y}px, 0)`,
    width,
  } satisfies CSSProperties

  return (
    <Link className="thumbnail" href={item.href} style={thumbnailStyle}>
      {item.image ? (
        <span className="thumbnail-media" style={{ height: mediaHeight }}>
          <img
            alt={item.title}
            height={item.image.height ?? undefined}
            loading="lazy"
            src={item.image.src}
            width={item.image.width ?? undefined}
          />
        </span>
      ) : (
        <span className="thumbnail-fallback" style={{ height: fallbackHeight }}>
          {item.description || item.title}
        </span>
      )}
      <span className="thumbnail-meta" style={{ height: metaHeight }}>
        <span>{item.title}</span>
      </span>
    </Link>
  )
}
