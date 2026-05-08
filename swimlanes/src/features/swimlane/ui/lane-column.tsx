import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { GripVerticalIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { LaneDragData } from '@/domain/dnd'
import type { CardModel, LaneModel } from '@/domain/model'
import { CardItem } from './card-item'
import { MetadataTooltip } from './metadata-tooltip'
import { toHexAlphaColor } from './style-utils'

interface LaneColumnProps {
  lane: LaneModel
  laneIndex: number
  laneCount: number
  cards: CardModel[]
  selectedCardId: number | null
  onSelectCard: (cardId: number) => void
  onOpenLaneEditor: (laneId: number) => void
  onQuickAddCard: (laneId: number) => void
  onCopyCardTitle: (cardId: number) => void
  onMoveCardToPreviousLane: (cardId: number) => void
  onMoveCardToNextLane: (cardId: number) => void
  onRemoveCard: (cardId: number) => void
}

export const LaneColumn = ({
  lane,
  laneIndex,
  laneCount,
  cards,
  selectedCardId,
  onSelectCard,
  onOpenLaneEditor,
  onQuickAddCard,
  onCopyCardTitle,
  onMoveCardToPreviousLane,
  onMoveCardToNextLane,
  onRemoveCard,
}: LaneColumnProps) => {
  const laneRef = useRef<HTMLDivElement | null>(null)
  const laneHeaderRef = useRef<HTMLDivElement | null>(null)
  const [isDropActive, setIsDropActive] = useState(false)

  useEffect(() => {
    const laneElement = laneRef.current
    const laneHeader = laneHeaderRef.current

    if (!laneElement || !laneHeader) {
      return
    }

    return combine(
      draggable({
        element: laneElement,
        dragHandle: laneHeader,
        getInitialData: (): LaneDragData => ({
          entity: 'lane',
          laneId: lane.id,
          connectionId: lane.connectionId,
          index: laneIndex,
        }),
      }),
      dropTargetForElements({
        element: laneElement,
        getData: () => ({
          target: 'lane',
          laneId: lane.id,
          itemCount: cards.length,
        }),
        onDragEnter: () => setIsDropActive(true),
        onDragLeave: () => setIsDropActive(false),
        onDrop: () => setIsDropActive(false),
      }),
    )
  }, [cards.length, lane.connectionId, lane.id, laneIndex])

  return (
    <section
      ref={laneRef}
      className="flex w-[320px] min-w-[320px] flex-col gap-3 rounded-xl border p-3"
      style={{
        backgroundColor: toHexAlphaColor(lane.color, '1a'),
        borderColor: isDropActive ? lane.color : toHexAlphaColor(lane.color, '55'),
      }}
    >
      <div className="flex items-center justify-between gap-2" ref={laneHeaderRef}>
        <div className="flex min-w-0 items-center gap-2">
          <GripVerticalIcon className="size-4 text-muted-foreground" />
          <h2 className="truncate font-mono text-sm font-semibold text-foreground">{lane.title}</h2>
          <MetadataTooltip
            label="Lane channel metadata"
            metadata={lane.metadata}
            className="size-5"
          />
        </div>
        <Badge variant="outline">WIP {lane.wipLimit}</Badge>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="justify-start"
        onClick={() => onOpenLaneEditor(lane.id)}
      >
        Edit lane settings
      </Button>

      <div className="flex max-h-[65vh] flex-col gap-2 overflow-y-auto pr-1">
        {cards.map((card, index) => (
          <CardItem
            key={card.id}
            card={card}
            laneColor={lane.color}
            index={index}
            isSelected={selectedCardId === card.id}
            onSelect={onSelectCard}
            onCopyTitle={onCopyCardTitle}
            onMoveToPreviousLane={onMoveCardToPreviousLane}
            onMoveToNextLane={onMoveCardToNextLane}
            onRemove={onRemoveCard}
            canMoveToPreviousLane={laneIndex > 0}
            canMoveToNextLane={laneIndex < laneCount - 1}
          />
        ))}
        {cards.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-background/30 px-3 py-4 text-xs text-muted-foreground">
            Drop cards here.
          </div>
        ) : null}
      </div>

      <Button
        size="sm"
        variant="outline"
        style={{ borderColor: toHexAlphaColor(lane.color, '80') }}
        onClick={() => onQuickAddCard(lane.id)}
      >
        + New card
      </Button>
    </section>
  )
}
