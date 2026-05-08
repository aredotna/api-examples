import { useCreateChannel } from '@aredotna/react-query'
import { ChannelVisibility, type CreateChannelData } from '@aredotna/sdk/api'
import { Button, Dialog, Flex, Select, Text, TextArea, TextField } from '@radix-ui/themes'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

interface CreateChannelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type CreateChannelRequest = CreateChannelData['body']

const DEFAULT_VALUES: CreateChannelRequest = {
  title: '',
  description: '',
  visibility: ChannelVisibility.CLOSED,
}

export function CreateChannelDialog({ open, onOpenChange }: CreateChannelDialogProps) {
  const navigate = useNavigate()

  const { register, handleSubmit, control, reset, formState } = useForm<CreateChannelRequest>({
    defaultValues: DEFAULT_VALUES,
  })

  const createChannel = useCreateChannel({
    onSuccess: (channel) => {
      reset()
      onOpenChange(false)
      navigate(`/channel/${channel.slug}`)
    },
  })

  const onSubmit = (data: CreateChannelRequest) => {
    createChannel.mutate({
      title: data.title.trim(),
      description: data.description?.trim() || undefined,
      visibility: data.visibility,
    })
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) reset()
    onOpenChange(newOpen)
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Content maxWidth="450px">
        <Dialog.Title>Create New Channel</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Channels are collections of blocks. Give your channel a name and choose its visibility.
        </Dialog.Description>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="3">
            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Title
              </Text>
              <TextField.Root
                placeholder="Channel title"
                autoFocus
                {...register('title', { required: true })}
              />
            </label>

            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Description
              </Text>
              <TextArea
                placeholder="Optional description (supports markdown)"
                rows={3}
                {...register('description')}
              />
            </label>

            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Visibility
              </Text>
              <Controller
                name="visibility"
                control={control}
                render={({ field }) => (
                  <Select.Root value={field.value} onValueChange={field.onChange}>
                    <Select.Trigger style={{ width: '100%' }} />
                    <Select.Content>
                      <Select.Item value={ChannelVisibility.CLOSED}>
                        Closed — Anyone can view, only collaborators can add
                      </Select.Item>
                      <Select.Item value={ChannelVisibility.PUBLIC}>
                        Public — Anyone can view and connect
                      </Select.Item>
                      <Select.Item value={ChannelVisibility.PRIVATE}>
                        Private — Only you and collaborators can view
                      </Select.Item>
                    </Select.Content>
                  </Select.Root>
                )}
              />
            </label>

            {createChannel.error && (
              <Text color="red" size="2">
                {createChannel.error.message}
              </Text>
            )}
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button type="submit" disabled={!formState.isValid || createChannel.isPending}>
              {createChannel.isPending ? 'Creating...' : 'Create Channel'}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  )
}
