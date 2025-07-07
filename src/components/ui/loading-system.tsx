import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Truck, Package, Users, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from './card';
import { Button } from './button';
import { cn } from '@/lib/utils';

// Unified loading spinner component
export function LoadingSpinner({ 
  size = 'default', 
  className = '' 
}: { 
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 className={cn(
      'animate-spin text-blue-600',
      sizeClasses[size],
      className
    )} />
  );
}

// Enhanced skeleton loader with shimmer effect
export function SkeletonLoader({ 
  className = '',
  lines = 1,
  width = 'full'
}: {
  className?: string;
  lines?: number;
  width?: 'full' | 'half' | 'quarter' | string;
}) {
  const widthClasses = {
    full: 'w-full',
    half: 'w-1/2',
    quarter: 'w-1/4'
  };

  const widthClass = typeof width === 'string' && widthClasses[width as keyof typeof widthClasses] 
    ? widthClasses[width as keyof typeof widthClasses]
    : width;

  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            'h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded',
            widthClass
          )}
          animate={{
            backgroundPosition: ['200% 0', '-200% 0'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear'
          }}
          style={{
            backgroundSize: '200% 100%'
          }}
        />
      ))}
    </div>
  );
}

// Page-level loading state
export function PageLoader({ 
  message = 'Loading...',
  icon: Icon = Truck
}: {
  message?: string;
  icon?: React.ComponentType<any>;
}) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="mx-auto w-12 h-12 text-blue-600"
        >
          <Icon className="w-full h-full" />
        </motion.div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">{message}</h3>
          <div className="flex items-center justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-600 rounded-full"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Card skeleton for list views
export function CardSkeleton({ 
  count = 3,
  className = ''
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <SkeletonLoader width="half" />
                <SkeletonLoader width="quarter" />
              </div>
              <div className="w-20 h-8 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Table skeleton
export function TableSkeleton({ 
  rows = 5,
  columns = 4,
  className = ''
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {Array.from({ length: columns }).map((_, i) => (
                  <th key={i} className="px-4 py-3">
                    <SkeletonLoader width="half" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex} className="border-t border-gray-100">
                  {Array.from({ length: columns }).map((_, colIndex) => (
                    <td key={colIndex} className="px-4 py-3">
                      <SkeletonLoader width={colIndex === 0 ? 'half' : 'quarter'} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// Error state component
export function ErrorState({
  title = 'Something went wrong',
  message = 'There was an error loading this content',
  onRetry,
  className = ''
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-center min-h-[300px]', className)}>
      <div className="text-center space-y-4 max-w-md">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mx-auto w-16 h-16 text-red-500"
        >
          <XCircle className="w-full h-full" />
        </motion.div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="text-gray-600">{message}</p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

// Empty state component
export function EmptyState({
  title = 'No data found',
  message = 'There are no items to display',
  action,
  icon: Icon = Package,
  className = ''
}: {
  title?: string;
  message?: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<any>;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-center min-h-[300px]', className)}>
      <div className="text-center space-y-4 max-w-md">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mx-auto w-16 h-16 text-gray-400"
        >
          <Icon className="w-full h-full" />
        </motion.div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="text-gray-600">{message}</p>
        </div>
        {action && (
          <div className="pt-2">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

// Success state component
export function SuccessState({
  title = 'Success!',
  message = 'Operation completed successfully',
  action,
  className = ''
}: {
  title?: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-center min-h-[300px]', className)}>
      <div className="text-center space-y-4 max-w-md">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="mx-auto w-16 h-16 text-green-500"
        >
          <CheckCircle className="w-full h-full" />
        </motion.div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="text-gray-600">{message}</p>
        </div>
        {action && (
          <div className="pt-2">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

// Loading button state
export function LoadingButton({
  loading = false,
  children,
  disabled,
  className = '',
  ...props
}: {
  loading?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  [key: string]: any;
}) {
  return (
    <Button
      disabled={disabled || loading}
      className={cn(loading && 'cursor-not-allowed', className)}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" className="mr-2" />}
      {children}
    </Button>
  );
}

// Form field loading state
export function FieldLoader({ className = '' }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      <SkeletonLoader width="quarter" />
      <div className="h-10 bg-gray-200 rounded border animate-pulse"></div>
    </div>
  );
}

// Inline loading indicator
export function InlineLoader({ 
  message = 'Loading...',
  size = 'sm',
  className = ''
}: {
  message?: string;
  size?: 'sm' | 'default';
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LoadingSpinner size={size} />
      <span className={cn(
        'text-gray-600',
        size === 'sm' ? 'text-sm' : 'text-base'
      )}>
        {message}
      </span>
    </div>
  );
}

// List loading state with count
export function ListLoader({ 
  message = 'Loading items...',
  count,
  className = ''
}: {
  message?: string;
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn('text-center py-8', className)}>
      <LoadingSpinner className="mx-auto mb-3" />
      <p className="text-gray-600">{message}</p>
      {count && (
        <p className="text-sm text-gray-500 mt-1">
          Found {count} items
        </p>
      )}
    </div>
  );
}