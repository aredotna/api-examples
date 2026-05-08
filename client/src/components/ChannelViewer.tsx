import { useState } from "react";
import { useChannel } from "@aredotna/react-query";
import {
  Card,
  Flex,
  Heading,
  Text,
  Box,
  Separator,
  Button,
} from "@radix-ui/themes";
import { DefinitionList } from "./DefinitionList";
import ChannelContents from "./ChannelContents";
import ChannelConnections from "./ChannelConnections";
import OwnerAvatar from "./OwnerAvatar";
import { LoadingIndicator } from "./LoadingIndicator";
import { ErrorMessage } from "./ErrorMessage";
import { AddBlockDialog } from "./AddBlockDialog";
import { ChannelUploadDropzone } from "./ChannelUploadDropzone";
import { ChannelContentSort } from "@aredotna/sdk/api";
import {
  ContentViewerProvider,
  useContentViewer,
} from "../contexts/ContentViewerContext";

interface ChannelViewerProps {
  channelId: string;
}

const PER = 25;

function ChannelViewerContent({ channelId }: ChannelViewerProps): JSX.Element {
  const { state, setPage, setSort } = useContentViewer<
    undefined,
    ChannelContentSort
  >();
  const [addBlockOpen, setAddBlockOpen] = useState(false);

  const { data: channel, isLoading, error } = useChannel(channelId);

  const canAddTo = channel?.can?.add_to ?? false;

  if (isLoading) {
    return (
      <Card>
        <LoadingIndicator message={`Loading channel ${channelId}...`} />
      </Card>
    );
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  if (!channel) {
    return <Box />;
  }

  return (
    <Card>
      <Flex direction="column" gap="4">
        <Flex gap="3" align="center">
          <OwnerAvatar owner={channel.owner} />

          <Heading
            size="6"
            style={{
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            / {channel.title}
          </Heading>
        </Flex>

        {channel.description && (
          <Text
            dangerouslySetInnerHTML={{ __html: channel.description.html }}
          />
        )}

        <Separator size="4" />

        <Flex direction="row" gap="6">
          <DefinitionList
            width="100%"
            definitions={[
              {
                term: "Length",
                description: `${channel.counts.contents} (${channel.counts.blocks} blocks, ${channel.counts.channels} channels)`,
              },
              {
                term: "Collaborators",
                description: channel.counts.collaborators,
              },
              {
                term: "Created at",
                description: new Date(channel.created_at).toLocaleString(),
              },
              {
                term: "Updated at",
                description: new Date(channel.updated_at).toLocaleString(),
              },
            ]}
          />

          <DefinitionList
            width="100%"
            definitions={[
              {
                term: "ID",
                description: channel.id,
              },
              {
                term: "Slug",
                description: channel.slug,
              },
              {
                term: "Visibility",
                description: channel.visibility,
              },
            ]}
          />
        </Flex>

        {canAddTo && (
          <Button variant="soft" onClick={() => setAddBlockOpen(true)}>
            Add Block
          </Button>
        )}

        <ChannelContents
          channelId={channelId}
          currentPage={state.currentPage}
          onPageChange={setPage}
          per={PER}
          sort={state.sort}
          onSortChange={setSort}
        />

        <ChannelConnections channelId={channelId} />
      </Flex>

      <AddBlockDialog
        channelId={channel.id}
        open={addBlockOpen}
        onOpenChange={setAddBlockOpen}
      />
      <ChannelUploadDropzone
        channelId={channelId}
        channelNumericId={channel.id}
        channelTitle={channel.title}
        enabled={canAddTo}
      />
    </Card>
  );
}

function ChannelViewer({ channelId }: ChannelViewerProps): JSX.Element {
  return (
    <ContentViewerProvider
      resourceId={channelId}
      initialState={{
        currentPage: 1,
        type: undefined,
        sort: ChannelContentSort.POSITION_DESC,
      }}
    >
      <ChannelViewerContent channelId={channelId} />
    </ContentViewerProvider>
  );
}

export default ChannelViewer;
