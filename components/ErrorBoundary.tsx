import React from 'react';

interface Props { children: React.ReactNode; label?: string; fallback?: React.ReactNode }
interface State { hasError: boolean }

/**
 * Generic render-time error boundary. Lets one piece of the page crash
 * without taking the whole React tree down with it. Logs the error to the
 * console with a label so we can identify which boundary tripped.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  declare props: Props;
  declare state: State;
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): State { return { hasError: true }; }
  componentDidCatch(err: unknown) {
    console.warn(`[ErrorBoundary${this.props.label ? `:${this.props.label}` : ''}]`, err);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
