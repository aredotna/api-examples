import { ArenaProvider } from '@aredotna/react-query'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { createArenaClient } from './api/client'
import { Toaster } from './components/ui/sonner'
import { TooltipProvider } from './components/ui/tooltip'
import { ErrorBoundary } from './error-boundary'
import './index.css'

document.documentElement.classList.add('dark')

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

const arena = createArenaClient()
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Missing root element')
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ArenaProvider arena={arena}>
        <ErrorBoundary>
          <TooltipProvider>
            <App />
            <Toaster position="bottom-right" richColors />
          </TooltipProvider>
        </ErrorBoundary>
      </ArenaProvider>
    </QueryClientProvider>
  </StrictMode>,
)
