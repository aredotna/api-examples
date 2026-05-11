import { Loader2Icon, XIcon } from 'lucide-react'
import { useMemo, useReducer } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { appConfig, isOauthConfigured } from '@/config'
import { setStoredBoardId } from '@/domain/board-storage'
import { cardFromBoard } from '@/domain/board-transforms'
import { type BoardModel, type CardModel, DEMO_METADATA_KEYS, type LaneModel } from '@/domain/model'
import {
  addLane as addLaneApi,
  createCard,
  moveCardAcrossLanes,
  updateCard,
  updateLaneSettings,
} from '@/domain/swimlaneService'
import { useAuth } from '@/features/swimlane/hooks/use-auth'
import { useBoardDnD } from '@/features/swimlane/hooks/use-board-dnd'
import { usePendingRemovals } from '@/features/swimlane/hooks/use-pending-removals'
import {
  appReducer,
  DEFAULT_CARD_DRAFT,
  initialAppState,
} from '@/features/swimlane/state/app-state'
import { AddLaneDialog } from '@/features/swimlane/ui/add-lane-dialog'
import { BoardHeader } from '@/features/swimlane/ui/board-header'
import { BoardSetup } from '@/features/swimlane/ui/board-setup'
import { CardSheet } from '@/features/swimlane/ui/card-sheet'
import { CreateCardDialog } from '@/features/swimlane/ui/create-card-dialog'
import { LaneColumn } from '@/features/swimlane/ui/lane-column'
import { LaneSheet } from '@/features/swimlane/ui/lane-sheet'
import { createQuickTimestampLabel } from '@/features/swimlane/ui/style-utils'
import { toErrorMessage } from '@/lib/errors'

const App = () => {
  const [state, dispatch] = useReducer(appReducer, initialAppState)
  const {
    board,
    selectedCardId,
    selectedLaneId,
    cardDraft,
    cardEditorDraft,
    laneDrafts,
    addLaneDraft,
    isCreateCardDialogOpen,
    isAddLaneDialogOpen,
    isBusy,
    errorMessage,
  } = state

  const auth = useAuth(dispatch)
  const { client } = auth
  const removals = usePendingRemovals(client, dispatch)
  useBoardDnD(board, client, dispatch)

  const selectedCard = useMemo(
    () => (board && selectedCardId !== null ? cardFromBoard(board, selectedCardId) : null),
    [board, selectedCardId],
  )

  const selectedLane = useMemo(
    () => board?.lanes.find((l) => l.id === selectedLaneId) ?? null,
    [board, selectedLaneId],
  )

  // ─── Handlers ────────────────────────────────────────────────────

  const handleLogout = (): void => {
    removals.clearAll()
    auth.logout()
  }

  const handleBoardReady = (nextBoard: BoardModel): void => {
    dispatch({ type: 'SET_BOARD', board: nextBoard })
    dispatch({ type: 'SET_ERROR', message: '' })
    setStoredBoardId(nextBoard.id)
  }

  const handleRefresh = async (): Promise<void> => {
    if (!board) return
    toast.info('Refreshing board')
    dispatch({ type: 'SET_BUSY', busy: true })

    try {
      await auth.syncBoard(board.id)
      toast.success('Board synced')
    } catch (error) {
      const msg = toErrorMessage(error, 'Unable to refresh board')
      dispatch({ type: 'SET_ERROR', message: msg })
      toast.error('Refresh failed', { description: msg })
    } finally {
      dispatch({ type: 'SET_BUSY', busy: false })
    }
  }

  const handleCreateCard = async (): Promise<void> => {
    if (!client || !board || cardDraft.title.trim().length === 0) return

    const lane = board.lanes.find((l) => l.id === cardDraft.laneId)
    if (!lane) return

    const laneCards = board.cardsByLaneId[lane.id] ?? []
    const previousBoard = board
    const tempId = -Date.now()
    const updatedAtIso = new Date().toISOString()

    const optimisticCard: CardModel = {
      id: tempId,
      laneId: lane.id,
      laneKey: lane.laneKey,
      connectionId: tempId - 1,
      position: laneCards.length + 1,
      title: cardDraft.title,
      description: cardDraft.description,
      metadata: {
        [DEMO_METADATA_KEYS.cardPriority]: cardDraft.priority,
        [DEMO_METADATA_KEYS.cardEstimatePoints]: String(cardDraft.estimatePoints),
        [DEMO_METADATA_KEYS.cardEpic]: cardDraft.epic,
        [DEMO_METADATA_KEYS.cardUpdatedAt]: updatedAtIso,
      },
      connectionMetadata: {
        [DEMO_METADATA_KEYS.connectionBlocked]: false,
        [DEMO_METADATA_KEYS.connectionTargetDate]: '',
      },
    }

    dispatch({
      type: 'SET_BOARD',
      board: {
        ...previousBoard,
        cardsByLaneId: {
          ...previousBoard.cardsByLaneId,
          [lane.id]: [...laneCards, optimisticCard],
        },
      },
    })
    dispatch({ type: 'SET_BUSY', busy: true })

    try {
      const created = await createCard(client, cardDraft, lane, laneCards.length, updatedAtIso)

      if (created.connectionId != null) {
        dispatch({
          type: 'RECONCILE_CARD',
          tempId,
          realId: created.blockId,
          realConnectionId: created.connectionId,
        })
      } else {
        await auth.syncBoard(previousBoard.id)
      }

      dispatch({ type: 'RESET_CARD_DRAFT' })
      dispatch({ type: 'SET_CREATE_CARD_DIALOG', open: false })
      toast.success('Card synced')
    } catch (error) {
      dispatch({ type: 'SET_BOARD', board: previousBoard })
      const msg = toErrorMessage(error, 'Unable to create card')
      dispatch({ type: 'SET_ERROR', message: msg })
      toast.error('Card create failed', { description: msg })
    } finally {
      dispatch({ type: 'SET_BUSY', busy: false })
    }
  }

  const handleQuickAddCard = (laneId: number): void => {
    const label = createQuickTimestampLabel()
    dispatch({ type: 'SELECT_LANE', laneId: null })
    dispatch({
      type: 'SET_CARD_DRAFT',
      draft: {
        ...DEFAULT_CARD_DRAFT,
        laneId,
        title: `Task · ${label}`,
        description: `Captured ${label}`,
        priority: 'P2',
        estimatePoints: 1,
        epic: '',
      },
    })
    dispatch({ type: 'SET_CREATE_CARD_DIALOG', open: true })
  }

  const handleCopyCardTitle = async (cardId: number): Promise<void> => {
    if (!board) return
    const card = cardFromBoard(board, cardId)
    if (!card) return

    try {
      await navigator.clipboard.writeText(card.title)
      toast.success('Card title copied')
    } catch {
      toast.error('Copy failed', {
        description: 'Clipboard access was not available',
      })
    }
  }

  const handleMoveCardToAdjacentLane = async (cardId: number, direction: -1 | 1): Promise<void> => {
    if (!client || !board) return

    const sourceCard = cardFromBoard(board, cardId)
    if (!sourceCard) return

    const sourceLaneIndex = board.lanes.findIndex((l) => l.id === sourceCard.laneId)
    if (sourceLaneIndex < 0) return

    const targetLane = board.lanes[sourceLaneIndex + direction]
    if (!targetLane) return

    const previousBoard = board
    const sourceCards = previousBoard.cardsByLaneId[sourceCard.laneId] ?? []
    const targetCards = previousBoard.cardsByLaneId[targetLane.id] ?? []
    const nextTargetCards = [
      ...targetCards,
      {
        ...sourceCard,
        laneId: targetLane.id,
        laneKey: targetLane.laneKey,
      },
    ]

    dispatch({
      type: 'SET_BOARD',
      board: {
        ...previousBoard,
        cardsByLaneId: {
          ...previousBoard.cardsByLaneId,
          [sourceCard.laneId]: sourceCards.filter((c) => c.id !== sourceCard.id),
          [targetLane.id]: nextTargetCards,
        },
      },
    })
    dispatch({ type: 'SET_BUSY', busy: true })

    try {
      const { connectionId } = await moveCardAcrossLanes(
        client,
        sourceCard,
        targetLane,
        targetCards.length,
      )
      dispatch({ type: 'UPDATE_CARD_CONNECTION', cardId: sourceCard.id, connectionId })
      toast.success('Card move synced')
    } catch (error) {
      dispatch({ type: 'SET_BOARD', board: previousBoard })
      const msg = toErrorMessage(error, 'Unable to move card')
      dispatch({ type: 'SET_ERROR', message: msg })
      toast.error('Card move failed', { description: msg })
    } finally {
      dispatch({ type: 'SET_BUSY', busy: false })
    }
  }

  const handleRemoveCard = (cardId: number): void => {
    if (!board) return
    removals.remove(board, cardId, selectedCardId)
  }

  const handleLaneSave = async (laneId: number): Promise<void> => {
    if (!client || !board) return

    const lane = board.lanes.find((l) => l.id === laneId)
    const draft = laneDrafts[laneId]
    if (!lane || !draft) return

    const previousBoard = board
    dispatch({
      type: 'SET_BOARD',
      board: {
        ...previousBoard,
        lanes: previousBoard.lanes.map((l) =>
          l.id === lane.id
            ? {
                ...l,
                title: draft.title,
                color: draft.color,
                wipLimit: draft.wipLimit,
                metadata: {
                  ...l.metadata,
                  [DEMO_METADATA_KEYS.laneColor]: draft.color,
                  [DEMO_METADATA_KEYS.laneWipLimit]: String(draft.wipLimit),
                  [DEMO_METADATA_KEYS.laneKey]: l.laneKey,
                  [DEMO_METADATA_KEYS.isDefaultLane]: l.isDefault,
                },
              }
            : l,
        ),
      },
    })
    dispatch({ type: 'SET_BUSY', busy: true })

    try {
      await updateLaneSettings(client, lane, draft)
      toast.success('Lane settings synced')
    } catch (error) {
      dispatch({ type: 'SET_BOARD', board: previousBoard })
      const msg = toErrorMessage(error, 'Unable to save lane settings')
      dispatch({ type: 'SET_ERROR', message: msg })
      toast.error('Lane settings failed', { description: msg })
    } finally {
      dispatch({ type: 'SET_BUSY', busy: false })
    }
  }

  const handleAddLane = async (): Promise<void> => {
    if (!client || !board || addLaneDraft.title.trim().length === 0) return

    const previousBoard = board
    const tempLaneId = -Date.now()
    const optimisticLaneKey = `lane_${Math.abs(tempLaneId)}`
    const optimisticLane: LaneModel = {
      id: tempLaneId,
      title: addLaneDraft.title,
      connectionId: tempLaneId - 1,
      position: previousBoard.lanes.length + 1,
      wipLimit: addLaneDraft.wipLimit,
      laneKey: optimisticLaneKey,
      color: addLaneDraft.color,
      isDefault: false,
      metadata: {
        [DEMO_METADATA_KEYS.laneColor]: addLaneDraft.color,
        [DEMO_METADATA_KEYS.laneWipLimit]: String(addLaneDraft.wipLimit),
        [DEMO_METADATA_KEYS.laneKey]: optimisticLaneKey,
        [DEMO_METADATA_KEYS.isDefaultLane]: false,
      },
    }

    dispatch({
      type: 'SET_BOARD',
      board: {
        ...previousBoard,
        lanes: [...previousBoard.lanes, optimisticLane],
        cardsByLaneId: { ...previousBoard.cardsByLaneId, [tempLaneId]: [] },
      },
    })
    dispatch({ type: 'SET_BUSY', busy: true })

    try {
      const created = await addLaneApi(
        client,
        board.id,
        addLaneDraft.title,
        addLaneDraft.color,
        addLaneDraft.wipLimit,
        board.lanes.length,
      )
      dispatch({
        type: 'RECONCILE_LANE',
        tempId: tempLaneId,
        realId: created.laneId,
        realConnectionId: created.connectionId,
      })
      dispatch({ type: 'PATCH_ADD_LANE', patch: { title: '' } })
      dispatch({ type: 'SET_ADD_LANE_DIALOG', open: false })
      toast.success('Lane synced')
    } catch (error) {
      dispatch({ type: 'SET_BOARD', board: previousBoard })
      const msg = toErrorMessage(error, 'Unable to add lane')
      dispatch({ type: 'SET_ERROR', message: msg })
      toast.error('Lane create failed', { description: msg })
    } finally {
      dispatch({ type: 'SET_BUSY', busy: false })
    }
  }

  const handleSaveCardEditor = async (): Promise<void> => {
    if (!client || !selectedCard || !cardEditorDraft || !board) return

    const previousBoard = board
    const updatedAtIso = new Date().toISOString()
    const updatedBoard: BoardModel = {
      ...previousBoard,
      cardsByLaneId: Object.fromEntries(
        Object.entries(previousBoard.cardsByLaneId).map(([laneIdStr, cards]) => [
          Number(laneIdStr),
          cards.map((c) =>
            c.id === selectedCard.id
              ? {
                  ...c,
                  title: cardEditorDraft.title,
                  description: cardEditorDraft.description,
                  metadata: {
                    ...c.metadata,
                    [DEMO_METADATA_KEYS.cardPriority]: cardEditorDraft.priority,
                    [DEMO_METADATA_KEYS.cardEstimatePoints]: String(cardEditorDraft.estimatePoints),
                    [DEMO_METADATA_KEYS.cardEpic]: cardEditorDraft.epic,
                    [DEMO_METADATA_KEYS.cardUpdatedAt]: updatedAtIso,
                  },
                  connectionMetadata: {
                    ...c.connectionMetadata,
                    [DEMO_METADATA_KEYS.connectionBlocked]: cardEditorDraft.blocked,
                    [DEMO_METADATA_KEYS.connectionTargetDate]: cardEditorDraft.targetDate,
                  },
                }
              : c,
          ),
        ]),
      ),
    }

    dispatch({ type: 'SET_BOARD', board: updatedBoard })
    dispatch({ type: 'SET_BUSY', busy: true })

    try {
      await updateCard(client, selectedCard, cardEditorDraft, updatedAtIso)
      toast.success('Card changes synced')
    } catch (error) {
      dispatch({ type: 'SET_BOARD', board: previousBoard })
      const msg = toErrorMessage(error, 'Unable to save card changes')
      dispatch({ type: 'SET_ERROR', message: msg })
      toast.error('Card save failed', { description: msg })
    } finally {
      dispatch({ type: 'SET_BUSY', busy: false })
    }
  }

  // ─── Render ──────────────────────────────────────────────────────

  if (auth.isHandlingCallback) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Completing OAuth callback...
        </div>
      </main>
    )
  }

  if (!auth.token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
        <section className="w-full max-w-2xl space-y-5 rounded-xl border border-border bg-card p-6 sm:p-8">
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Swimlane
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Swimlane board using channel, block, and connection metadata
            </h1>
            <p className="text-sm text-muted-foreground">
              OAuth is Authorization Code + PKCE. API calls are typed from the generated OpenAPI
              client.
            </p>
          </div>

          <div className="space-y-1 text-xs text-muted-foreground">
            <p>API base: {appConfig.apiBaseUrl}</p>
            <p>Redirect URI: {appConfig.oauthRedirectUri}</p>
          </div>

          {!isOauthConfigured ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Missing <code>VITE_ARENA_CLIENT_ID</code> in <code>.env.local</code>.
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <Button
            size="lg"
            disabled={!isOauthConfigured}
            onClick={() => {
              void auth.login()
            }}
          >
            Connect with Are.na OAuth
          </Button>
        </section>
      </main>
    )
  }

  if (!client || (!board && isBusy)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Checking saved board...
        </div>
      </main>
    )
  }

  if (!board) {
    return (
      <BoardSetup
        client={client}
        errorMessage={errorMessage}
        userName={auth.user.name}
        userAvatar={auth.user.avatar}
        userInitials={auth.user.initials}
        onBoardReady={handleBoardReady}
        onError={(message) => dispatch({ type: 'SET_ERROR', message })}
        onLogout={handleLogout}
      />
    )
  }

  const activeLaneDraft = selectedLane ? (laneDrafts[selectedLane.id] ?? null) : null

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-[1640px] flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6">
        <BoardHeader
          boardTitle={board?.title ?? 'Swimlane Board'}
          boardMetadata={board?.metadata ?? {}}
          userName={auth.user.name}
          userAvatar={auth.user.avatar}
          userInitials={auth.user.initials}
          isBusy={isBusy}
          onRefresh={() => {
            void handleRefresh()
          }}
          onLogout={handleLogout}
          onOpenCreateCard={() => dispatch({ type: 'SET_CREATE_CARD_DIALOG', open: true })}
          onOpenAddLane={() => dispatch({ type: 'SET_ADD_LANE_DIALOG', open: true })}
        />

        {errorMessage ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <span>{errorMessage}</span>
            <button
              type="button"
              className="shrink-0 rounded p-0.5 hover:bg-destructive/20"
              onClick={() => dispatch({ type: 'SET_ERROR', message: '' })}
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
        ) : null}

        <section className="overflow-x-auto pb-2">
          <div className="flex min-w-max items-start gap-4">
            {(board?.lanes ?? []).map((lane, laneIndex) => (
              <LaneColumn
                key={lane.id}
                lane={lane}
                laneIndex={laneIndex}
                laneCount={board?.lanes.length ?? 0}
                cards={board?.cardsByLaneId[lane.id] ?? []}
                selectedCardId={selectedCardId}
                onSelectCard={(cardId) => dispatch({ type: 'SELECT_CARD', cardId })}
                onOpenLaneEditor={(laneId) => dispatch({ type: 'OPEN_LANE_EDITOR', laneId })}
                onQuickAddCard={handleQuickAddCard}
                onCopyCardTitle={(cardId) => {
                  void handleCopyCardTitle(cardId)
                }}
                onMoveCardToPreviousLane={(cardId) => {
                  void handleMoveCardToAdjacentLane(cardId, -1)
                }}
                onMoveCardToNextLane={(cardId) => {
                  void handleMoveCardToAdjacentLane(cardId, 1)
                }}
                onRemoveCard={handleRemoveCard}
              />
            ))}
          </div>
        </section>

        <CreateCardDialog
          open={isCreateCardDialogOpen}
          isBusy={isBusy}
          lanes={board?.lanes ?? []}
          draft={cardDraft}
          onOpenChange={(open) => dispatch({ type: 'SET_CREATE_CARD_DIALOG', open })}
          onDraftChange={(field, value) => dispatch({ type: 'PATCH_CARD_DRAFT', field, value })}
          onSubmit={handleCreateCard}
        />

        <AddLaneDialog
          open={isAddLaneDialogOpen}
          isBusy={isBusy}
          title={addLaneDraft.title}
          color={addLaneDraft.color}
          wipLimit={addLaneDraft.wipLimit}
          onOpenChange={(open) => dispatch({ type: 'SET_ADD_LANE_DIALOG', open })}
          onTitleChange={(value) => dispatch({ type: 'PATCH_ADD_LANE', patch: { title: value } })}
          onColorChange={(value) => dispatch({ type: 'PATCH_ADD_LANE', patch: { color: value } })}
          onWipLimitChange={(value) =>
            dispatch({ type: 'PATCH_ADD_LANE', patch: { wipLimit: value } })
          }
          onSubmit={handleAddLane}
        />

        <CardSheet
          open={Boolean(selectedCard && cardEditorDraft)}
          card={selectedCard}
          draft={cardEditorDraft}
          isBusy={isBusy}
          onOpenChange={(open) => {
            if (!open) {
              dispatch({ type: 'SELECT_CARD', cardId: null })
            }
          }}
          onFieldChange={(field, value) => dispatch({ type: 'PATCH_CARD_EDITOR', field, value })}
          onSave={handleSaveCardEditor}
        />

        <LaneSheet
          open={Boolean(selectedLane)}
          lane={selectedLane}
          draft={activeLaneDraft}
          isBusy={isBusy}
          onOpenChange={(open) => {
            if (!open) {
              dispatch({ type: 'SELECT_LANE', laneId: null })
            }
          }}
          onDraftChange={(patch) => {
            if (!selectedLane) return
            dispatch({
              type: 'PATCH_LANE_DRAFT',
              laneId: selectedLane.id,
              patch,
            })
          }}
          onSave={async () => {
            if (!selectedLane) return
            await handleLaneSave(selectedLane.id)
          }}
        />

        {isBusy ? (
          <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground shadow-lg">
            <Loader2Icon className="size-3.5 animate-spin" />
            Syncing...
          </div>
        ) : null}
      </div>
    </main>
  )
}

export default App
