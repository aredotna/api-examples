import 'server-only'

import type { Block, Channel } from '@aredotna/sdk'
import { cache } from 'react'
import { arena, getRootChannelSlug } from '@/config/arena'

export type Connectable = Block | Channel

export type ChannelSection = {
  blocks: Block[]
  channel: Channel
  channels: Channel[]
}

export type SiteData = {
  allBlocks: Block[]
  blockContexts: Map<number, Channel>
  blocksById: Map<number, Block>
  root: Channel
  rootBlocks: Block[]
  rootChannels: Channel[]
  sectionsBySlug: Map<string, ChannelSection>
}

function isBlock(item: Connectable): item is Block {
  return 'base_type' in item && item.base_type === 'Block'
}

function isChannel(item: Connectable): item is Channel {
  return 'type' in item && item.type === 'Channel'
}

function sortByConnectionPosition<T extends Connectable>(items: T[]) {
  return [...items].sort((a, b) => {
    const aPosition = a.connection?.position ?? Number.MAX_SAFE_INTEGER
    const bPosition = b.connection?.position ?? Number.MAX_SAFE_INTEGER

    return aPosition - bPosition
  })
}

async function getChannelContents(slug: string) {
  const contents: Connectable[] = []

  for await (const page of arena.channels.paginateContents(slug, { per: 100 })) {
    contents.push(...page.data)
  }

  return sortByConnectionPosition(contents)
}

function splitContents(items: Connectable[]) {
  return {
    blocks: items.filter(isBlock),
    channels: items.filter(isChannel),
  }
}

function addBlock(
  block: Block,
  channel: Channel,
  data: Pick<SiteData, 'allBlocks' | 'blockContexts' | 'blocksById'>,
) {
  if (data.blocksById.has(block.id)) {
    return
  }

  data.allBlocks.push(block)
  data.blocksById.set(block.id, block)
  data.blockContexts.set(block.id, channel)
}

async function loadSiteData(): Promise<SiteData> {
  const root = await arena.channels.get(getRootChannelSlug())
  const rootItems = await getChannelContents(root.slug)
  const { blocks: rootBlocks, channels: rootChannels } = splitContents(rootItems)

  const data: SiteData = {
    allBlocks: [],
    blockContexts: new Map(),
    blocksById: new Map(),
    root,
    rootBlocks,
    rootChannels,
    sectionsBySlug: new Map(),
  }

  for (const block of rootBlocks) {
    addBlock(block, root, data)
  }

  const sections = await Promise.all(
    rootChannels.map(async (channel) => {
      const items = await getChannelContents(channel.slug)
      const { blocks, channels } = splitContents(items)
      const section: ChannelSection = { blocks, channel, channels }

      for (const block of blocks) {
        addBlock(block, channel, data)
      }

      return section
    }),
  )

  data.sectionsBySlug = new Map(sections.map((section) => [section.channel.slug, section]))

  return data
}

let siteDataPromise: Promise<SiteData> | undefined

export const getSiteData = cache(() => {
  siteDataPromise ??= loadSiteData()
  return siteDataPromise
})

export async function getAllBlocks() {
  return (await getSiteData()).allBlocks
}

export async function getBlock(id: string | number) {
  return (await getSiteData()).blocksById.get(Number(id)) ?? null
}

export async function getBlockContext(id: string | number) {
  return (await getSiteData()).blockContexts.get(Number(id)) ?? null
}

export async function getSection(slug: string) {
  return (await getSiteData()).sectionsBySlug.get(slug) ?? null
}
