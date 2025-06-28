import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand-600 text-white hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-500",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 dark:bg-red-700 dark:hover:bg-red-600",
        outline: "text-foreground dark:text-gray-200 dark:border-gray-600",
        success: "border-transparent bg-success-100 text-success-800 hover:bg-success-200/80 dark:bg-success-900/30 dark:text-success-400 dark:hover:bg-success-900/40",
        warning: "border-transparent bg-warning-100 text-warning-800 hover:bg-warning-200/80 dark:bg-warning-900/30 dark:text-warning-400 dark:hover:bg-warning-900/40",
        info: "border-transparent bg-brand-100 text-brand-800 hover:bg-brand-200/80 dark:bg-brand-900/30 dark:text-brand-400 dark:hover:bg-brand-900/40",
        neutral: "border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200/80 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  text?: string;
}

function Badge({ className, variant, icon, text, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {icon && <span className="mr-1">{icon}</span>}
      {text || props.children}
    </div>
  )
}

export { Badge, badgeVariants }