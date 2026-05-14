import type { Metadata, User } from '@aredotna/sdk'
import type { ConnectableListResponse } from '@aredotna/sdk/api'
import type { ArenaClient } from '../api/client'
import {
  readBooleanMetadata,
  readNumberMetadata,
  readStringMetadata,
  toMetadataRecord,
} from './metadata'
import {
  type BoardModel,
  type CardDraft,
  type CardEditorDraft,
  type CardModel,
  DEMO_METADATA_KEYS,
  type LaneModel,
  type LaneTemplate,
} from './model'

type ConnectableItem = ConnectableListResponse['data'][number]

type ArenaChannel = Extract<ConnectableItem, { type: 'Channel' }>
type ArenaBlock = Extract<ConnectableItem, { base_type: 'Block' }>
type ApiMetadata = Metadata

const DEMO_BOARD_MARKER = 'swimlane_kv_demo'
const OBSOLETE_METADATA_KEYS = {
  laneOrder: 'lane_order',
  connectionRank: 'rank',
  connectionSwimlaneKey: 'swimlane_key',
} as const

const isChannel = (item: ConnectableItem): item is ArenaChannel =>
  'type' in item && item.type === 'Channel'

const isBlock = (item: ConnectableItem): item is ArenaBlock =>
  'base_type' in item && item.base_type === 'Block'

const laneKeyFromTitle = (title: string): string =>
  title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_\s-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_')
    .slice(0, 40)

const toApiPosition = (index: number): number => Math.max(1, index + 1)

const cardConnectionMetadata = (metadata: unknown = {}): ApiMetadata => {
  const record = toMetadataRecord(metadata)

  return {
    [DEMO_METADATA_KEYS.connectionBlocked]: readBooleanMetadata(
      record,
      DEMO_METADATA_KEYS.connectionBlocked,
      false,
    ),
    [DEMO_METADATA_KEYS.connectionTargetDate]: readStringMetadata(
      record,
      DEMO_METADATA_KEYS.connectionTargetDate,
      '',
    ),
  }
}

const defaultCardConnectionMetadata = (): ApiMetadata => ({
  [DEMO_METADATA_KEYS.connectionBlocked]: false,
  [DEMO_METADATA_KEYS.connectionTargetDate]: '',
})

const blockMetadataForCard = (
  draft: CardDraft,
  updatedAtIso = new Date().toISOString(),
): ApiMetadata => ({
  [DEMO_METADATA_KEYS.cardPriority]: draft.priority,
  [DEMO_METADATA_KEYS.cardEstimatePoints]: String(draft.estimatePoints),
  [DEMO_METADATA_KEYS.cardEpic]: draft.epic,
  [DEMO_METADATA_KEYS.cardUpdatedAt]: updatedAtIso,
})

const toCardEditorDraft = (card: CardModel): CardEditorDraft => ({
  title: card.title,
  description: card.description,
  priority: readStringMetadata(card.metadata, DEMO_METADATA_KEYS.cardPriority, 'P2'),
  estimatePoints: readNumberMetadata(card.metadata, DEMO_METADATA_KEYS.cardEstimatePoints, 1),
  epic: readStringMetadata(card.metadata, DEMO_METADATA_KEYS.cardEpic, ''),
  blocked: readBooleanMetadata(
    card.connectionMetadata,
    DEMO_METADATA_KEYS.connectionBlocked,
    false,
  ),
  targetDate: readStringMetadata(
    card.connectionMetadata,
    DEMO_METADATA_KEYS.connectionTargetDate,
    '',
  ),
})

const mapLane = (channel: ArenaChannel): LaneModel => {
  const laneMetadata = toMetadataRecord(channel.metadata)
  delete laneMetadata[OBSOLETE_METADATA_KEYS.laneOrder]
  const connection = channel.connection

  if (!connection) {
    throw new Error(`Lane channel ${channel.id} is missing connection context.`)
  }

  return {
    id: channel.id,
    title: channel.title,
    connectionId: connection.id,
    position: connection.position,
    metadata: laneMetadata,
    color: readStringMetadata(laneMetadata, DEMO_METADATA_KEYS.laneColor, '#93c5fd'),
    laneKey: readStringMetadata(
      laneMetadata,
      DEMO_METADATA_KEYS.laneKey,
      laneKeyFromTitle(channel.title),
    ),
    isDefault: readBooleanMetadata(laneMetadata, DEMO_METADATA_KEYS.isDefaultLane, false),
  }
}

const mapCard = (block: ArenaBlock, lane: LaneModel): CardModel => {
  const connection = block.connection

  if (!connection) {
    throw new Error(`Block ${block.id} is missing connection context.`)
  }

  const connectionMetadata = toMetadataRecord(connection.metadata)
  delete connectionMetadata[OBSOLETE_METADATA_KEYS.connectionRank]
  delete connectionMetadata[OBSOLETE_METADATA_KEYS.connectionSwimlaneKey]

  return {
    id: block.id,
    laneId: lane.id,
    laneKey: lane.laneKey,
    connectionId: connection.id,
    position: connection.position,
    title: block.title ?? 'Untitled',
    description: block.description?.markdown ?? '',
    metadata: toMetadataRecord(block.metadata),
    connectionMetadata,
  }
}

const fetchAllChannelContents = async (
  client: ArenaClient,
  channelId: number,
): Promise<ConnectableItem[]> => {
  const items: ConnectableItem[] = []
  let page = 1

  while (true) {
    const data = await client.channels.contents(channelId, {
      page,
      per: 100,
      sort: 'position_asc',
    })

    items.push(...data.data)

    const nextPage = data.meta.next_page
    if (!data.meta.has_more_pages || nextPage === null || nextPage === undefined) {
      break
    }

    page = nextPage
  }

  return items
}

export const fetchBoard = async (client: ArenaClient, boardId: number): Promise<BoardModel> => {
  const board = await client.channels.get(boardId)
  const boardItems = await fetchAllChannelContents(client, boardId)

  const lanes = boardItems
    .filter(isChannel)
    .map(mapLane)
    .sort((a, b) => a.position - b.position)

  const cardsByLaneId: Record<number, CardModel[]> = {}

  for (const lane of lanes) {
    const laneItems = await fetchAllChannelContents(client, lane.id)
    cardsByLaneId[lane.id] = laneItems
      .filter(isBlock)
      .map((block) => mapCard(block, lane))
      .sort((a, b) => a.position - b.position)
  }

  return {
    id: board.id,
    title: board.title,
    metadata: toMetadataRecord(board.metadata),
    lanes,
    cardsByLaneId,
  }
}

interface CreatedLane {
  laneId: number
  connectionId: number
}

export interface LaneChannelSetup {
  channelId: number | null
  title: string
  key: string
  color: string
  isDefault: boolean
}

const createLaneWithConnection = async (
  client: ArenaClient,
  boardId: number,
  lane: LaneTemplate,
  index: number,
): Promise<CreatedLane> => {
  const createdLane = await client.channels.create({
    title: lane.title,
    visibility: 'private',
    description: `Swimlane ${lane.title}`,
    metadata: {
      [DEMO_METADATA_KEYS.laneColor]: lane.color,
      [DEMO_METADATA_KEYS.laneKey]: lane.key,
      [DEMO_METADATA_KEYS.isDefaultLane]: lane.isDefault,
    },
  })

  const connections = await client.connections.create({
    connectable_id: createdLane.id,
    connectable_type: 'Channel',
    channels: [
      {
        id: boardId,
        position: toApiPosition(index),
      },
    ],
  })

  return {
    laneId: createdLane.id,
    connectionId: connections.data?.[0]?.id ?? -1,
  }
}

const connectLaneChannel = async (
  client: ArenaClient,
  boardId: number,
  laneChannelId: number,
  index: number,
): Promise<CreatedLane> => {
  const connections = await client.connections.create({
    connectable_id: laneChannelId,
    connectable_type: 'Channel',
    channels: [
      {
        id: boardId,
        position: toApiPosition(index),
      },
    ],
  })

  return {
    laneId: laneChannelId,
    connectionId: connections.data?.[0]?.id ?? -1,
  }
}

export const createBoardWithLanes = async (
  client: ArenaClient,
  boardTitle: string,
  lanes: LaneChannelSetup[],
): Promise<BoardModel> => {
  const now = new Date()
  const quarter = `Q${Math.ceil((now.getUTCMonth() + 1) / 3)}-${now.getUTCFullYear()}`
  const title = boardTitle.trim() || 'Swimlane Board'

  const board = await client.channels.create({
    title,
    visibility: 'private',
    description: 'Product swimlane board backed by channel/block/connection metadata.',
    metadata: {
      [DEMO_METADATA_KEYS.boardType]: DEMO_BOARD_MARKER,
      [DEMO_METADATA_KEYS.appVersion]: '1',
      [DEMO_METADATA_KEYS.quarter]: quarter,
    },
  })

  for (const [index, lane] of lanes.entries()) {
    if (lane.channelId !== null) {
      await connectLaneChannel(client, board.id, lane.channelId, index)
    } else {
      await createLaneWithConnection(client, board.id, lane, index)
    }
  }

  return fetchBoard(client, board.id)
}

export const fetchCurrentUser = async (client: ArenaClient): Promise<User> => client.me()

export const addLane = async (
  client: ArenaClient,
  boardId: number,
  laneTitle: string,
  laneColor: string,
  laneIndex: number,
): Promise<CreatedLane> => {
  const laneKey = laneKeyFromTitle(laneTitle)

  return createLaneWithConnection(
    client,
    boardId,
    {
      key: laneKey,
      title: laneTitle,
      color: laneColor,
      isDefault: false,
    },
    laneIndex,
  )
}

export interface CreatedCard {
  blockId: number
  connectionId: number | null
}

export const createCard = async (
  client: ArenaClient,
  draft: CardDraft,
  lane: LaneModel,
  laneCardCount: number,
  updatedAtIso = new Date().toISOString(),
): Promise<CreatedCard> => {
  const block = await client.blocks.create({
    value: draft.description.trim().length > 0 ? draft.description : draft.title,
    title: draft.title,
    description: draft.description,
    channels: [
      {
        id: lane.id,
        position: toApiPosition(laneCardCount),
        metadata: defaultCardConnectionMetadata(),
      },
    ],
    metadata: blockMetadataForCard(draft, updatedAtIso),
  })

  return {
    blockId: block.id,
    connectionId: block.connection?.id ?? null,
  }
}

export const updateLaneSettings = async (
  client: ArenaClient,
  lane: LaneModel,
  patch: {
    title: string
    color: string
  },
): Promise<void> => {
  await client.channels.update(lane.id, {
    title: patch.title,
    metadata: {
      [DEMO_METADATA_KEYS.laneColor]: patch.color,
      [DEMO_METADATA_KEYS.laneKey]: lane.laneKey,
      [DEMO_METADATA_KEYS.isDefaultLane]: lane.isDefault,
      [OBSOLETE_METADATA_KEYS.laneOrder]: null,
    },
  })
}

export const updateCard = async (
  client: ArenaClient,
  card: CardModel,
  draft: CardEditorDraft,
  updatedAtIso = new Date().toISOString(),
): Promise<void> => {
  await client.blocks.update(card.id, {
    title: draft.title,
    description: draft.description,
    metadata: {
      [DEMO_METADATA_KEYS.cardPriority]: draft.priority,
      [DEMO_METADATA_KEYS.cardEstimatePoints]: String(draft.estimatePoints),
      [DEMO_METADATA_KEYS.cardEpic]: draft.epic,
      [DEMO_METADATA_KEYS.cardUpdatedAt]: updatedAtIso,
    },
  })

  await client.connections.update(card.connectionId, {
    metadata: {
      [DEMO_METADATA_KEYS.connectionBlocked]: draft.blocked,
      [DEMO_METADATA_KEYS.connectionTargetDate]: draft.targetDate,
      [OBSOLETE_METADATA_KEYS.connectionRank]: null,
      [OBSOLETE_METADATA_KEYS.connectionSwimlaneKey]: null,
    },
  })
}

export const reorderConnection = async (
  client: ArenaClient,
  connectionId: number,
  targetIndex: number,
): Promise<void> => {
  await client.connections.move(connectionId, {
    movement: 'insert_at',
    position: toApiPosition(targetIndex),
  })
}

export const moveCardAcrossLanes = async (
  client: ArenaClient,
  card: CardModel,
  targetLane: LaneModel,
  targetIndex: number,
): Promise<{ connectionId: number }> => {
  const connections = await client.connections.create({
    connectable_id: card.id,
    connectable_type: 'Block',
    channels: [
      {
        id: targetLane.id,
        position: toApiPosition(targetIndex),
        metadata: cardConnectionMetadata(card.connectionMetadata),
      },
    ],
  })

  const newConnectionId = connections.data?.[0]?.id ?? -1

  await client.connections.delete(card.connectionId)

  return { connectionId: newConnectionId }
}

export const removeCardFromLane = async (
  client: ArenaClient,
  connectionId: number,
): Promise<void> => client.connections.delete(connectionId)

export const reorderLane = async (
  client: ArenaClient,
  laneConnectionId: number,
  targetIndex: number,
): Promise<void> => {
  await reorderConnection(client, laneConnectionId, targetIndex)
}

export { toCardEditorDraft }
