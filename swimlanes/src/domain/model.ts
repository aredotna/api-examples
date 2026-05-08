import type { MetadataRecord } from './metadata'

export interface OAuthToken {
  access_token: string
  token_type: 'Bearer'
  scope: string
  created_at: number
}

export interface LaneTemplate {
  key: string
  title: string
  color: string
  wipLimit: number
  isDefault: boolean
}

export interface LaneModel {
  id: number
  title: string
  connectionId: number
  position: number
  metadata: MetadataRecord
  wipLimit: number
  laneKey: string
  color: string
  isDefault: boolean
}

export interface CardModel {
  id: number
  laneId: number
  laneKey: string
  connectionId: number
  position: number
  title: string
  description: string
  metadata: MetadataRecord
  connectionMetadata: MetadataRecord
}

export interface BoardModel {
  id: number
  title: string
  metadata: MetadataRecord
  lanes: LaneModel[]
  cardsByLaneId: Record<number, CardModel[]>
}

export interface CardDraft {
  title: string
  description: string
  priority: string
  estimatePoints: number
  epic: string
  laneId: number
}

export interface CardEditorDraft {
  title: string
  description: string
  priority: string
  estimatePoints: number
  epic: string
  blocked: boolean
  targetDate: string
}

export const DEMO_METADATA_KEYS = {
  boardType: 'board_type',
  appVersion: 'app_version',
  quarter: 'quarter',
  laneColor: 'lane_color',
  laneWipLimit: 'wip_limit',
  laneKey: 'lane_key',
  isDefaultLane: 'is_default_lane',
  cardPriority: 'priority',
  cardEstimatePoints: 'estimate_points',
  cardEpic: 'epic',
  cardUpdatedAt: 'updated_at',
  connectionBlocked: 'blocked',
  connectionTargetDate: 'target_date',
} as const

export const DEFAULT_LANES: readonly LaneTemplate[] = [
  {
    key: 'backlog',
    title: 'Backlog',
    color: '#59D5E0',
    wipLimit: 8,
    isDefault: true,
  },
  {
    key: 'in_progress',
    title: 'In Progress',
    color: '#21B6A8',
    wipLimit: 4,
    isDefault: true,
  },
  {
    key: 'review',
    title: 'Review',
    color: '#F3B664',
    wipLimit: 3,
    isDefault: true,
  },
  {
    key: 'done',
    title: 'Done',
    color: '#7AB2B2',
    wipLimit: 999,
    isDefault: true,
  },
]

export const BOARD_STORAGE_KEY = 'swimlane.board-id'
