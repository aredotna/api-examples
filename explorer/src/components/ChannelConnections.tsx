import { useChannelConnections } from '@aredotna/react-query'
import { Box, Flex, Heading, Separator } from '@radix-ui/themes'
import { useState } from 'react'
import ChannelLink from './ChannelLink'
import { ErrorMessage } from './ErrorMessage'
import { LoadingIndicator } from './LoadingIndicator'
import Pagination from './Pagination'

interface ChannelConnectionsProps {
  channelId: string
}

const ChannelConnections = ({ channelId }: ChannelConnectionsProps): JSX.Element | null => {
  const [currentPage, setCurrentPage] = useState(1)
  const {
    data: connections,
    isLoading,
    error,
  } = useChannelConnections(channelId, {
    page: currentPage,
    per: 10,
  })

  if (isLoading) {
    return <LoadingIndicator message="Loading connections..." />
  }

  if (error) {
    return <ErrorMessage error={error} />
  }

  if (!connections || connections.data.length === 0) {
    return null
  }

  return (
    <>
      <Separator size="4" />

      <Box>
        <Flex direction="column" gap="3">
          <Heading size="3">
            {connections.meta.total_count} Connection
            {connections.meta.total_count === 1 ? '' : 's'}
          </Heading>

          <Flex direction="column" gap="2">
            {connections.data.map((channel) => (
              <ChannelLink key={`connection-${channel.id}`} channel={channel} />
            ))}
          </Flex>

          {connections.meta && (
            <Pagination meta={connections.meta} onPageChange={(page) => setCurrentPage(page)} />
          )}
        </Flex>
      </Box>
    </>
  )
}

export default ChannelConnections
