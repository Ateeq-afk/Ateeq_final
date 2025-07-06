import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<any>;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

export function Breadcrumb({ items, className, showHome = true }: BreadcrumbProps) {
  const allItems = showHome 
    ? [{ label: 'Dashboard', href: '/dashboard', icon: Home }, ...items]
    : items;

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}
    >
      <ol className="flex items-center space-x-1">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const Icon = item.icon;
          
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" aria-hidden="true" />
              )}
              
              {item.href && !isLast ? (
                <Link
                  to={item.href}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                  aria-current={isLast ? "page" : undefined}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </Link>
              ) : (
                <span 
                  className={cn(
                    "flex items-center gap-1",
                    isLast && "text-foreground font-medium"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Hook to generate breadcrumbs based on current route
export function useBreadcrumbs() {
  const location = useLocation();
  
  const generateBreadcrumbs = React.useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    
    // Skip 'dashboard' as it's added by default
    const segments = pathSegments.slice(1);
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const href = `/dashboard/${segments.slice(0, i + 1).join('/')}`;
      
      // Map segments to readable labels
      const label = getSegmentLabel(segment, segments, i);
      
      breadcrumbs.push({
        label,
        href: i === segments.length - 1 ? undefined : href, // Don't link the current page
      });
    }
    
    return breadcrumbs;
  }, [location.pathname]);
  
  return generateBreadcrumbs;
}

function getSegmentLabel(segment: string, allSegments: string[], index: number): string {
  // Static route mappings
  const routeLabels: Record<string, string> = {
    'bookings': 'Bookings',
    'new-booking': 'New Booking',
    'customers': 'Customers',
    'vehicles': 'Vehicles',
    'articles': 'Articles',
    'branches': 'Branches',
    'warehouse': 'Warehouse',
    'revenue': 'Revenue',
    'reports': 'Reports',
    'loading': 'Loading',
    'unloading': 'Unloading',
    'pod': 'Proof of Delivery',
    'tracking': 'Tracking',
    'settings': 'Settings',
    'organizations': 'Organizations',
  };
  
  // Check if it's a dynamic segment (likely an ID)
  if (segment.match(/^[a-f0-9-]{36}$|^\d+$/)) {
    // This looks like an ID, use the previous segment to determine context
    const previousSegment = allSegments[index - 1];
    if (previousSegment === 'bookings') return 'Booking Details';
    if (previousSegment === 'customers') return 'Customer Details';
    if (previousSegment === 'vehicles') return 'Vehicle Details';
    if (previousSegment === 'articles') return 'Article Details';
    return 'Details';
  }
  
  return routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
}

// Enhanced breadcrumb with page context
interface PageBreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export function PageBreadcrumb({ items, className }: PageBreadcrumbProps) {
  const autoBreadcrumbs = useBreadcrumbs();
  const breadcrumbItems = items || autoBreadcrumbs;
  
  if (breadcrumbItems.length === 0) {
    return null;
  }
  
  return (
    <div className={cn("mb-6", className)}>
      <Breadcrumb items={breadcrumbItems} />
    </div>
  );
}