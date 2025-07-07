import React from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  ArrowLeft, 
  Wifi, 
  Server, 
  Lock,
  Clock,
  XCircle,
  AlertCircle,
  InfoIcon
} from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { cn } from '@/lib/utils';

// Error types with specific handling
export type ErrorType = 
  | 'network' 
  | 'server' 
  | 'authentication' 
  | 'authorization' 
  | 'validation' 
  | 'timeout'
  | 'not-found'
  | 'generic';

interface ErrorConfig {
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  title: string;
  suggestions: string[];
}

const ERROR_CONFIGS: Record<ErrorType, ErrorConfig> = {
  network: {
    icon: Wifi,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    title: 'Network Connection Error',
    suggestions: [
      'Check your internet connection',
      'Try refreshing the page',
      'Contact support if the problem persists'
    ]
  },
  server: {
    icon: Server,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    title: 'Server Error',
    suggestions: [
      'The server is experiencing issues',
      'Please try again in a few minutes',
      'Contact support if the error continues'
    ]
  },
  authentication: {
    icon: Lock,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    title: 'Authentication Required',
    suggestions: [
      'Please log in to continue',
      'Your session may have expired',
      'Check your credentials and try again'
    ]
  },
  authorization: {
    icon: Lock,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    title: 'Access Denied',
    suggestions: [
      'You don\'t have permission for this action',
      'Contact your administrator',
      'Try logging in with different credentials'
    ]
  },
  validation: {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200',
    title: 'Validation Error',
    suggestions: [
      'Please check the required fields',
      'Ensure all data is in the correct format',
      'Fix the highlighted errors and try again'
    ]
  },
  timeout: {
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    title: 'Request Timeout',
    suggestions: [
      'The request took too long to complete',
      'Try again with a smaller dataset',
      'Check your internet connection'
    ]
  },
  'not-found': {
    icon: XCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200',
    title: 'Not Found',
    suggestions: [
      'The requested item could not be found',
      'It may have been deleted or moved',
      'Check the URL and try again'
    ]
  },
  generic: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    title: 'Something went wrong',
    suggestions: [
      'An unexpected error occurred',
      'Please try again',
      'Contact support if the problem persists'
    ]
  }
};

// Determine error type from error object
export function getErrorType(error: any): ErrorType {
  if (!error) return 'generic';
  
  const message = error.message?.toLowerCase() || '';
  const status = error.status || error.response?.status;
  
  if (status === 401) return 'authentication';
  if (status === 403) return 'authorization';
  if (status === 404) return 'not-found';
  if (status === 408 || message.includes('timeout')) return 'timeout';
  if (status >= 500) return 'server';
  if (status === 422 || message.includes('validation')) return 'validation';
  if (message.includes('network') || message.includes('fetch')) return 'network';
  
  return 'generic';
}

// Main error boundary component
export function ErrorBoundary({
  error,
  onRetry,
  onGoHome,
  onGoBack,
  className = '',
  compact = false
}: {
  error: any;
  onRetry?: () => void;
  onGoHome?: () => void;
  onGoBack?: () => void;
  className?: string;
  compact?: boolean;
}) {
  const errorType = getErrorType(error);
  const config = ERROR_CONFIGS[errorType];
  const Icon = config.icon;

  if (compact) {
    return (
      <Card className={cn('border-l-4 border-l-red-500', className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Icon className={cn('h-5 w-5', config.color)} />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{config.title}</h4>
              <p className="text-sm text-gray-600 mt-1">
                {error.message || 'An error occurred'}
              </p>
            </div>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('flex items-center justify-center min-h-[400px] p-6', className)}>
      <Card className={cn('max-w-md w-full', config.bgColor)}>
        <CardHeader className="text-center pb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn('mx-auto w-16 h-16 mb-4', config.color)}
          >
            <Icon className="w-full h-full" />
          </motion.div>
          <CardTitle className="text-xl text-gray-900">
            {config.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error.message && (
            <div className="p-3 bg-white rounded border">
              <p className="text-sm text-gray-700 font-mono">
                {error.message}
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">What you can try:</h4>
            <ul className="space-y-1">
              {config.suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-gray-400 mt-1">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            {onRetry && (
              <Button onClick={onRetry} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            {onGoBack && (
              <Button variant="outline" onClick={onGoBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            )}
            {onGoHome && (
              <Button variant="outline" onClick={onGoHome}>
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Inline error display
export function InlineError({
  error,
  onRetry,
  className = ''
}: {
  error: any;
  onRetry?: () => void;
  className?: string;
}) {
  const errorType = getErrorType(error);
  const config = ERROR_CONFIGS[errorType];
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-2 p-3 rounded border border-red-200 bg-red-50', className)}>
      <Icon className="h-4 w-4 text-red-600 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-red-700">
          {error.message || config.title}
        </p>
      </div>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry} className="text-red-600 hover:text-red-700">
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

// Toast-style error notification
export function ErrorToast({
  error,
  onDismiss,
  onRetry,
  className = ''
}: {
  error: any;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
}) {
  const errorType = getErrorType(error);
  const config = ERROR_CONFIGS[errorType];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={cn(
        'fixed bottom-4 right-4 z-50 max-w-sm w-full',
        'bg-white border border-red-200 rounded-lg shadow-lg',
        className
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', config.color)} />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 text-sm">
              {config.title}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {error.message || 'An error occurred'}
            </p>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {onRetry && (
          <div className="mt-3 flex justify-end">
            <Button variant="outline" size="sm" onClick={onRetry}>
              Try Again
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Form field error
export function FieldError({
  error,
  className = ''
}: {
  error?: string;
  className?: string;
}) {
  if (!error) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={cn('flex items-center gap-1 mt-1', className)}
    >
      <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
      <p className="text-xs text-red-600">{error}</p>
    </motion.div>
  );
}

// Error list for multiple errors
export function ErrorList({
  errors,
  onDismiss,
  className = ''
}: {
  errors: string[];
  onDismiss?: (index: number) => void;
  className?: string;
}) {
  if (errors.length === 0) return null;

  return (
    <Card className={cn('border-red-200 bg-red-50', className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h4 className="font-medium text-red-900">
            {errors.length === 1 ? 'Error' : `${errors.length} Errors`}
          </h4>
        </div>
        <ul className="space-y-2">
          {errors.map((error, index) => (
            <li key={index} className="flex items-start justify-between gap-2">
              <span className="text-sm text-red-700">{error}</span>
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDismiss(index)}
                  className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                >
                  <XCircle className="h-3 w-3" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// Status badge for different states
export function StatusBadge({
  status,
  className = ''
}: {
  status: 'loading' | 'success' | 'error' | 'warning' | 'info';
  className?: string;
}) {
  const configs = {
    loading: { color: 'bg-blue-100 text-blue-700', label: 'Loading' },
    success: { color: 'bg-green-100 text-green-700', label: 'Success' },
    error: { color: 'bg-red-100 text-red-700', label: 'Error' },
    warning: { color: 'bg-yellow-100 text-yellow-700', label: 'Warning' },
    info: { color: 'bg-gray-100 text-gray-700', label: 'Info' }
  };

  const config = configs[status];

  return (
    <Badge className={cn(config.color, 'text-xs', className)}>
      {config.label}
    </Badge>
  );
}