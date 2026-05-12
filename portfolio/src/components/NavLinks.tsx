'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = {
  href: string
  id: number | string
  title: string
}

type NavLinksProps = {
  items: NavItem[]
}

export function NavLinks({ items }: NavLinksProps) {
  const pathname = usePathname()

  return (
    <nav aria-label="Primary navigation" className="nav-list">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname === item.href.replace(/\/$/, '')

        return (
          <Link
            aria-current={isActive ? 'page' : undefined}
            className="nav-link"
            href={item.href}
            key={item.id}
          >
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}
