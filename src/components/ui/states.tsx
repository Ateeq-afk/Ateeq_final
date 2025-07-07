import * as React from "react"
import { cn } from "@/lib/utils"
import { 
  AlertCircle, 
  FileX, 
  Loader2, 
  PackageX, 
  SearchX, 
  ServerCrash,
  WifiOff,
  Database,
  RefreshCw
} from "lucide-react"
import { Button } from "./button"

// Loading State Component
interface LoadingStateProps {
  text?: string
  size?: "sm" | "md" | "lg"
  fullScreen?: boolean
  className?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  text = "Loading...",
  size = "md",
  fullScreen = false,
  className
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  }

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <Loader2 className={cn("animate-spin text-brand-600", sizeClasses[size])} />
      {text && (
        <p className={cn(
          "text-muted-foreground",
          size === "sm" && "text-sm",
          size === "lg" && "text-lg"
        )}>
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className={cn(
        "fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50",
        className
      )}>
        {content}
      </div>
    )
  }

  return (
    <div className={cn("flex items-center justify-center p-8", className)}>
      {content}
    </div>
  )
}

// Empty State Component
interface EmptyStateProps {
  icon?: React.ReactNode
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "search" | "error" | "no-data" | "no-access"
  className?: string
}

const emptyStateVariants = {
  default: {
    icon: <FileX className="h-12 w-12" />,
    title: "No items found",
    description: "There are no items to display at this time."
  },
  search: {
    icon: <SearchX className="h-12 w-12" />,
    title: "No results found",
    description: "Try adjusting your search or filter to find what you're looking for."
  },
  error: {
    icon: <AlertCircle className="h-12 w-12" />,
    title: "Something went wrong",
    description: "We encountered an error while loading the data. Please try again."
  },
  "no-data": {
    icon: <Database className="h-12 w-12" />,
    title: "No data yet",
    description: "Start by creating your first item to see it here."
  },
  "no-access": {
    icon: <PackageX className="h-12 w-12" />,
    title: "Access restricted",
    description: "You don't have permission to view this content."
  }
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  variant = "default",
  className
}) => {
  const variantConfig = emptyStateVariants[variant]
  
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      <div className="mb-4 text-muted-foreground">
        {icon || variantConfig.icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">
        {title || variantConfig.title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {description || variantConfig.description}
      </p>
      {action}
    </div>
  )
}

// Error State Component
interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  variant?: "default" | "network" | "server" | "permission"
  className?: string
}

const errorStateVariants = {
  default: {
    icon: <AlertCircle className="h-12 w-12" />,
    title: "An error occurred",
    description: "Something went wrong. Please try again later."
  },
  network: {
    icon: <WifiOff className="h-12 w-12" />,
    title: "Network error",
    description: "Please check your internet connection and try again."
  },
  server: {
    icon: <ServerCrash className="h-12 w-12" />,
    title: "Server error",
    description: "Our servers are having issues. Please try again later."
  },
  permission: {
    icon: <PackageX className="h-12 w-12" />,
    title: "Permission denied",
    description: "You don't have permission to perform this action."
  }
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  description,
  onRetry,
  variant = "default",
  className
}) => {
  const variantConfig = errorStateVariants[variant]
  
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      <div className="mb-4 text-danger">
        {variantConfig.icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">
        {title || variantConfig.title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {description || variantConfig.description}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try again
        </Button>
      )}
    </div>
  )
}

// Skeleton Loading Components
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular"
  animation?: "pulse" | "wave"
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = "text", animation = "pulse", ...props }, ref) => {
    const variantClasses = {
      text: "h-4 w-full rounded",
      circular: "rounded-full",
      rectangular: "rounded-md"
    }

    const animationClasses = {
      pulse: "animate-pulse",
      wave: "animate-shimmer"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "bg-muted",
          variantClasses[variant],
          animationClasses[animation],
          className
        )}
        {...props}
      />
    )
  }
)
Skeleton.displayName = "Skeleton"

// List Skeleton
interface ListSkeletonProps {
  count?: number
  showAvatar?: boolean
  className?: string
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  count = 3,
  showAvatar = false,
  className
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-4">
          {showAvatar && (
            <Skeleton variant="circular" className="h-10 w-10 flex-shrink-0" />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Card Skeleton
export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("rounded-lg border bg-card p-6", className)}>
      <div className="space-y-3">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-8 w-1/2" />
        <div className="space-y-2 pt-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    </div>
  )
}

// Grid Skeleton
interface GridSkeletonProps {
  count?: number
  columns?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
  }
  className?: string
}

export const GridSkeleton: React.FC<GridSkeletonProps> = ({
  count = 6,
  columns = { default: 1, sm: 2, md: 3, lg: 4 },
  className
}) => {
  const gridClasses = cn(
    "grid gap-4",
    columns.default && `grid-cols-${columns.default}`,
    columns.sm && `sm:grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`
  )

  return (
    <div className={cn(gridClasses, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}