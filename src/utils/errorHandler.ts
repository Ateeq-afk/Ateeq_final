import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ErrorLogEntry {
  timestamp: string;
  error: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
  userId?: string;
  organizationId?: string;
  branchId?: string;
  additionalInfo?: any;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private errorQueue: ErrorLogEntry[] = [];
  private isOnline = navigator.onLine;

  private constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  async logError(error: Error, componentStack?: string, additionalInfo?: any) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const errorLog: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: user?.id,
      organizationId: user?.user_metadata?.organization_id,
      branchId: user?.user_metadata?.branch_id,
      additionalInfo
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error logged:', errorLog);
    }

    // Add to queue
    this.errorQueue.push(errorLog);

    // Try to send immediately if online
    if (this.isOnline) {
      this.flushErrorQueue();
    }
  }

  private async flushErrorQueue() {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // Send to backend API
      const response = await fetch('/api/error-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ errors })
      });

      if (!response.ok) {
        // Re-add to queue if failed
        this.errorQueue.unshift(...errors);
      }
    } catch (error) {
      // Re-add to queue if failed
      this.errorQueue.unshift(...errors);
      console.error('Failed to send error logs:', error);
    }
  }
}

export const errorLogger = ErrorLogger.getInstance();

// Error types with user-friendly messages
export const ErrorMessages = {
  NETWORK_ERROR: "Unable to connect to the server. Please check your internet connection.",
  AUTH_ERROR: "Authentication failed. Please login again.",
  PERMISSION_ERROR: "You don't have permission to perform this action.",
  VALIDATION_ERROR: "Please check your input and try again.",
  SERVER_ERROR: "Something went wrong on our end. Please try again later.",
  NOT_FOUND: "The requested resource was not found.",
  RATE_LIMIT: "Too many requests. Please slow down and try again.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again."
};

// Error handler utility
export function handleError(error: any, showToast = true): string {
  let message = ErrorMessages.UNKNOWN_ERROR;
  
  // Log the error
  errorLogger.logError(error instanceof Error ? error : new Error(String(error)));

  // Parse different error types
  if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
    message = ErrorMessages.NETWORK_ERROR;
  } else if (error.status === 401 || error.code === 'AUTH_ERROR') {
    message = ErrorMessages.AUTH_ERROR;
  } else if (error.status === 403) {
    message = ErrorMessages.PERMISSION_ERROR;
  } else if (error.status === 404) {
    message = ErrorMessages.NOT_FOUND;
  } else if (error.status === 429) {
    message = ErrorMessages.RATE_LIMIT;
  } else if (error.status >= 500) {
    message = ErrorMessages.SERVER_ERROR;
  } else if (error.message) {
    message = error.message;
  }

  // Show toast notification
  if (showToast) {
    toast.error(message);
  }

  return message;
}

// React Error Boundary error handler
export function logErrorToService(error: Error, errorInfo: any) {
  errorLogger.logError(error, errorInfo.componentStack, {
    errorBoundary: true,
    errorInfo
  });
}

// Global error handlers
export function setupGlobalErrorHandlers() {
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    errorLogger.logError(
      new Error(`Unhandled promise rejection: ${event.reason}`),
      undefined,
      { type: 'unhandledRejection', reason: event.reason }
    );
  });

  // Global errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    errorLogger.logError(
      event.error || new Error(event.message),
      undefined,
      { 
        type: 'globalError', 
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    );
  });
}