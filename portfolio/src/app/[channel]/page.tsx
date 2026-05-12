import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ApiHtml } from '@/components/ApiHtml'
import { SubNav } from '@/components/SubNav'
import { ThumbnailGrid } from '@/components/ThumbnailGrid'
import { getSection, getSiteData } from '@/lib/blocks'
import { blockImage, channelDescription } from '@/lib/og'

type ChannelPageProps = {
  params: Promise<{
    channel: string
  }>
}

export const dynamic = 'force-static'

export async function generateStaticParams() {
  const data = await getSiteData()

  return data.rootChannels.map((channel) => ({
    channel: channel.slug,
  }))
}

export async function generateMetadata({ params }: ChannelPageProps): Promise<Metadata> {
  const { channel: slug } = await params
  const section = await getSection(slug)

  if (!section) {
    return {}
  }

  const description = channelDescription(section.channel)
  const image = section.blocks.map(blockImage).find(Boolean)

  return {
    description,
    openGraph: {
      description,
      images: image ? [{ url: image }] : undefined,
      title: section.channel.title,
      type: 'website',
      url: `/${section.channel.slug}/`,
    },
    title: section.channel.title,
  }
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { channel: slug } = await params
  const section = await getSection(slug)

  if (!section) {
    notFound()
  }

  return (
    <>
      <header className="page-header">
        <h1>{section.channel.title}</h1>
        <ApiHtml className="description prose" html={section.channel.description?.html} />
      </header>
      <SubNav channels={section.channels} />
      <ThumbnailGrid
        blocks={section.blocks}
        emptyMessage="No blocks are connected to this channel yet."
      />
    </>
  )
}
