import React from 'react';
import { UseFormRegisterReturn, FieldError } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { FieldValidation } from './form-validation';

interface FormFieldProps {
  label: string;
  error?: FieldError;
  success?: string;
  warning?: string;
  info?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  id?: string;
  icon?: React.ReactNode;
}

export function FormField({
  label,
  error,
  success,
  warning,
  info,
  required,
  children,
  className,
  id,
  icon,
}: FormFieldProps) {
  const hasValidation = error || success || warning || info;
  const inputId = id || `field-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={inputId}
        className={cn(
          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block",
          error ? "text-red-600 dark:text-red-400" : "text-foreground"
        )}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        {React.cloneElement(children as React.ReactElement, {
          id: inputId,
          className: cn(
            (children as React.ReactElement).props.className,
            icon && "pl-10",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-600",
            success && "border-green-500 focus:border-green-500 focus:ring-green-500 dark:border-green-600",
            warning && "border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500 dark:border-yellow-600"
          ),
          'aria-invalid': error ? 'true' : 'false',
          'aria-describedby': hasValidation ? `${inputId}-validation` : undefined,
        })}
      </div>
      
      {hasValidation && (
        <div id={`${inputId}-validation`} aria-live="polite" className="mt-1">
          <FieldValidation 
            error={error?.message} 
            success={success} 
            warning={warning} 
            info={info} 
          />
        </div>
      )}
    </div>
  );
}

// Select field wrapper
interface FormSelectProps {
  label: string;
  error?: FieldError;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function FormSelect({
  label,
  error,
  required,
  children,
  className,
  id,
}: FormSelectProps) {
  const inputId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={inputId}
        className={cn(
          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block",
          error ? "text-red-600 dark:text-red-400" : "text-foreground"
        )}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          id: inputId,
          'aria-invalid': error ? 'true' : 'false',
          'aria-describedby': error ? `${inputId}-validation` : undefined,
        })}
      </div>
      
      {error && (
        <div id={`${inputId}-validation`} aria-live="polite" className="mt-1">
          <FieldValidation error={error.message} />
        </div>
      )}
    </div>
  );
}