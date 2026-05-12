import { getSiteData } from '@/lib/blocks'
import { buildRssXml } from '@/lib/rss'

export const dynamic = 'force-static'

export async function GET() {
  const data = await getSiteData()
  const body = buildRssXml({
    blockContexts: data.blockContexts,
    blocks: data.allBlocks,
    root: data.root,
  })

  return new Response(body, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
    },
  })
}
