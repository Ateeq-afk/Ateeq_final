import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RippleEffect {
  id: string;
  x: number;
  y: number;
  timestamp: number;
}

interface TouchRippleProps {
  children: React.ReactNode;
  color?: string;
  duration?: number;
  disabled?: boolean;
  className?: string;
  rippleClassName?: string;
  onRipple?: (x: number, y: number) => void;
}

export const TouchRipple: React.FC<TouchRippleProps> = ({
  children,
  color = 'rgba(59, 130, 246, 0.3)', // Blue-500 with opacity
  duration = 600,
  disabled = false,
  className = '',
  rippleClassName = '',
  onRipple
}) => {
  const [ripples, setRipples] = useState<RippleEffect[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const rippleIdRef = useRef(0);

  const addRipple = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (disabled || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    let clientX: number, clientY: number;

    // Handle both mouse and touch events
    if ('touches' in event && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else if ('clientX' in event) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      return;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const newRipple: RippleEffect = {
      id: `ripple-${rippleIdRef.current++}`,
      x,
      y,
      timestamp: Date.now()
    };

    setRipples(prev => [...prev, newRipple]);
    onRipple?.(x, y);

    // Clean up ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, duration);
  }, [disabled, onRipple, duration]);

  const handleInteractionStart = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    addRipple(event);
  }, [addRipple]);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      onMouseDown={handleInteractionStart}
      onTouchStart={handleInteractionStart}
    >
      {children}
      
      {/* Ripple effects */}
      <div className="absolute inset-0 pointer-events-none">
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.div
              key={ripple.id}
              initial={{
                x: ripple.x,
                y: ripple.y,
                scale: 0,
                opacity: 0.6
              }}
              animate={{
                scale: 4,
                opacity: 0
              }}
              exit={{
                opacity: 0
              }}
              transition={{
                duration: duration / 1000,
                ease: [0.4, 0, 0.2, 1]
              }}
              className={cn(
                "absolute w-8 h-8 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none",
                rippleClassName
              )}
              style={{
                backgroundColor: color,
                transformOrigin: 'center'
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Enhanced button with built-in ripple effect
interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  rippleColor?: string;
  children: React.ReactNode;
}

export const RippleButton: React.FC<RippleButtonProps> = ({
  variant = 'primary',
  size = 'md',
  rippleColor,
  className = '',
  children,
  disabled,
  ...props
}) => {
  const variants = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg',
    secondary: 'bg-gray-500 hover:bg-gray-600 text-white shadow-md hover:shadow-lg',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
    outline: 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const defaultRippleColors = {
    primary: 'rgba(255, 255, 255, 0.3)',
    secondary: 'rgba(255, 255, 255, 0.3)',
    ghost: 'rgba(59, 130, 246, 0.2)',
    outline: 'rgba(59, 130, 246, 0.2)'
  };

  return (
    <TouchRipple
      color={rippleColor || defaultRippleColors[variant]}
      disabled={disabled}
      className={cn(
        "relative inline-flex items-center justify-center",
        "font-medium rounded-lg transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "active:scale-95",
        variants[variant],
        sizes[size],
        className
      )}
    >
      <button
        disabled={disabled}
        className="w-full h-full flex items-center justify-center"
        {...props}
      >
        {children}
      </button>
    </TouchRipple>
  );
};

// Ripple card component
interface RippleCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  rippleColor?: string;
  className?: string;
  disabled?: boolean;
}

export const RippleCard: React.FC<RippleCardProps> = ({
  children,
  onClick,
  rippleColor = 'rgba(59, 130, 246, 0.1)',
  className = '',
  disabled = false
}) => {
  return (
    <TouchRipple
      color={rippleColor}
      disabled={disabled}
      className={cn(
        "cursor-pointer transition-all duration-200",
        "hover:shadow-md active:scale-[0.99]",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      onRipple={() => onClick?.()}
    >
      <div className="w-full h-full">
        {children}
      </div>
    </TouchRipple>
  );
};

export default TouchRipple;