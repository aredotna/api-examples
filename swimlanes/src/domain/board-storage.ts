import { BOARD_STORAGE_KEY } from './model'

export const getStoredBoardId = (): number | null => {
  try {
    const rawValue = window.localStorage.getItem(BOARD_STORAGE_KEY)
    if (!rawValue) {
      return null
    }

    const parsed = Number.parseInt(rawValue, 10)
    return Number.isFinite(parsed) ? parsed : null
  } catch {
    return null
  }
}

export const setStoredBoardId = (boardId: number): void => {
  try {
    window.localStorage.setItem(BOARD_STORAGE_KEY, String(boardId))
  } catch {
    // ignore storage failures in constrained runtimes
  }
}

export const clearStoredBoardId = (): void => {
  try {
    window.localStorage.removeItem(BOARD_STORAGE_KEY)
  } catch {
    // ignore storage failures in constrained runtimes
  }
}
