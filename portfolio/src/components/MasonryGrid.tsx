import { MasonryGridClient } from '@/components/MasonryGridClient'
import {
  computeMasonryLayout,
  MASONRY_DEFAULT_CONTAINER_WIDTH,
  type MasonryGridItem,
  prepareMasonryItems,
} from '@/lib/masonryLayout'
import { ensureServerTextMeasurement } from '@/lib/serverTextMeasurement'

export type { MasonryGridItem } from '@/lib/masonryLayout'

type MasonryGridProps = {
  items: MasonryGridItem[]
}

export function MasonryGrid({ items }: MasonryGridProps) {
  ensureServerTextMeasurement()

  const initialLayout = computeMasonryLayout(
    prepareMasonryItems(items),
    MASONRY_DEFAULT_CONTAINER_WIDTH,
  )

  return <MasonryGridClient initialLayout={initialLayout} items={items} />
}
