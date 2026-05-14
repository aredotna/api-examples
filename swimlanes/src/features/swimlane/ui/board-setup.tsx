import { useSearch } from '@aredotna/react-query'
import { type Channel, SearchScope } from '@aredotna/sdk/api'
import { Loader2Icon, LogOutIcon, XIcon } from 'lucide-react'
import { type ChangeEvent, type FormEvent, useId, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { ArenaClient } from '@/api/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { type BoardModel, DEFAULT_LANES } from '@/domain/model'
import { createBoardWithLanes, fetchBoard, type LaneChannelSetup } from '@/domain/swimlaneService'
import { toErrorMessage } from '@/lib/errors'

interface LaneChannelDraft extends LaneChannelSetup {
  selectedChannel: Channel | null
}

interface ChannelPickerProps {
  label: string
  placeholder: string
  selectedChannel: Channel | null
  excludedChannelIds?: Set<number>
  onSelect: (channel: Channel) => void
  onClear: () => void
}

const initialLaneDrafts = (): LaneChannelDraft[] =>
  DEFAULT_LANES.map((lane) => ({
    channelId: null,
    title: lane.title,
    key: lane.key,
    color: lane.color,
    isDefault: lane.isDefault,
    selectedChannel: null,
  }))

const labelInputClassName = 'flex flex-col gap-2'
const fieldLabelClassName =
  'text-xs font-medium uppercase leading-none tracking-[0.16em] text-muted-foreground'

const ChannelPicker = ({
  label,
  placeholder,
  selectedChannel,
  excludedChannelIds = new Set<number>(),
  onSelect,
  onClear,
}: ChannelPickerProps) => {
  const inputId = useId()
  const [query, setQuery] = useState('')
  const trimmedQuery = query.trim()
  const { data, isLoading } = useSearch(
    {
      query: trimmedQuery,
      type: ['Channel'],
      scope: SearchScope.MY,
      per: 8,
    },
    { enabled: trimmedQuery.length > 0 },
  )

  const channels = useMemo(
    () =>
      data?.data?.filter((item): item is Channel => 'type' in item && item.type === 'Channel') ??
      [],
    [data],
  )

  return (
    <div className="space-y-2">
      <div className={labelInputClassName}>
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={inputId} className={fieldLabelClassName}>
            {label}
          </label>
          {selectedChannel ? (
            <Button type="button" size="xs" variant="ghost" onClick={onClear}>
              <XIcon className="size-3" />
              Clear
            </Button>
          ) : null}
        </div>

        <Input
          id={inputId}
          value={query}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
          placeholder={placeholder}
        />
      </div>

      {selectedChannel ? (
        <div className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm">
          <div className="font-medium text-foreground">{selectedChannel.title}</div>
          <div className="text-xs text-muted-foreground">
            /{selectedChannel.slug} - {selectedChannel.counts?.contents ?? 0} items
          </div>
        </div>
      ) : null}

      {trimmedQuery.length === 0 ? (
        <p className="text-xs text-muted-foreground">Start typing to search your channels.</p>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
          <Loader2Icon className="size-3.5 animate-spin" />
          Searching channels...
        </div>
      ) : null}

      {trimmedQuery.length > 0 && !isLoading && channels.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
          No matching channels found.
        </p>
      ) : null}

      {channels.length > 0 ? (
        <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-border p-1">
          {channels.map((channel) => {
            const isAlreadySelected =
              excludedChannelIds.has(channel.id) && selectedChannel?.id !== channel.id

            return (
              <button
                type="button"
                key={channel.id}
                disabled={isAlreadySelected}
                className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => onSelect(channel)}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-foreground">
                    {channel.title}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    /{channel.slug} - {channel.counts?.contents ?? 0} items
                  </span>
                </span>
                {isAlreadySelected ? <Badge variant="outline">Selected</Badge> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

interface BoardSetupProps {
  client: ArenaClient
  errorMessage: string
  userName: string
  userAvatar: string | null
  userInitials: string
  onBoardReady: (board: BoardModel) => void
  onError: (message: string) => void
  onLogout: () => void
}

export const BoardSetup = ({
  client,
  errorMessage,
  userName,
  userAvatar,
  userInitials,
  onBoardReady,
  onError,
  onLogout,
}: BoardSetupProps) => {
  const [selectedBoard, setSelectedBoard] = useState<Channel | null>(null)
  const [boardTitle, setBoardTitle] = useState('Swimlane Board')
  const [laneDrafts, setLaneDrafts] = useState<LaneChannelDraft[]>(initialLaneDrafts)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedLaneChannelIds = useMemo(
    () =>
      new Set(
        laneDrafts
          .map((lane) => lane.channelId)
          .filter((channelId): channelId is number => channelId !== null),
      ),
    [laneDrafts],
  )

  const canCreateBoard =
    boardTitle.trim().length > 0 &&
    laneDrafts.every((lane) => lane.channelId !== null || lane.title.trim().length > 0)

  const handleUseSelectedBoard = async (): Promise<void> => {
    if (!selectedBoard) return
    setIsSubmitting(true)

    try {
      const board = await fetchBoard(client, selectedBoard.id)
      onBoardReady(board)
      toast.success('Board selected')
    } catch (error) {
      const msg = toErrorMessage(error, 'Unable to load selected board')
      onError(msg)
      toast.error('Board load failed', { description: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLaneSelected = (index: number, channel: Channel): void => {
    setLaneDrafts((current) =>
      current.map((lane, laneIndex) =>
        laneIndex === index
          ? {
              ...lane,
              channelId: channel.id,
              title: channel.title,
              selectedChannel: channel,
            }
          : lane,
      ),
    )
  }

  const handleLaneCleared = (index: number): void => {
    setLaneDrafts((current) =>
      current.map((lane, laneIndex) =>
        laneIndex === index
          ? {
              ...lane,
              channelId: null,
              selectedChannel: null,
            }
          : lane,
      ),
    )
  }

  const handleLaneTitleChanged = (index: number, title: string): void => {
    setLaneDrafts((current) =>
      current.map((lane, laneIndex) => (laneIndex === index ? { ...lane, title } : lane)),
    )
  }

  const handleCreateBoard = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (!canCreateBoard) return

    setIsSubmitting(true)

    try {
      const laneSetup = laneDrafts.map(
        ({ channelId, title, key, color, isDefault }): LaneChannelSetup => ({
          channelId,
          title,
          key,
          color,
          isDefault,
        }),
      )
      const board = await createBoardWithLanes(client, boardTitle, laneSetup)
      onBoardReady(board)
      toast.success('Board created')
    } catch (error) {
      const msg = toErrorMessage(error, 'Unable to create board')
      onError(msg)
      toast.error('Board create failed', { description: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Swimlane setup
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Choose your channels</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Pick an existing board channel, or create a new board and decide which channels should
              become the default lanes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Avatar size="sm">
              {userAvatar ? <AvatarImage src={userAvatar} alt={userName} /> : null}
              <AvatarFallback>{userInitials || '?'}</AvatarFallback>
            </Avatar>
            <Button type="button" variant="outline" size="sm" onClick={onLogout}>
              <LogOutIcon className="size-3.5" />
              Logout
            </Button>
          </div>
        </header>

        {errorMessage ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Use an existing board</CardTitle>
              <CardDescription>
                Select a channel that already contains lane channels as its contents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ChannelPicker
                label="Board channel"
                placeholder="Search board channels..."
                selectedChannel={selectedBoard}
                onSelect={setSelectedBoard}
                onClear={() => setSelectedBoard(null)}
              />
              <Button
                type="button"
                disabled={!selectedBoard || isSubmitting}
                onClick={() => {
                  void handleUseSelectedBoard()
                }}
              >
                {isSubmitting ? <Loader2Icon className="size-3.5 animate-spin" /> : null}
                Use selected board
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Create a board</CardTitle>
              <CardDescription>
                Name the board, then select an existing channel for each lane or leave a lane name
                to create a new private channel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleCreateBoard}>
                <div className={labelInputClassName}>
                  <label htmlFor="board-title" className={fieldLabelClassName}>
                    New board name
                  </label>
                  <Input
                    id="board-title"
                    value={boardTitle}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setBoardTitle(event.target.value)
                    }
                    placeholder="Board channel name"
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  {laneDrafts.map((lane, index) => (
                    <div key={lane.key} className="rounded-xl border border-border p-3">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <h2 className="text-sm font-semibold text-foreground">{lane.title}</h2>
                          <p className="text-xs text-muted-foreground">
                            Select a channel, or create one from the lane name below.
                          </p>
                        </div>
                        <Badge variant="outline">Lane {index + 1}</Badge>
                      </div>

                      <div className="grid gap-3 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                        <div className={labelInputClassName}>
                          <label htmlFor={`lane-title-${lane.key}`} className={fieldLabelClassName}>
                            New channel name
                          </label>
                          <Input
                            id={`lane-title-${lane.key}`}
                            value={lane.title}
                            disabled={lane.selectedChannel !== null}
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                              handleLaneTitleChanged(index, event.target.value)
                            }
                            placeholder="Lane channel name"
                          />
                        </div>

                        <ChannelPicker
                          label="Use existing channel"
                          placeholder={`Search for ${lane.title || 'a lane'}...`}
                          selectedChannel={lane.selectedChannel}
                          excludedChannelIds={selectedLaneChannelIds}
                          onSelect={(channel) => handleLaneSelected(index, channel)}
                          onClear={() => handleLaneCleared(index)}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end border-t border-border pt-3">
                  <Button type="submit" disabled={!canCreateBoard || isSubmitting}>
                    {isSubmitting ? <Loader2Icon className="size-3.5 animate-spin" /> : null}
                    Create board and lanes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
