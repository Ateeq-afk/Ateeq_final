import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const cardVariants = cva(
  "rounded-lg text-card-foreground transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border bg-card shadow-sm hover:shadow-md dark:shadow-lg dark:shadow-black/10",
        elevated: "bg-card shadow-lg hover:shadow-xl dark:shadow-2xl dark:shadow-black/20",
        outlined: "bg-transparent border-2 border-border hover:border-foreground/20",
        glass: "bg-card/80 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        gradient: "bg-gradient-to-br from-card to-accent/10 border shadow-md hover:shadow-lg",
      },
      interactive: {
        true: "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
        false: "",
      },
      loading: {
        true: "relative overflow-hidden",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      interactive: false,
      loading: false,
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  hover?: boolean
  gradient?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, interactive, loading, hover, gradient, children, ...props }, ref) => {
    // For backward compatibility with hover prop
    const isInteractive = interactive ?? hover

    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, interactive: isInteractive, loading }),
          gradient && "bg-gradient-to-br from-card to-accent/5",
          className
        )}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        )}
        {children}
      </div>
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    separated?: boolean
  }
>(({ className, separated = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 p-6",
      separated && "border-b border-border",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  size?: "sm" | "default" | "lg"
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, size = "default", as: Component = "h3", ...props }, ref) => {
    const sizes = {
      sm: "text-lg font-semibold",
      default: "text-2xl font-semibold",
      lg: "text-3xl font-bold",
    }

    return (
      <Component
        ref={ref}
        className={cn(
          "leading-none tracking-tight",
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    separated?: boolean
  }
>(({ className, separated = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-6 pt-0",
      separated && "border-t border-border pt-6",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// Specialized Card Components

// Stat Card Component
interface StatCardProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  icon?: React.ReactNode
  loading?: boolean
  className?: string
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  trend,
  icon,
  loading = false,
  className,
}) => {
  return (
    <Card className={cn("relative overflow-hidden", className)} hover loading={loading}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {loading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold">{value}</h3>
                {trend && (
                  <span
                    className={cn(
                      "text-sm font-medium",
                      trend.isPositive ? "text-success" : "text-danger"
                    )}
                  >
                    {trend.isPositive ? "+" : ""}
                    {trend.value}%
                  </span>
                )}
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {icon && (
            <div className="h-12 w-12 rounded-full bg-brand-100 dark:bg-brand-900/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
      {/* Background decoration */}
      {icon && (
        <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-brand-100/50 dark:bg-brand-900/10" />
      )}
    </Card>
  )
}

// Feature Card Component
interface FeatureCardProps {
  title: string
  description: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  action,
  className,
}) => {
  return (
    <Card className={cn("h-full", className)} hover>
      <CardHeader>
        {icon && (
          <div className="h-12 w-12 rounded-lg bg-brand-100 dark:bg-brand-900/20 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4">
            {icon}
          </div>
        )}
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {action && <CardFooter>{action}</CardFooter>}
    </Card>
  )
}

// Interactive Card Component
interface InteractiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  isSelected?: boolean
  onSelect?: () => void
}

const InteractiveCard = React.forwardRef<HTMLDivElement, InteractiveCardProps>(
  ({ className, isSelected = false, onSelect, children, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          isSelected && "ring-2 ring-brand-500 border-brand-500",
          className
        )}
        interactive
        onClick={onSelect}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onSelect?.()
          }
        }}
        {...props}
      >
        {children}
      </Card>
    )
  }
)
InteractiveCard.displayName = "InteractiveCard"

// Metric Card Component (Enterprise style)
interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  change?: number
  trend?: "up" | "down" | "neutral"
  icon?: React.ReactNode
  loading?: boolean
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ title, value, change, trend = "neutral", icon, loading = false, className, ...props }, ref) => {
    const trendColors = {
      up: "text-green-600 dark:text-green-400",
      down: "text-red-600 dark:text-red-400",
      neutral: "text-neutral-600 dark:text-neutral-400",
    }

    const trendIcons = {
      up: "↑",
      down: "↓",
      neutral: "→",
    }

    return (
      <Card ref={ref} className={cn("relative overflow-hidden", className)} loading={loading} {...props}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {icon && (
              <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                {icon}
              </div>
            )}
          </div>

          {loading ? (
            <div className="space-y-2">
              <div className="h-8 bg-muted rounded animate-pulse" />
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold">{value}</p>
              {change !== undefined && (
                <p className={cn("text-sm font-medium mt-2", trendColors[trend])}>
                  {trendIcons[trend]} {Math.abs(change)}% from last period
                </p>
              )}
            </>
          )}
        </CardContent>

        {/* Decorative gradient */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full blur-3xl" />
        </div>
      </Card>
    )
  }
)
MetricCard.displayName = "MetricCard"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  StatCard,
  FeatureCard,
  InteractiveCard,
  MetricCard,
  cardVariants,
}