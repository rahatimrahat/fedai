// utils/errorHandler.ts

/**
 * Standardized error handling utility for the Fedai application
 */

export interface FedaiError {
  message: string;
  code?: string;
  details?: string;
  originalError?: Error;
}

/**
 * Creates a standardized error object
 * @param message - User-friendly error message
 * @param code - Error code for categorization
 * @param details - Additional technical details
 * @param originalError - Original error object if available
 * @returns Standardized error object
 */
export function createError(
  message: string,
  code?: string,
  details?: string,
  originalError?: Error
): FedaiError {
  return {
    message,
    code,
    details,
    originalError
  };
}

/**
 * Handles API errors and converts them to standardized format
 * @param error - Error object from API call
 * @param defaultErrorMessage - Default message if none provided by API
 * @returns Standardized error object
 */
export function handleApiError(error: any, defaultErrorMessage: string): FedaiError {
  let message = defaultErrorMessage;
  let code: string | undefined;
  let details: string | undefined;

  if (error instanceof Error) {
    message = error.message;
    
    // Handle specific error types
    if (error.name === 'AbortError') {
      message = 'Request timed out. Please try again.';
      code = 'TIMEOUT_ERROR';
    } else if (error.message.toLowerCase().includes('failed to fetch')) {
      message = 'Network error. Please check your connection and try again.';
      code = 'NETWORK_ERROR';
    } else if (error.message.toLowerCase().includes('rate limit')) {
      message = 'Too many requests. Please wait a moment and try again.';
      code = 'RATE_LIMIT_ERROR';
    }
  } else if (typeof error === 'string') {
    message = error;
  } else if (error && typeof error === 'object') {
    // Handle API response errors
    if (error.error) {
      message = typeof error.error === 'string' ? error.error : defaultErrorMessage;
    }
    if (error.errorKey) {
      code = error.errorKey;
    }
    if (error.details) {
      details = error.details;
    }
  }

  return createError(message, code, details, error instanceof Error ? error : undefined);
}

/**
 * Logs error information for debugging
 * @param error - Error object to log
 * @param context - Context where error occurred
 */
export function logError(error: FedaiError, context: string): void {
  console.error(`[Fedai Error] ${context}:`, {
    message: error.message,
    code: error.code,
    details: error.details,
    originalError: error.originalError
  });
}

/**
 * Converts error to user-friendly message
 * @param error - Error object
 * @returns User-friendly message string
 */
export function getErrorMessage(error: FedaiError | Error | string): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return error.message || 'An unknown error occurred';
}
