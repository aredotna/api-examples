type ApiHtmlProps = {
  className?: string
  html?: string | null
}

export function ApiHtml({ className, html }: ApiHtmlProps) {
  if (!html) {
    return null
  }

  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
