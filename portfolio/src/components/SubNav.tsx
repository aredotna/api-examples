import type { Channel } from '@aredotna/sdk'

type SubNavProps = {
  channels: Channel[]
}

export function SubNav({ channels }: SubNavProps) {
  if (channels.length === 0) {
    return null
  }

  return (
    <nav aria-label="Nested channel navigation" className="subnav">
      {channels.map((channel) => (
        <a href={`https://www.are.na/${channel.slug}`} key={channel.id}>
          {channel.title}
        </a>
      ))}
    </nav>
  )
}
