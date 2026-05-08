import { useChannelContents } from '@aredotna/react-query'
import { ChannelContentSort } from '@aredotna/sdk/api'
import ContentsGrid from './ContentsGrid'
import { LoadingIndicator } from './LoadingIndicator'

interface ChannelContentsProps {
  channelId: string
  currentPage: number
  onPageChange: (page: number) => void
  per?: number
  sort?: ChannelContentSort
  onSortChange?: (sort: ChannelContentSort) => void
}

function ChannelContents({
  channelId,
  currentPage,
  onPageChange,
  per = 25,
  sort,
  onSortChange,
}: ChannelContentsProps): JSX.Element | null {
  const { data: contents, isLoading } = useChannelContents(channelId, {
    page: currentPage,
    per,
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
      sortEnum={ChannelContentSort}
      onSortChange={onSortChange}
      channelId={channelId}
    />
  )
}

export default ChannelContents
