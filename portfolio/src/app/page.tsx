import type { Metadata } from 'next'
import { ApiHtml } from '@/components/ApiHtml'
import { ThumbnailGrid } from '@/components/ThumbnailGrid'
import { getSiteData } from '@/lib/blocks'
import { blockImage, channelDescription } from '@/lib/og'

export const dynamic = 'force-static'

export async function generateMetadata(): Promise<Metadata> {
  const data = await getSiteData()
  const description = channelDescription(data.root)
  const image = data.allBlocks.map(blockImage).find(Boolean)

  return {
    description,
    openGraph: {
      description,
      images: image ? [{ url: image }] : undefined,
      title: data.root.title,
      type: 'website',
      url: '/',
    },
    title: data.root.title,
  }
}

export default async function HomePage() {
  const data = await getSiteData()

  return (
    <>
      <header className="page-header">
        <h1>{data.root.title}</h1>
        <ApiHtml className="description prose" html={data.root.description?.html} />
      </header>
      <ThumbnailGrid
        blocks={data.rootBlocks}
        emptyMessage="No blocks are connected directly to this channel yet."
      />
    </>
  )
}
