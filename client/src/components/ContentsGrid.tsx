import { Flex, Grid, Select } from "@radix-ui/themes";
import {
  ChannelContentSort,
  ContentSort,
  type Block,
  type Channel,
  type PaginationMeta,
} from "@aredotna/sdk/api";
import Pagination from "./Pagination";
import { ChannelCell, BlockCell } from "./Cell";

interface ContentsGridProps<TSortEnum extends string> {
  meta: PaginationMeta;
  data: (Block | Channel)[];
  onPageChange: (page: number) => void;
  sort?: TSortEnum;
  sortEnum?: Record<string, TSortEnum>;
  onSortChange?: (sort: TSortEnum) => void;
  channelId?: string; // For connection actions (move/delete)
}

const SORT_LABELS: Record<string, string> = {
  position_asc: "Position (Low to High)",
  position_desc: "Position (High to Low)",
  created_at_asc: "Oldest First",
  created_at_desc: "Newest First",
  updated_at_asc: "Least Recently Updated",
  updated_at_desc: "Recently Updated",
};

function getSortLabel(sort: string): string {
  return SORT_LABELS[sort] || sort;
}

function ContentsGrid<TSortEnum extends string>({
  meta,
  data,
  onPageChange,
  sort,
  sortEnum,
  onSortChange,
  channelId,
}: ContentsGridProps<TSortEnum>): JSX.Element | null {
  return (
    <>
      <Flex direction="column" gap="3">
        {meta && (
          <Flex gap="3" align="center" justify="between" wrap="wrap">
            <Pagination meta={meta} onPageChange={onPageChange} />

            {sort && sortEnum && onSortChange && (
              <Select.Root
                value={sort}
                onValueChange={(value) => {
                  onSortChange(value as TSortEnum);
                }}
              >
                <Select.Trigger />

                <Select.Content>
                  {Object.values(sortEnum).map((s) => (
                    <Select.Item key={s} value={s}>
                      {getSortLabel(s)}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            )}
          </Flex>
        )}

        <Grid columns={{ initial: "2", sm: "3", md: "4", lg: "5" }} gap="2">
          {data.map((item) => {
            if (item.type === "Channel") {
              return (
                <ChannelCell
                  key={`channel-${item.id}`}
                  channel={item as Channel}
                  channelId={channelId}
                />
              );
            }
            return (
              <BlockCell
                key={`block-${item.id}`}
                block={item as Block}
                channelId={channelId}
              />
            );
          })}
        </Grid>

        {meta && (
          <Flex gap="3" align="center" justify="between" wrap="wrap">
            <Pagination meta={meta} onPageChange={onPageChange} />
            {sort && sortEnum && onSortChange && (
              <Select.Root
                value={sort}
                onValueChange={(value) => {
                  onSortChange(value as TSortEnum);
                }}
              >
                <Select.Trigger />
                <Select.Content>
                  {Object.values(sortEnum).map((s) => (
                    <Select.Item key={s} value={s}>
                      {getSortLabel(s)}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            )}
          </Flex>
        )}
      </Flex>
    </>
  );
}

export default ContentsGrid;

// Re-export for type convenience
export type { ChannelContentSort, ContentSort };
