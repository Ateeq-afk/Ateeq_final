/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  darkMode: ['class', 'class'],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		fontFamily: {
  			sans: [
  				'Inter',
  				'system-ui',
  				'-apple-system',
  				'sans-serif'
  			],
  			heading: [
  				'DM Sans',
  				'system-ui',
  				'sans-serif'
  			]
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				'50': '#f0f7ff',
  				'100': '#e0eefe',
  				'200': '#bae0fd',
  				'300': '#7cc8fb',
  				'400': '#36aaf5',
  				'500': '#0c8ee3',
  				'600': '#0072c3',
  				'700': '#005a9e',
  				'800': '#004d85',
  				'900': '#00416f',
  				'950': '#002a4a',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			brand: {
  				'50': '#f0f7ff',
  				'100': '#e0eefe',
  				'200': '#bae0fd',
  				'300': '#7cc8fb',
  				'400': '#36aaf5',
  				'500': '#0c8ee3',
  				'600': '#0072c3',
  				'700': '#005a9e',
  				'800': '#004d85',
  				'900': '#00416f',
  				'950': '#002a4a'
  			},
  			success: {
  				'50': '#f0fdf4',
  				'100': '#dcfce7',
  				'200': '#bbf7d0',
  				'300': '#86efac',
  				'400': '#4ade80',
  				'500': '#22c55e',
  				'600': '#16a34a',
  				'700': '#15803d',
  				'800': '#166534',
  				'900': '#14532d',
  				'950': '#052e16'
  			},
  			warning: {
  				'50': '#fffbeb',
  				'100': '#fef3c7',
  				'200': '#fde68a',
  				'300': '#fcd34d',
  				'400': '#fbbf24',
  				'500': '#f59e0b',
  				'600': '#d97706',
  				'700': '#b45309',
  				'800': '#92400e',
  				'900': '#78350f',
  				'950': '#451a03'
  			},
  			danger: {
  				'50': '#fef2f2',
  				'100': '#fee2e2',
  				'200': '#fecaca',
  				'300': '#fca5a5',
  				'400': '#f87171',
  				'500': '#ef4444',
  				'600': '#dc2626',
  				'700': '#b91c1c',
  				'800': '#991b1b',
  				'900': '#7f1d1d',
  				'950': '#450a0a'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		boxShadow: {
  			soft: '0 2px 10px rgba(0, 0, 0, 0.05)',
  			medium: '0 4px 20px rgba(0, 0, 0, 0.08)',
  			hard: '0 8px 30px rgba(0, 0, 0, 0.12)'
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