import { useParams } from 'react-router-dom'
import { ErrorMessage } from '../components/ErrorMessage'
import GroupViewer from '../components/GroupViewer'

function GroupRoute(): JSX.Element {
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return <ErrorMessage error={new Error('No group ID provided')} />
  }

  return <GroupViewer groupId={id} />
}

export default GroupRoute
