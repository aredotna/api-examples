import 'server-only'

import { getSiteData } from '@/lib/blocks'

export async function getRootChannel() {
  return (await getSiteData()).root
}

export async function getNav() {
  const data = await getSiteData()

  return {
    root: data.root,
    rootChannels: data.rootChannels,
  }
}
