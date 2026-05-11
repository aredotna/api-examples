import { createContext, type ReactNode, useContext, useEffect, useReducer, useRef } from 'react'

// Generic types for the context
export interface ContentViewerState<TypeEnum, SortEnum> {
  currentPage: number
  type: TypeEnum | undefined
  sort: SortEnum
}

export type ContentViewerAction<TypeEnum, SortEnum> =
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_TYPE'; payload: TypeEnum | undefined }
  | { type: 'SET_SORT'; payload: SortEnum }
  | { type: 'RESET_PAGE' }

interface ContentViewerContextValue<TypeEnum, SortEnum> {
  state: ContentViewerState<TypeEnum, SortEnum>
  setPage: (page: number) => void
  setType: (type: TypeEnum | undefined) => void
  setSort: (sort: SortEnum) => void
}

const ContentViewerContext = createContext<unknown>(undefined)

function createContentViewerReducer<TypeEnum, SortEnum>() {
  return (
    state: ContentViewerState<TypeEnum, SortEnum>,
    action: ContentViewerAction<TypeEnum, SortEnum>,
  ): ContentViewerState<TypeEnum, SortEnum> => {
    switch (action.type) {
      case 'SET_PAGE':
        return { ...state, currentPage: action.payload }
      case 'SET_TYPE':
        return { ...state, type: action.payload, currentPage: 1 }
      case 'SET_SORT':
        return {
          ...state,
          sort: action.payload,
          currentPage: 1,
        }
      case 'RESET_PAGE':
        return { ...state, currentPage: 1 }
      default:
        return state
    }
  }
}

interface ContentViewerProviderProps<TypeEnum, SortEnum> {
  children: ReactNode
  initialState: ContentViewerState<TypeEnum, SortEnum>
  resourceId: string
}

export function ContentViewerProvider<TypeEnum, SortEnum>({
  children,
  initialState,
  resourceId,
}: ContentViewerProviderProps<TypeEnum, SortEnum>) {
  const reducer = createContentViewerReducer<TypeEnum, SortEnum>()
  const [state, dispatch] = useReducer(reducer, initialState)
  const previousResourceId = useRef<string | null>(null)

  // Reset to page 1 when resourceId changes
  useEffect(() => {
    if (previousResourceId.current !== resourceId) {
      previousResourceId.current = resourceId
      dispatch({ type: 'RESET_PAGE' })
    }
  }, [resourceId])

  const value: ContentViewerContextValue<TypeEnum, SortEnum> = {
    state,
    setPage: (page: number) => dispatch({ type: 'SET_PAGE', payload: page }),
    setType: (type: TypeEnum | undefined) => dispatch({ type: 'SET_TYPE', payload: type }),
    setSort: (sort: SortEnum) => dispatch({ type: 'SET_SORT', payload: sort }),
  }

  return <ContentViewerContext.Provider value={value}>{children}</ContentViewerContext.Provider>
}

export function useContentViewer<TypeEnum, SortEnum>() {
  const context = useContext(ContentViewerContext)
  if (context === undefined) {
    throw new Error('useContentViewer must be used within a ContentViewerProvider')
  }
  return context as ContentViewerContextValue<TypeEnum, SortEnum>
}
