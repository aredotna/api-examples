import type { Block as ArenaBlock } from '@aredotna/sdk'
import Link from 'next/link'
import { ApiHtml } from '@/components/ApiHtml'
import { blockDescription, blockTitle, imageUrl } from '@/lib/og'

type BlockProps = {
  block: ArenaBlock
  showPermalink?: boolean
}

function formatBytes(value?: number | null) {
  if (!value) {
    return null
  }

  const units = ['B', 'KB', 'MB', 'GB']
  let size = value
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function BlockHeader({
  block,
  showPermalink = true,
}: {
  block: ArenaBlock
  showPermalink?: boolean
}) {
  const title = blockTitle(block)
  const description = blockDescription(block)

  return (
    <header className="block-header">
      <h2>{title}</h2>
      {showPermalink ? (
        <Link className="permalink" href={`/show/${block.id}/`}>
          Permalink
        </Link>
      ) : null}
      {description ? <p className="description">{description}</p> : null}
    </header>
  )
}

function ImageBlock({ block }: { block: Extract<ArenaBlock, { type: 'Image' }> }) {
  const src = imageUrl(block.image)

  if (!src) {
    return null
  }

  return (
    <img
      alt={block.image.alt_text || block.title || 'Are.na image block'}
      className="block-image"
      height={block.image.large.height ?? undefined}
      loading="lazy"
      src={src}
      width={block.image.large.width ?? undefined}
    />
  )
}

function LinkBlock({ block }: { block: Extract<ArenaBlock, { type: 'Link' }> }) {
  const src = imageUrl(block.image)
  const href = block.source?.url

  return (
    <div className="link-preview">
      {src ? <img alt="" className="preview-image" loading="lazy" src={src} /> : null}
      {href ? (
        <a className="source-link" href={href} rel="noreferrer" target="_blank">
          {block.source?.title || href}
        </a>
      ) : null}
      <ApiHtml className="prose" html={block.content?.html} />
    </div>
  )
}

function EmbedBlock({ block }: { block: Extract<ArenaBlock, { type: 'Embed' }> }) {
  if (block.embed.html) {
    return <ApiHtml className="embed" html={block.embed.html} />
  }

  const src = imageUrl(block.image)
  const href = block.embed.source_url || block.embed.url || block.source?.url

  return (
    <div className="link-preview">
      {src ? <img alt="" className="preview-image" loading="lazy" src={src} /> : null}
      {href ? (
        <a className="source-link" href={href} rel="noreferrer" target="_blank">
          {block.embed.title || href}
        </a>
      ) : null}
    </div>
  )
}

function AttachmentBlock({ block }: { block: Extract<ArenaBlock, { type: 'Attachment' }> }) {
  const src = imageUrl(block.image)
  const fileSize = formatBytes(block.attachment.file_size)

  return (
    <div className="attachment">
      {src ? <img alt="" className="preview-image" loading="lazy" src={src} /> : null}
      <a download href={block.attachment.url}>
        {block.attachment.filename || block.title || 'Download attachment'}
      </a>
      <p>
        {[block.attachment.file_extension?.toUpperCase(), fileSize].filter(Boolean).join(' / ')}
      </p>
    </div>
  )
}

export function Block({ block, showPermalink = true }: BlockProps) {
  return (
    <article className={`block block-${block.type.toLowerCase()}`}>
      <BlockHeader block={block} showPermalink={showPermalink} />
      {block.state === 'processing' ? <p>Processing...</p> : null}
      {block.state === 'failed' ? <p>Processing failed.</p> : null}
      {block.type === 'Text' ? <ApiHtml className="prose" html={block.content.html} /> : null}
      {block.type === 'Image' ? <ImageBlock block={block} /> : null}
      {block.type === 'Link' ? <LinkBlock block={block} /> : null}
      {block.type === 'Embed' ? <EmbedBlock block={block} /> : null}
      {block.type === 'Attachment' ? <AttachmentBlock block={block} /> : null}
    </article>
  )
}
