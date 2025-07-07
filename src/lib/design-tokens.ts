// Enterprise Design Tokens for DesiCargo
// This file defines the design tokens that establish a consistent visual language

export const designTokens = {
  // Color Palette - Professional Enterprise Colors
  colors: {
    // Primary - Deep Professional Blue
    primary: {
      50: '#E6F0FF',
      100: '#CCE0FF',
      200: '#99C2FF',
      300: '#66A3FF',
      400: '#3385FF',
      500: '#0066FF', // Main primary
      600: '#0052CC',
      700: '#003D99',
      800: '#002966',
      900: '#001433',
    },
    
    // Secondary - Sophisticated Teal
    secondary: {
      50: '#E6F5F5',
      100: '#CCEBEB',
      200: '#99D6D6',
      300: '#66C2C2',
      400: '#33ADAD',
      500: '#009999',
      600: '#007A7A',
      700: '#005C5C',
      800: '#003D3D',
      900: '#001F1F',
    },
    
    // Accent - Premium Gold
    accent: {
      50: '#FFF9E6',
      100: '#FFF3CC',
      200: '#FFE799',
      300: '#FFDB66',
      400: '#FFCF33',
      500: '#FFC300',
      600: '#CC9C00',
      700: '#997500',
      800: '#664E00',
      900: '#332700',
    },
    
    // Neutral - Professional Grays
    neutral: {
      50: '#FAFBFC',
      100: '#F4F6F8',
      200: '#E9ECF0',
      300: '#DDE1E6',
      400: '#C1C7CE',
      500: '#8D96A0',
      600: '#5E6C7E',
      700: '#394455',
      800: '#1D2635',
      900: '#0F1419',
      950: '#060B12',
    },
    
    // Semantic Colors
    success: {
      50: '#E6F7F0',
      100: '#CCEFE1',
      200: '#99DFC3',
      300: '#66CFA5',
      400: '#33BF87',
      500: '#00AF69',
      600: '#008C54',
      700: '#00693F',
      800: '#00462A',
      900: '#002315',
    },
    
    warning: {
      50: '#FFF5E6',
      100: '#FFEBCC',
      200: '#FFD699',
      300: '#FFC266',
      400: '#FFAD33',
      500: '#FF9900',
      600: '#CC7A00',
      700: '#995C00',
      800: '#663D00',
      900: '#331F00',
    },
    
    error: {
      50: '#FFEBE9',
      100: '#FFD6D3',
      200: '#FFADA7',
      300: '#FF857B',
      400: '#FF5C4F',
      500: '#FF3333',
      600: '#CC2929',
      700: '#991F1F',
      800: '#661414',
      900: '#330A0A',
    },
    
    info: {
      50: '#E6F3FF',
      100: '#CCE7FF',
      200: '#99CFFF',
      300: '#66B7FF',
      400: '#339FFF',
      500: '#0087FF',
      600: '#006CCC',
      700: '#005199',
      800: '#003666',
      900: '#001B33',
    },
  },
  
  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      mono: ['JetBrains Mono', 'SF Mono', 'Monaco', 'Consolas', 'monospace'],
      display: ['Cal Sans', 'Inter', 'sans-serif'],
    },
    
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
      '6xl': '3.75rem', // 60px
    },
    
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    
    lineHeight: {
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
  },
  
  // Spacing System (8px base)
  spacing: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
    24: '6rem',    // 96px
  },
  
  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    base: '0.5rem',  // 8px
    md: '0.625rem',  // 10px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },
  
  // Shadows (Sophisticated and subtle)
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
    base: '0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03)',
    md: '0 8px 10px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
    lg: '0 12px 16px -4px rgba(0, 0, 0, 0.08), 0 6px 8px -2px rgba(0, 0, 0, 0.03)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    
    // Colored shadows for interactive elements
    primary: '0 4px 14px 0 rgba(0, 102, 255, 0.15)',
    success: '0 4px 14px 0 rgba(0, 175, 105, 0.15)',
    error: '0 4px 14px 0 rgba(255, 51, 51, 0.15)',
  },
  
  // Transitions
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
    
    easing: {
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
  
  // Z-index layers
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    modal: 1200,
    popover: 1300,
    tooltip: 1400,
    notification: 1500,
  },
  
  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // Animation keyframes
  animations: {
    shimmer: {
      '0%': { backgroundPosition: '-200% 0' },
      '100%': { backgroundPosition: '200% 0' },
    },
    pulse: {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 },
    },
    bounce: {
      '0%, 100%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-25%)' },
    },
    slideIn: {
      '0%': { transform: 'translateX(-100%)', opacity: 0 },
      '100%': { transform: 'translateX(0)', opacity: 1 },
    },
  },
};

// Export helper functions for easy access
export const getColor = (path: string): string => {
  const keys = path.split('.');
  let value: any = designTokens.colors;
  
  for (const key of keys) {
    value = value[key];
    if (!value) return '#000000';
  }
  
  return value;
};

export const getSpacing = (size: keyof typeof designTokens.spacing): string => 
  designTokens.spacing[size];

export const getBorderRadius = (size: keyof typeof designTokens.borderRadius): string => 
  designTokens.borderRadius[size];

export const getShadow = (size: keyof typeof designTokens.shadows): string => 
  designTokens.shadows[size];