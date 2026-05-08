import type { ArenaClient } from '../api/client'
import { unwrapApiResult } from '../api/client'
import type { components } from '../api/openapi.generated'
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
  DEFAULT_LANES,
  DEMO_METADATA_KEYS,
  type LaneModel,
  type LaneTemplate,
} from './model'

type ConnectableItem = components['schemas']['ConnectableListResponse']['data'][number]

type ArenaChannel = Extract<ConnectableItem, { type: 'Channel' }>
type ArenaBlock = Exclude<ConnectableItem, ArenaChannel>
type ApiMetadata = components['schemas']['Metadata']

const DEMO_BOARD_MARKER = 'swimlane_kv_demo'
const OBSOLETE_METADATA_KEYS = {
  laneOrder: 'lane_order',
  connectionRank: 'rank',
  connectionSwimlaneKey: 'swimlane_key',
} as const
let pendingFreshBoard: Promise<BoardModel> | null = null

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

const cardConnectionMetadata = (metadata = {}): ApiMetadata => {
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
    wipLimit: readNumberMetadata(laneMetadata, DEMO_METADATA_KEYS.laneWipLimit, 5),
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
    const result = await client.GET('/v3/channels/{id}/contents', {
      params: {
        path: { id: String(channelId) },
        query: {
          page,
          per: 100,
          sort: 'position_asc',
        },
      },
    })

    const data = unwrapApiResult(result, 'Unable to fetch channel contents')
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
  const boardResult = await client.GET('/v3/channels/{id}', {
    params: { path: { id: String(boardId) } },
  })

  const board = unwrapApiResult(boardResult, 'Unable to fetch board channel')
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

const createLaneWithConnection = async (
  client: ArenaClient,
  boardId: number,
  lane: LaneTemplate,
  index: number,
): Promise<CreatedLane> => {
  const createLaneResult = await client.POST('/v3/channels', {
    body: {
      title: lane.title,
      visibility: 'private',
      description: `Swimlane ${lane.title}`,
      metadata: {
        [DEMO_METADATA_KEYS.laneColor]: lane.color,
        [DEMO_METADATA_KEYS.laneWipLimit]: String(lane.wipLimit),
        [DEMO_METADATA_KEYS.laneKey]: lane.key,
        [DEMO_METADATA_KEYS.isDefaultLane]: lane.isDefault,
      },
    },
  })

  const createdLane = unwrapApiResult(createLaneResult, 'Unable to create lane')

  const createConnectionResult = await client.POST('/v3/connections', {
    body: {
      connectable_id: createdLane.id,
      connectable_type: 'Channel',
      channels: [
        {
          id: boardId,
          position: toApiPosition(index),
        },
      ],
    },
  })

  const connections = unwrapApiResult(
    createConnectionResult,
    'Unable to connect lane to board channel',
  )

  return {
    laneId: createdLane.id,
    connectionId: connections.data?.[0]?.id ?? -1,
  }
}

export const createDemoBoard = async (client: ArenaClient): Promise<number> => {
  const now = new Date()
  const quarter = `Q${Math.ceil((now.getUTCMonth() + 1) / 3)}-${now.getUTCFullYear()}`

  const boardResult = await client.POST('/v3/channels', {
    body: {
      title: 'Swimlane Board',
      visibility: 'private',
      description: 'Product swimlane board backed by channel/block/connection metadata.',
      metadata: {
        [DEMO_METADATA_KEYS.boardType]: DEMO_BOARD_MARKER,
        [DEMO_METADATA_KEYS.appVersion]: '1',
        [DEMO_METADATA_KEYS.quarter]: quarter,
      },
    },
  })

  const board = unwrapApiResult(boardResult, 'Unable to create board channel')

  for (const [index, lane] of DEFAULT_LANES.entries()) {
    await createLaneWithConnection(client, board.id, lane, index)
  }

  return board.id
}

export const ensureDemoBoard = async (
  client: ArenaClient,
  currentBoardId: number | null,
): Promise<BoardModel> => {
  if (currentBoardId) {
    try {
      return await fetchBoard(client, currentBoardId)
    } catch {
      // fall through and bootstrap a fresh board
    }
  }

  pendingFreshBoard ??= (async () => {
    const boardId = await createDemoBoard(client)
    return fetchBoard(client, boardId)
  })().finally(() => {
    pendingFreshBoard = null
  })

  return pendingFreshBoard
}

export const fetchCurrentUser = async (
  client: ArenaClient,
): Promise<components['schemas']['User']> => {
  const result = await client.GET('/v3/me')
  return unwrapApiResult(result, 'Unable to load current user')
}

export const addLane = async (
  client: ArenaClient,
  boardId: number,
  laneTitle: string,
  laneColor: string,
  wipLimit: number,
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
      wipLimit,
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
  const result = await client.POST('/v3/blocks', {
    body: {
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
    },
  })

  const block = unwrapApiResult(result, 'Unable to create card')

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
    wipLimit: number
  },
): Promise<void> => {
  const result = await client.PUT('/v3/channels/{id}', {
    params: {
      path: {
        id: String(lane.id),
      },
    },
    body: {
      title: patch.title,
      metadata: {
        [DEMO_METADATA_KEYS.laneColor]: patch.color,
        [DEMO_METADATA_KEYS.laneWipLimit]: String(patch.wipLimit),
        [DEMO_METADATA_KEYS.laneKey]: lane.laneKey,
        [DEMO_METADATA_KEYS.isDefaultLane]: lane.isDefault,
        [OBSOLETE_METADATA_KEYS.laneOrder]: null,
      },
    },
  })

  unwrapApiResult(result, 'Unable to update lane settings')
}

export const updateCard = async (
  client: ArenaClient,
  card: CardModel,
  draft: CardEditorDraft,
  updatedAtIso = new Date().toISOString(),
): Promise<void> => {
  const updateBlockResult = await client.PUT('/v3/blocks/{id}', {
    params: { path: { id: card.id } },
    body: {
      title: draft.title,
      description: draft.description,
      metadata: {
        [DEMO_METADATA_KEYS.cardPriority]: draft.priority,
        [DEMO_METADATA_KEYS.cardEstimatePoints]: String(draft.estimatePoints),
        [DEMO_METADATA_KEYS.cardEpic]: draft.epic,
        [DEMO_METADATA_KEYS.cardUpdatedAt]: updatedAtIso,
      },
    },
  })

  unwrapApiResult(updateBlockResult, 'Unable to update card block')

  const updateConnectionResult = await client.PUT('/v3/connections/{id}', {
    params: { path: { id: card.connectionId } },
    body: {
      metadata: {
        [DEMO_METADATA_KEYS.connectionBlocked]: draft.blocked,
        [DEMO_METADATA_KEYS.connectionTargetDate]: draft.targetDate,
        [OBSOLETE_METADATA_KEYS.connectionRank]: null,
        [OBSOLETE_METADATA_KEYS.connectionSwimlaneKey]: null,
      },
    },
  })

  unwrapApiResult(updateConnectionResult, 'Unable to update card connection')
}

export const reorderConnection = async (
  client: ArenaClient,
  connectionId: number,
  targetIndex: number,
): Promise<void> => {
  const result = await client.POST('/v3/connections/{id}/move', {
    params: { path: { id: connectionId } },
    body: {
      movement: 'insert_at',
      position: toApiPosition(targetIndex),
    },
  })

  unwrapApiResult(result, 'Unable to reorder connection')
}

export const moveCardAcrossLanes = async (
  client: ArenaClient,
  card: CardModel,
  targetLane: LaneModel,
  targetIndex: number,
): Promise<{ connectionId: number }> => {
  const connectResult = await client.POST('/v3/connections', {
    body: {
      connectable_id: card.id,
      connectable_type: 'Block',
      channels: [
        {
          id: targetLane.id,
          position: toApiPosition(targetIndex),
          metadata: cardConnectionMetadata(card.connectionMetadata),
        },
      ],
    },
  })

  const connections = unwrapApiResult(connectResult, 'Unable to connect card to target lane')
  const newConnectionId = connections.data?.[0]?.id ?? -1

  const removeSourceResult = await client.DELETE('/v3/connections/{id}', {
    params: { path: { id: card.connectionId } },
  })

  if (removeSourceResult.error) {
    throw new Error('Unable to remove original card connection after move')
  }

  return { connectionId: newConnectionId }
}

export const removeCardFromLane = async (
  client: ArenaClient,
  connectionId: number,
): Promise<void> => {
  const result = await client.DELETE('/v3/connections/{id}', {
    params: { path: { id: connectionId } },
  })

  if (result.error) {
    throw new Error('Unable to remove card connection')
  }
}

export const reorderLane = async (
  client: ArenaClient,
  laneConnectionId: number,
  targetIndex: number,
): Promise<void> => {
  await reorderConnection(client, laneConnectionId, targetIndex)
}

export { toCardEditorDraft }
