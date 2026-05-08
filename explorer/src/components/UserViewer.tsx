import { useUser } from '@aredotna/react-query'
import { Avatar, Box, Card, Flex, Heading, Separator } from '@radix-ui/themes'
import { Outlet } from 'react-router-dom'
import { DefinitionList } from './DefinitionList'
import { ErrorMessage } from './ErrorMessage'
import { LoadingIndicator } from './LoadingIndicator'

interface UserViewerProps {
  userId: string
}

function UserViewer({ userId }: UserViewerProps): JSX.Element {
  const { data: user, isLoading, error } = useUser(userId)

  if (isLoading) {
    return (
      <Card>
        <LoadingIndicator message={`Loading user ${userId}...`} />
      </Card>
    )
  }

  if (error) {
    return <ErrorMessage error={error} />
  }

  if (!user) {
    return <Box>User not found</Box>
  }

  return (
    <Card>
      <Flex direction="column" gap="4">
        <Flex direction="column" gap="3" align="center">
          {user.avatar ? (
            <Avatar src={user.avatar} alt={user.name} size="8" fallback={user.initials} />
          ) : (
            <Avatar size="8" fallback={user.initials} />
          )}

          <Heading size="6">{user.name}</Heading>
        </Flex>

        <Separator size="4" />

        <Flex direction="row" gap="6">
          <DefinitionList
            width="50%"
            definitions={[
              { term: 'ID', description: user.id },
              { term: 'Slug', description: user.slug },
              {
                term: 'Joined',
                description: new Date(user.created_at).toLocaleString(),
              },
            ]}
          />

          <DefinitionList
            width="50%"
            definitions={[
              { term: 'Channels', description: user.counts.channels },
              {
                term: 'Followers',
                description: user.counts.followers,
                href: `/user/${userId}/followers`,
              },
              {
                term: 'Following',
                description: user.counts.following,
                href: `/user/${userId}/following`,
              },
            ]}
          />
        </Flex>

        <Outlet />
      </Flex>
    </Card>
  )
}

export default UserViewer
