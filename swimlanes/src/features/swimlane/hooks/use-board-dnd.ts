import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { type Dispatch, useEffect } from 'react'
import { toast } from 'sonner'
import type { ArenaClient } from '@/api/client'
import { cardFromBoard, withCardReordered, withLanesReordered } from '@/domain/board-transforms'
import { isCardDragData, isCardDropData, isLaneDragData, isLaneDropData } from '@/domain/dnd'
import type { BoardModel, CardModel } from '@/domain/model'
import { moveCardAcrossLanes, reorderConnection, reorderLane } from '@/domain/swimlaneService'
import { toErrorMessage } from '@/lib/errors'
import type { AppAction } from '../state/app-state'

export const useBoardDnD = (
  board: BoardModel | null,
  client: ArenaClient | null,
  dispatch: Dispatch<AppAction>,
): void => {
  useEffect(() => {
    if (!client || !board) return

    return monitorForElements({
      onDrop: async ({ source, location }) => {
        const sourceData = source.data
        const primaryTarget = location.current.dropTargets[0]?.data
        const laneDropTargetData = location.current.dropTargets
          .map((dt) => dt.data)
          .find(isLaneDropData)

        if (!primaryTarget) return

        if (isCardDragData(sourceData)) {
          const laneTarget = isCardDropData(primaryTarget)
            ? { laneId: primaryTarget.laneId, index: primaryTarget.index }
            : isLaneDropData(primaryTarget)
              ? { laneId: primaryTarget.laneId, index: primaryTarget.itemCount }
              : null

          if (!laneTarget) return

          const sourceCard = cardFromBoard(board, sourceData.cardId)
          if (!sourceCard) return

          const targetLane = board.lanes.find((l) => l.id === laneTarget.laneId)
          if (!targetLane) return

          const sourceLaneCards = board.cardsByLaneId[sourceData.laneId] ?? []

          // Same-lane reorder
          if (sourceData.laneId === laneTarget.laneId) {
            if (
              laneTarget.index === sourceData.index ||
              laneTarget.index < 0 ||
              laneTarget.index >= sourceLaneCards.length
            ) {
              return
            }

            const previousBoard = board
            dispatch({
              type: 'SET_BOARD',
              board: withCardReordered(
                board,
                sourceData.laneId,
                sourceData.index,
                laneTarget.index,
              ),
            })

            try {
              await reorderConnection(client, sourceData.connectionId, laneTarget.index)
              toast.success('Card order synced')
            } catch (error) {
              dispatch({ type: 'SET_BOARD', board: previousBoard })
              const msg = toErrorMessage(error, 'Unable to reorder card in lane')
              dispatch({ type: 'SET_ERROR', message: msg })
              toast.error('Card reorder failed', { description: msg })
            }

            return
          }

          // Cross-lane move
          const previousBoard = board
          const sourceCards = previousBoard.cardsByLaneId[sourceData.laneId] ?? []
          const targetCards = previousBoard.cardsByLaneId[targetLane.id] ?? []
          const nextSourceCards = sourceCards.filter((c) => c.id !== sourceCard.id)
          const targetInsertIndex = Math.max(0, Math.min(laneTarget.index, targetCards.length))

          const movedCard: CardModel = {
            ...sourceCard,
            laneId: targetLane.id,
            laneKey: targetLane.laneKey,
          }

          const nextTargetCards = [...targetCards]
          nextTargetCards.splice(targetInsertIndex, 0, movedCard)

          dispatch({
            type: 'SET_BOARD',
            board: {
              ...previousBoard,
              cardsByLaneId: {
                ...previousBoard.cardsByLaneId,
                [sourceData.laneId]: nextSourceCards,
                [targetLane.id]: nextTargetCards,
              },
            },
          })

          try {
            const { connectionId } = await moveCardAcrossLanes(
              client,
              sourceCard,
              targetLane,
              Math.max(0, laneTarget.index),
            )
            dispatch({ type: 'UPDATE_CARD_CONNECTION', cardId: sourceCard.id, connectionId })
            toast.success('Card move synced')
          } catch (error) {
            dispatch({ type: 'SET_BOARD', board: previousBoard })
            const msg = toErrorMessage(error, 'Unable to move card')
            dispatch({ type: 'SET_ERROR', message: msg })
            toast.error('Card move failed', { description: msg })
          }

          return
        }

        // Lane reorder
        if (isLaneDragData(sourceData) && laneDropTargetData) {
          const targetIndex = board.lanes.findIndex((l) => l.id === laneDropTargetData.laneId)
          if (
            targetIndex < 0 ||
            targetIndex === sourceData.index ||
            targetIndex >= board.lanes.length
          ) {
            return
          }

          const previousBoard = board
          dispatch({
            type: 'SET_BOARD',
            board: withLanesReordered(board, sourceData.index, targetIndex),
          })

          try {
            await reorderLane(client, sourceData.connectionId, targetIndex)
            toast.success('Lane order synced')
          } catch (error) {
            dispatch({ type: 'SET_BOARD', board: previousBoard })
            const msg = toErrorMessage(error, 'Unable to reorder lanes')
            dispatch({ type: 'SET_ERROR', message: msg })
            toast.error('Lane reorder failed', { description: msg })
          }
        }
      },
    })
  }, [board, client, dispatch])
}
