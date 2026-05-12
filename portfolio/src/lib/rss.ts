import 'server-only'

import type { Block, Channel } from '@aredotna/sdk'
import { absoluteUrl, blockDescription, blockImage, blockTitle, channelDescription } from '@/lib/og'

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function cdata(value: string) {
  return `<![CDATA[${value.replaceAll(']]>', ']]]]><![CDATA[>')}]]>`
}

function blockHtml(block: Block) {
  switch (block.type) {
    case 'Text':
      return block.content.html
    case 'Link':
      return block.content?.html || blockDescription(block) || ''
    case 'Embed':
      return block.embed.html || blockDescription(block) || ''
    default:
      return blockDescription(block) || ''
  }
}

function enclosure(block: Block) {
  if (block.type === 'Attachment') {
    return {
      length: block.attachment.file_size ?? 0,
      type: block.attachment.content_type ?? 'application/octet-stream',
      url: block.attachment.url,
    }
  }

  const image = blockImage(block)

  if (!image) {
    return null
  }

  return {
    length: 0,
    type: 'image/jpeg',
    url: image,
  }
}

export function buildRssXml({
  blocks,
  blockContexts,
  root,
}: {
  blocks: Block[]
  blockContexts: Map<number, Channel>
  root: Channel
}) {
  const items = [...blocks]
    .sort((a, b) => {
      const aDate = Date.parse(a.connection?.connected_at ?? a.created_at)
      const bDate = Date.parse(b.connection?.connected_at ?? b.created_at)

      return bDate - aDate
    })
    .map((block) => {
      const url = absoluteUrl(`/show/${block.id}/`)
      const context = blockContexts.get(block.id)
      const blockEnclosure = enclosure(block)
      const enclosureXml = blockEnclosure
        ? `<enclosure url="${escapeXml(blockEnclosure.url)}" length="${blockEnclosure.length}" type="${escapeXml(blockEnclosure.type)}" />`
        : ''

      return `
    <item>
      <title>${escapeXml(blockTitle(block))}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${new Date(block.connection?.connected_at ?? block.created_at).toUTCString()}</pubDate>
      ${context ? `<category>${escapeXml(context.title)}</category>` : ''}
      <description>${cdata(blockHtml(block))}</description>
      ${enclosureXml}
    </item>`
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(root.title)}</title>
    <link>${escapeXml(absoluteUrl('/'))}</link>
    <description>${escapeXml(channelDescription(root) || root.title)}</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>
`
}
