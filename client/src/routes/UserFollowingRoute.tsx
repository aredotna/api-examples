import { useState } from "react";
import { useParams } from "react-router-dom";
import UserFollowing from "../components/UserFollowing";
import ContentTypeFilter from "../components/ContentTypeFilter";
import { Flex } from "@radix-ui/themes";
import { FollowableType } from "@aredotna/sdk/api";

const PER = 25;

function UserFollowingRoute(): JSX.Element | null {
  const { id: userId } = useParams<{ id: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const [type, setType] = useState<FollowableType | undefined>(undefined);

  if (!userId) return null;

  const handleTypeChange = (newType: FollowableType | undefined) => {
    setType(newType);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  return (
    <Flex direction="column" gap="3">
      <ContentTypeFilter
        value={type}
        onChange={handleTypeChange}
        options={[
          { value: FollowableType.USER, label: "Users" },
          { value: FollowableType.CHANNEL, label: "Channels" },
          { value: FollowableType.GROUP, label: "Groups" },
        ]}
      />

      <UserFollowing
        userId={userId}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        per={PER}
        type={type}
      />
    </Flex>
  );
}

export default UserFollowingRoute;
