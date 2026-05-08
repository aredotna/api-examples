import { useUserFollowing } from '@aredotna/react-query'
import type { FollowableType } from '@aredotna/sdk/api'
import { Box, Text } from '@radix-ui/themes'
import FollowGrid from './FollowGrid'
import { LoadingIndicator } from './LoadingIndicator'

interface UserFollowingProps {
  userId: string
  currentPage: number
  onPageChange: (page: number) => void
  per?: number
  type?: FollowableType
}

function UserFollowing({
  userId,
  currentPage,
  onPageChange,
  per = 25,
  type,
}: UserFollowingProps): JSX.Element | null {
  const { data: following, isLoading } = useUserFollowing(userId, {
    page: currentPage,
    per,
    type,
  })

  if (isLoading) {
    return <LoadingIndicator message="Loading following..." />
  }

  if (!following || following.data.length === 0) {
    return (
      <Box py="6">
        <Text color="gray" align="center" as="p">
          Not following anyone yet
        </Text>
      </Box>
    )
  }

  return <FollowGrid meta={following.meta} data={following.data} onPageChange={onPageChange} />
}

export default UserFollowing
