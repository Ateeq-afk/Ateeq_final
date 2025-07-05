import React from 'react';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';

interface RouteErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

function RouteErrorFallback({ error, resetErrorBoundary }: RouteErrorFallbackProps) {
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-50 rounded-full">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          
          <div className="mt-6 text-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Page Error
            </h1>
            <p className="mt-2 text-gray-600">
              This page encountered an error and couldn't be displayed properly.
            </p>
            
            {error && (
              <div className="mt-4 text-left">
                <details className="bg-gray-50 rounded p-3">
                  <summary className="text-sm font-medium cursor-pointer">
                    Error Details
                  </summary>
                  <div className="mt-2 text-xs text-red-600 font-mono">
                    {error.message}
                  </div>
                </details>
              </div>
            )}
          </div>

          <div className="mt-8 flex space-x-3">
            <button
              onClick={handleGoBack}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </button>
            
            {resetErrorBoundary && (
              <button
                onClick={resetErrorBoundary}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface RouteErrorBoundaryProps {
  children: React.ReactNode;
}

export function RouteErrorBoundary({ children }: RouteErrorBoundaryProps) {
  return (
    <ErrorBoundary 
      fallback={<RouteErrorFallback />}
      showDetails={true}
    >
      {children}
    </ErrorBoundary>
  );
}

export default RouteErrorBoundary;