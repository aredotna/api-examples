import type { Block } from '@aredotna/sdk'
import Link from 'next/link'
import { blockDescription, blockImageData, blockTitle } from '@/lib/og'

type ThumbnailGridProps = {
  blocks: Block[]
  emptyMessage: string
}

function Thumbnail({ block }: { block: Block }) {
  const image = blockImageData(block)
  const title = blockTitle(block)
  const description = blockDescription(block)
  const aspectRatio = image?.width && image.height ? `${image.width} / ${image.height}` : undefined

  return (
    <Link className="thumbnail" href={`/show/${block.id}/`}>
      {image ? (
        <span className="thumbnail-media" style={{ aspectRatio }}>
          <img
            alt={title}
            height={image.height ?? undefined}
            loading="lazy"
            src={image.src}
            width={image.width ?? undefined}
          />
        </span>
      ) : (
        <span className="thumbnail-fallback">{description || title}</span>
      )}
      <span className="thumbnail-meta">
        <span>{title}</span>
      </span>
    </Link>
  )
}

export function ThumbnailGrid({ blocks, emptyMessage }: ThumbnailGridProps) {
  if (blocks.length === 0) {
    return <p>{emptyMessage}</p>
  }

  return (
    <section aria-label="Blocks" className="thumbnail-grid">
      {blocks.map((block) => (
        <Thumbnail block={block} key={block.id} />
      ))}
    </section>
  )
}
