import { useBlockComments, useCreateBlockComment, useDeleteComment } from '@aredotna/react-query'
import type { Comment } from '@aredotna/sdk/api'
import { ChatBubbleIcon, TrashIcon } from '@radix-ui/react-icons'
import {
  Avatar,
  Box,
  Button,
  Card,
  Flex,
  Heading,
  IconButton,
  Link,
  Text,
  TextArea,
} from '@radix-ui/themes'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link as RouterLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ErrorMessage } from './ErrorMessage'
import { LoadingIndicator } from './LoadingIndicator'
import Pagination from './Pagination'

interface BlockCommentsProps {
  blockId: number
}

interface CommentItemProps {
  comment: Comment
  onDelete?: (commentId: number) => void
  isDeleting?: boolean
  canDelete?: boolean
}

function CommentItem({ comment, onDelete, isDeleting, canDelete }: CommentItemProps): JSX.Element {
  const userHref = `/user/${comment.user.slug}`

  return (
    <Card size="1">
      <Flex direction="column" gap="2">
        <Flex justify="between" align="start">
          <Flex gap="2" align="center">
            <Link asChild>
              <RouterLink to={userHref}>
                <Avatar
                  src={comment.user.avatar || undefined}
                  fallback={comment.user.initials}
                  size="1"
                />
              </RouterLink>
            </Link>

            <Flex direction="column" gap="0">
              <Link asChild size="2" weight="medium">
                <RouterLink to={userHref}>{comment.user.name}</RouterLink>
              </Link>
              <Text size="1" color="gray">
                {new Date(comment.created_at).toLocaleString()}
              </Text>
            </Flex>
          </Flex>

          {canDelete && onDelete && (
            <IconButton
              size="1"
              variant="ghost"
              color="red"
              onClick={() => onDelete(comment.id)}
              disabled={isDeleting}
            >
              <TrashIcon />
            </IconButton>
          )}
        </Flex>

        {comment.body && <Text size="2" dangerouslySetInnerHTML={{ __html: comment.body.html }} />}
      </Flex>
    </Card>
  )
}

interface CommentFormData {
  body: string
}

const DEFAULT_VALUES: CommentFormData = {
  body: '',
}

interface AddCommentFormProps {
  onSubmit: (body: string) => void
  isSubmitting: boolean
}

function AddCommentForm({ onSubmit, isSubmitting }: AddCommentFormProps): JSX.Element {
  const { register, handleSubmit, reset, watch } = useForm<CommentFormData>({
    defaultValues: DEFAULT_VALUES,
  })

  const body = watch('body')

  const onFormSubmit = (data: CommentFormData) => {
    onSubmit(data.body.trim())
    reset()
  }

  const isValid = body.trim().length > 0

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <Flex direction="column" gap="2">
        <TextArea
          placeholder="Write a comment..."
          disabled={isSubmitting}
          {...register('body', { required: true })}
        />
        <Flex justify="end">
          <Button type="submit" disabled={!isValid || isSubmitting}>
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </Flex>
      </Flex>
    </form>
  )
}

function BlockComments({ blockId }: BlockCommentsProps): JSX.Element {
  const { user } = useAuth()
  const [currentPage, setCurrentPage] = useState(1)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const {
    data: commentsResponse,
    isLoading,
    error,
  } = useBlockComments(blockId, {
    page: currentPage,
    per: 10,
  })

  const createComment = useCreateBlockComment()
  const deleteComment = useDeleteComment()

  const handleAddComment = (body: string) => {
    createComment.mutate({ blockId, body: { body } })
  }

  const handleDeleteComment = (commentId: number) => {
    setDeletingId(commentId)
    deleteComment.mutate(
      { id: commentId },
      {
        onSettled: () => setDeletingId(null),
      },
    )
  }

  if (isLoading) {
    return <LoadingIndicator message="Loading comments..." />
  }

  if (error) {
    return <ErrorMessage error={error} />
  }

  const comments = commentsResponse?.data ?? []
  const meta = commentsResponse?.meta
  const totalCount = meta?.total_count ?? 0

  return (
    <Box>
      <Flex direction="column" gap="3">
        <Flex gap="2" align="center">
          <ChatBubbleIcon />
          <Heading size="3">
            {totalCount} Comment{totalCount === 1 ? '' : 's'}
          </Heading>
        </Flex>

        {user && (
          <AddCommentForm onSubmit={handleAddComment} isSubmitting={createComment.isPending} />
        )}

        {comments.length > 0 && (
          <Flex direction="column" gap="2">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onDelete={handleDeleteComment}
                isDeleting={deletingId === comment.id}
                canDelete={user?.id === comment.user.id}
              />
            ))}
          </Flex>
        )}

        {comments.length === 0 && !user && (
          <Text size="2" color="gray">
            No comments yet.
          </Text>
        )}

        {comments.length === 0 && user && (
          <Text size="2" color="gray">
            Be the first to comment.
          </Text>
        )}

        {meta && totalCount > 10 && (
          <Pagination meta={meta} onPageChange={(page) => setCurrentPage(page)} />
        )}
      </Flex>
    </Box>
  )
}

export default BlockComments
