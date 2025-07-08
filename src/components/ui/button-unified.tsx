import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-brand-600 text-white shadow-sm hover:bg-brand-700 hover:shadow-md active:scale-[0.98] focus-visible:ring-brand-500",
        destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/25 active:scale-[0.98] focus-visible:ring-red-500",
        outline: "border border-border bg-background hover:bg-accent hover:text-accent-foreground hover:border-border/80 active:scale-[0.98]",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md active:scale-[0.98]",
        ghost: "hover:bg-accent hover:text-accent-foreground active:scale-[0.98] hover:shadow-sm",
        link: "text-brand-600 underline-offset-4 hover:underline active:scale-[0.98] dark:text-brand-400",
        gradient: "bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 text-white hover:shadow-lg hover:shadow-brand-500/25 active:scale-[0.98] bg-size-200 hover:bg-pos-100",
        glass: "glass-subtle text-foreground hover:glass-strong active:scale-[0.98] hover:shadow-lg",
        premium: "bg-gradient-to-r from-brand-600 via-purple-600 to-brand-600 text-white hover:shadow-xl hover:shadow-brand-500/30 active:scale-[0.98] bg-size-200 hover:bg-pos-100",
        success: "bg-success text-white hover:bg-success/90 active:bg-success/80 shadow-sm hover:shadow-md focus-visible:ring-success",
        warning: "bg-warning text-white hover:bg-warning/90 active:bg-warning/80 shadow-sm hover:shadow-md focus-visible:ring-warning",
      },
      size: {
        xs: "h-7 px-2 text-xs min-h-[28px]",
        sm: "h-8 px-3 text-xs min-h-[32px]",
        default: "h-10 px-4 py-2 text-sm min-h-[40px]",
        lg: "h-11 px-6 text-base min-h-[44px]",
        xl: "h-14 px-10 text-lg min-h-[56px]",
        icon: "h-10 w-10 min-h-[40px] min-w-[40px] p-0",
        "icon-sm": "h-8 w-8 min-h-[32px] min-w-[32px] p-0",
        "icon-lg": "h-12 w-12 min-h-[48px] min-w-[48px] p-0",
      },
      rounded: {
        default: "rounded-lg",
        full: "rounded-full",
        none: "rounded-none",
        sm: "rounded-md",
        xl: "rounded-xl",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
      loading: {
        true: "cursor-not-allowed opacity-70",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "default",
      fullWidth: false,
      loading: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    rounded,
    fullWidth,
    asChild = false, 
    loading = false,
    loadingText,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    const isDisabled = disabled || loading
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, rounded, fullWidth, loading, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {!loading && leftIcon && (
          <span className="inline-flex shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <span className={cn(loading && loadingText && "sr-only")}>
          {children}
        </span>
        {loading && loadingText && (
          <span aria-hidden="true">{loadingText}</span>
        )}
        {!loading && rightIcon && (
          <span className="inline-flex shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

// Button Group Component
interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: "tight" | "normal" | "loose"
  orientation?: "horizontal" | "vertical"
  attached?: boolean
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, spacing = "normal", orientation = "horizontal", attached = false, children, ...props }, ref) => {
    const spacingClasses = {
      tight: orientation === "horizontal" ? "gap-1" : "gap-1",
      normal: orientation === "horizontal" ? "gap-2" : "gap-2",
      loose: orientation === "horizontal" ? "gap-4" : "gap-4",
    }

    if (attached) {
      return (
        <div
          ref={ref}
          className={cn(
            "inline-flex shadow-sm",
            orientation === "horizontal" ? "flex-row" : "flex-col",
            className
          )}
          {...props}
        >
          {React.Children.map(children, (child, index) => {
            if (!React.isValidElement(child)) return child
            
            const isFirst = index === 0
            const isLast = index === React.Children.count(children) - 1
            
            return React.cloneElement(child as React.ReactElement<any>, {
              className: cn(
                child.props.className,
                orientation === "horizontal" ? {
                  "rounded-r-none": !isLast,
                  "rounded-l-none": !isFirst,
                  "border-l-0": !isFirst,
                } : {
                  "rounded-b-none": !isLast,
                  "rounded-t-none": !isFirst,
                  "border-t-0": !isFirst,
                }
              ),
            })
          })}
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "horizontal" ? "flex-row" : "flex-col",
          !attached && spacingClasses[spacing],
          className
        )}
        {...props}
      />
    )
  }
)
ButtonGroup.displayName = "ButtonGroup"

// Icon Button Component - Better for mobile touch targets
interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon?: React.ReactNode
  "aria-label": string
  children?: React.ReactNode
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = "icon", icon, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size={size}
        className={cn("relative", className)}
        {...props}
      >
        {icon || children}
      </Button>
    )
  }
)
IconButton.displayName = "IconButton"

// Floating Action Button Component
interface FABProps extends ButtonProps {
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
}

const FAB = React.forwardRef<HTMLButtonElement, FABProps>(
  ({ className, position = "bottom-right", size = "icon-lg", rounded = "full", variant = "gradient", ...props }, ref) => {
    const positions = {
      "bottom-right": "bottom-6 right-6",
      "bottom-left": "bottom-6 left-6",
      "top-right": "top-6 right-6",
      "top-left": "top-6 left-6",
    }
    
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        rounded={rounded}
        className={cn(
          "fixed z-50 shadow-xl hover:shadow-2xl",
          positions[position],
          className
        )}
        {...props}
      />
    )
  }
)
FAB.displayName = "FAB"

export { Button, ButtonGroup, IconButton, FAB, buttonVariants }