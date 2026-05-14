import type { Block } from '@aredotna/sdk'
import { blockDescription, blockImageData, blockTitle } from '@/lib/og'
import { MasonryGrid, type MasonryGridItem } from './MasonryGrid'

type ThumbnailGridProps = {
  blocks: Block[]
  emptyMessage: string
}

function thumbnailItem(block: Block): MasonryGridItem {
  const title = blockTitle(block)

  return {
    description: blockDescription(block),
    href: `/show/${block.id}/`,
    id: block.id,
    image: blockImageData(block),
    title,
  }
}

export function ThumbnailGrid({ blocks, emptyMessage }: ThumbnailGridProps) {
  if (blocks.length === 0) {
    return <p>{emptyMessage}</p>
  }

  return <MasonryGrid items={blocks.map(thumbnailItem)} />
}
