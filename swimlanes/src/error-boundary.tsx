import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Uncaught render error:', error, info.componentStack)
  }

  render() {
    const { error } = this.state

    if (error) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-background px-6">
          <section className="w-full max-w-lg space-y-4 rounded-xl border border-destructive/30 bg-card p-6">
            <h1 className="text-lg font-semibold text-foreground">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <button
              type="button"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
