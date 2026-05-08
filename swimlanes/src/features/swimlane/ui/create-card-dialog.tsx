import type { ChangeEvent, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { CardDraft, LaneModel } from '@/domain/model'

interface CreateCardDialogProps {
  open: boolean
  isBusy: boolean
  lanes: LaneModel[]
  draft: CardDraft
  onOpenChange: (open: boolean) => void
  onDraftChange: (field: keyof CardDraft, value: string | number) => void
  onSubmit: () => Promise<void>
}

export const CreateCardDialog = ({
  open,
  isBusy,
  lanes,
  draft,
  onOpenChange,
  onDraftChange,
  onSubmit,
}: CreateCardDialogProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    void onSubmit()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create card</DialogTitle>
          <DialogDescription>
            Create a new block and connect it into the selected lane.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <Input
            value={draft.title}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onDraftChange('title', event.target.value)
            }
            placeholder="Card title"
            autoFocus
          />

          <Textarea
            value={draft.description}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
              onDraftChange('description', event.target.value)
            }
            placeholder="Description"
            className="min-h-28"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_128px_132px]">
            <select
              className="h-8 min-w-0 w-full rounded-lg border border-input bg-input/20 px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={draft.laneId}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                onDraftChange('laneId', Number.parseInt(event.target.value, 10))
              }
            >
              {lanes.map((lane) => (
                <option key={lane.id} value={lane.id}>
                  {lane.title}
                </option>
              ))}
            </select>

            <Input
              value={draft.priority}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onDraftChange('priority', event.target.value)
              }
              placeholder="Priority"
            />

            <Input
              type="number"
              min={0}
              value={draft.estimatePoints}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onDraftChange('estimatePoints', Number.parseInt(event.target.value, 10) || 0)
              }
              placeholder="Points"
            />
          </div>

          <Input
            value={draft.epic}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onDraftChange('epic', event.target.value)
            }
            placeholder="Epic"
          />

          <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isBusy || draft.title.trim().length === 0}>
              Add card
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
