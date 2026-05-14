import {
  cardFromBoard,
  withCardConnectionUpdated,
  withCardReconciled,
  withLaneReconciled,
} from '@/domain/board-transforms'
import type { BoardModel, CardDraft, CardEditorDraft, CardModel } from '@/domain/model'
import { toCardEditorDraft } from '@/domain/swimlaneService'
import type { LaneDraft } from '../ui/lane-sheet'

// ─── State ───────────────────────────────────────────────────────────

export interface AddLaneDraft {
  title: string
  color: string
}

export interface AppState {
  board: BoardModel | null
  selectedCardId: number | null
  selectedLaneId: number | null
  cardDraft: CardDraft
  cardEditorDraft: CardEditorDraft | null
  laneDrafts: Record<number, LaneDraft>
  addLaneDraft: AddLaneDraft
  isCreateCardDialogOpen: boolean
  isAddLaneDialogOpen: boolean
  isBusy: boolean
  errorMessage: string
}

export const DEFAULT_CARD_DRAFT: CardDraft = {
  title: '',
  description: '',
  priority: 'P2',
  estimatePoints: 2,
  epic: '',
  laneId: 0,
}

const DEFAULT_ADD_LANE_DRAFT: AddLaneDraft = {
  title: '',
  color: '#7dd3fc',
}

export const initialAppState: AppState = {
  board: null,
  selectedCardId: null,
  selectedLaneId: null,
  cardDraft: DEFAULT_CARD_DRAFT,
  cardEditorDraft: null,
  laneDrafts: {},
  addLaneDraft: DEFAULT_ADD_LANE_DRAFT,
  isCreateCardDialogOpen: false,
  isAddLaneDialogOpen: false,
  isBusy: false,
  errorMessage: '',
}

// ─── Actions ─────────────────────────────────────────────────────────

export type AppAction =
  | { type: 'SET_BOARD'; board: BoardModel | null }
  | { type: 'SELECT_CARD'; cardId: number | null }
  | { type: 'SELECT_LANE'; laneId: number | null }
  | { type: 'OPEN_LANE_EDITOR'; laneId: number }
  | { type: 'PATCH_CARD_DRAFT'; field: keyof CardDraft; value: string | number }
  | { type: 'SET_CARD_DRAFT'; draft: CardDraft }
  | { type: 'RESET_CARD_DRAFT' }
  | { type: 'PATCH_CARD_EDITOR'; field: keyof CardEditorDraft; value: string | number | boolean }
  | { type: 'PATCH_LANE_DRAFT'; laneId: number; patch: Partial<LaneDraft> }
  | { type: 'PATCH_ADD_LANE'; patch: Partial<AddLaneDraft> }
  | { type: 'SET_CREATE_CARD_DIALOG'; open: boolean }
  | { type: 'SET_ADD_LANE_DIALOG'; open: boolean }
  | { type: 'SET_BUSY'; busy: boolean }
  | { type: 'SET_ERROR'; message: string }
  | {
      type: 'RESTORE_CARD'
      laneId: number
      insertIndex: number
      card: CardModel
      reselectCardId: number | null
    }
  | { type: 'RECONCILE_CARD'; tempId: number; realId: number; realConnectionId: number }
  | { type: 'RECONCILE_LANE'; tempId: number; realId: number; realConnectionId: number }
  | { type: 'UPDATE_CARD_CONNECTION'; cardId: number; connectionId: number }
  | { type: 'LOGOUT' }

// ─── Derived-state helpers ───────────────────────────────────────────

const buildLaneDrafts = (board: BoardModel): Record<number, LaneDraft> =>
  Object.fromEntries(board.lanes.map((lane) => [lane.id, { title: lane.title, color: lane.color }]))

const deriveCardEditorDraft = (
  board: BoardModel | null,
  cardId: number | null,
): CardEditorDraft | null => {
  if (!board || cardId === null) return null
  const card = cardFromBoard(board, cardId)
  return card ? toCardEditorDraft(card) : null
}

const applyDefaultLane = (draft: CardDraft, board: BoardModel | null): CardDraft => {
  if (draft.laneId !== 0 || !board?.lanes[0]) return draft
  return { ...draft, laneId: board.lanes[0].id }
}

// ─── Reducer ─────────────────────────────────────────────────────────

export const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_BOARD': {
      const { board } = action
      return {
        ...state,
        board,
        cardDraft: applyDefaultLane(state.cardDraft, board),
        laneDrafts: board ? buildLaneDrafts(board) : {},
        cardEditorDraft: deriveCardEditorDraft(board, state.selectedCardId),
      }
    }

    case 'SELECT_CARD':
      return {
        ...state,
        selectedCardId: action.cardId,
        selectedLaneId: null,
        cardEditorDraft: deriveCardEditorDraft(state.board, action.cardId),
      }

    case 'SELECT_LANE':
      return { ...state, selectedLaneId: action.laneId }

    case 'OPEN_LANE_EDITOR':
      return {
        ...state,
        selectedCardId: null,
        selectedLaneId: action.laneId,
        cardEditorDraft: null,
      }

    case 'PATCH_CARD_DRAFT':
      return {
        ...state,
        cardDraft: { ...state.cardDraft, [action.field]: action.value },
      }

    case 'SET_CARD_DRAFT':
      return { ...state, cardDraft: action.draft }

    case 'RESET_CARD_DRAFT':
      return {
        ...state,
        cardDraft: { ...DEFAULT_CARD_DRAFT, laneId: state.cardDraft.laneId },
      }

    case 'PATCH_CARD_EDITOR':
      return state.cardEditorDraft
        ? {
            ...state,
            cardEditorDraft: { ...state.cardEditorDraft, [action.field]: action.value },
          }
        : state

    case 'PATCH_LANE_DRAFT': {
      const existing = state.laneDrafts[action.laneId]
      if (!existing) return state
      return {
        ...state,
        laneDrafts: {
          ...state.laneDrafts,
          [action.laneId]: { ...existing, ...action.patch },
        },
      }
    }

    case 'PATCH_ADD_LANE':
      return { ...state, addLaneDraft: { ...state.addLaneDraft, ...action.patch } }

    case 'SET_CREATE_CARD_DIALOG':
      return { ...state, isCreateCardDialogOpen: action.open }

    case 'SET_ADD_LANE_DIALOG':
      return { ...state, isAddLaneDialogOpen: action.open }

    case 'SET_BUSY':
      return { ...state, isBusy: action.busy }

    case 'SET_ERROR':
      return { ...state, errorMessage: action.message }

    case 'RESTORE_CARD': {
      if (!state.board) return state

      const laneCards = state.board.cardsByLaneId[action.laneId] ?? []
      if (laneCards.some((c) => c.id === action.card.id)) return state

      const idx = Math.max(0, Math.min(action.insertIndex, laneCards.length))
      const nextLaneCards = [...laneCards]
      nextLaneCards.splice(idx, 0, action.card)

      const board: BoardModel = {
        ...state.board,
        cardsByLaneId: { ...state.board.cardsByLaneId, [action.laneId]: nextLaneCards },
      }
      const selectedCardId = action.reselectCardId ?? state.selectedCardId

      return {
        ...state,
        board,
        selectedCardId,
        cardEditorDraft: deriveCardEditorDraft(board, selectedCardId),
      }
    }

    case 'RECONCILE_CARD': {
      if (!state.board) return state
      const board = withCardReconciled(
        state.board,
        action.tempId,
        action.realId,
        action.realConnectionId,
      )
      return { ...state, board, laneDrafts: buildLaneDrafts(board) }
    }

    case 'RECONCILE_LANE': {
      if (!state.board) return state
      const board = withLaneReconciled(
        state.board,
        action.tempId,
        action.realId,
        action.realConnectionId,
      )
      return {
        ...state,
        board,
        laneDrafts: buildLaneDrafts(board),
        cardDraft: applyDefaultLane(state.cardDraft, board),
      }
    }

    case 'UPDATE_CARD_CONNECTION': {
      if (!state.board) return state
      return {
        ...state,
        board: withCardConnectionUpdated(state.board, action.cardId, action.connectionId),
      }
    }

    case 'LOGOUT':
      return { ...initialAppState }

    default:
      return state
  }
}
