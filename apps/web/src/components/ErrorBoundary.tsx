import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/20 rounded-xl p-8 max-w-xl w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mb-2">Something went wrong</h1>
            <p className="text-slate-400 mb-6">
              An unexpected error occurred in this view.
            </p>
            {this.state.error && (
              <div className="bg-slate-950 rounded p-4 text-left mb-6 overflow-auto max-h-48 border border-slate-800">
                <code className="text-red-400 text-sm whitespace-pre-wrap font-mono">
                  {this.state.error.message}
                </code>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
