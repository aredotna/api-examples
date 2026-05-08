import { Link as RouterLink } from "react-router-dom";
import {
  Flex,
  Text,
  Box,
  Link,
  Badge,
  Avatar,
  Spinner,
} from "@radix-ui/themes";
import {
  Link2Icon,
  PlayIcon,
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";
import type {
  Block,
  Channel,
  User,
  Group,
  EmbeddedConnection,
} from "@aredotna/sdk/api";
import Image from "./Image";
import { channelColors } from "../lib/channelColor";
import { CellActionMenu } from "./CellActionMenu";

// Base Cell wrapper
export function Cell({
  children,
  style,
  connection,
  channelId,
  itemType,
  itemId,
  connectableId,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  connection?: EmbeddedConnection | null;
  channelId?: string;
  itemType?: "block" | "channel";
  itemId?: number | string; // For navigation (slug for channels, id for blocks)
  connectableId?: number; // Numeric ID for API calls (always the actual ID)
}) {
  const cellContent = (
    <Box
      style={{
        aspectRatio: "1",
        backgroundColor: "var(--gray-3)",
        borderRadius: "var(--radius-2)",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {children}
    </Box>
  );

  // Wrap with context menu if we have connection data
  if (
    connection &&
    channelId &&
    itemType &&
    itemId !== undefined &&
    connectableId !== undefined
  ) {
    return (
      <CellActionMenu
        connectionId={connection.id}
        currentPosition={connection.position}
        itemType={itemType}
        itemId={itemId}
        connectableId={connectableId}
      >
        {cellContent}
      </CellActionMenu>
    );
  }

  return cellContent;
}

// Type guards
export function isBlock(item: Block | Channel | User | Group): item is Block {
  return "base_type" in item && item.base_type === "Block";
}

export function isChannel(
  item: Block | Channel | User | Group
): item is Channel {
  return "type" in item && item.type === "Channel";
}

export function isUser(item: Block | Channel | User | Group): item is User {
  return "type" in item && item.type === "User";
}

export function isGroup(item: Block | Channel | User | Group): item is Group {
  return "type" in item && item.type === "Group";
}

// Channel Cell
interface ChannelCellProps {
  channel: Channel;
  showCount?: boolean;
  channelId?: string; // The channel we're viewing (for connection actions)
}

export function ChannelCell({
  channel,
  showCount = false,
  channelId,
}: ChannelCellProps) {
  return (
    <Cell
      style={{
        padding: "var(--space-2)",
        ...channelColors(channel.visibility),
      }}
      connection={channel.connection}
      channelId={channelId}
      itemType="channel"
      itemId={channel.slug}
      connectableId={channel.id}
    >
      <Link asChild style={{ width: "100%", height: "100%" }}>
        <RouterLink
          to={`/channel/${channel.slug}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          {showCount ? (
            <Flex direction="column" align="center" gap="1">
              <Text size="2" align="center" weight="medium">
                {channel.title}
              </Text>
              <Text size="1" color="gray">
                {channel.counts?.contents || 0} items
              </Text>
            </Flex>
          ) : (
            <Text size="2" align="center">
              {channel.title}
            </Text>
          )}
        </RouterLink>
      </Link>
    </Cell>
  );
}

// User Cell
export function UserCell({ user }: { user: User }) {
  return (
    <Link asChild>
      <RouterLink to={`/user/${user.slug}`}>
        <Cell>
          <Flex direction="column" align="center" gap="2" p="3">
            <Avatar
              size="5"
              src={user.avatar || undefined}
              fallback={user.initials}
              radius="full"
            />
            <Flex direction="column" align="center" gap="1">
              <Text size="2" weight="medium" align="center">
                {user.name}
              </Text>

              <Text size="1" color="gray">
                @{user.slug}
              </Text>
            </Flex>
          </Flex>
        </Cell>
      </RouterLink>
    </Link>
  );
}

// Group Cell
export function GroupCell({ group }: { group: Group }) {
  return (
    <Link asChild>
      <RouterLink to={`/group/${group.slug}`}>
        <Cell style={{ padding: "var(--space-3)" }}>
          <Flex direction="column" align="center" gap="1">
            <Badge size="1" color="orange">
              Group
            </Badge>
            <Text size="2" weight="medium" align="center">
              {group.name}
            </Text>
            <Text size="1" color="gray">
              {group.counts?.channels || 0} channels
            </Text>
          </Flex>
        </Cell>
      </RouterLink>
    </Link>
  );
}

// Block Cell
interface BlockCellProps {
  block: Block;
  channelId?: string; // The channel we're viewing (for connection actions)
}

export function BlockCell({ block, channelId }: BlockCellProps) {
  const imageStyle = {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  };

  const linkStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  };

  // Handle PendingBlock type or processing state
  if (block.type === "PendingBlock" || block.state === "processing") {
    return (
      <Cell
        connection={block.connection}
        channelId={channelId}
        itemType="block"
        itemId={block.id}
        connectableId={block.id}
      >
        <Link asChild style={{ width: "100%", height: "100%" }}>
          <RouterLink to={`/block/${block.id}`} style={linkStyle}>
            <Flex direction="column" align="center" gap="2">
              <Spinner size="3" />
            </Flex>
          </RouterLink>
        </Link>
      </Cell>
    );
  }

  // Handle failed state
  if (block.state === "failed") {
    return (
      <Cell
        connection={block.connection}
        channelId={channelId}
        itemType="block"
        itemId={block.id}
        connectableId={block.id}
      >
        <Link asChild style={{ width: "100%", height: "100%" }}>
          <RouterLink to={`/block/${block.id}`} style={linkStyle}>
            <Flex direction="column" align="center" gap="2" p="3">
              <ExclamationTriangleIcon
                width={24}
                height={24}
                color="var(--red-9)"
              />
              <Text size="1" color="red" align="center">
                Processing failed
              </Text>
              {block.title && (
                <Text size="1" color="gray" align="center">
                  {block.title}
                </Text>
              )}
            </Flex>
          </RouterLink>
        </Link>
      </Cell>
    );
  }

  switch (block.type) {
    case "Image":
      return (
        <Cell
          connection={block.connection}
          channelId={channelId}
          itemType="block"
          itemId={block.id}
          connectableId={block.id}
        >
          <Link asChild style={{ width: "100%", height: "100%" }}>
            <RouterLink to={`/block/${block.id}`} style={linkStyle}>
              {block.image && (
                <Image
                  image={block.image}
                  size="square"
                  alt={block.title || "Block"}
                  style={imageStyle}
                />
              )}
            </RouterLink>
          </Link>
        </Cell>
      );

    case "Text":
      return (
        <Cell
          connection={block.connection}
          channelId={channelId}
          itemType="block"
          itemId={block.id}
          connectableId={block.id}
        >
          <Link asChild style={{ width: "100%", height: "100%" }}>
            <RouterLink to={`/block/${block.id}`} style={linkStyle}>
              <Box p="2" style={{ width: "100%", height: "100%" }}>
                <Text
                  size="2"
                  color="gray"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 8,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: block.content?.html || "",
                  }}
                />
              </Box>
            </RouterLink>
          </Link>
        </Cell>
      );

    case "Attachment":
      return (
        <Cell
          connection={block.connection}
          channelId={channelId}
          itemType="block"
          itemId={block.id}
          connectableId={block.id}
        >
          <Link asChild style={{ width: "100%", height: "100%" }}>
            <RouterLink to={`/block/${block.id}`} style={linkStyle}>
              {block.image && (
                <Image
                  image={block.image}
                  size="square"
                  alt={block.title || "Block"}
                  style={imageStyle}
                />
              )}
            </RouterLink>
          </Link>
          <Box
            position="absolute"
            right="0"
            bottom="0"
            style={{ zIndex: 1, padding: "var(--space-2)" }}
          >
            <Badge variant="solid">{block.attachment?.file_extension}</Badge>
          </Box>
        </Cell>
      );

    case "Link":
      return (
        <Cell
          connection={block.connection}
          channelId={channelId}
          itemType="block"
          itemId={block.id}
          connectableId={block.id}
        >
          <Link asChild style={{ width: "100%", height: "100%" }}>
            <RouterLink to={`/block/${block.id}`} style={linkStyle}>
              {block.image && (
                <Image
                  image={block.image}
                  size="square"
                  alt={block.title || "Block"}
                  style={imageStyle}
                />
              )}
            </RouterLink>
          </Link>
          <Box
            position="absolute"
            right="0"
            bottom="0"
            style={{ zIndex: 1, padding: "var(--space-2)" }}
          >
            <Badge variant="solid">
              <Link2Icon />
            </Badge>
          </Box>
        </Cell>
      );

    case "Embed":
      return (
        <Cell
          connection={block.connection}
          channelId={channelId}
          itemType="block"
          itemId={block.id}
          connectableId={block.id}
        >
          <Link asChild style={{ width: "100%", height: "100%" }}>
            <RouterLink to={`/block/${block.id}`} style={linkStyle}>
              {block.image && (
                <Image
                  image={block.image}
                  size="square"
                  alt={block.title || "Block"}
                  style={imageStyle}
                />
              )}
            </RouterLink>
          </Link>
          <Flex
            position="absolute"
            top="0"
            right="0"
            width="100%"
            height="100%"
            direction="column"
            align="center"
            justify="center"
            style={{ zIndex: 1, pointerEvents: "none" }}
          >
            <Flex
              align="center"
              justify="center"
              style={{
                width: 30,
                height: 25,
                backgroundColor: "var(--accent-9)",
                color: "var(--gray-1)",
                borderRadius: "var(--radius-1)",
              }}
            >
              <PlayIcon />
            </Flex>
          </Flex>
        </Cell>
      );
  }
}
