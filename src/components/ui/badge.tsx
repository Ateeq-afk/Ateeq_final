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
        success: "border-transparent bg-green-100 text-green-900 hover:bg-green-200/80 dark:bg-green-900/40 dark:text-green-200 dark:hover:bg-green-900/50",
        warning: "border-transparent bg-yellow-100 text-yellow-900 hover:bg-yellow-200/80 dark:bg-yellow-900/40 dark:text-yellow-200 dark:hover:bg-yellow-900/50",
        info: "border-transparent bg-blue-100 text-blue-900 hover:bg-blue-200/80 dark:bg-blue-900/40 dark:text-blue-200 dark:hover:bg-blue-900/50",
        neutral: "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200/80 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600",
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