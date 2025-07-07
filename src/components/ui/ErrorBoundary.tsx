import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Bug, 
  MessageCircle,
  ArrowLeft,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleGoBack = () => {
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default Apple-inspired error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-2xl"
          >
            <Card className="border-0 shadow-2xl shadow-black/10 bg-white/80 backdrop-blur-xl">
              <CardContent className="p-12 text-center">
                {/* Error Icon with Animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center"
                >
                  <AlertTriangle className="w-12 h-12 text-red-500" />
                </motion.div>

                {/* Error Message */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-8"
                >
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-red-600 bg-clip-text text-transparent mb-4">
                    Something went wrong
                  </h1>
                  <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto">
                    We encountered an unexpected error. Our team has been notified and is working on a fix.
                  </p>
                </motion.div>

                {/* Error Details (Development Only) */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ delay: 0.4 }}
                    className="mb-8"
                  >
                    <div className="bg-gray-50 rounded-xl p-6 text-left">
                      <div className="flex items-center gap-2 mb-3">
                        <Bug className="w-4 h-4 text-gray-500" />
                        <Badge variant="outline" className="text-xs">
                          Development Mode
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Error:</p>
                          <p className="text-sm text-red-600 font-mono bg-red-50 p-2 rounded border">
                            {this.state.error.message}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Stack Trace:</p>
                          <pre className="text-xs text-gray-600 bg-gray-100 p-3 rounded border overflow-auto max-h-32">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                  <Button
                    onClick={this.handleRetry}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all px-8"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={this.handleGoBack}
                    className="border-gray-300 hover:border-gray-400 px-8"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={this.handleGoHome}
                    className="border-gray-300 hover:border-gray-400 px-8"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </Button>
                </motion.div>

                {/* Help Text */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-8 pt-6 border-t border-gray-200"
                >
                  <p className="text-sm text-gray-500">
                    If this problem persists, please{' '}
                    <button
                      onClick={() => window.open('mailto:support@desicargo.com')}
                      className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
                    >
                      contact support
                      <MessageCircle className="w-3 h-3" />
                    </button>
                  </p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional component wrapper for easier usage
export const ErrorBoundaryWrapper: React.FC<{ children: ReactNode; onError?: (error: Error, errorInfo: ErrorInfo) => void }> = ({ 
  children, 
  onError 
}) => {
  return (
    <ErrorBoundary onError={onError}>
      {children}
    </ErrorBoundary>
  );
};

// Simple error fallback component
export const SimpleErrorFallback: React.FC<{ error?: Error; resetError?: () => void }> = ({ 
  error, 
  resetError 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <Zap className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        Unable to load this section
      </h2>
      <p className="text-gray-600 mb-4 max-w-sm">
        We're experiencing some technical difficulties. Please try again.
      </p>
      {resetError && (
        <Button
          onClick={resetError}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
};

export default ErrorBoundary;