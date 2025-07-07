import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import RouteErrorBoundary from './components/RouteErrorBoundary';
import { SearchProvider } from './contexts/SearchContext';

// Lazy load components for code splitting
const Dashboard = lazy(() => import('./components/Dashboard'));
const TrackingPage = lazy(() => import('./pages/TrackingPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const SignInPage = lazy(() => import('./pages/SignInPage'));
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const OrganizationSignIn = lazy(() => import('./pages/auth/OrganizationSignIn').then(m => ({ default: m.OrganizationSignIn })));
const CreateOrganizationPage = lazy(() => import('./pages/CreateOrganizationPage'));
const SuperAdminBranchPage = lazy(() => import('./pages/SuperAdminBranchPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
    <div className="flex items-center gap-2 text-blue-600" role="status" aria-live="polite">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" aria-hidden="true"></div>
      <span>Loading...</span>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary showDetails={true}>
      <BrowserRouter>
        <SearchProvider>
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
      </SearchProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;