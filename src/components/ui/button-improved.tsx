import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation",
  {
    variants: {
      variant: {
        default: "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm hover:shadow-md",
        destructive: "bg-danger text-white hover:bg-danger/90 active:bg-danger/80 shadow-sm hover:shadow-md",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        secondary: "bg-brand-100 text-brand-700 hover:bg-brand-200 active:bg-brand-300 dark:bg-brand-900/20 dark:text-brand-400 dark:hover:bg-brand-900/30",
        ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        link: "text-brand-600 underline-offset-4 hover:underline dark:text-brand-400",
        gradient: "bg-gradient-to-r from-brand-600 to-blue-600 text-white hover:from-brand-700 hover:to-blue-700 shadow-md hover:shadow-lg",
        success: "bg-success text-white hover:bg-success/90 active:bg-success/80 shadow-sm hover:shadow-md",
        warning: "bg-warning text-white hover:bg-warning/90 active:bg-warning/80 shadow-sm hover:shadow-md",
      },
      size: {
        xs: "h-7 px-2 text-xs min-h-[28px]",
        sm: "h-8 px-3 text-xs min-h-[32px]",
        default: "h-10 px-4 py-2 min-h-[40px]",
        lg: "h-11 px-6 text-base min-h-[44px]",
        xl: "h-12 px-8 text-lg min-h-[48px]",
        icon: "h-10 w-10 min-h-[40px] min-w-[40px] p-0",
        "icon-sm": "h-8 w-8 min-h-[32px] min-w-[32px] p-0",
        "icon-lg": "h-11 w-11 min-h-[44px] min-w-[44px] p-0",
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
        className={cn(buttonVariants({ variant, size, fullWidth, loading, className }))}
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
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, spacing = "normal", orientation = "horizontal", ...props }, ref) => {
    const spacingClasses = {
      tight: orientation === "horizontal" ? "-space-x-px" : "-space-y-px",
      normal: orientation === "horizontal" ? "gap-2" : "gap-2",
      loose: orientation === "horizontal" ? "gap-4" : "gap-4",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "horizontal" ? "flex-row" : "flex-col",
          spacingClasses[spacing],
          className
        )}
        {...props}
      />
    )
  }
)
ButtonGroup.displayName = "ButtonGroup"

// Icon Button Component - Better for mobile touch targets
interface IconButtonProps extends ButtonProps {
  "aria-label": string
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = "icon", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size={size}
        className={cn("relative", className)}
        {...props}
      />
    )
  }
)
IconButton.displayName = "IconButton"

export { Button, ButtonGroup, IconButton, buttonVariants }