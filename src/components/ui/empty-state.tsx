import React from 'react';
import { 
  LucideIcon, 
  Package, 
  Users, 
  Package2, 
  Truck, 
  Building2, 
  Warehouse, 
  AlertTriangle 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center py-12 px-4",
      className
    )}>
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 mb-4">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      
      {description && (
        <p className="text-muted-foreground text-sm max-w-sm mb-6">{description}</p>
      )}
      
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || 'default'}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Specialized empty states for common scenarios
interface ListEmptyStateProps {
  type: 'bookings' | 'customers' | 'articles' | 'vehicles' | 'branches' | 'warehouses';
  searchQuery?: string;
  onCreateNew?: () => void;
  onClearSearch?: () => void;
  className?: string;
}

export function ListEmptyState({
  type,
  searchQuery,
  onCreateNew,
  onClearSearch,
  className,
}: ListEmptyStateProps) {
  const config = {
    bookings: {
      icon: Package,
      title: searchQuery ? 'No bookings found' : 'No bookings yet',
      description: searchQuery 
        ? `No bookings match "${searchQuery}". Try adjusting your search terms.`
        : 'Start by creating your first booking to manage shipments.',
      createLabel: 'Create Booking',
    },
    customers: {
      icon: Users,
      title: searchQuery ? 'No customers found' : 'No customers yet',
      description: searchQuery
        ? `No customers match "${searchQuery}". Try adjusting your search terms.`
        : 'Add customers to start managing your client relationships.',
      createLabel: 'Add Customer',
    },
    articles: {
      icon: Package2,
      title: searchQuery ? 'No articles found' : 'No articles yet',
      description: searchQuery
        ? `No articles match "${searchQuery}". Try adjusting your search terms.`
        : 'Add articles to define your shipping rates and inventory.',
      createLabel: 'Add Article',
    },
    vehicles: {
      icon: Truck,
      title: searchQuery ? 'No vehicles found' : 'No vehicles yet',
      description: searchQuery
        ? `No vehicles match "${searchQuery}". Try adjusting your search terms.`
        : 'Add vehicles to manage your fleet and transportation.',
      createLabel: 'Add Vehicle',
    },
    branches: {
      icon: Building2,
      title: searchQuery ? 'No branches found' : 'No branches yet',
      description: searchQuery
        ? `No branches match "${searchQuery}". Try adjusting your search terms.`
        : 'Create branches to expand your logistics network.',
      createLabel: 'Add Branch',
    },
    warehouses: {
      icon: Warehouse,
      title: searchQuery ? 'No warehouses found' : 'No warehouses yet',
      description: searchQuery
        ? `No warehouses match "${searchQuery}". Try adjusting your search terms.`
        : 'Add warehouses to manage your storage locations.',
      createLabel: 'Add Warehouse',
    },
  };

  const { icon, title, description, createLabel } = config[type];

  if (searchQuery && onClearSearch) {
    return (
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        action={{
          label: 'Clear Search',
          onClick: onClearSearch,
          variant: 'outline',
        }}
        className={className}
      />
    );
  }

  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      action={onCreateNew ? {
        label: createLabel,
        onClick: onCreateNew,
      } : undefined}
      className={className}
    />
  );
}

// Error state component
interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We encountered an error while loading this content. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title={title}
      description={description}
      action={onRetry ? {
        label: 'Try Again',
        onClick: onRetry,
        variant: 'outline',
      } : undefined}
      className={className}
    />
  );
}

// Loading state with skeleton-like appearance
interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = 'Loading...',
  className,
}: LoadingStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center py-12 px-4",
      className
    )}>
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 mb-4 animate-pulse">
        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
      </div>
      
      <div className="h-6 w-32 bg-muted animate-pulse rounded mb-2" />
      <div className="h-4 w-48 bg-muted animate-pulse rounded" />
    </div>
  );
}