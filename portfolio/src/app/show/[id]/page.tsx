import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Block } from '@/components/Block'
import { getAllBlocks, getBlock, getBlockContext, getSiteData } from '@/lib/blocks'
import { blockDescription, blockImage, blockTitle } from '@/lib/og'

type ShowPageProps = {
  params: Promise<{
    id: string
  }>
}

export const dynamic = 'force-static'

export async function generateStaticParams() {
  const blocks = await getAllBlocks()

  return blocks.map((block) => ({
    id: String(block.id),
  }))
}

export async function generateMetadata({ params }: ShowPageProps): Promise<Metadata> {
  const { id } = await params
  const block = await getBlock(id)

  if (!block) {
    return {}
  }

  const description = blockDescription(block)
  const image = blockImage(block)
  const title = blockTitle(block)

  return {
    description,
    openGraph: {
      description,
      images: image ? [{ url: image }] : undefined,
      publishedTime: block.connection?.connected_at ?? block.created_at,
      title,
      type: 'article',
      url: `/show/${block.id}/`,
    },
    title,
  }
}

export default async function ShowPage({ params }: ShowPageProps) {
  const { id } = await params
  const block = await getBlock(id)

  if (!block) {
    notFound()
  }

  const context = await getBlockContext(id)
  const data = await getSiteData()
  const contextHref = context?.slug === data.root.slug ? '/' : `/${context?.slug}/`

  return (
    <>
      {context ? (
        <p className="eyebrow">
          From <Link href={contextHref}>{context.title}</Link>
        </p>
      ) : null}
      <Block block={block} showPermalink={false} />
    </>
  )
}
