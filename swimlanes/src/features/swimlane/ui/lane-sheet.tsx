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
import type { LaneModel } from '@/domain/model'

export interface LaneDraft {
  title: string
  color: string
  wipLimit: number
}

interface LaneSheetProps {
  open: boolean
  lane: LaneModel | null
  draft: LaneDraft | null
  isBusy: boolean
  onOpenChange: (open: boolean) => void
  onDraftChange: (patch: Partial<LaneDraft>) => void
  onSave: () => Promise<void>
}

export const LaneSheet = ({
  open,
  lane,
  draft,
  isBusy,
  onOpenChange,
  onDraftChange,
  onSave,
}: LaneSheetProps) => {
  if (!lane || !draft) {
    return null
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Lane settings</SheetTitle>
          <SheetDescription>Update lane channel metadata and title.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
          <Input
            value={draft.title}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onDraftChange({ title: event.target.value })
            }
            placeholder="Lane title"
          />

          <div className="grid grid-cols-[84px_1fr] gap-3">
            <Input
              type="color"
              value={draft.color}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onDraftChange({ color: event.target.value })
              }
              className="h-8 p-1"
            />
            <Input
              type="number"
              min={1}
              value={draft.wipLimit}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onDraftChange({
                  wipLimit: Number.parseInt(event.target.value, 10) || 1,
                })
              }
              placeholder="WIP limit"
            />
          </div>
        </div>

        <SheetFooter>
          <Button
            onClick={() => {
              void onSave()
            }}
            disabled={isBusy || draft.title.trim().length === 0}
          >
            Save lane settings
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
