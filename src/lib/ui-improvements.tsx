/**
 * UI Improvement Utilities and Patterns
 * 
 * This file contains utility functions and components to help standardize
 * and improve the UI across the entire application.
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Enhanced cn function with better type safety
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Responsive utility classes
export const responsive = {
  // Padding utilities
  padding: {
    sm: "p-3 sm:p-4",
    md: "p-4 sm:p-6",
    lg: "p-6 sm:p-8",
    section: "py-8 sm:py-12 lg:py-16"
  },
  
  // Margin utilities
  margin: {
    sm: "m-3 sm:m-4",
    md: "m-4 sm:m-6",
    lg: "m-6 sm:m-8",
    section: "my-8 sm:my-12 lg:my-16"
  },

  // Gap utilities
  gap: {
    sm: "gap-3 sm:gap-4",
    md: "gap-4 sm:gap-6",
    lg: "gap-6 sm:gap-8"
  },

  // Text utilities
  text: {
    xs: "text-xs sm:text-sm",
    sm: "text-sm sm:text-base",
    base: "text-base sm:text-lg",
    lg: "text-lg sm:text-xl",
    xl: "text-xl sm:text-2xl",
    "2xl": "text-2xl sm:text-3xl",
    "3xl": "text-3xl sm:text-4xl",
    "4xl": "text-4xl sm:text-5xl"
  },

  // Grid utilities
  grid: {
    cols2: "grid-cols-1 sm:grid-cols-2",
    cols3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    cols4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    cols6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
  },

  // Container utilities
  container: {
    sm: "max-w-sm mx-auto",
    md: "max-w-md mx-auto",
    lg: "max-w-lg mx-auto",
    xl: "max-w-xl mx-auto",
    "2xl": "max-w-2xl mx-auto",
    "4xl": "max-w-4xl mx-auto",
    "6xl": "max-w-6xl mx-auto",
    "7xl": "max-w-7xl mx-auto",
    full: "w-full mx-auto px-4 sm:px-6 lg:px-8"
  }
}

// Focus and accessibility utilities
export const accessibility = {
  focusRing: "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
  srOnly: "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
  notSrOnly: "not-sr-only",
  focusWithin: "focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2"
}

// Animation utilities
export const animation = {
  transition: {
    base: "transition-all duration-200",
    slow: "transition-all duration-300",
    fast: "transition-all duration-150"
  },
  hover: {
    scale: "hover:scale-105 active:scale-95",
    lift: "hover:-translate-y-1",
    glow: "hover:shadow-lg hover:shadow-brand-500/25"
  },
  skeleton: "animate-pulse bg-muted rounded",
  spin: "animate-spin",
  bounce: "animate-bounce",
  pulse: "animate-pulse"
}

// Color utilities for consistent theming
export const colors = {
  // Status colors
  status: {
    success: "text-success bg-success/10 border-success/20",
    warning: "text-warning bg-warning/10 border-warning/20",
    danger: "text-danger bg-danger/10 border-danger/20",
    info: "text-info bg-info/10 border-info/20"
  },
  
  // Interactive states
  interactive: {
    default: "bg-background hover:bg-accent",
    primary: "bg-brand-600 hover:bg-brand-700 text-white",
    secondary: "bg-brand-100 hover:bg-brand-200 text-brand-700",
    danger: "bg-danger hover:bg-danger/90 text-white"
  },

  // Text colors
  text: {
    primary: "text-foreground",
    secondary: "text-muted-foreground",
    brand: "text-brand-600 dark:text-brand-400",
    danger: "text-danger",
    success: "text-success"
  }
}

// Layout utilities
export const layout = {
  // Stack layouts
  stack: {
    vertical: "flex flex-col",
    horizontal: "flex flex-row",
    center: "flex items-center justify-center"
  },

  // Flex utilities
  flex: {
    between: "flex items-center justify-between",
    start: "flex items-start",
    end: "flex items-end justify-end",
    center: "flex items-center justify-center",
    wrap: "flex flex-wrap"
  },

  // Position utilities
  position: {
    relative: "relative",
    absolute: "absolute",
    fixed: "fixed",
    sticky: "sticky top-0 z-10"
  }
}

// Form utilities
export const form = {
  // Input utilities
  input: {
    base: cn(
      "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2",
      "text-base sm:text-sm", // Mobile-friendly text size
      "ring-offset-background placeholder:text-muted-foreground",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "transition-colors duration-200"
    ),
    error: "border-danger focus-visible:ring-danger",
    success: "border-success focus-visible:ring-success"
  },

  // Label utilities
  label: {
    base: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
    required: "after:content-['*'] after:ml-0.5 after:text-danger"
  },

  // Helper text
  helper: {
    base: "text-sm text-muted-foreground mt-1.5",
    error: "text-sm text-danger mt-1.5"
  },

  // Form group
  group: "space-y-2"
}

// Table utilities
export const table = {
  wrapper: "w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0",
  base: "w-full caption-bottom text-sm",
  header: "border-b bg-muted/50 sticky top-0",
  headerCell: "h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap",
  body: "[&_tr:last-child]:border-0",
  row: "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
  cell: "px-4 py-3 align-middle",
  mobileCard: "block sm:hidden space-y-3 p-4 border rounded-lg"
}

// Card utilities
export const card = {
  base: "rounded-lg border bg-card text-card-foreground shadow-sm",
  hover: "transition-all duration-200 hover:shadow-md hover:border-brand-200 dark:hover:border-brand-700",
  interactive: "cursor-pointer hover:scale-[1.02]",
  padding: {
    sm: "p-4",
    md: "p-6",
    lg: "p-8"
  }
}

// Button utilities
export const button = {
  base: cn(
    "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium",
    "ring-offset-background transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "touch-manipulation" // Improves touch responsiveness
  ),
  
  variants: {
    default: "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800",
    secondary: "bg-brand-100 text-brand-700 hover:bg-brand-200 active:bg-brand-300",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    danger: "bg-danger text-white hover:bg-danger/90 active:bg-danger/80"
  },

  sizes: {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 py-2",
    lg: "h-11 px-6 text-base",
    xl: "h-12 px-8 text-lg",
    icon: "h-10 w-10 p-0",
    iconSm: "h-8 w-8 p-0",
    iconLg: "h-11 w-11 p-0"
  },

  // Mobile-friendly minimum touch target
  mobile: "min-h-[44px] min-w-[44px]"
}

// Badge utilities
export const badge = {
  base: "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  variants: {
    default: "bg-brand-100 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border border-input bg-background",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    danger: "bg-danger/10 text-danger border-danger/20"
  }
}

// Loading states
export const loading = {
  spinner: "animate-spin h-5 w-5 text-brand-600",
  skeleton: "animate-pulse bg-muted rounded-md",
  dots: "space-x-1 flex items-center",
  overlay: "absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
}

// Empty states
export const empty = {
  wrapper: "flex flex-col items-center justify-center py-12 px-4 text-center",
  icon: "h-12 w-12 text-muted-foreground mb-4",
  title: "text-lg font-semibold text-foreground mb-2",
  description: "text-sm text-muted-foreground max-w-sm"
}

// Utility functions for common patterns

/**
 * Get responsive padding classes
 */
export function getResponsivePadding(size: "sm" | "md" | "lg" = "md") {
  return responsive.padding[size]
}

/**
 * Get responsive text classes
 */
export function getResponsiveText(size: keyof typeof responsive.text = "base") {
  return responsive.text[size]
}

/**
 * Get status color classes
 */
export function getStatusClasses(status: "success" | "warning" | "danger" | "info") {
  return colors.status[status]
}

/**
 * Get button classes with all variants
 */
export function getButtonClasses(
  variant: keyof typeof button.variants = "default",
  size: keyof typeof button.sizes = "md",
  fullWidth = false
) {
  return cn(
    button.base,
    button.variants[variant],
    button.sizes[size],
    fullWidth && "w-full",
    button.mobile // Always include mobile-friendly sizing
  )
}

/**
 * Get form input classes
 */
export function getInputClasses(error = false, success = false) {
  return cn(
    form.input.base,
    error && form.input.error,
    success && form.input.success
  )
}

/**
 * Format class names for mobile-first responsive design
 */
export function mobileFirst(
  mobile: string,
  tablet?: string,
  desktop?: string
) {
  return cn(
    mobile,
    tablet && `sm:${tablet}`,
    desktop && `lg:${desktop}`
  )
}