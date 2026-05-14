import ArenaLogo from '@aredotna/icons/ArenaLogoIcon'
import { Box, Button, Flex } from '@radix-ui/themes'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function HomeRoute(): JSX.Element {
  const { isAuthenticated, isLoading, login, user } = useAuth()

  if (isAuthenticated && user) {
    return <Navigate to={`/user/${user.slug}`} replace />
  }

  return (
    <Flex align="center" justify="center" minHeight="100vh">
      <Button size="3" onClick={login} disabled={isLoading} style={{ gap: 10 }}>
        <Box width="26px" height="16px" position="relative" aria-hidden="true">
          <ArenaLogo />
        </Box>
        {isLoading ? 'Loading...' : 'Log in with Are.na'}
      </Button>
    </Flex>
  )
}

export default HomeRoute
