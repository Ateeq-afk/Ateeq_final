import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense, useState, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import RouteErrorBoundary from './components/RouteErrorBoundary';
import { SearchProvider } from './contexts/SearchContext';
import { RealtimeProvider } from './contexts/RealtimeContext';
import AppleCommandPalette from './components/search/AppleCommandPalette';
import { setupGlobalErrorHandlers } from './utils/errorHandler';

// Lazy load components for code splitting
const Dashboard = lazy(() => import('./components/Dashboard'));
const TrackingPage = lazy(() => import('./pages/TrackingPage'));
const LandingPage = lazy(() => import('./pages/AppleLandingPage'));
const SignInPage = lazy(() => import('./pages/SignInPage'));
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const OrganizationSignIn = lazy(() => import('./pages/auth/OrganizationSignIn').then(m => ({ default: m.OrganizationSignIn })));
const CreateOrganizationPage = lazy(() => import('./pages/CreateOrganizationPage'));
const SuperAdminBranchPage = lazy(() => import('./pages/SuperAdminBranchPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));

// Apple-inspired loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
    <div className="flex flex-col items-center gap-6 text-center max-w-sm" role="status" aria-live="polite">
      <div className="relative">
        <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-100 to-blue-200" />
        <div className="absolute top-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-400" />
      </div>
      <div>
        <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent mb-2">
          DesiCargo
        </h3>
        <p className="text-sm text-gray-500">Loading your logistics experience...</p>
      </div>
    </div>
  </div>
);

function App() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Set up global error handlers on mount
  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);

  // Global keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ErrorBoundary showDetails={true}>
      <BrowserRouter>
        <SearchProvider>
          <RealtimeProvider>
            <AppleCommandPalette 
              isOpen={commandPaletteOpen} 
              onClose={() => setCommandPaletteOpen(false)} 
            />
            <Suspense fallback={<PageLoader />}>
            <Routes>
            <Route path="/" element={
              <RouteErrorBoundary>
                <LandingPage />
              </RouteErrorBoundary>
            } />
            <Route path="/signin" element={
              <RouteErrorBoundary>
                <SignInPage />
              </RouteErrorBoundary>
            } />
            <Route path="/signin-org" element={
              <RouteErrorBoundary>
                <OrganizationSignIn />
              </RouteErrorBoundary>
            } />
            <Route path="/auth/callback" element={
              <RouteErrorBoundary>
                <AuthCallbackPage />
              </RouteErrorBoundary>
            } />
            <Route path="/signup" element={
              <RouteErrorBoundary>
                <SignUpPage />
              </RouteErrorBoundary>
            } />
            <Route path="/new-organization" element={
              <RouteErrorBoundary>
                <CreateOrganizationPage />
              </RouteErrorBoundary>
            } />
            <Route path="/dashboard/*" element={
              <RouteErrorBoundary>
                <Dashboard />
              </RouteErrorBoundary>
            } />
            <Route path="/superadmin/branches" element={
              <RouteErrorBoundary>
                <SuperAdminBranchPage />
              </RouteErrorBoundary>
            } />
            <Route path="/track" element={
              <RouteErrorBoundary>
                <TrackingPage />
              </RouteErrorBoundary>
            } />
            <Route path="/track/:lrNumber" element={
              <RouteErrorBoundary>
                <TrackingPage />
              </RouteErrorBoundary>
            } />
            <Route path="/about" element={
              <RouteErrorBoundary>
                <AboutPage />
              </RouteErrorBoundary>
            } />
            <Route path="*" element={
              <RouteErrorBoundary>
                <LandingPage />
              </RouteErrorBoundary>
            } />
          </Routes>
            </Suspense>
          </RealtimeProvider>
        </SearchProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;