import * as React from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus, Activity, ArrowRight } from "lucide-react"
import { Card, CardContent } from "./card-enterprise"
import { Button } from "./button-enterprise"

interface StatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  subtitle?: string
  change?: {
    value: number
    type: 'increase' | 'decrease' | 'neutral'
  }
  icon?: React.ReactNode
  iconColor?: string
  loading?: boolean
  onClick?: () => void
  actionLabel?: string
  chart?: React.ReactNode
  variant?: 'default' | 'gradient' | 'outlined'
}

export const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  ({ 
    title, 
    value, 
    subtitle,
    change,
    icon,
    iconColor = "bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400",
    loading = false,
    onClick,
    actionLabel,
    chart,
    variant = 'default',
    className,
    ...props 
  }, ref) => {
    const getTrendIcon = () => {
      if (!change) return null
      
      switch (change.type) {
        case 'increase':
          return <TrendingUp className="w-4 h-4" />
        case 'decrease':
          return <TrendingDown className="w-4 h-4" />
        default:
          return <Minus className="w-4 h-4" />
      }
    }
    
    const getTrendColor = () => {
      if (!change) return ''
      
      switch (change.type) {
        case 'increase':
          return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
        case 'decrease':
          return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
        default:
          return 'text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/20'
      }
    }
    
    const cardVariants = {
      default: '',
      gradient: 'bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-950 dark:to-secondary-950 border-0',
      outlined: 'border-2'
    }
    
    if (loading) {
      return (
        <Card ref={ref} className={cn(cardVariants[variant], className)} {...props}>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
              <div className="h-8 w-32 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
              <div className="h-3 w-20 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      )
    }
    
    return (
      <Card 
        ref={ref} 
        className={cn(
          cardVariants[variant],
          onClick && "cursor-pointer hover:shadow-lg transition-all duration-300",
          className
        )} 
        onClick={onClick}
        {...props}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                {icon && (
                  <div className={cn("p-2.5 rounded-lg", iconColor)}>
                    {icon}
                  </div>
                )}
                <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  {title}
                </h3>
              </div>
              
              <div className="space-y-2">
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {value}
                </p>
                
                {subtitle && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-500">
                    {subtitle}
                  </p>
                )}
                
                {change && (
                  <div className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                    getTrendColor()
                  )}>
                    {getTrendIcon()}
                    <span>{Math.abs(change.value)}%</span>
                  </div>
                )}
              </div>
              
              {actionLabel && (
                <Button
                  variant="link"
                  size="sm"
                  className="mt-4 p-0 h-auto font-medium"
                  rightIcon={<ArrowRight className="w-3 h-3" />}
                >
                  {actionLabel}
                </Button>
              )}
            </div>
            
            {chart && (
              <div className="ml-4 flex-shrink-0">
                {chart}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
)
StatsCard.displayName = "StatsCard"

// Mini Stats Component for compact displays
interface MiniStatsProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export const MiniStats: React.FC<MiniStatsProps> = ({
  title,
  value,
  icon,
  trend = 'neutral',
  className
}) => {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-neutral-600'
  }
  
  return (
    <div className={cn("flex items-center gap-3 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900", className)}>
      {icon && (
        <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-sm">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 truncate">
          {title}
        </p>
        <p className={cn("text-lg font-bold", trendColors[trend])}>
          {value}
        </p>
      </div>
    </div>
  )
}

// Stats Grid Component
interface StatsGridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4
  className?: string
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  children,
  columns = 4,
  className
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  }
  
  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  )
}

// Animated Counter Component
interface AnimatedCounterProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 2000,
  prefix = '',
  suffix = '',
  className
}) => {
  const [count, setCount] = React.useState(0)
  
  React.useEffect(() => {
    let start = 0
    const end = value
    const increment = end / (duration / 16)
    
    const timer = setInterval(() => {
      start += increment
      if (start > end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    
    return () => clearInterval(timer)
  }, [value, duration])
  
  return (
    <span className={className}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}