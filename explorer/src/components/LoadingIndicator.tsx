import { Flex, Spinner, Text } from '@radix-ui/themes'

interface LoadingIndicatorProps {
  message: string
}

export const LoadingIndicator = ({ message }: LoadingIndicatorProps) => {
  return (
    <Flex direction="column" gap="3" align="center" py="6">
      <Spinner size="3" />

      <Text color="gray" size="2">
        {message}
      </Text>
    </Flex>
  )
}
