import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './components/notifications/NotificationProvider';
import { ThemeProvider } from './contexts/ThemeContext';
import { BranchSelectionProvider } from './contexts/BranchSelectionContext';
import { ErrorBoundary } from './components/ErrorBoundary';

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
  </StrictMode>
);