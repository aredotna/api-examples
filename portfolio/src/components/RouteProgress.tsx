'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type Phase = 'idle' | 'loading' | 'complete'

function isInternalNavigation(event: MouseEvent) {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false
  }

  const link = (event.target as Element | null)?.closest('a')

  if (!link || link.target || link.hasAttribute('download')) {
    return false
  }

  const url = new URL(link.href, window.location.href)

  return (
    url.origin === window.location.origin &&
    (url.pathname !== window.location.pathname || url.search !== window.location.search)
  )
}

export function RouteProgress() {
  const pathname = usePathname()
  const [phase, setPhase] = useState<Phase>('idle')
  const previousPathname = useRef(pathname)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!isInternalNavigation(event)) {
        return
      }

      if (resetTimer.current) {
        clearTimeout(resetTimer.current)
        resetTimer.current = null
      }

      setPhase('loading')
    }

    document.addEventListener('click', handleClick, { capture: true })

    return () => {
      document.removeEventListener('click', handleClick, { capture: true })
    }
  }, [])

  useEffect(() => {
    if (previousPathname.current === pathname) {
      return
    }

    previousPathname.current = pathname
    setPhase('complete')

    if (resetTimer.current) {
      clearTimeout(resetTimer.current)
    }

    resetTimer.current = setTimeout(() => {
      setPhase('idle')
      resetTimer.current = null
    }, 500)

    return () => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current)
      }
    }
  }, [pathname])

  return <div aria-hidden="true" className="route-progress" data-phase={phase} />
}
