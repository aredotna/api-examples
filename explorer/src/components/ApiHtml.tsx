import { Text, type TextProps } from '@radix-ui/themes'
import { createElement, type ReactNode, useMemo } from 'react'

type ApiHtmlProps = Omit<
  Extract<TextProps, { as: 'div' }>,
  'as' | 'children' | 'dangerouslySetInnerHTML'
> & {
  html: string
}

const ALLOWED_TAGS = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'code',
  'del',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'i',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'strong',
  'u',
  'ul',
])

const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])
const VOID_TAGS = new Set(['br'])

function isSafeUrl(href: string): boolean {
  if (href.startsWith('/') || href.startsWith('#')) return true

  try {
    return SAFE_URL_PROTOCOLS.has(new URL(href, 'https://arena.local').protocol)
  } catch {
    return false
  }
}

function renderNode(node: ChildNode, key: string): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null
  }

  const element = node as Element
  const tagName = element.tagName.toLowerCase()
  const children = Array.from(element.childNodes).map((child, index) =>
    renderNode(child, `${key}-${index}`),
  )

  if (!ALLOWED_TAGS.has(tagName)) {
    return children
  }

  if (VOID_TAGS.has(tagName)) {
    return createElement(tagName, { key })
  }

  if (tagName === 'a') {
    const href = element.getAttribute('href')

    if (!href || !isSafeUrl(href)) {
      return children
    }

    return createElement(
      'a',
      {
        href,
        key,
        rel: 'noreferrer',
        target: element.getAttribute('target') === '_blank' ? '_blank' : undefined,
        title: element.getAttribute('title') ?? undefined,
      },
      children,
    )
  }

  return createElement(tagName, { key }, children)
}

function renderApiHtml(html: string): ReactNode[] {
  const document = new DOMParser().parseFromString(html, 'text/html')

  return Array.from(document.body.childNodes).map((node, index) => renderNode(node, String(index)))
}

export function ApiHtml({ html, ...textProps }: ApiHtmlProps): JSX.Element {
  const children = useMemo(() => renderApiHtml(html), [html])

  return (
    <Text as="div" {...textProps}>
      {children}
    </Text>
  )
}
