import type { ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import type { CardEditorDraft, CardModel } from '@/domain/model'

interface CardSheetProps {
  open: boolean
  card: CardModel | null
  draft: CardEditorDraft | null
  isBusy: boolean
  onOpenChange: (open: boolean) => void
  onFieldChange: (field: keyof CardEditorDraft, value: string | number | boolean) => void
  onSave: () => Promise<void>
}

export const CardSheet = ({
  open,
  card,
  draft,
  isBusy,
  onOpenChange,
  onFieldChange,
  onSave,
}: CardSheetProps) => {
  if (!card || !draft) {
    return null
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Card details</SheetTitle>
          <SheetDescription>Update block metadata and lane connection metadata.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
          <Input
            value={draft.title}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onFieldChange('title', event.target.value)
            }
            placeholder="Title"
          />

          <Textarea
            value={draft.description}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
              onFieldChange('description', event.target.value)
            }
            className="min-h-32"
            placeholder="Description"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              value={draft.priority}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onFieldChange('priority', event.target.value)
              }
              placeholder="Priority"
            />

            <Input
              type="number"
              min={0}
              value={draft.estimatePoints}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onFieldChange('estimatePoints', Number.parseInt(event.target.value, 10) || 0)
              }
              placeholder="Points"
            />
          </div>

          <Input
            value={draft.epic}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onFieldChange('epic', event.target.value)
            }
            placeholder="Epic"
          />

          <Input
            type="date"
            value={draft.targetDate}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onFieldChange('targetDate', event.target.value)
            }
          />

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={draft.blocked}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onFieldChange('blocked', event.target.checked)
              }
              className="size-4 accent-current"
            />
            Blocked
          </label>
        </div>

        <SheetFooter>
          <Button
            onClick={() => {
              void onSave()
            }}
            disabled={isBusy || draft.title.trim().length === 0}
          >
            Save card
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
