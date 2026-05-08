import { Link as RouterLink } from "react-router-dom";
import { Flex, Heading, Avatar, Link } from "@radix-ui/themes";
import type { ChannelOwner, EmbeddedUser } from "@aredotna/sdk/api";

interface OwnerAvatarProps {
  owner: ChannelOwner | EmbeddedUser;
}

function OwnerAvatar({ owner }: OwnerAvatarProps): JSX.Element {
  const href =
    owner.type === "User" ? `/user/${owner.slug}` : `/group/${owner.slug}`;

  return (
    <Flex gap="3" align="center">
      <Link asChild>
        <RouterLink to={href}>
          <Avatar
            src={owner.avatar || undefined}
            fallback={owner.initials}
            size="3"
          />
        </RouterLink>
      </Link>

      <Link asChild>
        <RouterLink to={href}>
          <Heading
            size="6"
            style={{
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            {owner.name}
          </Heading>
        </RouterLink>
      </Link>
    </Flex>
  );
}

export default OwnerAvatar;
