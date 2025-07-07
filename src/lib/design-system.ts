/**
 * DesiCargo Design System
 * 
 * This file defines the core design tokens and patterns used throughout the application.
 * It ensures consistency in UI elements, spacing, colors, and interactions.
 */

export const designSystem = {
  // Color Tokens - Using CSS variables for theme support
  colors: {
    // Brand colors
    brand: {
      50: 'hsl(var(--brand-50))',
      100: 'hsl(var(--brand-100))',
      200: 'hsl(var(--brand-200))',
      300: 'hsl(var(--brand-300))',
      400: 'hsl(var(--brand-400))',
      500: 'hsl(var(--brand-500))',
      600: 'hsl(var(--brand-600))',
      700: 'hsl(var(--brand-700))',
      800: 'hsl(var(--brand-800))',
      900: 'hsl(var(--brand-900))',
      950: 'hsl(var(--brand-950))',
    },
    // Semantic colors
    semantic: {
      success: 'hsl(var(--success))',
      warning: 'hsl(var(--warning))',
      danger: 'hsl(var(--danger))',
      info: 'hsl(var(--info))',
    },
    // UI colors
    ui: {
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      card: 'hsl(var(--card))',
      cardForeground: 'hsl(var(--card-foreground))',
      muted: 'hsl(var(--muted))',
      mutedForeground: 'hsl(var(--muted-foreground))',
      border: 'hsl(var(--border))',
    },
  },

  // Spacing Scale (in rem)
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },

  // Typography
  typography: {
    // Font families
    fonts: {
      sans: 'var(--font-sans)',
      mono: 'var(--font-mono)',
      display: 'var(--font-display)',
    },
    // Font sizes with line heights
    sizes: {
      xs: { size: '0.75rem', lineHeight: '1rem' },
      sm: { size: '0.875rem', lineHeight: '1.25rem' },
      base: { size: '1rem', lineHeight: '1.5rem' },
      lg: { size: '1.125rem', lineHeight: '1.75rem' },
      xl: { size: '1.25rem', lineHeight: '1.75rem' },
      '2xl': { size: '1.5rem', lineHeight: '2rem' },
      '3xl': { size: '1.875rem', lineHeight: '2.25rem' },
      '4xl': { size: '2.25rem', lineHeight: '2.5rem' },
      '5xl': { size: '3rem', lineHeight: '1' },
    },
    // Font weights
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  // Border Radius
  radius: {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },

  // Animation
  animation: {
    duration: {
      fast: '150ms',
      base: '200ms',
      slow: '300ms',
      slower: '500ms',
    },
    easing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },

  // Breakpoints
  breakpoints: {
    xs: '480px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Z-index scale
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modalBackdrop: 40,
    modal: 50,
    popover: 60,
    tooltip: 70,
    notification: 80,
  },
};

// Component-specific design tokens
export const components = {
  // Button variants
  button: {
    variants: {
      primary: 'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500',
      secondary: 'bg-brand-100 text-brand-700 hover:bg-brand-200 focus:ring-brand-500',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      destructive: 'bg-danger text-white hover:bg-danger/90 focus:ring-danger',
      link: 'text-brand-600 underline-offset-4 hover:underline',
    },
    sizes: {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-11 px-6 text-base',
      xl: 'h-12 px-8 text-lg',
    },
    // Mobile-friendly minimum size
    mobileSize: 'min-h-[44px] min-w-[44px]',
  },

  // Form elements
  form: {
    input: {
      base: 'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      error: 'border-danger focus-visible:ring-danger',
      sizes: {
        sm: 'h-8 text-xs',
        md: 'h-10 text-sm',
        lg: 'h-11 text-base',
      },
    },
    label: {
      base: 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      required: 'after:content-["*"] after:ml-0.5 after:text-danger',
    },
    error: {
      base: 'text-sm text-danger mt-1',
    },
  },

  // Card styles
  card: {
    base: 'rounded-lg border bg-card text-card-foreground shadow-sm',
    hover: 'transition-all duration-200 hover:shadow-md hover:border-brand-200',
    interactive: 'cursor-pointer hover:scale-[1.02]',
    padding: {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
  },

  // Table styles
  table: {
    wrapper: 'w-full overflow-x-auto',
    base: 'w-full caption-bottom text-sm',
    header: 'border-b bg-muted/50',
    headerCell: 'h-10 px-4 text-left align-middle font-medium text-muted-foreground',
    body: 'divide-y',
    row: 'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
    cell: 'px-4 py-3 align-middle',
    // Mobile card view
    mobileCard: 'block md:hidden space-y-4',
    mobileCardItem: 'rounded-lg border bg-card p-4 space-y-2',
  },

  // Modal/Dialog
  modal: {
    overlay: 'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
    content: {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-[95vw] md:max-w-2xl',
    },
    padding: 'p-6',
    mobileFullscreen: 'sm:rounded-lg rounded-none sm:max-h-[90vh] h-full sm:h-auto',
  },

  // Loading states
  loading: {
    spinner: 'animate-spin h-5 w-5 text-brand-600',
    skeleton: 'animate-pulse bg-muted rounded-md',
    overlay: 'absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50',
  },

  // Empty states
  empty: {
    wrapper: 'flex flex-col items-center justify-center py-12 px-4 text-center',
    icon: 'h-12 w-12 text-muted-foreground mb-4',
    title: 'text-lg font-semibold text-foreground mb-2',
    description: 'text-sm text-muted-foreground max-w-sm',
  },

  // Status indicators
  status: {
    badge: {
      success: 'bg-success/10 text-success border-success/20',
      warning: 'bg-warning/10 text-warning border-warning/20',
      danger: 'bg-danger/10 text-danger border-danger/20',
      info: 'bg-info/10 text-info border-info/20',
      default: 'bg-muted text-muted-foreground',
    },
    dot: {
      base: 'h-2 w-2 rounded-full',
      success: 'bg-success',
      warning: 'bg-warning',
      danger: 'bg-danger',
      info: 'bg-info',
    },
  },
};

// Utility functions for consistent styling
export const utils = {
  // Get responsive padding
  getResponsivePadding: (size: 'sm' | 'md' | 'lg' = 'md') => {
    const paddingMap = {
      sm: 'p-3 sm:p-4',
      md: 'p-4 sm:p-6',
      lg: 'p-6 sm:p-8',
    };
    return paddingMap[size];
  },

  // Get responsive text size
  getResponsiveText: (size: 'sm' | 'base' | 'lg' = 'base') => {
    const textMap = {
      sm: 'text-xs sm:text-sm',
      base: 'text-sm sm:text-base',
      lg: 'text-base sm:text-lg',
    };
    return textMap[size];
  },

  // Get responsive grid columns
  getResponsiveGrid: (cols: { sm?: number; md?: number; lg?: number; xl?: number }) => {
    let classes = 'grid gap-4';
    if (cols.sm) classes += ` sm:grid-cols-${cols.sm}`;
    if (cols.md) classes += ` md:grid-cols-${cols.md}`;
    if (cols.lg) classes += ` lg:grid-cols-${cols.lg}`;
    if (cols.xl) classes += ` xl:grid-cols-${cols.xl}`;
    return classes;
  },

  // Focus visible styles
  getFocusStyles: () => 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',

  // Get consistent shadow
  getShadow: (size: keyof typeof designSystem.shadows = 'base') => {
    return `shadow-[${designSystem.shadows[size]}]`;
  },
};

// Export specific patterns for common use cases
export const patterns = {
  // Page container
  pageContainer: 'container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
  
  // Section spacing
  sectionSpacing: 'space-y-6 sm:space-y-8',
  
  // Form layout
  formGrid: 'grid gap-4 sm:gap-6',
  formSection: 'space-y-4 sm:space-y-6',
  
  // Card grid
  cardGrid: 'grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  
  // Mobile-first utilities
  hideOnMobile: 'hidden sm:block',
  showOnMobile: 'block sm:hidden',
  
  // Responsive flex
  flexResponsive: 'flex flex-col sm:flex-row gap-4',
  
  // Touch targets
  touchTarget: 'min-h-[44px] min-w-[44px] flex items-center justify-center',
};