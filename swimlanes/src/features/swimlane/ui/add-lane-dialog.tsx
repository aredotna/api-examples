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
  onOpenChange: (open: boolean) => void
  onTitleChange: (value: string) => void
  onColorChange: (value: string) => void
  onSubmit: () => Promise<void>
}

export const AddLaneDialog = ({
  open,
  isBusy,
  title,
  color,
  onOpenChange,
  onTitleChange,
  onColorChange,
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

        <Input
          type="color"
          value={color}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onColorChange(event.target.value)}
          className="h-8 w-24 p-1"
        />
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
