import React from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Package, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Apple-style Activity Indicator
export const ActivityIndicator = ({ 
  size = 'default', 
  className,
  color = 'primary' 
}: {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  color?: 'primary' | 'secondary' | 'muted';
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-[1.5px]',
    default: 'w-5 h-5 border-2',
    lg: 'w-6 h-6 border-[2.5px]'
  };

  const colorClasses = {
    primary: 'border-gray-200 dark:border-gray-700 border-t-blue-500',
    secondary: 'border-gray-200 dark:border-gray-700 border-t-gray-500',
    muted: 'border-gray-100 dark:border-gray-800 border-t-gray-400'
  };

  return (
    <div className={cn(
      'inline-block rounded-full animate-spin',
      sizeClasses[size],
      colorClasses[color],
      className
    )} />
  );
};

// Apple-style Dots Indicator
export const DotsIndicator = ({ 
  className,
  color = 'primary' 
}: {
  className?: string;
  color?: 'primary' | 'secondary' | 'muted';
}) => {
  const colorClasses = {
    primary: 'bg-blue-500',
    secondary: 'bg-gray-500',
    muted: 'bg-gray-400'
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn('w-1.5 h-1.5 rounded-full', colorClasses[color])}
          animate={{ 
            scale: [0.8, 1, 0.8],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            delay: i * 0.16,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
};

// Enhanced Skeleton Components
export const Skeleton = ({ 
  className,
  variant = 'default'
}: {
  className?: string;
  variant?: 'default' | 'pulse' | 'wave';
}) => {
  const variantClasses = {
    default: 'skeleton',
    pulse: 'skeleton-pulse',
    wave: 'skeleton-wave'
  };

  return (
    <div className={cn('rounded-xl', variantClasses[variant], className)} />
  );
};

// Metric Card Skeleton
export const MetricCardSkeleton = () => (
  <div className="p-6 rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-800/50">
    <div className="flex items-start justify-between mb-5">
      <Skeleton className="w-12 h-12 rounded-xl" variant="pulse" />
      <Skeleton className="w-16 h-6 rounded-full" variant="wave" />
    </div>
    <div className="space-y-2">
      <Skeleton className="w-20 h-4" variant="wave" />
      <Skeleton className="w-32 h-8" variant="pulse" />
      <Skeleton className="w-24 h-3" variant="wave" />
    </div>
  </div>
);

// Transaction Item Skeleton
export const TransactionSkeleton = () => (
  <div className="flex items-center gap-4 p-4 rounded-xl">
    <Skeleton className="w-11 h-11 rounded-xl" variant="pulse" />
    <div className="flex-1 space-y-2">
      <Skeleton className="w-48 h-4" variant="wave" />
      <div className="flex items-center gap-2">
        <Skeleton className="w-16 h-3" variant="wave" />
        <div className="w-1 h-1 rounded-full bg-gray-300" />
        <Skeleton className="w-20 h-3 rounded-full" variant="wave" />
      </div>
    </div>
    <div className="text-right space-y-1">
      <Skeleton className="w-20 h-5" variant="pulse" />
      <Skeleton className="w-12 h-3" variant="wave" />
    </div>
  </div>
);

// Loading Card with Animation
export const LoadingCard = ({ 
  title = 'Loading...', 
  description,
  children,
  className 
}: {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className={cn(
      'flex flex-col items-center justify-center p-8 rounded-2xl',
      'bg-white dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-800/50',
      'text-center space-y-4',
      className
    )}
  >
    {children || <ActivityIndicator size="lg" />}
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-primary">{title}</h3>
      {description && (
        <p className="text-caption text-tertiary">{description}</p>
      )}
    </div>
  </motion.div>
);

// Apple-style Progress Ring
export const ProgressRing = ({ 
  progress, 
  size = 40, 
  strokeWidth = 3,
  color = 'blue',
  className 
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: 'blue' | 'green' | 'red' | 'purple';
  className?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const colors = {
    blue: '#007AFF',
    green: '#34C759',
    red: '#FF3B30',
    purple: '#AF52DE'
  };

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors[color]}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold text-primary">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};

// Typing Indicator (like Apple Messages)
export const TypingIndicator = ({ className }: { className?: string }) => (
  <div className={cn('flex items-center gap-1', className)}>
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: i * 0.2,
          ease: 'easeInOut',
        }}
      />
    ))}
  </div>
);

// No customers empty state
export const NoCustomers: React.FC<{
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}> = ({ title, description, action }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-20"
  >
    <div className="max-w-md mx-auto">
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="h-32 w-32 mx-auto mb-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-purple-100/50" />
        <Users className="h-16 w-16 text-blue-500 relative z-10" />
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-blue-200/30 rounded-full"
        />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent mb-4">
          {title}
        </h3>
        <p className="text-gray-600 mb-8 leading-relaxed max-w-sm mx-auto">
          {description}
        </p>
        
        {action && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={action.onClick}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all px-8"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              {action.label}
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  </motion.div>
);

// No search results empty state
export const NoSearchResults: React.FC<{
  query: string;
  onClear: () => void;
  suggestions?: string[];
}> = ({ query, onClear, suggestions = [] }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-16"
  >
    <div className="max-w-md mx-auto">
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="h-24 w-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center"
      >
        <Search className="h-12 w-12 text-gray-400" />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No results for "{query}"
        </h3>
        <p className="text-gray-600 mb-6">
          We couldn't find any customers matching your search. Try adjusting your search terms.
        </p>
        
        {suggestions.length > 0 && (
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-sm text-gray-500 mb-3">Suggestions:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                    {suggestion}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            onClick={onClear}
            variant="outline"
            className="border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            Clear search and show all customers
          </Button>
        </motion.div>
      </motion.div>
    </div>
  </motion.div>
);

// No bookings empty state
export const NoBookings: React.FC<{
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}> = ({ title, description, action }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-20"
  >
    <div className="max-w-md mx-auto">
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="h-32 w-32 mx-auto mb-8 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-green-100/50 to-blue-100/50" />
        <Package className="h-16 w-16 text-green-500 relative z-10" />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-green-600 bg-clip-text text-transparent mb-4">
          {title}
        </h3>
        <p className="text-gray-600 mb-8 leading-relaxed max-w-sm mx-auto">
          {description}
        </p>
        
        {action && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={action.onClick}
              size="lg"
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all px-8"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              {action.label}
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  </motion.div>
);

// No articles empty state
export const NoArticles: React.FC<{
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}> = ({ title, description, action }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-20"
  >
    <div className="max-w-md mx-auto">
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="h-32 w-32 mx-auto mb-8 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/50 to-pink-100/50" />
        <Package className="h-16 w-16 text-purple-500 relative z-10" />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-purple-600 bg-clip-text text-transparent mb-4">
          {title}
        </h3>
        <p className="text-gray-600 mb-8 leading-relaxed max-w-sm mx-auto">
          {description}
        </p>
        
        {action && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={action.onClick}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all px-8"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              {action.label}
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  </motion.div>
);