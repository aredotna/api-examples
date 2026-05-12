import Link from 'next/link'
import { NavLinks } from '@/components/NavLinks'
import { getNav } from '@/lib/nav'

export async function Nav() {
  const { root, rootChannels } = await getNav()

  return (
    <header className="site-header">
      <Link className="brand" href="/">
        {root.title}
      </Link>
      {rootChannels.length > 0 ? (
        <NavLinks
          items={rootChannels.map((channel) => ({
            href: `/${channel.slug}/`,
            id: channel.id,
            title: channel.title,
          }))}
        />
      ) : null}
    </header>
  )
}
