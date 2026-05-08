import { useState } from 'react'
import { useParams } from 'react-router-dom'
import UserFollowers from '../components/UserFollowers'

const PER = 25

function UserFollowersRoute(): JSX.Element | null {
  const { id: userId } = useParams<{ id: string }>()
  const [currentPage, setCurrentPage] = useState(1)

  if (!userId) return null

  return (
    <UserFollowers
      userId={userId}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      per={PER}
    />
  )
}

export default UserFollowersRoute
