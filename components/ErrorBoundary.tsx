
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined,
    errorInfo: undefined,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
    // You could log this to an external service here
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    // Potentially attempt to reload or navigate to a safe route
    window.location.reload(); 
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '100vh', 
            fontFamily: 'Inter, sans-serif', // Ensure consistent font
            backgroundColor: 'var(--neutral-100, #f5f8f3)',
            color: 'var(--text-primary, #2d3748)',
            padding: '20px',
            textAlign: 'center',
            border: '1px solid var(--border-color-soft, #eee)',
            borderRadius: 'var(--border-radius-md, 16px)',
            margin: '20px',
            boxShadow: 'var(--glass-shadow, 0 6px 20px rgba(0, 30, 20, 0.1))'
        }}>
          <h1 style={{ fontSize: '2rem', color: 'var(--status-red, #d32f2f)', marginBottom: '1rem' }}>
            Oops! Something went wrong.
          </h1>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-secondary, #718096)' }}>
            An unexpected error occurred. We've logged the details.
          </p>
          <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-secondary, #718096)' }}>
            Please try refreshing the page. If the problem persists, you may contact support.
          </p>
          {/* 
            The detailed error is logged to the console via componentDidCatch.
            We avoid showing it directly to the user unless it's a development environment.
            For development, one might conditionally render this:
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  wordBreak: 'break-all', 
                  background: 'var(--glass-bg-secondary, rgba(231, 245, 229, 0.8))',
                  border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.18))',
                  padding: '1rem',
                  borderRadius: 'var(--border-radius-sm, 8px)',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  textAlign: 'left',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary, #718096)',
                  marginBottom: '1.5rem',
                  width: '100%',
                  maxWidth: '600px'
              }}>
                  {this.state.error.toString()}
                  <br />
                  {this.state.errorInfo?.componentStack}
              </pre>
            )}
          */}
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
              transition: 'background-color 0.3s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary-900, #2e7d32)')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary-500, #4caf50)')}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
