import { Flex, Grid } from "@radix-ui/themes";
import type { FollowableListResponse } from "@aredotna/sdk/api";
import Pagination from "./Pagination";
import {
  UserCell,
  ChannelCell,
  GroupCell,
  isUser,
  isChannel,
  isGroup,
} from "./Cell";

interface FollowGridProps extends FollowableListResponse {
  onPageChange: (page: number) => void;
}

function FollowGrid({
  meta,
  data,
  onPageChange,
}: FollowGridProps): JSX.Element {
  return (
    <Flex direction="column" gap="3">
      {meta && <Pagination meta={meta} onPageChange={onPageChange} />}

      <Grid columns={{ initial: "2", sm: "3", md: "4", lg: "5" }} gap="2">
        {data.map((item) => {
          if (isUser(item)) {
            return <UserCell key={`user-${item.id}`} user={item} />;
          }
          if (isChannel(item)) {
            return (
              <ChannelCell
                key={`channel-${item.id}`}
                channel={item}
                showCount
              />
            );
          }
          if (isGroup(item)) {
            return <GroupCell key={`group-${item.id}`} group={item} />;
          }
          return null;
        })}
      </Grid>

      {meta && <Pagination meta={meta} onPageChange={onPageChange} />}
    </Flex>
  );
}

export default FollowGrid;
