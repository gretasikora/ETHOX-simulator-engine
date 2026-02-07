import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-aurora-bg0 p-4">
          <div className="max-w-lg rounded-lg border border-aurora-danger/50 bg-aurora-surface1 p-6">
            <h2 className="text-lg font-semibold text-red-400">Something went wrong</h2>
            <p className="mt-2 text-sm text-aurora-text1">{this.state.error.message}</p>
            <pre className="mt-3 max-h-40 overflow-auto rounded bg-aurora-surface0 p-2 text-xs text-aurora-text2">
              {this.state.error.stack}
            </pre>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-4 rounded bg-accent px-4 py-2 text-sm text-white hover:bg-accent-light"
            >
              Dismiss
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
