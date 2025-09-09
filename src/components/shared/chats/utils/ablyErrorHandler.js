// src/components/shared/chats/utils/ablyErrorHandler.js - Global Error Handler for Ably

/**
 * Global error handler for Ably uncaught promise rejections
 * This prevents "Connection closed" errors from appearing as uncaught exceptions
 */

// Track if handler is already installed
let isHandlerInstalled = false;

// Ably error patterns to catch
const ABLY_ERROR_PATTERNS = [
  'Connection closed',
  'Connection failed',
  'Connection suspended',
  'Channel detached',
  'Channel failed',
  'Token expired',
  'Authentication failed'
];

// Check if error is from Ably
const isAblyError = (error) => {
  if (!error) return false;
  
  const errorMessage = error.message || error.toString();
  return ABLY_ERROR_PATTERNS.some(pattern => 
    errorMessage.includes(pattern)
  );
};

// Global unhandled promise rejection handler
const handleUnhandledRejection = (event) => {
  const error = event.reason;
  
  // Check if this is an Ably-related error
  if (isAblyError(error)) {
    console.warn(
      '%c[ABLY-ERROR-HANDLER] Caught uncaught Ably promise rejection:',
      'color: #FFB74D; font-weight: bold;',
      error
    );
    
    // Prevent the error from appearing as uncaught
    event.preventDefault();
    
    // Optional: Log to external error tracking service
    // errorTracker.captureException(error, { context: 'ably-cleanup' });
    
    return;
  }
  
  // Let other errors bubble up normally
};

// Install the global error handler
export const installAblyErrorHandler = () => {
  if (isHandlerInstalled || typeof window === 'undefined') {
    return;
  }
  
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
  isHandlerInstalled = true;
  
  console.log(
    '%c[ABLY-ERROR-HANDLER] Global Ably error handler installed',
    'color: #66BB6A; font-weight: bold;'
  );
};

// Remove the global error handler
export const removeAblyErrorHandler = () => {
  if (!isHandlerInstalled || typeof window === 'undefined') {
    return;
  }
  
  window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  isHandlerInstalled = false;
  
  console.log(
    '%c[ABLY-ERROR-HANDLER] Global Ably error handler removed',
    'color: #9E9E9E; font-weight: bold;'
  );
};

// React hook to manage the error handler lifecycle
export const useAblyErrorHandler = () => {
  React.useEffect(() => {
    installAblyErrorHandler();
    
    return () => {
      // Don't remove on component unmount - keep it global
      // removeAblyErrorHandler();
    };
  }, []);
};

// Auto-install when this module is imported
if (typeof window !== 'undefined') {
  installAblyErrorHandler();
}

export default {
  installAblyErrorHandler,
  removeAblyErrorHandler,
  useAblyErrorHandler,
  isAblyError
};