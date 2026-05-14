import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Uncaught render error:', error, info.componentStack)
  }

  override render(): ReactNode {
    const { error } = this.state

    if (error) {
      return (
        <main className="explorer-error-boundary" role="alert">
          <section className="explorer-error-boundary__panel">
            <h1>Uncaught Error</h1>
            <pre>{`Uncaught Error: ${error.message}`}</pre>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
