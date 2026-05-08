import { useUserContents } from '@aredotna/react-query'
import { ContentSort, type ContentTypeFilter } from '@aredotna/sdk/api'
import ContentsGrid from './ContentsGrid'
import { LoadingIndicator } from './LoadingIndicator'

interface UserContentsProps {
  userId: string
  currentPage: number
  onPageChange: (page: number) => void
  per?: number
  type?: ContentTypeFilter
  sort?: ContentSort
  onSortChange?: (sort: ContentSort) => void
}

function UserContents({
  userId,
  currentPage,
  onPageChange,
  per = 25,
  type,
  sort,
  onSortChange,
}: UserContentsProps): JSX.Element | null {
  const { data: contents, isLoading } = useUserContents(userId, {
    page: currentPage,
    per,
    type,
    sort,
  })

  if (isLoading) {
    return <LoadingIndicator message="Loading contents..." />
  }

  if (!contents || contents.data.length === 0) {
    return null
  }

  return (
    <ContentsGrid
      meta={contents.meta}
      data={contents.data}
      onPageChange={onPageChange}
      sort={sort}
      sortEnum={ContentSort}
      onSortChange={onSortChange}
    />
  )
}

export default UserContents
