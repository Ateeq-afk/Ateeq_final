import React from 'react';
import { 
  LoadingSpinner, 
  PageLoader, 
  CardSkeleton, 
  TableSkeleton,
  EmptyState,
  SuccessState 
} from './loading-system';
import { ErrorBoundary, InlineError, getErrorType } from './error-system';
import { cn } from '@/lib/utils';

interface AsyncBoundaryProps {
  loading?: boolean;
  error?: any;
  data?: any[];
  children: React.ReactNode;
  
  // Loading customization
  loadingType?: 'spinner' | 'page' | 'cards' | 'table' | 'inline';
  loadingMessage?: string;
  loadingIcon?: React.ComponentType<any>;
  
  // Error customization
  errorType?: 'full' | 'inline' | 'compact';
  onRetry?: () => void;
  onGoHome?: () => void;
  onGoBack?: () => void;
  
  // Empty state customization
  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  emptyIcon?: React.ComponentType<any>;
  
  // Success state
  showSuccess?: boolean;
  successTitle?: string;
  successMessage?: string;
  successAction?: React.ReactNode;
  
  // Layout
  className?: string;
  minHeight?: string;
}

export function AsyncBoundary({
  loading = false,
  error,
  data,
  children,
  
  loadingType = 'spinner',
  loadingMessage,
  loadingIcon,
  
  errorType = 'full',
  onRetry,
  onGoHome,
  onGoBack,
  
  emptyTitle,
  emptyMessage,
  emptyAction,
  emptyIcon,
  
  showSuccess = false,
  successTitle,
  successMessage,
  successAction,
  
  className = '',
  minHeight = 'min-h-[200px]'
}: AsyncBoundaryProps) {
  
  // Loading state
  if (loading) {
    const LoadingComponent = () => {
      switch (loadingType) {
        case 'page':
          return <PageLoader message={loadingMessage} icon={loadingIcon} />;
        case 'cards':
          return <CardSkeleton className={minHeight} />;
        case 'table':
          return <TableSkeleton className={minHeight} />;
        case 'inline':
          return (
            <div className={cn('flex items-center justify-center py-8', minHeight)}>
              <div className="flex items-center gap-2">
                <LoadingSpinner />
                <span className="text-gray-600">{loadingMessage || 'Loading...'}</span>
              </div>
            </div>
          );
        default:
          return (
            <div className={cn('flex items-center justify-center', minHeight)}>
              <LoadingSpinner className="h-8 w-8" />
            </div>
          );
      }
    };

    return (
      <div className={cn(className)}>
        <LoadingComponent />
      </div>
    );
  }
  
  // Error state
  if (error) {
    const ErrorComponent = () => {
      switch (errorType) {
        case 'inline':
          return <InlineError error={error} onRetry={onRetry} />;
        case 'compact':
          return (
            <ErrorBoundary
              error={error}
              onRetry={onRetry}
              onGoHome={onGoHome}
              onGoBack={onGoBack}
              compact
            />
          );
        default:
          return (
            <ErrorBoundary
              error={error}
              onRetry={onRetry}
              onGoHome={onGoHome}
              onGoBack={onGoBack}
            />
          );
      }
    };

    return (
      <div className={cn(className, minHeight)}>
        <ErrorComponent />
      </div>
    );
  }
  
  // Success state (for completed operations)
  if (showSuccess) {
    return (
      <div className={cn(className, minHeight)}>
        <SuccessState
          title={successTitle}
          message={successMessage}
          action={successAction}
        />
      </div>
    );
  }
  
  // Empty state
  if (data && Array.isArray(data) && data.length === 0) {
    return (
      <div className={cn(className, minHeight)}>
        <EmptyState
          title={emptyTitle}
          message={emptyMessage}
          action={emptyAction}
          icon={emptyIcon}
        />
      </div>
    );
  }
  
  // Success state - render children
  return (
    <div className={cn(className)}>
      {children}
    </div>
  );
}

// Specialized versions for common use cases

export function DataTable({
  data,
  loading,
  error,
  onRetry,
  children,
  emptyMessage = 'No records found',
  className = ''
}: {
  data?: any[];
  loading?: boolean;
  error?: any;
  onRetry?: () => void;
  children: React.ReactNode;
  emptyMessage?: string;
  className?: string;
}) {
  return (
    <AsyncBoundary
      loading={loading}
      error={error}
      data={data}
      loadingType="table"
      errorType="compact"
      onRetry={onRetry}
      emptyMessage={emptyMessage}
      className={className}
    >
      {children}
    </AsyncBoundary>
  );
}

export function DataCards({
  data,
  loading,
  error,
  onRetry,
  children,
  emptyMessage = 'No items found',
  emptyAction,
  className = ''
}: {
  data?: any[];
  loading?: boolean;
  error?: any;
  onRetry?: () => void;
  children: React.ReactNode;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  className?: string;
}) {
  return (
    <AsyncBoundary
      loading={loading}
      error={error}
      data={data}
      loadingType="cards"
      errorType="compact"
      onRetry={onRetry}
      emptyMessage={emptyMessage}
      emptyAction={emptyAction}
      className={className}
    >
      {children}
    </AsyncBoundary>
  );
}

export function PageContent({
  loading,
  error,
  onRetry,
  onGoHome,
  children,
  loadingMessage = 'Loading page...',
  className = ''
}: {
  loading?: boolean;
  error?: any;
  onRetry?: () => void;
  onGoHome?: () => void;
  children: React.ReactNode;
  loadingMessage?: string;
  className?: string;
}) {
  return (
    <AsyncBoundary
      loading={loading}
      error={error}
      loadingType="page"
      loadingMessage={loadingMessage}
      errorType="full"
      onRetry={onRetry}
      onGoHome={onGoHome}
      className={className}
      minHeight="min-h-[400px]"
    >
      {children}
    </AsyncBoundary>
  );
}

// Form submission wrapper
export function FormSubmission({
  submitting,
  submitted,
  error,
  onRetry,
  children,
  successTitle = 'Success!',
  successMessage = 'Your changes have been saved',
  successAction,
  className = ''
}: {
  submitting?: boolean;
  submitted?: boolean;
  error?: any;
  onRetry?: () => void;
  children: React.ReactNode;
  successTitle?: string;
  successMessage?: string;
  successAction?: React.ReactNode;
  className?: string;
}) {
  return (
    <AsyncBoundary
      loading={submitting}
      error={error}
      showSuccess={submitted}
      loadingType="inline"
      loadingMessage="Saving..."
      errorType="inline"
      onRetry={onRetry}
      successTitle={successTitle}
      successMessage={successMessage}
      successAction={successAction}
      className={className}
    >
      {children}
    </AsyncBoundary>
  );
}