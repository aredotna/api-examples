import { useState } from "react";
import {
  Avatar,
  Button,
  DropdownMenu,
  Flex,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import { useAuth } from "../contexts/AuthContext";
import { Link as RouterLink } from "react-router-dom";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { CreateChannelDialog } from "./CreateChannelDialog";

export const UserMenu = () => {
  const { isAuthenticated, isLoading, user, logout, login } = useAuth();
  const [createChannelOpen, setCreateChannelOpen] = useState(false);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Button size="2" variant="ghost" onClick={login} disabled={isLoading}>
        {isLoading ? "Loading..." : "Log in with Are.na"}
      </Button>
    );
  }

  return (
    <>
      <Flex align="center" gap="4">
        <Tooltip content="Search">
          <Button size="2" variant="ghost" asChild>
            <RouterLink to="/search">
              <MagnifyingGlassIcon width="18" height="18" />
            </RouterLink>
          </Button>
        </Tooltip>

        <Flex align="center" gap="3">
          <Button
            size="2"
            variant="soft"
            onClick={() => setCreateChannelOpen(true)}
          >
            New Channel
          </Button>

          {user && (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Button size="2" variant="ghost">
                  <Avatar
                    size="1"
                    src={user.avatar ?? undefined}
                    fallback={user.initials || "U"}
                    radius="full"
                  />
                  <Text size="2" weight="medium">
                    {user.name}
                  </Text>
                </Button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Content align="end">
                <DropdownMenu.Item asChild>
                  <RouterLink to={`/user/${user.slug}`}>
                    View profile
                  </RouterLink>
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item color="red" onSelect={logout}>
                  Log out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          )}
        </Flex>
      </Flex>

      <CreateChannelDialog
        open={createChannelOpen}
        onOpenChange={setCreateChannelOpen}
      />
    </>
  );
};
