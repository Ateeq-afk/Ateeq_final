import React from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Package, 
  FileText, 
  Users, 
  TrendingUp, 
  Wifi, 
  AlertCircle,
  Plus,
  RefreshCw,
  Inbox,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Apple-inspired minimal illustrations using SVG
const EmptyIllustration = ({ 
  type, 
  className 
}: { 
  type: 'search' | 'data' | 'connection' | 'transactions' | 'bookings' | 'customers' | 'general';
  className?: string;
}) => {
  const illustrations = {
    search: (
      <svg width="120" height="120" viewBox="0 0 120 120" className={cn("text-gray-300 dark:text-gray-600", className)}>
        <circle cx="45" cy="45" r="25" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="m64 64 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="45" cy="45" r="8" fill="currentColor" opacity="0.3" />
      </svg>
    ),
    data: (
      <svg width="120" height="120" viewBox="0 0 120 120" className={cn("text-gray-300 dark:text-gray-600", className)}>
        <rect x="20" y="30" width="80" height="60" rx="8" fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="30" y1="50" x2="70" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="30" y1="60" x2="90" y2="60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="30" y1="70" x2="60" y2="70" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="85" cy="50" r="3" fill="currentColor" opacity="0.5" />
        <circle cx="85" cy="70" r="3" fill="currentColor" opacity="0.3" />
      </svg>
    ),
    connection: (
      <svg width="120" height="120" viewBox="0 0 120 120" className={cn("text-gray-300 dark:text-gray-600", className)}>
        <circle cx="60" cy="60" r="30" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="60" cy="60" r="15" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="60" cy="60" r="5" fill="currentColor" opacity="0.5" />
        <path d="M40 40L80 80M80 40L40 80" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      </svg>
    ),
    transactions: (
      <svg width="120" height="120" viewBox="0 0 120 120" className={cn("text-gray-300 dark:text-gray-600", className)}>
        <rect x="25" y="35" width="70" height="50" rx="6" fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="25" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        <circle cx="40" cy="60" r="4" fill="currentColor" opacity="0.4" />
        <line x1="50" y1="60" x2="80" y2="60" stroke="currentColor" strokeWidth="1" opacity="0.6" />
        <circle cx="40" cy="70" r="4" fill="currentColor" opacity="0.4" />
        <line x1="50" y1="70" x2="75" y2="70" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      </svg>
    ),
    bookings: (
      <svg width="120" height="120" viewBox="0 0 120 120" className={cn("text-gray-300 dark:text-gray-600", className)}>
        <rect x="30" y="25" width="60" height="70" rx="6" fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="40" y1="40" x2="80" y2="40" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        <line x1="40" y1="50" x2="70" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        <rect x="40" y="60" width="40" height="20" rx="3" fill="currentColor" opacity="0.2" />
        <circle cx="60" cy="70" r="2" fill="currentColor" opacity="0.6" />
      </svg>
    ),
    customers: (
      <svg width="120" height="120" viewBox="0 0 120 120" className={cn("text-gray-300 dark:text-gray-600", className)}>
        <circle cx="60" cy="45" r="15" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M35 85c0-15 10-25 25-25s25 10 25 25" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="60" cy="45" r="6" fill="currentColor" opacity="0.3" />
      </svg>
    ),
    general: (
      <svg width="120" height="120" viewBox="0 0 120 120" className={cn("text-gray-300 dark:text-gray-600", className)}>
        <circle cx="60" cy="60" r="25" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
        <circle cx="60" cy="60" r="8" fill="currentColor" opacity="0.3" />
        <circle cx="60" cy="60" r="3" fill="currentColor" />
      </svg>
    )
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex items-center justify-center"
    >
      {illustrations[type]}
    </motion.div>
  );
};

// Main Empty State Component
export const EmptyState = ({
  illustration = 'general',
  title,
  description,
  action,
  className
}: {
  illustration?: 'search' | 'data' | 'connection' | 'transactions' | 'bookings' | 'customers' | 'general';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ElementType;
    variant?: 'default' | 'outline' | 'ghost';
  };
  className?: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 rounded-2xl',
        'bg-gray-50/50 dark:bg-gray-900/30 border border-gray-200/50 dark:border-gray-800/50',
        'min-h-[300px]',
        className
      )}
    >
      <EmptyIllustration type={illustration} className="mb-6" />
      
      <div className="space-y-3 max-w-md">
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-semibold text-primary"
        >
          {title}
        </motion.h3>
        
        {description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-body-md text-secondary leading-relaxed"
          >
            {description}
          </motion.p>
        )}
      </div>

      {action && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <Button
            onClick={action.onClick}
            variant={action.variant || 'default'}
            className="btn-apple haptic-medium"
          >
            {action.icon && <action.icon className="w-4 h-4 mr-2" />}
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

// Specialized Empty States
export const NoSearchResults = ({ 
  query, 
  onReset 
}: { 
  query: string; 
  onReset: () => void; 
}) => (
  <EmptyState
    illustration="search"
    title="No results found"
    description={`We couldn't find anything matching "${query}". Try adjusting your search terms.`}
    action={{
      label: "Clear search",
      onClick: onReset,
      icon: RefreshCw,
      variant: "outline"
    }}
  />
);

export const NoTransactions = ({ onAddTransaction }: { onAddTransaction?: () => void }) => (
  <EmptyState
    illustration="transactions"
    title="No transactions yet"
    description="Your transaction history will appear here once you start recording payments and expenses."
    action={onAddTransaction ? {
      label: "Record transaction",
      onClick: onAddTransaction,
      icon: Plus
    } : undefined}
  />
);

export const NoBookings = ({ onCreateBooking }: { onCreateBooking?: () => void }) => (
  <EmptyState
    illustration="bookings"
    title="No bookings found"
    description="Start managing your logistics by creating your first booking."
    action={onCreateBooking ? {
      label: "Create booking",
      onClick: onCreateBooking,
      icon: Plus
    } : undefined}
  />
);

export const NoCustomers = ({ onAddCustomer }: { onAddCustomer?: () => void }) => (
  <EmptyState
    illustration="customers"
    title="No customers yet"
    description="Add your first customer to start building your client base and managing relationships."
    action={onAddCustomer ? {
      label: "Add customer",
      onClick: onAddCustomer,
      icon: Users
    } : undefined}
  />
);

export const ConnectionError = ({ onRetry }: { onRetry: () => void }) => (
  <EmptyState
    illustration="connection"
    title="Connection error"
    description="Unable to load data. Please check your connection and try again."
    action={{
      label: "Try again",
      onClick: onRetry,
      icon: RefreshCw,
      variant: "outline"
    }}
  />
);

export const LoadingError = ({ 
  title = "Something went wrong",
  description = "We encountered an error while loading this data.",
  onRetry 
}: { 
  title?: string;
  description?: string;
  onRetry?: () => void; 
}) => (
  <EmptyState
    illustration="general"
    title={title}
    description={description}
    action={onRetry ? {
      label: "Try again",
      onClick: onRetry,
      icon: RefreshCw,
      variant: "outline"
    } : undefined}
  />
);

// Compact Empty States for smaller spaces
export const CompactEmptyState = ({
  icon: Icon = Inbox,
  title,
  action,
  className
}: {
  icon?: React.ElementType;
  title: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className={cn(
      'flex flex-col items-center justify-center text-center p-6 space-y-3',
      className
    )}
  >
    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
      <Icon className="w-6 h-6 text-gray-400" />
    </div>
    <h4 className="font-medium text-secondary">{title}</h4>
    {action && (
      <Button
        onClick={action.onClick}
        variant="ghost"
        size="sm"
        className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20"
      >
        {action.label}
      </Button>
    )}
  </motion.div>
);