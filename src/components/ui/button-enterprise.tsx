import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary-600 text-white shadow-md hover:bg-primary-700 hover:shadow-lg focus-visible:ring-primary-500",
        destructive: "bg-red-600 text-white shadow-md hover:bg-red-700 hover:shadow-lg focus-visible:ring-red-500",
        outline: "border-2 border-neutral-300 bg-transparent hover:bg-neutral-100 hover:border-neutral-400 dark:border-neutral-700 dark:hover:bg-neutral-800 dark:hover:border-neutral-600",
        secondary: "bg-neutral-100 text-neutral-900 shadow-sm hover:bg-neutral-200 hover:shadow-md dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700",
        ghost: "hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
        link: "text-primary-600 underline-offset-4 hover:underline dark:text-primary-400",
        gradient: "bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg hover:shadow-xl hover:scale-105",
        premium: "bg-gradient-to-r from-accent-500 to-accent-600 text-neutral-900 shadow-lg hover:shadow-xl hover:scale-105 font-semibold",
      },
      size: {
        default: "h-10 px-5 py-2 text-sm",
        sm: "h-8 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
      rounded: {
        default: "rounded-lg",
        full: "rounded-full",
        none: "rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    rounded,
    asChild = false, 
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, rounded, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {!loading && leftIcon && (
          <span className="mr-2">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="ml-2">{rightIcon}</span>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

// Icon Button Component
interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon'> {
  icon: React.ReactNode
  "aria-label": string
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = "icon", className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size={size}
        className={cn("relative", className)}
        {...props}
      >
        {icon}
      </Button>
    )
  }
)
IconButton.displayName = "IconButton"

// Button Group Component
interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, orientation = 'horizontal', children, ...props }, ref) => {
    const orientationClasses = {
      horizontal: "flex-row",
      vertical: "flex-col"
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex shadow-sm",
          orientationClasses[orientation],
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
              orientation === 'horizontal' ? {
                'rounded-r-none': !isLast,
                'rounded-l-none': !isFirst,
                'border-l-0': !isFirst,
              } : {
                'rounded-b-none': !isLast,
                'rounded-t-none': !isFirst,
                'border-t-0': !isFirst,
              }
            ),
          })
        })}
      </div>
    )
  }
)
ButtonGroup.displayName = "ButtonGroup"

// Floating Action Button Component
interface FABProps extends ButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

const FAB = React.forwardRef<HTMLButtonElement, FABProps>(
  ({ className, position = 'bottom-right', ...props }, ref) => {
    const positions = {
      'bottom-right': 'bottom-6 right-6',
      'bottom-left': 'bottom-6 left-6',
      'top-right': 'top-6 right-6',
      'top-left': 'top-6 left-6',
    }
    
    return (
      <Button
        ref={ref}
        variant="gradient"
        size="icon-lg"
        rounded="full"
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

export { Button, buttonVariants, IconButton, ButtonGroup, FAB }