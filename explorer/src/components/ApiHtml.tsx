import { Text, type TextProps } from '@radix-ui/themes'

type ApiHtmlProps = Omit<
  Extract<TextProps, { as: 'div' }>,
  'as' | 'children' | 'dangerouslySetInnerHTML'
> & {
  html: string
}

export function ApiHtml({ html, ...textProps }: ApiHtmlProps): JSX.Element {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: Are.na API HTML is trusted.
  return <Text as="div" {...textProps} dangerouslySetInnerHTML={{ __html: html }} />
}
