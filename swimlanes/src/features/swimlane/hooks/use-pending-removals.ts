import { type Dispatch, useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import type { ArenaClient } from '@/api/client'
import { cardFromBoard } from '@/domain/board-transforms'
import type { BoardModel, CardModel } from '@/domain/model'
import { removeCardFromLane } from '@/domain/swimlaneService'
import { toErrorMessage } from '@/lib/errors'
import type { AppAction } from '../state/app-state'

const REMOVE_UNDO_MS = 5_000

interface PendingRemoval {
  timeoutId: number
  boardId: number
  laneId: number
  insertIndex: number
  card: CardModel
  wasSelected: boolean
}

export const usePendingRemovals = (client: ArenaClient | null, dispatch: Dispatch<AppAction>) => {
  const pendingRef = useRef<Map<number, PendingRemoval>>(new Map())

  const clearAll = useCallback((): void => {
    for (const pending of pendingRef.current.values()) {
      window.clearTimeout(pending.timeoutId)
    }
    pendingRef.current.clear()
  }, [])

  useEffect(() => () => clearAll(), [clearAll])

  const finalize = useCallback(
    async (cardId: number): Promise<void> => {
      if (!client) return

      const pending = pendingRef.current.get(cardId)
      if (!pending) return

      pendingRef.current.delete(cardId)

      try {
        await removeCardFromLane(client, pending.card.connectionId)
        toast.success('Card removed')
      } catch (error) {
        dispatch({
          type: 'RESTORE_CARD',
          laneId: pending.laneId,
          insertIndex: pending.insertIndex,
          card: pending.card,
          reselectCardId: pending.wasSelected ? pending.card.id : null,
        })
        const msg = toErrorMessage(error, 'Unable to remove card')
        dispatch({ type: 'SET_ERROR', message: msg })
        toast.error('Card remove failed', { description: msg })
      }
    },
    [client, dispatch],
  )

  const undo = useCallback(
    (cardId: number): void => {
      const pending = pendingRef.current.get(cardId)
      if (!pending) return

      window.clearTimeout(pending.timeoutId)
      pendingRef.current.delete(cardId)

      dispatch({
        type: 'RESTORE_CARD',
        laneId: pending.laneId,
        insertIndex: pending.insertIndex,
        card: pending.card,
        reselectCardId: pending.wasSelected ? pending.card.id : null,
      })
      toast.success('Card restored')
    },
    [dispatch],
  )

  const remove = useCallback(
    (board: BoardModel, cardId: number, selectedCardId: number | null): void => {
      const sourceCard = cardFromBoard(board, cardId)
      if (!sourceCard) return

      const laneCards = board.cardsByLaneId[sourceCard.laneId] ?? []
      const cardIndex = laneCards.findIndex((c) => c.id === cardId)
      if (cardIndex < 0) return

      const wasSelected = selectedCardId === cardId

      dispatch({
        type: 'SET_BOARD',
        board: {
          ...board,
          cardsByLaneId: {
            ...board.cardsByLaneId,
            [sourceCard.laneId]: laneCards.filter((c) => c.id !== cardId),
          },
        },
      })

      if (wasSelected) {
        dispatch({ type: 'SELECT_CARD', cardId: null })
      }

      const timeoutId = window.setTimeout(() => {
        void finalize(cardId)
      }, REMOVE_UNDO_MS)

      pendingRef.current.set(cardId, {
        timeoutId,
        boardId: board.id,
        laneId: sourceCard.laneId,
        insertIndex: cardIndex,
        card: sourceCard,
        wasSelected,
      })

      toast.info('Card removed', {
        description: 'Undo within 5 seconds to keep this card.',
        duration: REMOVE_UNDO_MS,
        action: {
          label: 'Undo',
          onClick: () => undo(cardId),
        },
      })
    },
    [dispatch, finalize, undo],
  )

  return { remove, clearAll }
}
