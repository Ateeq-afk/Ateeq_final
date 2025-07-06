import React from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationMessageProps {
  type: 'error' | 'success' | 'warning' | 'info';
  message: string;
  className?: string;
}

export function ValidationMessage({ type, message, className }: ValidationMessageProps) {
  const config = {
    error: {
      icon: AlertCircle,
      className: 'text-red-600 dark:text-red-400',
      bgClassName: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    },
    success: {
      icon: CheckCircle,
      className: 'text-green-600 dark:text-green-400',
      bgClassName: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    },
    warning: {
      icon: AlertCircle,
      className: 'text-yellow-600 dark:text-yellow-400',
      bgClassName: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
    },
    info: {
      icon: Info,
      className: 'text-blue-600 dark:text-blue-400',
      bgClassName: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    },
  };

  const { icon: Icon, className: iconClassName } = config[type];

  return (
    <div className={cn("flex items-start gap-2 text-sm", className)}>
      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", iconClassName)} />
      <span className={iconClassName}>{message}</span>
    </div>
  );
}

interface FieldValidationProps {
  error?: string;
  success?: string;
  warning?: string;
  info?: string;
  className?: string;
}

export function FieldValidation({ error, success, warning, info, className }: FieldValidationProps) {
  if (error) {
    return <ValidationMessage type="error" message={error} className={className} />;
  }
  if (success) {
    return <ValidationMessage type="success" message={success} className={className} />;
  }
  if (warning) {
    return <ValidationMessage type="warning" message={warning} className={className} />;
  }
  if (info) {
    return <ValidationMessage type="info" message={info} className={className} />;
  }
  return null;
}

interface ValidatedInputProps {
  label: string;
  error?: string;
  success?: string;
  warning?: string;
  info?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function ValidatedInput({
  label,
  error,
  success,
  warning,
  info,
  required,
  children,
  className,
  id,
}: ValidatedInputProps) {
  const hasValidation = error || success || warning || info;
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={inputId}
        className={cn(
          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          error ? "text-red-600 dark:text-red-400" : "text-foreground"
        )}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          id: inputId,
          className: cn(
            (children as React.ReactElement).props.className,
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            success && "border-green-500 focus:border-green-500 focus:ring-green-500",
            warning && "border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500"
          ),
          'aria-invalid': error ? 'true' : 'false',
          'aria-describedby': hasValidation ? `${inputId}-validation` : undefined,
        })}
      </div>
      
      {hasValidation && (
        <div id={`${inputId}-validation`} aria-live="polite" className="mt-1">
          <FieldValidation error={error} success={success} warning={warning} info={info} />
        </div>
      )}
    </div>
  );
}

// Form section with validation summary
interface FormSectionProps {
  title: string;
  description?: string;
  errors?: string[];
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, description, errors, children, className }: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-lg font-medium text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      
      {errors && errors.length > 0 && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 dark:bg-red-900/20 dark:border-red-800">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Please fix the following errors:
              </h3>
              <ul className="mt-2 text-sm text-red-700 dark:text-red-300 list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
}

// Form validation state management hook
export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  validationRules: Record<keyof T, (value: any) => string | undefined>
) {
  const [data, setData] = React.useState<T>(initialData);
  const [errors, setErrors] = React.useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = React.useState<Partial<Record<keyof T, boolean>>>({});

  const validateField = React.useCallback(
    (field: keyof T, value: any) => {
      const rule = validationRules[field];
      if (rule) {
        const error = rule(value);
        setErrors(prev => ({ ...prev, [field]: error }));
        return !error;
      }
      return true;
    },
    [validationRules]
  );

  const validateAll = React.useCallback(() => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(validationRules).forEach(field => {
      const rule = validationRules[field as keyof T];
      if (rule) {
        const error = rule(data[field as keyof T]);
        if (error) {
          newErrors[field as keyof T] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [data, validationRules]);

  const updateField = React.useCallback(
    (field: keyof T, value: any) => {
      setData(prev => ({ ...prev, [field]: value }));
      
      // Validate if field has been touched
      if (touched[field]) {
        validateField(field, value);
      }
    },
    [touched, validateField]
  );

  const touchField = React.useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, data[field]);
  }, [data, validateField]);

  const reset = React.useCallback(() => {
    setData(initialData);
    setErrors({});
    setTouched({});
  }, [initialData]);

  const hasErrors = Object.values(errors).some(error => !!error);

  return {
    data,
    errors,
    touched,
    hasErrors,
    updateField,
    touchField,
    validateField,
    validateAll,
    reset,
  };
}