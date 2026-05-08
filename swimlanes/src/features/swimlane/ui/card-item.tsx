import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { CopyIcon, EyeIcon, MoveLeftIcon, MoveRightIcon, TrashIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import type { CardDragData } from '@/domain/dnd'
import { type CardModel, DEMO_METADATA_KEYS } from '@/domain/model'
import { MetadataTooltip } from './metadata-tooltip'
import { formatTimestamp, toHexAlphaColor } from './style-utils'

interface CardItemProps {
  card: CardModel
  index: number
  laneColor: string
  isSelected: boolean
  canMoveToPreviousLane: boolean
  canMoveToNextLane: boolean
  onSelect: (cardId: number) => void
  onMoveToPreviousLane: (cardId: number) => void
  onMoveToNextLane: (cardId: number) => void
  onCopyTitle: (cardId: number) => void
  onRemove: (cardId: number) => void
}

export const CardItem = ({
  card,
  index,
  laneColor,
  isSelected,
  canMoveToPreviousLane,
  canMoveToNextLane,
  onSelect,
  onMoveToPreviousLane,
  onMoveToNextLane,
  onCopyTitle,
  onRemove,
}: CardItemProps) => {
  const ref = useRef<HTMLDivElement | null>(null)
  const [isDropActive, setIsDropActive] = useState(false)
  const laneTint = toHexAlphaColor(laneColor, isSelected ? '20' : '14')

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }

    return combine(
      draggable({
        element,
        getInitialData: (): CardDragData => ({
          entity: 'card',
          cardId: card.id,
          laneId: card.laneId,
          connectionId: card.connectionId,
          index,
        }),
      }),
      dropTargetForElements({
        element,
        getData: () => ({
          target: 'card' as const,
          laneId: card.laneId,
          index,
        }),
        onDragEnter: () => setIsDropActive(true),
        onDragLeave: () => setIsDropActive(false),
        onDrop: () => setIsDropActive(false),
      }),
    )
  }, [card.connectionId, card.id, card.laneId, index])

  const cardTimestamp = formatTimestamp(
    card.metadata[DEMO_METADATA_KEYS.cardUpdatedAt] ?? card.metadata.created_at,
  )

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Card
          ref={ref}
          role="button"
          tabIndex={0}
          onClick={() => onSelect(card.id)}
          className="gap-2 rounded-lg border px-3 py-3 text-left shadow-none transition-colors"
          style={{
            backgroundColor: laneTint,
            borderColor: isSelected
              ? laneColor
              : isDropActive
                ? toHexAlphaColor(laneColor, 'aa')
                : 'var(--border)',
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-start gap-1.5">
              <p className="line-clamp-2 font-mono text-sm font-semibold leading-tight text-foreground">
                {card.title}
              </p>
              <MetadataTooltip
                label="Card block and connection metadata"
                metadata={{
                  block: card.metadata,
                  connection: card.connectionMetadata,
                }}
                className="size-5"
              />
            </div>
            <Badge className="shrink-0" variant="secondary">
              {String(card.metadata.priority ?? 'P2')}
            </Badge>
          </div>

          <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
            {card.description || 'No description'}
          </p>

          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span>pts {String(card.metadata.estimate_points ?? 0)}</span>
            <span>{String(card.metadata.epic ?? 'no-epic')}</span>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">{cardTimestamp}</p>
        </Card>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={() => onSelect(card.id)}>
          <EyeIcon className="mr-2 size-4" />
          Open details
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!canMoveToPreviousLane}
          onClick={() => onMoveToPreviousLane(card.id)}
        >
          <MoveLeftIcon className="mr-2 size-4" />
          Move to previous lane
        </ContextMenuItem>
        <ContextMenuItem disabled={!canMoveToNextLane} onClick={() => onMoveToNextLane(card.id)}>
          <MoveRightIcon className="mr-2 size-4" />
          Move to next lane
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onCopyTitle(card.id)}>
          <CopyIcon className="mr-2 size-4" />
          Copy title
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onRemove(card.id)} variant="destructive">
          <TrashIcon className="mr-2 size-4" />
          Remove card
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
