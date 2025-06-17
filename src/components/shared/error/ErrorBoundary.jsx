// src/components/shared/error/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    const { FallbackComponent } = this.props;
    
    if (this.state.hasError) {
      if (FallbackComponent) {
        return <FallbackComponent 
          error={this.state.error} 
          resetErrorBoundary={() => this.setState({ hasError: false, error: null })} 
        />;
      }
      
      // Default fallback UI
      return (
        <div className="flex justify-center items-center h-full min-h-[50vh] p-4">
          <div className="flex flex-col items-center text-center p-6 max-w-md">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-red-500 font-semibold mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4 text-sm">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };