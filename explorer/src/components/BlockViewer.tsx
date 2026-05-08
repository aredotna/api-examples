import { useBlock } from '@aredotna/react-query'
import { ExternalLinkIcon } from '@radix-ui/react-icons'
import { Box, Card, Flex, Heading, Separator, Text } from '@radix-ui/themes'
import BlockComments from './BlockComments'
import BlockConnections from './BlockConnections'
import { DefinitionList } from './DefinitionList'
import { ErrorMessage } from './ErrorMessage'
import Image from './Image'
import { LoadingIndicator } from './LoadingIndicator'
import OwnerAvatar from './OwnerAvatar'

interface BlockViewerProps {
  blockId: number
}

function BlockViewer({ blockId }: BlockViewerProps): JSX.Element {
  const { data: block, isLoading, error } = useBlock(blockId)

  if (isLoading) {
    return (
      <Card>
        <LoadingIndicator message={`Loading block ${blockId}...`} />
      </Card>
    )
  }

  if (error) {
    return <ErrorMessage error={error} />
  }

  if (!block) {
    return <Box />
  }

  return (
    <Card>
      <Flex direction="column" gap="4">
        <Flex gap="3" align="center">
          <OwnerAvatar owner={block.user} />

          <Heading
            size="6"
            style={{
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            / {block.title ?? 'Untitled'}
          </Heading>
        </Flex>

        <Separator size="4" />

        <Flex direction="row" gap="6">
          <DefinitionList
            width="50%"
            definitions={[
              {
                term: 'ID',
                description: block.id,
              },
              {
                term: 'Created at',
                description: new Date(block.created_at).toLocaleString(),
              },
              {
                term: 'Updated at',
                description: new Date(block.updated_at).toLocaleString(),
              },
              ...(block.source
                ? [
                    {
                      term: 'Source',
                      description: (
                        <Flex gap="2" align="center">
                          <Text
                            style={{
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {block.source.title ?? block.source.url ?? ''}
                          </Text>

                          <ExternalLinkIcon style={{ flexShrink: 0 }} />
                        </Flex>
                      ),
                      href: block.source.url,
                    },
                  ]
                : []),
            ]}
          />

          <DefinitionList
            width="50%"
            definitions={[
              {
                term: 'Type',
                description: block.type,
              },
              {
                term: 'Visibility',
                description: block.visibility,
              },
              {
                term: 'State',
                description: block.state,
              },
            ]}
          />
        </Flex>

        {'image' in block && block.image && (
          <Image
            image={block.image}
            size="large"
            alt={block.image.alt_text ?? ''}
            containerStyle={{
              maxWidth: '75%',
              backgroundColor: 'var(--gray-3)',
            }}
            style={{
              objectFit: 'contain',
            }}
          />
        )}

        {block.type === 'Text' && <Text dangerouslySetInnerHTML={{ __html: block.content.html }} />}

        {block.description && (
          <>
            <Separator size="4" />

            <Text dangerouslySetInnerHTML={{ __html: block.description.html }} />
          </>
        )}

        <Separator size="4" />

        <Flex direction="row" gap="6">
          <Box width="50%">
            <BlockConnections blockId={blockId} />
          </Box>

          {'image' in block && block.image && (
            <DefinitionList
              width="50%"
              definitions={[
                {
                  term: 'Dimensions',
                  description:
                    block.image.width && block.image.height
                      ? `${block.image.width} × ${block.image.height}`
                      : 'Unknown',
                },
                {
                  term: 'Aspect ratio',
                  description: block.image.aspect_ratio
                    ? `${block.image.aspect_ratio.toFixed(2)}:1`
                    : 'Unknown',
                },
                {
                  term: 'File size',
                  description: block.image.file_size
                    ? `${(block.image.file_size / 1024 / 1024).toFixed(2)} MB`
                    : 'Unknown',
                },
                {
                  term: 'Content type',
                  description: block.image.content_type ?? 'Unknown',
                },
                {
                  term: 'Filename',
                  description: block.image.filename ?? 'Unknown',
                },
              ]}
            />
          )}
        </Flex>

        <Separator size="4" />

        <BlockComments blockId={blockId} />
      </Flex>
    </Card>
  )
}

export default BlockViewer
