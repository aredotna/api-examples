import { useParams } from 'react-router-dom'
import { ErrorMessage } from '../components/ErrorMessage'
import UserViewer from '../components/UserViewer'

function UserRoute(): JSX.Element {
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return <ErrorMessage error={new Error('No user ID provided')} />
  }

  return <UserViewer userId={id} />
}

export default UserRoute
