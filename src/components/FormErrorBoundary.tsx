import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';

interface FormErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
  formName?: string;
}

function FormErrorFallback({ error, resetErrorBoundary, formName = 'form' }: FormErrorFallbackProps) {
  return (
    <div className="border border-red-200 rounded-lg bg-red-50 p-6">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Form Error
          </h3>
          <p className="mt-1 text-sm text-red-700">
            The {formName} encountered an error and couldn't be displayed properly.
          </p>
          
          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-2">
              <summary className="text-xs cursor-pointer text-red-600 font-medium">
                Error Details (Development)
              </summary>
              <div className="mt-1 text-xs text-red-600 font-mono bg-red-100 p-2 rounded">
                {error.message}
              </div>
            </details>
          )}
        </div>
        
        {resetErrorBoundary && (
          <div className="flex-shrink-0">
            <button
              onClick={resetErrorBoundary}
              className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface FormErrorBoundaryProps {
  children: React.ReactNode;
  formName?: string;
}

export function FormErrorBoundary({ children, formName }: FormErrorBoundaryProps) {
  return (
    <ErrorBoundary 
      fallback={<FormErrorFallback formName={formName} />}
      showDetails={false}
    >
      {children}
    </ErrorBoundary>
  );
}

export default FormErrorBoundary;