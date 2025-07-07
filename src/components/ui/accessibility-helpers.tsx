import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Skip to main content link
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4",
        "z-50 bg-blue-600 text-white px-4 py-2 rounded-md",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      )}
    >
      Skip to main content
    </a>
  );
}

// Screen reader only text
export function ScreenReaderOnly({ 
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn('sr-only', className)}>
      {children}
    </span>
  );
}

// Accessible button with proper focus handling
export function AccessibleButton({
  children,
  onClick,
  disabled = false,
  variant = 'default',
  size = 'default',
  ariaLabel,
  ariaDescribedBy,
  className = '',
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'default' | 'lg';
  ariaLabel?: string;
  ariaDescribedBy?: string;
  className?: string;
  [key: string]: any;
}) {
  const variants = {
    default: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    ghost: 'text-gray-700 hover:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    default: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors duration-200',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// Focus trap for modals and dropdowns
export function FocusTrap({
  children,
  enabled = true,
  className = ''
}: {
  children: React.ReactNode;
  enabled?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [enabled]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

// Accessible form field with proper labeling
export function AccessibleField({
  label,
  children,
  error,
  hint,
  required = false,
  id,
  className = ''
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
  id: string;
  className?: string;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('space-y-2', className)}>
      <label 
        htmlFor={id}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      {hint && (
        <p id={hintId} className="text-sm text-gray-600">
          {hint}
        </p>
      )}
      
      <div>
        {React.cloneElement(children as React.ReactElement, {
          id,
          'aria-describedby': describedBy,
          'aria-invalid': error ? 'true' : undefined,
          required
        })}
      </div>
      
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// Accessible modal with proper ARIA attributes
export function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Trap focus in modal
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <FocusTrap enabled={isOpen}>
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={cn(
            'bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden',
            className
          )}
        >
          <div className="p-6 border-b border-gray-200">
            <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
              {title}
            </h2>
          </div>
          <div className="p-6 overflow-y-auto">
            {children}
          </div>
        </motion.div>
      </FocusTrap>
    </div>
  );
}

// Accessible dropdown menu
export function AccessibleDropdown({
  trigger,
  children,
  align = 'left',
  className = ''
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
      >
        {trigger}
      </div>
      
      {isOpen && (
        <div
          role="menu"
          className={cn(
            'absolute z-10 mt-2 bg-white rounded-md shadow-lg border border-gray-200',
            'focus:outline-none',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          <FocusTrap enabled={isOpen}>
            {children}
          </FocusTrap>
        </div>
      )}
    </div>
  );
}

// Accessible table with proper headers and navigation
export function AccessibleTable({
  caption,
  headers,
  children,
  className = ''
}: {
  caption?: string;
  headers: string[];
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse border border-gray-300" role="table">
        {caption && (
          <caption className="p-4 text-lg font-medium text-gray-900 text-left">
            {caption}
          </caption>
        )}
        <thead>
          <tr role="row">
            {headers.map((header, index) => (
              <th
                key={index}
                role="columnheader"
                className="p-3 text-left bg-gray-50 border border-gray-300 font-medium text-gray-900"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup">
          {children}
        </tbody>
      </table>
    </div>
  );
}

// Live region for announcements
export function LiveRegion({
  children,
  priority = 'polite',
  className = ''
}: {
  children: React.ReactNode;
  priority?: 'polite' | 'assertive';
  className?: string;
}) {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  );
}

// Keyboard navigation helper
export function useKeyboardNavigation(
  items: HTMLElement[],
  orientation: 'horizontal' | 'vertical' = 'vertical'
) {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
    const { key } = e;
    const isVertical = orientation === 'vertical';
    
    let nextIndex = currentIndex;

    switch (key) {
      case isVertical ? 'ArrowDown' : 'ArrowRight':
        e.preventDefault();
        nextIndex = (currentIndex + 1) % items.length;
        break;
      case isVertical ? 'ArrowUp' : 'ArrowLeft':
        e.preventDefault();
        nextIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = items.length - 1;
        break;
      default:
        return;
    }

    setCurrentIndex(nextIndex);
    items[nextIndex]?.focus();
  }, [currentIndex, items, orientation]);

  React.useEffect(() => {
    const currentItem = items[currentIndex];
    if (currentItem) {
      currentItem.addEventListener('keydown', handleKeyDown);
      return () => currentItem.removeEventListener('keydown', handleKeyDown);
    }
  }, [currentIndex, handleKeyDown, items]);

  return { currentIndex, setCurrentIndex };
}

// Color contrast checker (for development)
export function ColorContrastChecker({
  background,
  foreground,
  level = 'AA'
}: {
  background: string;
  foreground: string;
  level?: 'AA' | 'AAA';
}) {
  const checkContrast = () => {
    // This is a simplified version - in production, use a proper contrast calculation library
    const minRatio = level === 'AAA' ? 7 : 4.5;
    // Implementation would calculate actual contrast ratio
    return { ratio: 0, passes: false };
  };

  const result = checkContrast();

  return (
    <div className="p-2 text-xs border rounded">
      <div className="font-medium">
        Contrast Ratio: {result.ratio.toFixed(2)}:1
      </div>
      <div className={result.passes ? 'text-green-600' : 'text-red-600'}>
        {result.passes ? `Passes ${level}` : `Fails ${level}`}
      </div>
    </div>
  );
}