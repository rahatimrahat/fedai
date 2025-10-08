import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>; // Optional keys that will trigger reset when changed
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorCount: number;
  lastErrorTime?: number;
}

/**
 * Enhanced Error Boundary with:
 * - Error logging callback
 * - Reset keys support
 * - Error count tracking to prevent infinite loops
 * - Better error display for development
 * - Option to not auto-reload on reset
 */
class ErrorBoundary extends Component<Props, State> {
  private readonly MAX_ERROR_COUNT = 5;
  private readonly ERROR_WINDOW_MS = 10000; // 10 seconds

  public state: State = {
    hasError: false,
    error: undefined,
    errorInfo: undefined,
    errorCount: 0,
    lastErrorTime: undefined
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const now = Date.now();
    const { errorCount, lastErrorTime } = this.state;

    // Reset count if outside error window
    const newErrorCount = lastErrorTime && (now - lastErrorTime) > this.ERROR_WINDOW_MS
      ? 1
      : errorCount + 1;

    console.error('ErrorBoundary caught error:', {
      error: error.toString(),
      errorInfo,
      count: newErrorCount,
      timestamp: new Date().toISOString()
    });

    this.setState({
      errorInfo,
      errorCount: newErrorCount,
      lastErrorTime: now
    });

    // Call optional error callback (e.g., for external logging)
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (callbackError) {
        console.error('Error in onError callback:', callbackError);
      }
    }

    // Log to external service (placeholder)
    this.logErrorToService(error, errorInfo);
  }

  public componentDidUpdate(prevProps: Props) {
    // Reset error state if resetKeys change
    if (this.props.resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );

      if (hasResetKeyChanged && this.state.hasError) {
        this.setState({
          hasError: false,
          error: undefined,
          errorInfo: undefined
        });
      }
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Placeholder for external error logging service
    // In production, integrate with Sentry, LogRocket, etc.

    // Example structure for logging:
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      // Add user ID, session ID, etc. if available
    };

    // Example: Send to logging endpoint
    if (process.env.NODE_ENV === 'production') {
      try {
        fetch('/api/log-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorData)
        }).catch(err => console.error('Failed to log error to service:', err));
      } catch (e) {
        // Silently fail if logging fails
      }
    }
  };

  private handleReset = () => {
    const { errorCount } = this.state;

    // Prevent infinite reload loop
    if (errorCount >= this.MAX_ERROR_COUNT) {
      console.error('Too many errors in quick succession. Not reloading.');
      alert('Multiple errors detected. Please clear your browser cache and try again, or contact support.');
      return;
    }

    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined
    });

    // Option: Reload page (can be disabled via prop)
    // window.location.reload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, errorCount } = this.state;
      const isDevelopment = process.env.NODE_ENV === 'development';
      const isTooManyErrors = errorCount >= this.MAX_ERROR_COUNT;

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            fontFamily: 'Inter, sans-serif',
            backgroundColor: 'var(--neutral-100, #f5f8f3)',
            color: 'var(--text-primary, #2d3748)',
            padding: '20px',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              border: '1px solid var(--border-color-soft, #eee)',
              borderRadius: 'var(--border-radius-md, 16px)',
              padding: '2rem',
              boxShadow: 'var(--glass-shadow, 0 6px 20px rgba(0, 30, 20, 0.1))',
              backgroundColor: 'white'
            }}
          >
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌿💔</div>

            <h1
              style={{
                fontSize: '2rem',
                color: 'var(--status-red, #d32f2f)',
                marginBottom: '1rem'
              }}
            >
              {isTooManyErrors ? 'Critical Error' : 'Oops! Something went wrong'}
            </h1>

            <p
              style={{
                fontSize: '1.1rem',
                marginBottom: '0.5rem',
                color: 'var(--text-secondary, #718096)'
              }}
            >
              {isTooManyErrors
                ? 'Multiple errors detected. Please clear your browser data and try again.'
                : 'An unexpected error occurred. Our team has been notified.'}
            </p>

            <p
              style={{
                fontSize: '1rem',
                marginBottom: '1.5rem',
                color: 'var(--text-secondary, #718096)'
              }}
            >
              {isTooManyErrors
                ? 'If the problem persists, please contact support.'
                : 'Please try again. If the problem persists, contact support.'}
            </p>

            {/* Development mode: Show error details */}
            {isDevelopment && error && (
              <details
                style={{
                  marginBottom: '1.5rem',
                  textAlign: 'left',
                  backgroundColor: 'var(--glass-bg-secondary, rgba(231, 245, 229, 0.8))',
                  padding: '1rem',
                  borderRadius: 'var(--border-radius-sm, 8px)',
                  border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.18))'
                }}
              >
                <summary
                  style={{
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem',
                    color: 'var(--status-red, #d32f2f)'
                  }}
                >
                  Error Details (Development Mode)
                </summary>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary, #718096)',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    margin: 0
                  }}
                >
                  <strong>Error:</strong> {error.toString()}
                  {'\n\n'}
                  <strong>Stack:</strong>
                  {'\n'}
                  {error.stack}
                  {errorInfo?.componentStack && (
                    <>
                      {'\n\n'}
                      <strong>Component Stack:</strong>
                      {'\n'}
                      {errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              {!isTooManyErrors && (
                <button
                  onClick={this.handleReset}
                  style={{
                    padding: '10px 20px',
                    fontSize: '1rem',
                    color: 'var(--text-on-primary, #fff)',
                    backgroundColor: 'var(--primary-500, #4caf50)',
                    border: 'none',
                    borderRadius: 'var(--border-radius-sm, 8px)',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease'
                  }}
                  onMouseOver={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      'var(--primary-900, #2e7d32)')
                  }
                  onMouseOut={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      'var(--primary-500, #4caf50)')
                  }
                >
                  Try Again
                </button>
              )}

              <button
                onClick={this.handleReload}
                style={{
                  padding: '10px 20px',
                  fontSize: '1rem',
                  color: 'var(--text-secondary, #718096)',
                  backgroundColor: 'white',
                  border: '1px solid var(--border-color-soft, #eee)',
                  borderRadius: 'var(--border-radius-sm, 8px)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    'var(--neutral-100, #f5f8f3)';
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'white';
                }}
              >
                Reload Page
              </button>
            </div>

            {/* Error count indicator (dev mode) */}
            {isDevelopment && errorCount > 1 && (
              <p
                style={{
                  marginTop: '1rem',
                  fontSize: '0.875rem',
                  color: 'var(--status-yellow, #f59e0b)'
                }}
              >
                Error count: {errorCount} / {this.MAX_ERROR_COUNT}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
