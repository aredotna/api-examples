import { useForm } from "react-hook-form";
import {
  Dialog,
  Button,
  Flex,
  Text,
  TextArea,
} from "@radix-ui/themes";
import { useCreateBlock } from "@aredotna/react-query";

interface AddBlockDialogProps {
  channelId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  value: string;
}

const DEFAULT_VALUES: FormData = {
  value: "",
};

export function AddBlockDialog({
  channelId,
  open,
  onOpenChange,
}: AddBlockDialogProps) {
  const { register, handleSubmit, reset, watch } = useForm<FormData>({
    defaultValues: DEFAULT_VALUES,
  });

  const value = watch("value");

  const createBlock = useCreateBlock({
    onSuccess: () => {
      reset();
      onOpenChange(false);
    },
  });

  const onSubmit = (data: FormData) => {
    createBlock.mutate({
      value: data.value.trim(),
      channel_ids: [channelId],
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) reset();
    onOpenChange(newOpen);
  };

  const isValid = value.trim().length > 0;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Content maxWidth="500px">
        <Dialog.Title>Add Block</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Paste a URL or write some text.
        </Dialog.Description>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="3">
            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Content
              </Text>
              <TextArea
                placeholder="Paste a URL or write something..."
                rows={4}
                autoFocus
                {...register("value", { required: true })}
              />
              <Text as="div" size="1" color="gray" mt="1">
                URLs become link/image/embed blocks. Text becomes a text block.
              </Text>
            </label>

            {createBlock.error && (
              <Text color="red" size="2">
                {createBlock.error.message}
              </Text>
            )}
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              type="submit"
              disabled={!isValid || createBlock.isPending}
            >
              {createBlock.isPending ? "Adding..." : "Add Block"}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
