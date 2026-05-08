import type { ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface AddLaneDialogProps {
  open: boolean
  isBusy: boolean
  title: string
  color: string
  wipLimit: number
  onOpenChange: (open: boolean) => void
  onTitleChange: (value: string) => void
  onColorChange: (value: string) => void
  onWipLimitChange: (value: number) => void
  onSubmit: () => Promise<void>
}

export const AddLaneDialog = ({
  open,
  isBusy,
  title,
  color,
  wipLimit,
  onOpenChange,
  onTitleChange,
  onColorChange,
  onWipLimitChange,
  onSubmit,
}: AddLaneDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Add lane</DialogTitle>
        <DialogDescription>Create a lane channel and connect it to the board.</DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <Input
          value={title}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onTitleChange(event.target.value)}
          placeholder="Lane title"
          autoFocus
        />

        <div className="grid grid-cols-[84px_1fr] gap-3">
          <Input
            type="color"
            value={color}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onColorChange(event.target.value)}
            className="h-8 p-1"
          />
          <Input
            type="number"
            min={1}
            value={wipLimit}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onWipLimitChange(Number.parseInt(event.target.value, 10) || 1)
            }
            placeholder="WIP limit"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={isBusy || title.trim().length === 0}
          onClick={() => {
            void onSubmit()
          }}
        >
          Create lane
        </Button>
      </div>
    </DialogContent>
  </Dialog>
)
