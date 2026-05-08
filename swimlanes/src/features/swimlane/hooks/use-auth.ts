import { type Dispatch, useCallback, useEffect, useMemo, useState } from 'react'
import { type ArenaClient, createArenaClient } from '@/api/client'
import { beginOAuthLogin, maybeFinishOAuthCallback } from '@/auth/oauth'
import { clearToken, loadToken } from '@/auth/session'
import { getStoredBoardId, setStoredBoardId } from '@/domain/board-storage'
import type { BoardModel, OAuthToken } from '@/domain/model'
import { ensureDemoBoard, fetchBoard, fetchCurrentUser } from '@/domain/swimlaneService'
import { toErrorMessage } from '@/lib/errors'
import type { AppAction } from '../state/app-state'

export interface UserProfile {
  name: string
  avatar: string | null
  initials: string
}

const EMPTY_USER: UserProfile = { name: '', avatar: null, initials: '' }

export const useAuth = (dispatch: Dispatch<AppAction>) => {
  const [token, setToken] = useState<OAuthToken | null>(loadToken())
  const [user, setUser] = useState<UserProfile>(EMPTY_USER)
  const [isHandlingCallback, setIsHandlingCallback] = useState(
    window.location.pathname === '/auth/callback',
  )

  const client = useMemo<ArenaClient | null>(
    () => (token ? createArenaClient(token.access_token) : null),
    [token],
  )

  const syncBoard = useCallback(
    async (boardId: number): Promise<BoardModel> => {
      if (!client) throw new Error('Missing API client')
      const refreshed = await fetchBoard(client, boardId)
      dispatch({ type: 'SET_BOARD', board: refreshed })
      dispatch({ type: 'SET_ERROR', message: '' })
      setStoredBoardId(refreshed.id)
      return refreshed
    },
    [client, dispatch],
  )

  useEffect(() => {
    let cancelled = false

    const finishCallback = async (): Promise<void> => {
      if (window.location.pathname !== '/auth/callback') {
        setIsHandlingCallback(false)
        return
      }

      try {
        const nextToken = await maybeFinishOAuthCallback(new URL(window.location.href))
        if (!cancelled && nextToken) {
          setToken(nextToken)
          window.history.replaceState({}, '', '/')
        }
      } catch (error) {
        if (!cancelled) {
          dispatch({
            type: 'SET_ERROR',
            message: toErrorMessage(error, 'OAuth callback processing failed'),
          })
        }
      } finally {
        if (!cancelled) {
          setIsHandlingCallback(false)
        }
      }
    }

    void finishCallback()
    return () => {
      cancelled = true
    }
  }, [dispatch])

  useEffect(() => {
    let cancelled = false

    const bootstrap = async (): Promise<void> => {
      if (!client || isHandlingCallback) return

      dispatch({ type: 'SET_BUSY', busy: true })

      try {
        const me = await fetchCurrentUser(client)
        const storedBoardId = getStoredBoardId()
        const nextBoard = await ensureDemoBoard(client, storedBoardId)

        if (cancelled) return

        setUser({ name: me.name, avatar: me.avatar ?? null, initials: me.initials })
        dispatch({ type: 'SET_BOARD', board: nextBoard })
        dispatch({ type: 'SET_ERROR', message: '' })
        setStoredBoardId(nextBoard.id)
      } catch (error) {
        if (!cancelled) {
          dispatch({
            type: 'SET_ERROR',
            message: toErrorMessage(error, 'Unable to initialize app'),
          })
        }
      } finally {
        if (!cancelled) {
          dispatch({ type: 'SET_BUSY', busy: false })
        }
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [client, isHandlingCallback, dispatch])

  const login = useCallback(async (): Promise<void> => {
    dispatch({ type: 'SET_ERROR', message: '' })
    try {
      await beginOAuthLogin()
    } catch {
      // beginOAuthLogin intentionally throws after redirect assignment
    }
  }, [dispatch])

  const logout = useCallback((): void => {
    clearToken()
    setToken(null)
    setUser(EMPTY_USER)
    dispatch({ type: 'LOGOUT' })
  }, [dispatch])

  return { token, client, user, isHandlingCallback, syncBoard, login, logout }
}
