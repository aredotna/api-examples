import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  arenaQueryKeys,
  useCreateUploadBlock,
} from "@aredotna/react-query";
import { useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Card,
  Flex,
  Progress,
  Spinner,
  Text,
} from "@radix-ui/themes";

interface ChannelUploadDropzoneProps {
  channelId: string;
  channelNumericId: number;
  channelTitle: string;
  enabled: boolean;
}

type UploadStatus = "queued" | "uploading" | "creating" | "done" | "error";

interface UploadItem {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number;
  status: UploadStatus;
  sent?: number;
  total?: number;
  error?: string;
  blockId?: number;
}

const createUploadId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const unit = units[exponent] ?? "B";
  const value = bytes / 1024 ** exponent;

  return `${value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1)} ${unit}`;
};

const getUploadStatusLabel = (item: UploadItem) => {
  switch (item.status) {
    case "queued":
      return "Queued";
    case "uploading": {
      const total = item.total ?? item.fileSize;
      return `${formatBytes(item.sent ?? 0)} of ${formatBytes(total)}`;
    }
    case "creating":
      return "Creating block...";
    case "done":
      return item.blockId ? `Block ${item.blockId} created` : "Block created";
    case "error":
      return item.error ?? "Upload failed";
  }
};

const getProgressColor = (status: UploadStatus) => {
  if (status === "error") return "red";
  if (status === "done") return "green";
  return "blue";
};

const isActiveUpload = (status: UploadStatus) =>
  status === "queued" || status === "uploading" || status === "creating";

const getVisibleProgress = (item: UploadItem) => {
  if (item.status === "queued") return 0;
  if (item.status === "uploading" && item.progress === 0) return undefined;
  return item.progress;
};

function hasDraggedFiles(event: DragEvent) {
  return event.dataTransfer
    ? Array.from(event.dataTransfer.types).includes("Files")
    : false;
}

export function ChannelUploadDropzone({
  channelId,
  channelNumericId,
  channelTitle,
  enabled,
}: ChannelUploadDropzoneProps): JSX.Element | null {
  const dragDepth = useRef(0);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);

  const queryClient = useQueryClient();
  const createUploadBlock = useCreateUploadBlock({ invalidate: false });

  const activeCount = useMemo(
    () =>
      uploadItems.filter(
        (item) =>
          item.status === "queued" ||
          item.status === "uploading" ||
          item.status === "creating",
      ).length,
    [uploadItems],
  );
  const finishedCount = uploadItems.length - activeCount;
  const hasActiveUploads = activeCount > 0;
  const hasFinishedUploads = finishedCount > 0;

  const updateUploadItem = useCallback(
    (id: string, patch: Partial<UploadItem>) => {
      setUploadItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        ),
      );
    },
    [],
  );

  const refreshChannel = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: arenaQueryKeys.channels.detail(channelId),
      }),
      queryClient.invalidateQueries({
        queryKey: arenaQueryKeys.channels.contents(channelId),
      }),
    ]);
  }, [channelId, queryClient]);

  const uploadFile = useCallback(
    async (uploadId: string, file: File) => {
      updateUploadItem(uploadId, {
        error: undefined,
        progress: 0,
        sent: 0,
        status: "uploading",
        total: file.size,
      });

      try {
        const block = await createUploadBlock.mutateAsync({
          channels: [{ id: channelNumericId }],
          file,
          onProgress: (sent, total) => {
            const knownTotal = total ?? file.size;
            const progress =
              knownTotal > 0 ? Math.round((sent / knownTotal) * 100) : 100;

            updateUploadItem(uploadId, {
              progress: Math.min(progress, 100),
              sent,
              status: progress >= 100 ? "creating" : "uploading",
              total: knownTotal,
            });
          },
        });

        updateUploadItem(uploadId, {
          blockId: block.id,
          progress: 100,
          status: "done",
        });
        await refreshChannel();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Upload failed.";
        updateUploadItem(uploadId, {
          error: message,
          status: "error",
        });
      }
    },
    [
      channelNumericId,
      createUploadBlock,
      refreshChannel,
      updateUploadItem,
    ],
  );

  const startUploads = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;

      const uploads = files.map((file) => ({
        file,
        item: {
          fileName: file.name || "Untitled upload",
          fileSize: file.size,
          id: createUploadId(),
          progress: 0,
          status: "queued" as const,
        },
      }));

      setUploadItems((current) => [
        ...uploads.map(({ item }) => item),
        ...current,
      ]);

      void Promise.allSettled(
        uploads.map(({ file, item }) => uploadFile(item.id, file)),
      );
    },
    [uploadFile],
  );

  useEffect(() => {
    if (!enabled) {
      dragDepth.current = 0;
      setIsDraggingFiles(false);
      return;
    }

    const handleDragEnter = (event: DragEvent) => {
      if (!hasDraggedFiles(event)) return;

      event.preventDefault();
      dragDepth.current += 1;
      setIsDraggingFiles(true);
    };

    const handleDragOver = (event: DragEvent) => {
      if (!hasDraggedFiles(event)) return;

      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
    };

    const handleDragLeave = (event: DragEvent) => {
      if (!hasDraggedFiles(event)) return;

      event.preventDefault();
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) {
        setIsDraggingFiles(false);
      }
    };

    const handleDrop = (event: DragEvent) => {
      if (!hasDraggedFiles(event)) return;

      event.preventDefault();
      dragDepth.current = 0;
      setIsDraggingFiles(false);

      const files = event.dataTransfer
        ? Array.from(event.dataTransfer.files)
        : [];
      startUploads(files);
    };

    const handleDragEnd = () => {
      dragDepth.current = 0;
      setIsDraggingFiles(false);
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);
    window.addEventListener("dragend", handleDragEnd);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
      window.removeEventListener("dragend", handleDragEnd);
    };
  }, [enabled, startUploads]);

  const handleClearUploads = () => {
    setUploadItems((current) =>
      hasActiveUploads
        ? current.filter(
            (item) => item.status !== "done" && item.status !== "error",
          )
        : [],
    );
  };

  const uploadProgressContent = (
    <Flex direction="column" gap="3">
      <Flex justify="between" align="start" gap="3">
        <Box>
          <Text as="div" size="2" weight="bold">
            Uploads to / {channelTitle}
          </Text>
          <Text as="div" size="1" color="gray">
            {hasActiveUploads
              ? `${activeCount} active, ${finishedCount} finished`
              : `${finishedCount} finished`}
          </Text>
        </Box>

        <Button
          size="1"
          variant="ghost"
          color="gray"
          onClick={handleClearUploads}
          disabled={hasActiveUploads && !hasFinishedUploads}
        >
          {hasActiveUploads ? "Clear finished" : "Dismiss"}
        </Button>
      </Flex>

      <Flex
        direction="column"
        gap="3"
        style={{ maxHeight: "50vh", overflowY: "auto" }}
      >
        {uploadItems.map((item) => (
          <Box key={item.id}>
            <Flex justify="between" gap="3" mb="1">
              <Flex align="center" gap="2" style={{ minWidth: 0 }}>
                {isActiveUpload(item.status) && <Spinner size="1" />}
                <Text
                  size="2"
                  weight="bold"
                  style={{
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.fileName}
                </Text>
              </Flex>
              <Text size="1" color="gray" style={{ flexShrink: 0 }}>
                {formatBytes(item.fileSize)}
              </Text>
            </Flex>

            <Progress
              value={getVisibleProgress(item)}
              color={getProgressColor(item.status)}
              size="1"
            />

            <Flex justify="between" gap="3" mt="1">
              <Text
                size="1"
                color={item.status === "error" ? "red" : "gray"}
              >
                {getUploadStatusLabel(item)}
              </Text>
              <Text size="1" color="gray">
                {item.progress}%
              </Text>
            </Flex>
          </Box>
        ))}
      </Flex>
    </Flex>
  );

  return (
    <>
      {(isDraggingFiles || uploadItems.length > 0) && (
        <Box
          position="fixed"
          inset="0"
          style={{
            alignItems: "center",
            background: "rgba(255, 255, 255, 0.88)",
            display: "flex",
            justifyContent: "center",
            pointerEvents: isDraggingFiles && uploadItems.length === 0 ? "none" : "auto",
            zIndex: 100,
          }}
        >
          <Card
            size="4"
            style={{ width: isDraggingFiles ? undefined : "min(520px, 90vw)" }}
          >
            {isDraggingFiles ? (
              <Flex direction="column" gap="2" align="center">
                <Text size="5" weight="bold">
                  Drop files to upload
                </Text>
                <Text size="2" color="gray">
                  Add files to / {channelTitle}
                </Text>
              </Flex>
            ) : (
              uploadProgressContent
            )}
          </Card>
        </Box>
      )}
    </>
  );
}
