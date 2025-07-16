import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import * as Sentry from '@sentry/react';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './components/notifications/NotificationProvider';
import { ThemeProvider } from './contexts/ThemeContext';
import { BranchSelectionProvider } from './contexts/BranchSelectionContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// Initialize Sentry
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || 'YOUR_FRONTEND_DSN_HERE',
  environment: import.meta.env.MODE || 'development',
  integrations: [
    Sentry.browserTracingIntegration({
      // Set tracingOrigins to control what URLs are traced
      tracingOrigins: ['localhost', /^https:\/\/yourserver\.io\/api/],
      // Trace fetch/XHR requests
      tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
    }),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  // Performance Monitoring
  tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
  // Session Replay
  replaysSessionSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,
  // Release tracking
  release: import.meta.env.VITE_APP_VERSION || '1.0.0',
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    if (event.request?.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }
    // Don't send events in development unless explicitly enabled
    if (import.meta.env.MODE === 'development' && !import.meta.env.VITE_SENTRY_DSN) {
      return null;
    }
    return event;
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorBoundary showDetails={true} />} showDialog>
      <ErrorBoundary showDetails={true}>
        <QueryClientProvider client={queryClient}>
          <NotificationProvider>
            <AuthProvider>
              <ThemeProvider>
                <BranchSelectionProvider>
                  <TooltipProvider>
                    <App />
                    <Toaster position="top-right" richColors />
                  </TooltipProvider>
                </BranchSelectionProvider>
              </ThemeProvider>
            </AuthProvider>
          </NotificationProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </Sentry.ErrorBoundary>
  </StrictMode>
);