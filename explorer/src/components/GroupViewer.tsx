import { useGroup } from '@aredotna/react-query'
import { Box, Card, Flex, Heading, Separator, Text } from '@radix-ui/themes'
import { DefinitionList } from './DefinitionList'
import { ErrorMessage } from './ErrorMessage'
import { LoadingIndicator } from './LoadingIndicator'

interface GroupViewerProps {
  groupId: string
}

function GroupViewer({ groupId }: GroupViewerProps): JSX.Element {
  const { data: group, isLoading, error } = useGroup(groupId)

  if (isLoading) {
    return (
      <Card>
        <LoadingIndicator message={`Loading group ${groupId}...`} />
      </Card>
    )
  }

  if (error) {
    return <ErrorMessage error={error} />
  }

  if (!group) {
    return <Box>Group not found</Box>
  }

  return (
    <Card>
      <Flex direction="column" gap="4">
        <Heading size="6">{group.name}</Heading>

        {group.bio && <Text dangerouslySetInnerHTML={{ __html: group.bio.html }} />}

        <Separator size="4" />

        <Flex direction="row" gap="6">
          <DefinitionList
            width="50%"
            definitions={[
              { term: 'ID', description: group.id },
              { term: 'Slug', description: group.slug },
              {
                term: 'Created',
                description: new Date(group.created_at).toLocaleString(),
              },
              {
                term: 'Owner',
                description: group.user.name ?? group.user.slug ?? 'Unknown',
                href: `/user/${group.user.slug}`,
              },
            ]}
          />

          <DefinitionList
            width="50%"
            definitions={[
              { term: 'Channels', description: group.counts.channels },
              { term: 'Users', description: group.counts.users },
            ]}
          />
        </Flex>
      </Flex>
    </Card>
  )
}

export default GroupViewer
