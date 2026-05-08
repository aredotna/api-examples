import type { Channel } from '@aredotna/sdk/api'
import { Box, Link, Text } from '@radix-ui/themes'
import { Link as RouterLink } from 'react-router-dom'
import { channelColors } from '../lib/channelColor'

interface ChannelLinkProps {
  channel: Channel
  /** If provided, renders as a clickable button instead of a link */
  onSelect?: (channel: Channel) => void
}

const ChannelLink = ({ channel, onSelect }: ChannelLinkProps) => {
  const content = (
    <Text
      size="3"
      style={{
        padding: 'var(--space-2) var(--space-4)',
        display: 'block',
        borderRadius: 'var(--radius-2)',
        ...channelColors(channel.visibility),
      }}
    >
      {channel.title} / {channel.owner.name}
    </Text>
  )

  if (onSelect) {
    return (
      <Box asChild style={{ cursor: 'pointer' }} onClick={() => onSelect(channel)}>
        {content}
      </Box>
    )
  }

  return (
    <Link asChild>
      <RouterLink to={`/channel/${channel.slug}`}>{content}</RouterLink>
    </Link>
  )
}

export default ChannelLink
