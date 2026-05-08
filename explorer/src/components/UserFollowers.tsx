import { useUserFollowers } from "@aredotna/react-query";
import { LoadingIndicator } from "./LoadingIndicator";
import FollowGrid from "./FollowGrid";
import { Box, Text } from "@radix-ui/themes";

interface UserFollowersProps {
  userId: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  per?: number;
}

function UserFollowers({
  userId,
  currentPage,
  onPageChange,
  per = 25,
}: UserFollowersProps): JSX.Element | null {
  const { data: followers, isLoading } = useUserFollowers(userId, {
    page: currentPage,
    per,
  });

  if (isLoading) {
    return <LoadingIndicator message="Loading followers..." />;
  }

  if (!followers || followers.data.length === 0) {
    return (
      <Box py="6">
        <Text color="gray" align="center" as="p">
          No followers yet
        </Text>
      </Box>
    );
  }

  return (
    <FollowGrid
      meta={followers.meta}
      data={followers.data}
      onPageChange={onPageChange}
    />
  );
}

export default UserFollowers;
