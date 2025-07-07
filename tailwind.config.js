/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Apple-inspired color system
        gray: {
          50: '#F5F5F7',
          100: '#E8E8ED',
          200: '#D2D2D7',
          300: '#B7B7BE',
          400: '#98989F',
          500: '#86868B',
          600: '#6E6E73',
          700: '#48484A',
          800: '#1D1D1F',
          900: '#000000',
        },
        blue: {
          50: '#E3F2FF',
          100: '#C7E5FF',
          200: '#8FC8FF',
          300: '#5CABFF',
          400: '#2A8EFF',
          500: '#007AFF', // Primary blue
          600: '#0051D5',
          700: '#003DA5',
          800: '#002970',
          900: '#001A4A',
        },
        green: {
          50: '#E8F5E8',
          100: '#C7E7C7',
          200: '#A3D9A3',
          300: '#7DCA7D',
          400: '#5CB85C',
          500: '#34C759', // Success green
          600: '#2DA44E',
          700: '#228A3C',
          800: '#1B6B2F',
          900: '#144D23',
        },
        yellow: {
          50: '#FFF8E1',
          100: '#FFECB3',
          200: '#FFE082',
          300: '#FFD54F',
          400: '#FFCA28',
          500: '#FFB800', // Warning yellow
          600: '#FF9500',
          700: '#F57C00',
          800: '#E65100',
          900: '#BF360C',
        },
        red: {
          50: '#FFE5E5',
          100: '#FFCCCC',
          200: '#FF9999',
          300: '#FF6666',
          400: '#FF3B30',
          500: '#FF3B30', // Error red
          600: '#D70015',
          700: '#B80012',
          800: '#8B0000',
          900: '#5C0000',
        },
        purple: {
          50: '#F5E6FF',
          100: '#E6CCFF',
          200: '#D4A5FF',
          300: '#BF7FFF',
          400: '#AA5CFF',
          500: '#AF52DE', // Accent purple
          600: '#8E36D6',
          700: '#6B24B2',
          800: '#4C1A80',
          900: '#2E0F4F',
        },
        // Enhanced semantic colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#007AFF",
          50: "#E3F2FF",
          100: "#C7E5FF", 
          500: "#007AFF",
          600: "#0051D5",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F5F5F7",
          50: "#FAFAFA",
          100: "#F5F5F7",
          200: "#E8E8ED",
          foreground: "#1D1D1F",
        },
        destructive: {
          DEFAULT: "#FF3B30",
          50: "#FFE5E5",
          500: "#FF3B30",
          600: "#D70015",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F5F5F7",
          50: "#FAFAFA",
          100: "#F5F5F7",
          foreground: "#86868B",
        },
        accent: {
          DEFAULT: "#007AFF",
          50: "#E3F2FF",
          500: "#007AFF",
          foreground: "#FFFFFF",
        },
        // Content hierarchy colors
        content: {
          primary: "#1D1D1F",
          secondary: "#48484A", 
          tertiary: "#86868B",
          quaternary: "#C7C7CC",
        },
        // Surface colors
        surface: {
          primary: "#FFFFFF",
          secondary: "#F5F5F7",
          tertiary: "#E8E8ED",
          overlay: "rgba(0, 0, 0, 0.1)",
        },
        brand: {
          50: '#E3F2FF',
          100: '#C7E5FF',
          200: '#8FC8FF',
          300: '#5CABFF',
          400: '#2A8EFF',
          500: '#007AFF',
          600: '#0051D5',
          700: '#003DA5',
          800: '#002970',
          900: '#001A4A',
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#1D1D1F",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#1D1D1F",
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'sans-serif'
        ],
        mono: [
          '"SF Mono"',
          'Monaco',
          'Menlo',
          'Consolas',
          '"Courier New"',
          'monospace'
        ],
      },
      fontSize: {
        // Apple-inspired type scale with enhanced hierarchy
        'xs': ['11px', { lineHeight: '16px', letterSpacing: '0.02em', fontWeight: '400' }],
        'sm': ['13px', { lineHeight: '18px', letterSpacing: '-0.003em', fontWeight: '400' }],
        'base': ['15px', { lineHeight: '22px', letterSpacing: '-0.009em', fontWeight: '400' }],
        'lg': ['17px', { lineHeight: '24px', letterSpacing: '-0.012em', fontWeight: '400' }],
        'xl': ['19px', { lineHeight: '26px', letterSpacing: '-0.014em', fontWeight: '500' }],
        '2xl': ['22px', { lineHeight: '30px', letterSpacing: '-0.017em', fontWeight: '600' }],
        '3xl': ['28px', { lineHeight: '34px', letterSpacing: '-0.019em', fontWeight: '600' }],
        '4xl': ['34px', { lineHeight: '38px', letterSpacing: '-0.021em', fontWeight: '700' }],
        '5xl': ['44px', { lineHeight: '48px', letterSpacing: '-0.022em', fontWeight: '700' }],
        '6xl': ['56px', { lineHeight: '58px', letterSpacing: '-0.022em', fontWeight: '800' }],
        '7xl': ['72px', { lineHeight: '76px', letterSpacing: '-0.022em', fontWeight: '800' }],
        // Display text
        'display-sm': ['30px', { lineHeight: '36px', letterSpacing: '-0.021em', fontWeight: '700' }],
        'display-md': ['36px', { lineHeight: '44px', letterSpacing: '-0.022em', fontWeight: '700' }],
        'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.022em', fontWeight: '800' }],
        'display-xl': ['60px', { lineHeight: '68px', letterSpacing: '-0.022em', fontWeight: '800' }],
        // Body text
        'body-sm': ['14px', { lineHeight: '20px', letterSpacing: '-0.006em', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '24px', letterSpacing: '-0.011em', fontWeight: '400' }],
        'body-lg': ['18px', { lineHeight: '28px', letterSpacing: '-0.014em', fontWeight: '400' }],
        // Labels and captions
        'label-sm': ['12px', { lineHeight: '16px', letterSpacing: '0.01em', fontWeight: '500' }],
        'label-md': ['14px', { lineHeight: '20px', letterSpacing: '-0.006em', fontWeight: '500' }],
        'caption': ['12px', { lineHeight: '16px', letterSpacing: '0.02em', fontWeight: '400' }],
      },
      spacing: {
        // Enhanced spacing scale for better hierarchy
        '0': '0px',
        'px': '1px',
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '3.5': '14px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '9': '36px',
        '10': '40px',
        '11': '44px',
        '12': '48px',
        '14': '56px',
        '16': '64px',
        '18': '72px',
        '20': '80px',
        '24': '96px',
        '28': '112px',
        '32': '128px',
        '36': '144px',
        '40': '160px',
        '44': '176px',
        '48': '192px',
        '52': '208px',
        '56': '224px',
        '60': '240px',
        '64': '256px',
        '72': '288px',
        '80': '320px',
        '96': '384px',
        // Semantic spacing
        'section': '80px',
        'container': '120px',
        'content': '160px',
      },
      borderRadius: {
        'none': '0',
        'sm': '6px',
        DEFAULT: '10px',
        'md': '12px',
        'lg': '14px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '32px',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'md': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'lg': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '2xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'none': '0 0 #0000',
      },
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'pulse-subtle': {
  				'0%, 100%': {
  					opacity: 1
  				},
  				'50%': {
  					opacity: 0.8
  				}
  			},
  			'float': {
  				'0%, 100%': {
  					transform: 'translateY(0)'
  				},
  				'50%': {
  					transform: 'translateY(-5px)'
  				}
  			},
  			'slide-up': {
  				from: { opacity: 0, transform: 'translateY(10px)' },
  				to: { opacity: 1, transform: 'translateY(0)' }
  			},
  			'slide-down': {
  				from: { opacity: 0, transform: 'translateY(-10px)' },
  				to: { opacity: 1, transform: 'translateY(0)' }
  			},
  			'slide-left': {
  				from: { opacity: 0, transform: 'translateX(10px)' },
  				to: { opacity: 1, transform: 'translateX(0)' }
  			},
  			'slide-right': {
  				from: { opacity: 0, transform: 'translateX(-10px)' },
  				to: { opacity: 1, transform: 'translateX(0)' }
  			},
  			'fade': {
  				from: { opacity: 0 },
  				to: { opacity: 1 }
  			},
  			'scale': {
  				from: { opacity: 0, transform: 'scale(0.95)' },
  				to: { opacity: 1, transform: 'scale(1)' }
  			},
  			'shimmer': {
  				'0%': { transform: 'translateX(-100%)' },
  				'100%': { transform: 'translateX(100%)' }
  			},
  			'glow': {
  				from: { boxShadow: '0 0 5px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)' },
  				to: { boxShadow: '0 0 10px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.5)' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'pulse-subtle': 'pulse-subtle 3s ease-in-out infinite',
  			'float': 'float 3s ease-in-out infinite',
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'slide-up': 'slide-up 0.5s ease-out',
  			'slide-down': 'slide-down 0.5s ease-out',
  			'slide-left': 'slide-left 0.5s ease-out',
  			'slide-right': 'slide-right 0.5s ease-out',
  			'fade': 'fade 0.5s ease-out',
  			'scale': 'scale 0.2s ease-out',
  			'spin-slow': 'spin 3s linear infinite',
  			'shimmer': 'shimmer 2s infinite linear',
  			'glow': 'glow 2s ease-in-out infinite alternate'
  		},
  		backgroundImage: {
  			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  			'gradient-subtle': 'linear-gradient(to right, var(--tw-gradient-stops))',
  			'gradient-premium': 'linear-gradient(135deg, var(--tw-gradient-stops))',
  			'gradient-mesh': 'radial-gradient(at 40% 20%, hsla(210, 89%, 56%, 0.3) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(217, 91%, 60%, 0.2) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(221, 83%, 53%, 0.2) 0px, transparent 50%), radial-gradient(at 80% 50%, hsla(210, 78%, 46%, 0.15) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(210, 89%, 38%, 0.2) 0px, transparent 50%), radial-gradient(at 80% 100%, hsla(210, 89%, 31%, 0.15) 0px, transparent 50%), radial-gradient(at 0% 0%, hsla(210, 86%, 26%, 0.1) 0px, transparent 50%)'
  		},
  		transitionDuration: {
  			'400': '400ms',
  			'600': '600ms',
  			'800': '800ms',
  			'900': '900ms'
  		},
  		transitionTimingFunction: {
  			'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  			'smooth-out': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}