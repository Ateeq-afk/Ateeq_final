import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    hover?: boolean
    loading?: boolean
  }
>(({ className, hover = false, loading = false, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      hover && "transition-all duration-200 hover:shadow-md hover:border-brand-200 dark:hover:border-brand-700",
      loading && "relative overflow-hidden",
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
))
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
      separated && "border-b",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
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
      separated && "border-t pt-6",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

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
  className
}) => {
  return (
    <Card className={cn("relative overflow-hidden", className)} hover>
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
                  <span className={cn(
                    "text-sm font-medium",
                    trend.isPositive ? "text-success" : "text-danger"
                  )}>
                    {trend.isPositive ? "+" : ""}{trend.value}%
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
  className
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
      {action && (
        <CardFooter>
          {action}
        </CardFooter>
      )}
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
          "cursor-pointer transition-all duration-200",
          "hover:shadow-md hover:border-brand-200 dark:hover:border-brand-700",
          isSelected && "ring-2 ring-brand-500 border-brand-500",
          className
        )}
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
}