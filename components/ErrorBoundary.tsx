import React from 'react';

interface Props {
  children: React.ReactNode;
  label?: string;
  fallback?: React.ReactNode;
  /** When true, renders the captured error message inline in the fallback */
  showError?: boolean;
}
interface State { hasError: boolean; errorText: string }

/**
 * Generic render-time error boundary. Lets one piece of the page crash
 * without taking the whole React tree down with it. Optionally surfaces the
 * caught error text directly into the DOM so users on phones can screenshot
 * it for debugging.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  declare props: Props;
  declare state: State;
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorText: '' };
  }
  static getDerivedStateFromError(err: unknown): State {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    return { hasError: true, errorText: msg };
  }
  componentDidCatch(err: unknown, info: React.ErrorInfo) {
    console.warn(`[ErrorBoundary${this.props.label ? `:${this.props.label}` : ''}]`, err, info);
  }
  render() {
    if (this.state.hasError) {
      if (this.props.showError) {
        return (
          <div className="h-[100dvh] overflow-y-auto p-6 bg-[#f9f7f4] text-slate-800">
            <div className="max-w-md mx-auto pt-10">
              <p className="font-serif text-xl text-[#194f4c] mb-3">Something tripped up the page</p>
              <p className="text-sm text-slate-600 mb-4">
                Take a screenshot of everything below and the URL — it'll help us debug.
              </p>
              <pre className="text-[11px] text-[#ac3d29] bg-white p-3 rounded-lg border border-slate-200 whitespace-pre-wrap break-words mb-4">
                {this.state.errorText || '(no error message captured)'}
              </pre>
              <p className="text-[11px] text-slate-500 mb-4">
                Stack info also logged to Safari Web Inspector / browser console.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2 rounded-full bg-[#194f4c] text-white text-sm font-bold"
              >
                Reload
              </button>
            </div>
          </div>
        );
      }
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
