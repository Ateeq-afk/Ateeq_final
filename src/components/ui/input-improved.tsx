import * as React from "react"
import { cn } from "@/lib/utils"
import { AlertCircle, Check, Eye, EyeOff, X } from "lucide-react"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  success?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  onClear?: () => void
  showPasswordToggle?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    error, 
    success,
    leftIcon,
    rightIcon,
    onClear,
    showPasswordToggle,
    disabled,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const inputType = showPasswordToggle && type === "password" 
      ? (showPassword ? "text" : "password") 
      : type

    const baseClasses = cn(
      "flex h-11 w-full rounded-md border bg-background text-sm ring-offset-background transition-colors duration-200",
      "placeholder:text-muted-foreground",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "file:border-0 file:bg-transparent file:text-sm file:font-medium",
      // Touch-friendly padding
      "px-3 py-2",
      // Mobile-friendly text size
      "text-base sm:text-sm",
      // State-based styling
      {
        "border-input hover:border-brand-300 focus-visible:ring-brand-500": !error && !success,
        "border-danger hover:border-danger focus-visible:ring-danger": error,
        "border-success hover:border-success focus-visible:ring-success": success,
        "pl-10": leftIcon,
        "pr-10": rightIcon || onClear || showPasswordToggle,
      },
      className
    )

    const showClearButton = onClear && props.value && !disabled
    const showPasswordToggleButton = showPasswordToggle && type === "password" && !disabled

    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {leftIcon}
          </div>
        )}
        
        <input
          type={inputType}
          className={baseClasses}
          ref={ref}
          disabled={disabled}
          aria-invalid={error}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        />
        
        {/* Right side icons */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* Status icons */}
          {error && !showClearButton && !showPasswordToggleButton && (
            <AlertCircle className="h-4 w-4 text-danger" aria-hidden="true" />
          )}
          {success && !showClearButton && !showPasswordToggleButton && (
            <Check className="h-4 w-4 text-success" aria-hidden="true" />
          )}
          
          {/* Clear button */}
          {showClearButton && (
            <button
              type="button"
              onClick={onClear}
              className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear input"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {/* Password toggle */}
          {showPasswordToggleButton && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
          
          {/* Custom right icon */}
          {rightIcon && !showClearButton && !showPasswordToggleButton && (
            <div className="text-muted-foreground pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
      </div>
    )
  }
)
Input.displayName = "Input"

// Input Group Component for consistent spacing
interface InputGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
}

const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  ({ className, label, error, hint, required, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
            {required && (
              <span className="ml-0.5 text-danger" aria-label="required">*</span>
            )}
          </label>
        )}
        {children}
        {error && (
          <p className="text-sm text-danger flex items-center gap-1" role="alert">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-sm text-muted-foreground">{hint}</p>
        )}
      </div>
    )
  }
)
InputGroup.displayName = "InputGroup"

// Search Input Component
interface SearchInputProps extends Omit<InputProps, 'type'> {
  onSearch?: (value: string) => void
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onSearch, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && onSearch) {
        onSearch(e.currentTarget.value)
      }
    }

    return (
      <Input
        ref={ref}
        type="search"
        className={cn("pr-4", className)}
        onKeyDown={handleKeyDown}
        {...props}
      />
    )
  }
)
SearchInput.displayName = "SearchInput"

export { Input, InputGroup, SearchInput }