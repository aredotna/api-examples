import type { Metadata } from 'next'
import { Nav } from '@/components/Nav'
import { RouteProgress } from '@/components/RouteProgress'
import { getSiteUrl } from '@/config/arena'
import { getRootChannel } from '@/lib/nav'
import { channelDescription } from '@/lib/og'
import './globals.css'

type RootLayoutProps = {
  children: React.ReactNode
}

export const dynamic = 'force-static'

export async function generateMetadata(): Promise<Metadata> {
  const root = await getRootChannel()
  const description = channelDescription(root)

  return {
    alternates: {
      canonical: '/',
      types: {
        'application/rss+xml': '/rss.xml',
      },
    },
    description,
    metadataBase: new URL(getSiteUrl()),
    openGraph: {
      description,
      title: root.title,
      type: 'website',
      url: '/',
    },
    title: {
      default: root.title,
      template: `%s / ${root.title}`,
    },
  }
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <RouteProgress />
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  )
}
