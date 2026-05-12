import 'server-only'

import type { Block, Channel } from '@aredotna/sdk'
import { getSiteUrl } from '@/config/arena'

type ImageLike = {
  large?: ImageVersionLike
  medium?: ImageVersionLike
  small?: ImageVersionLike
  src?: string
}

type ImageVersionLike = {
  height?: number | null
  src?: string
  width?: number | null
}

function textFromHtml(value?: string | null) {
  return (
    value
      ?.replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim() || undefined
  )
}

export function plainText(value?: { plain?: string; html?: string } | null) {
  return value?.plain?.trim() || textFromHtml(value?.html)
}

export function imageUrl(image?: ImageLike | null) {
  return image?.large?.src || image?.medium?.src || image?.src || image?.small?.src || undefined
}

export function imageData(image?: ImageLike | null) {
  const versions = [image?.large, image?.medium, image?.small]
  const version = versions.find((candidate): candidate is ImageVersionLike =>
    Boolean(candidate?.src),
  )

  if (version?.src) {
    return {
      height:
        version.height ?? image?.large?.height ?? image?.medium?.height ?? image?.small?.height,
      src: version.src,
      width: version.width ?? image?.large?.width ?? image?.medium?.width ?? image?.small?.width,
    }
  }

  if (image?.src) {
    return {
      height: image.large?.height ?? image.medium?.height ?? image.small?.height,
      src: image.src,
      width: image.large?.width ?? image.medium?.width ?? image.small?.width,
    }
  }

  return null
}

export function blockTitle(block: Block) {
  return block.title?.trim() || block.source?.title?.trim() || `${block.type} block`
}

export function blockDescription(block: Block) {
  return plainText(block.description) || plainText('content' in block ? block.content : null)
}

export function blockImage(block: Block) {
  switch (block.type) {
    case 'Image':
      return imageUrl(block.image)
    case 'Link':
    case 'Attachment':
    case 'Embed':
      return imageUrl(block.image)
    default:
      return undefined
  }
}

export function blockImageData(block: Block) {
  switch (block.type) {
    case 'Image':
      return imageData(block.image)
    case 'Link':
    case 'Attachment':
    case 'Embed':
      return imageData(block.image)
    default:
      return null
  }
}

export function channelDescription(channel: Channel) {
  return plainText(channel.description)
}

export function absoluteUrl(path: string) {
  return new URL(path, getSiteUrl()).toString()
}
