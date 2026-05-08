import type { BoardModel, CardModel } from './model'
import { reorderArray } from './reorder'

export const withCardReordered = (
  board: BoardModel,
  laneId: number,
  fromIndex: number,
  toIndex: number,
): BoardModel => {
  const laneCards = board.cardsByLaneId[laneId] ?? []
  const reordered = reorderArray(laneCards, fromIndex, toIndex).map((card, index) => ({
    ...card,
    position: index,
  }))

  return {
    ...board,
    cardsByLaneId: {
      ...board.cardsByLaneId,
      [laneId]: reordered,
    },
  }
}

export const withLanesReordered = (
  board: BoardModel,
  fromIndex: number,
  toIndex: number,
): BoardModel => ({
  ...board,
  lanes: reorderArray(board.lanes, fromIndex, toIndex).map((lane, index) => ({
    ...lane,
    position: index,
  })),
})

export const cardFromBoard = (board: BoardModel, cardId: number): CardModel | null => {
  for (const cards of Object.values(board.cardsByLaneId)) {
    const card = cards.find((candidate) => candidate.id === cardId)
    if (card) {
      return card
    }
  }

  return null
}

const mapCards = (
  cardsByLaneId: BoardModel['cardsByLaneId'],
  fn: (card: CardModel) => CardModel,
): BoardModel['cardsByLaneId'] =>
  Object.fromEntries(
    Object.entries(cardsByLaneId).map(([laneId, cards]) => [laneId, cards.map(fn)]),
  )

export const withCardReconciled = (
  board: BoardModel,
  tempId: number,
  realId: number,
  realConnectionId: number,
): BoardModel => ({
  ...board,
  cardsByLaneId: mapCards(board.cardsByLaneId, (c) =>
    c.id === tempId ? { ...c, id: realId, connectionId: realConnectionId } : c,
  ),
})

export const withLaneReconciled = (
  board: BoardModel,
  tempId: number,
  realId: number,
  realConnectionId: number,
): BoardModel => {
  const tempCards = board.cardsByLaneId[tempId] ?? []
  const { [tempId]: _, ...rest } = board.cardsByLaneId

  return {
    ...board,
    lanes: board.lanes.map((l) =>
      l.id === tempId ? { ...l, id: realId, connectionId: realConnectionId } : l,
    ),
    cardsByLaneId: { ...rest, [realId]: tempCards },
  }
}

export const withCardConnectionUpdated = (
  board: BoardModel,
  cardId: number,
  connectionId: number,
): BoardModel => ({
  ...board,
  cardsByLaneId: mapCards(board.cardsByLaneId, (c) =>
    c.id === cardId ? { ...c, connectionId } : c,
  ),
})
