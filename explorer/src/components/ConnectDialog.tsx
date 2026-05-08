import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  Flex,
  Text,
  TextField,
  Spinner,
  ScrollArea,
} from "@radix-ui/themes";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useSearch, useCreateConnection } from "@aredotna/react-query";
import {
  ConnectableType,
  SearchScope,
  type Channel,
} from "@aredotna/sdk/api";
import ChannelLink from "./ChannelLink";

interface ConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectableId: number;
  connectableType: "block" | "channel";
}

export function ConnectDialog({
  open,
  onOpenChange,
  connectableId,
  connectableType,
}: ConnectDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const selectedChannelRef = useRef<Channel | null>(null);
  const navigate = useNavigate();

  const createConnection = useCreateConnection({
    onSuccess: () => {
      onOpenChange(false);
      setSearchQuery("");
      // Navigate to the selected channel
      if (selectedChannelRef.current) {
        navigate(`/channel/${selectedChannelRef.current.slug}`);
        selectedChannelRef.current = null;
      }
    },
  });

  // Search for channels only
  const { data, isLoading: isSearching } = useSearch(
    {
      query: searchQuery || undefined,
      type: ["Channel"],
      scope: SearchScope.MY, // Only show user's own channels they can connect to
      per: 20,
    },
    { enabled: searchQuery.length > 0 }
  );

  const handleSelectChannel = (channel: Channel) => {
    selectedChannelRef.current = channel;
    createConnection.mutate({
      connectable_id: connectableId,
      connectable_type:
        connectableType === "block"
          ? ConnectableType.BLOCK
          : ConnectableType.CHANNEL,
      // Use slug so cache invalidation matches the query key
      channel_ids: [channel.slug],
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSearchQuery("");
    }
    onOpenChange(newOpen);
  };

  const channels = data?.data?.filter(
    (item): item is Channel => item.type === "Channel"
  );

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Content maxWidth="450px">
        <Dialog.Title>Connect {connectableType} to channel</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Search for a channel to connect this {connectableType} to.
        </Dialog.Description>

        <Flex direction="column" gap="3">
          <TextField.Root
            placeholder="Search your channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          >
            <TextField.Slot>
              <MagnifyingGlassIcon height="16" width="16" />
            </TextField.Slot>
            {isSearching && (
              <TextField.Slot>
                <Spinner size="1" />
              </TextField.Slot>
            )}
          </TextField.Root>

          {createConnection.error && (
            <Text color="red" size="2">
              {createConnection.error.message}
            </Text>
          )}

          <ScrollArea style={{ height: "300px" }} scrollbars="vertical">
            <Flex direction="column" gap="1">
              {searchQuery.length === 0 && (
                <Flex py="4" justify="center">
                  <Text size="2" color="gray" align="center">
                    Start typing to search channels
                  </Text>
                </Flex>
              )}

              {searchQuery.length > 0 &&
                !isSearching &&
                channels?.length === 0 && (
                  <Flex py="4" justify="center">
                    <Text size="2" color="gray" align="center">
                      No channels found
                    </Text>
                  </Flex>
                )}

              {channels?.map((channel) => (
                <ChannelLink
                  key={channel.id}
                  channel={channel}
                  onSelect={
                    createConnection.isPending ? undefined : handleSelectChannel
                  }
                />
              ))}

              {createConnection.isPending && (
                <Flex align="center" justify="center" py="4" gap="2">
                  <Spinner size="2" />
                  <Text size="2" color="gray">
                    Connecting...
                  </Text>
                </Flex>
              )}
            </Flex>
          </ScrollArea>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
