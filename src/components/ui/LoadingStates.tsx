import React from 'react';
import { motion } from 'framer-motion';
import { 
  Loader2, 
  Search, 
  Package, 
  Users, 
  FileText,
  Activity,
  Zap
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Apple-inspired loading spinner
export const AppleSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={`${sizeClasses[size]} ${className}`}
    >
      <div className="w-full h-full rounded-full border-2 border-gray-200 border-t-blue-500" />
    </motion.div>
  );
};

// Full page loading with Apple design
export const FullPageLoader: React.FC<{ message?: string }> = ({ message = "Loading..." }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6 text-center max-w-sm"
    >
      <div className="relative">
        <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-100 to-blue-200" />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 h-20 w-20 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-400"
        />
      </div>
      <div>
        <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent mb-2">
          {message}
        </h3>
        <p className="text-sm text-gray-500">Please wait while we prepare your experience</p>
      </div>
    </motion.div>
  </div>
);

// Section loading component
export const SectionLoader: React.FC<{ message?: string; className?: string }> = ({ 
  message = "Loading...", 
  className = "" 
}) => (
  <div className={`flex items-center justify-center p-12 ${className}`}>
    <div className="flex flex-col items-center gap-4">
      <AppleSpinner size="lg" />
      <p className="text-sm text-gray-600 font-medium">{message}</p>
    </div>
  </div>
);

// Card skeleton with Apple design
export const CardSkeleton: React.FC = () => (
  <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
    <CardContent className="p-6">
      <div className="flex items-start gap-4 mb-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
      </div>
    </CardContent>
  </Card>
);

// Table row skeleton
export const TableRowSkeleton: React.FC = () => (
  <tr className="border-b border-gray-100">
    {Array.from({ length: 6 }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <Skeleton className="h-4 w-full" />
      </td>
    ))}
  </tr>
);

// Empty state with search illustration
export const EmptySearchState: React.FC<{ 
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
      <div className="h-24 w-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
        <Search className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No results for "{query}"
      </h3>
      <p className="text-gray-600 mb-6">
        We couldn't find any matches. Try adjusting your search terms.
      </p>
      
      {suggestions.length > 0 && (
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-3">Try searching for:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors"
                onClick={() => {/* Handle suggestion click */}}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <button
        onClick={onClear}
        className="text-blue-600 hover:text-blue-700 font-medium"
      >
        Clear search and show all
      </button>
    </div>
  </motion.div>
);

// Empty state for lists
export const EmptyListState: React.FC<{ 
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  icon?: React.ReactNode;
}> = ({ title, description, action, icon }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-20"
  >
    <div className="max-w-md mx-auto">
      <div className="h-32 w-32 mx-auto mb-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
        {icon || <Package className="h-16 w-16 text-blue-500" />}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600 mb-8 leading-relaxed">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  </motion.div>
);

// Error state component
export const ErrorState: React.FC<{ 
  title?: string;
  description?: string;
  onRetry?: () => void;
}> = ({ 
  title = "Something went wrong",
  description = "We encountered an error while loading this content.",
  onRetry
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-16"
  >
    <div className="max-w-md mx-auto">
      <div className="h-20 w-20 mx-auto mb-6 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
        <Zap className="h-10 w-10 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
        >
          Try Again
        </button>
      )}
    </div>
  </motion.div>
);

// Activity indicator for real-time updates
export const ActivityIndicator: React.FC<{ isActive: boolean; label?: string }> = ({ 
  isActive, 
  label = "Live updates" 
}) => (
  <div className="flex items-center gap-2 text-xs text-gray-500">
    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
    <span>{label}</span>
  </div>
);

// Progress indicator
export const ProgressIndicator: React.FC<{ 
  progress: number; 
  label?: string;
  className?: string; 
}> = ({ progress, label, className = "" }) => (
  <div className={`space-y-2 ${className}`}>
    {label && <p className="text-sm font-medium text-gray-700">{label}</p>}
    <div className="w-full bg-gray-200 rounded-full h-2">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
      />
    </div>
    <p className="text-xs text-gray-500 text-right">{Math.round(progress)}%</p>
  </div>
);

// Metric card skeleton
export const MetricCardSkeleton: React.FC = () => (
  <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-6 w-16" />
      </div>
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-4 w-32" />
    </CardContent>
  </Card>
);

export default {
  AppleSpinner,
  FullPageLoader,
  SectionLoader,
  CardSkeleton,
  TableRowSkeleton,
  EmptySearchState,
  EmptyListState,
  ErrorState,
  ActivityIndicator,
  ProgressIndicator,
  MetricCardSkeleton
};