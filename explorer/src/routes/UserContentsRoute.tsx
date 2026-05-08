import { ContentSort, ContentTypeFilter as ContentTypeFilterEnum } from '@aredotna/sdk/api'
import { Flex } from '@radix-ui/themes'
import { useParams } from 'react-router-dom'
import ContentTypeFilter from '../components/ContentTypeFilter'
import UserContents from '../components/UserContents'
import { ContentViewerProvider, useContentViewer } from '../contexts/ContentViewerContext'

const PER = 25

function UserContentsRouteContent(): JSX.Element | null {
  const { id: userId } = useParams<{ id: string }>()
  const { state, setPage, setType, setSort } = useContentViewer<
    ContentTypeFilterEnum,
    ContentSort
  >()

  if (!userId) return null

  return (
    <Flex direction="column" gap="3">
      <ContentTypeFilter
        value={state.type}
        onChange={setType}
        options={[
          { value: ContentTypeFilterEnum.IMAGE, label: 'Images' },
          { value: ContentTypeFilterEnum.TEXT, label: 'Text' },
          { value: ContentTypeFilterEnum.LINK, label: 'Links' },
          { value: ContentTypeFilterEnum.EMBED, label: 'Embeds' },
          { value: ContentTypeFilterEnum.ATTACHMENT, label: 'Attachments' },
          { value: ContentTypeFilterEnum.CHANNEL, label: 'Channels' },
        ]}
      />

      <UserContents
        userId={userId}
        currentPage={state.currentPage}
        onPageChange={setPage}
        per={PER}
        type={state.type}
        sort={state.sort}
        onSortChange={setSort}
      />
    </Flex>
  )
}

function UserContentsRoute(): JSX.Element | null {
  const { id: userId } = useParams<{ id: string }>()

  if (!userId) return null

  return (
    <ContentViewerProvider
      resourceId={`${userId}-contents`}
      initialState={{
        currentPage: 1,
        type: undefined,
        sort: ContentSort.CREATED_AT_DESC,
      }}
    >
      <UserContentsRouteContent />
    </ContentViewerProvider>
  )
}

export default UserContentsRoute
