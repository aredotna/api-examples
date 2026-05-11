import { useConnection, useDeleteConnection, useMoveConnection } from '@aredotna/react-query'
import { Movement } from '@aredotna/sdk/api'
import { ArrowRightIcon } from '@radix-ui/react-icons'
import { Button, ContextMenu, Dialog, Flex, Spinner, Text, TextField } from '@radix-ui/themes'
import { type ReactNode, useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ConnectDialog } from './ConnectDialog'

interface CellActionMenuProps {
  connectionId: number
  currentPosition: number
  itemType: 'block' | 'channel'
  itemId: number | string // block id (number) or channel slug (string)
  connectableId: number // Numeric ID for API calls
  children: ReactNode
}

export function CellActionMenu({
  connectionId,
  currentPosition,
  itemType,
  itemId,
  connectableId,
  children,
}: CellActionMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [positionDialogOpen, setPositionDialogOpen] = useState(false)
  const [connectDialogOpen, setConnectDialogOpen] = useState(false)
  const [targetPosition, setTargetPosition] = useState('')

  const { isAuthenticated, login } = useAuth()

  // Only fetch connection when menu is opened and user is authenticated
  const { data: connection, isLoading: isLoadingConnection } = useConnection(connectionId, {
    enabled: menuOpen && isAuthenticated,
  })

  const deleteConnection = useDeleteConnection()
  const moveConnection = useMoveConnection()

  const viewUrl = itemType === 'block' ? `/block/${itemId}` : `/channel/${itemId}`

  // Reset target position when dialog opens
  useEffect(() => {
    if (positionDialogOpen) {
      setTargetPosition(String(currentPosition))
    }
  }, [positionDialogOpen, currentPosition])

  const handleDelete = () => {
    deleteConnection.mutate({ id: connectionId })
    setMenuOpen(false)
  }

  const handleMove = (movement: Movement) => {
    moveConnection.mutate({
      id: connectionId,
      body: { movement },
    })
    setMenuOpen(false)
  }

  const handleMoveToPosition = () => {
    const position = parseInt(targetPosition, 10)
    if (!Number.isNaN(position) && position > 0) {
      moveConnection.mutate({
        id: connectionId,
        body: {
          movement: Movement.INSERT_AT,
          position,
        },
      })
      setPositionDialogOpen(false)
      setMenuOpen(false)
    }
  }

  const canRemove = connection?.can?.remove ?? false
  // For now, assume if they can remove, they can also sort
  // The API will return 403 if they can't
  const canSort = canRemove

  const isLoading = deleteConnection.isPending || moveConnection.isPending

  return (
    <>
      <ContextMenu.Root onOpenChange={setMenuOpen}>
        <ContextMenu.Trigger>{children}</ContextMenu.Trigger>

        <ContextMenu.Content>
          {/* Always show View link */}
          <ContextMenu.Item asChild>
            <RouterLink to={viewUrl}>View {itemType}</RouterLink>
          </ContextMenu.Item>

          {/* Show Connect option when authenticated */}
          {isAuthenticated && !isLoadingConnection && (
            <>
              <ContextMenu.Separator />
              <ContextMenu.Item onSelect={() => setConnectDialogOpen(true)}>
                Connect <ArrowRightIcon />
              </ContextMenu.Item>
            </>
          )}

          {/* Show login prompt if not authenticated */}
          {!isAuthenticated && (
            <>
              <ContextMenu.Separator />
              <ContextMenu.Item onSelect={() => login()}>Log in to edit</ContextMenu.Item>
            </>
          )}

          {/* Show loading state while fetching abilities */}
          {isAuthenticated && isLoadingConnection && (
            <>
              <ContextMenu.Separator />
              <ContextMenu.Item disabled>
                <Flex align="center" gap="2">
                  <Spinner size="1" />
                  <Text size="2">Loading...</Text>
                </Flex>
              </ContextMenu.Item>
            </>
          )}

          {/* Show actions when authenticated and loaded */}
          {isAuthenticated && !isLoadingConnection && (
            <>
              {canSort && (
                <>
                  <ContextMenu.Separator />
                  <ContextMenu.Sub>
                    <ContextMenu.SubTrigger disabled={isLoading}>Move</ContextMenu.SubTrigger>
                    <ContextMenu.SubContent>
                      <ContextMenu.Item
                        onSelect={() => handleMove(Movement.MOVE_TO_TOP)}
                        disabled={isLoading}
                      >
                        Move to top
                      </ContextMenu.Item>
                      <ContextMenu.Item
                        onSelect={() => handleMove(Movement.MOVE_UP)}
                        disabled={isLoading}
                      >
                        Move up
                      </ContextMenu.Item>
                      <ContextMenu.Item
                        onSelect={() => handleMove(Movement.MOVE_DOWN)}
                        disabled={isLoading}
                      >
                        Move down
                      </ContextMenu.Item>
                      <ContextMenu.Item
                        onSelect={() => handleMove(Movement.MOVE_TO_BOTTOM)}
                        disabled={isLoading}
                      >
                        Move to bottom
                      </ContextMenu.Item>
                      <ContextMenu.Separator />
                      <ContextMenu.Item
                        onSelect={() => setPositionDialogOpen(true)}
                        disabled={isLoading}
                      >
                        Move to position...
                        <Text size="1" color="gray" ml="2">
                          (currently {currentPosition})
                        </Text>
                      </ContextMenu.Item>
                    </ContextMenu.SubContent>
                  </ContextMenu.Sub>
                </>
              )}

              {canRemove && (
                <>
                  <ContextMenu.Separator />
                  <ContextMenu.Item color="red" onSelect={handleDelete} disabled={isLoading}>
                    {deleteConnection.isPending ? 'Removing...' : 'Remove from channel'}
                  </ContextMenu.Item>
                </>
              )}
            </>
          )}
        </ContextMenu.Content>
      </ContextMenu.Root>

      {/* Position input dialog */}
      <Dialog.Root open={positionDialogOpen} onOpenChange={setPositionDialogOpen}>
        <Dialog.Content maxWidth="300px">
          <Dialog.Title>Move to position</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Current position: {currentPosition}
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <TextField.Root
              type="number"
              min="1"
              value={targetPosition}
              onChange={(e) => setTargetPosition(e.target.value)}
              placeholder="Enter position"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleMoveToPosition()
                }
              }}
            />

            {moveConnection.error && (
              <Text color="red" size="2">
                {moveConnection.error.message}
              </Text>
            )}
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              onClick={handleMoveToPosition}
              disabled={
                moveConnection.isPending || !targetPosition || parseInt(targetPosition, 10) < 1
              }
            >
              {moveConnection.isPending ? 'Moving...' : 'Move'}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Connect to channel dialog */}
      <ConnectDialog
        open={connectDialogOpen}
        onOpenChange={setConnectDialogOpen}
        connectableId={connectableId}
        connectableType={itemType}
      />
    </>
  )
}
