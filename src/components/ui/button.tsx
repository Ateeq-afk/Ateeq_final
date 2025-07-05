import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background hover:bg-foreground/90 shadow-sm active:scale-[0.98] hover:shadow-md",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-sm active:scale-[0.98] hover:shadow-lg hover:shadow-red-500/25 dark:bg-red-700 dark:hover:bg-red-600",
        outline:
          "border border-border bg-background hover:bg-accent hover:text-accent-foreground shadow-sm hover:border-border/80 active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm active:scale-[0.98] hover:shadow-md",
        ghost: "hover:bg-accent hover:text-accent-foreground active:scale-[0.98] hover:shadow-sm",
        link: "text-foreground underline-offset-4 hover:underline active:scale-[0.98]",
        gradient: "bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 text-white hover:shadow-lg hover:shadow-brand-500/25 active:scale-[0.98] bg-size-200 hover:bg-pos-100 transition-all duration-300",
        glass: "glass-subtle text-foreground hover:glass-strong active:scale-[0.98] hover:shadow-lg",
        premium: "bg-gradient-to-r from-brand-600 via-purple-600 to-brand-600 text-white hover:shadow-xl hover:shadow-brand-500/30 active:scale-[0.98] bg-size-200 hover:bg-pos-100 transition-all duration-300 relative",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
        xl: "h-14 px-12 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }