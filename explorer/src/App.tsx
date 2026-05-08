import ArenaLogo from '@aredotna/icons/ArenaLogoIcon'
import { ArenaProvider } from '@aredotna/react-query'
import { createArena } from '@aredotna/sdk'
import { Box, Container, Flex, Link, Theme } from '@radix-ui/themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Link as RouterLink, Routes } from 'react-router-dom'
import { UserMenu } from './components/UserMenu'
import { createArenaOptions } from './config/api'
import { AuthProvider } from './contexts/AuthContext'
import { getStoredAccessToken } from './lib/authStorage'
import {
  BlockRoute,
  ChannelRoute,
  GroupRoute,
  HomeRoute,
  NotFoundRoute,
  OAuthCallbackRoute,
  SearchRoute,
  UserContentsRoute,
  UserFollowersRoute,
  UserFollowingRoute,
  UserRoute,
} from './routes'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

const arena = createArena(
  createArenaOptions({
    token: async () => getStoredAccessToken() ?? undefined,
  }),
)

function App(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <ArenaProvider arena={arena}>
        <Theme>
          <BrowserRouter>
            <AuthProvider>
              <Box asChild>
                <header>
                  <Container p="4">
                    <Flex justify="between" align="center">
                      <Link asChild>
                        <RouterLink to="/">
                          <Box width="32.5px" height="20px" position="relative">
                            <ArenaLogo />
                          </Box>
                        </RouterLink>
                      </Link>
                      <UserMenu />
                    </Flex>
                  </Container>
                </header>
              </Box>

              <Container pb="9" asChild>
                <main>
                  <Routes>
                    <Route path="/" element={<HomeRoute />} />
                    <Route path="/search" element={<SearchRoute />} />
                    <Route path="/block/:id" element={<BlockRoute />} />
                    <Route path="/channel/:id" element={<ChannelRoute />} />
                    <Route path="/user/:id" element={<UserRoute />}>
                      <Route index element={<UserContentsRoute />} />
                      <Route path="followers" element={<UserFollowersRoute />} />
                      <Route path="following" element={<UserFollowingRoute />} />
                    </Route>
                    <Route path="/group/:id" element={<GroupRoute />} />
                    <Route path="/oauth/callback" element={<OAuthCallbackRoute />} />
                    <Route path="*" element={<NotFoundRoute />} />
                  </Routes>
                </main>
              </Container>
            </AuthProvider>
          </BrowserRouter>
        </Theme>
      </ArenaProvider>
    </QueryClientProvider>
  )
}

export default App
