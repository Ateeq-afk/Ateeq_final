import * as React from "react"
import { cn } from "@/lib/utils"
import { designTokens } from "@/lib/design-tokens"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass'
  interactive?: boolean
  gradient?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', interactive = false, gradient = false, ...props }, ref) => {
    const variants = {
      default: "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800",
      elevated: "bg-white dark:bg-neutral-900 shadow-lg hover:shadow-xl",
      outlined: "bg-transparent border-2 border-neutral-300 dark:border-neutral-700",
      glass: "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-white/20 dark:border-neutral-800/20"
    }
    
    const interactiveStyles = interactive 
      ? "cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]" 
      : ""
    
    const gradientStyles = gradient
      ? "bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-950"
      : ""
    
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl transition-all duration-300",
          variants[variant],
          interactiveStyles,
          gradientStyles,
          className
        )}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "flex flex-col space-y-1.5 p-6 border-b border-neutral-100 dark:border-neutral-800",
        className
      )} 
      {...props} 
    />
  )
)
CardHeader.displayName = "CardHeader"

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  size?: 'sm' | 'base' | 'lg'
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, size = 'base', ...props }, ref) => {
    const sizes = {
      sm: "text-lg font-semibold",
      base: "text-xl font-bold",
      lg: "text-2xl font-bold"
    }
    
    return (
      <h3 
        ref={ref} 
        className={cn(
          "leading-tight tracking-tight text-neutral-900 dark:text-neutral-100",
          sizes[size],
          className
        )} 
        {...props} 
      />
    )
  }
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p 
      ref={ref} 
      className={cn(
        "text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed",
        className
      )} 
      {...props} 
    />
  )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "flex items-center p-6 pt-0 border-t border-neutral-100 dark:border-neutral-800",
        className
      )} 
      {...props} 
    />
  )
)
CardFooter.displayName = "CardFooter"

// Additional specialized card components for enterprise use

interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  loading?: boolean
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ title, value, change, trend = 'neutral', icon, loading = false, className, ...props }, ref) => {
    const trendColors = {
      up: 'text-green-600 dark:text-green-400',
      down: 'text-red-600 dark:text-red-400',
      neutral: 'text-neutral-600 dark:text-neutral-400'
    }
    
    return (
      <Card ref={ref} className={cn("relative overflow-hidden", className)} {...props}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{title}</p>
            {icon && (
              <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                {icon}
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="space-y-2">
              <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
              <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                {value}
              </p>
              {change !== undefined && (
                <p className={cn("text-sm font-medium mt-2", trendColors[trend])}>
                  {trend === 'up' && '↑'}
                  {trend === 'down' && '↓'}
                  {' '}
                  {Math.abs(change)}% from last period
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
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  MetricCard 
}