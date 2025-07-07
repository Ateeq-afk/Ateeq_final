import React, { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
const OperationalDashboard = lazy(() => import('./OperationalDashboard'));
const ExecutiveDashboard = lazy(() => import('./ExecutiveDashboard'));
import { PageBreadcrumb } from './ui/breadcrumb';
// import ChatInterface from './chat/ChatInterface';

// Lazy load dashboard components for better code splitting
const BookingListEnhanced = lazy(() => import('./bookings/BookingListEnhanced'));
const BookingDetails = lazy(() => import('./bookings/BookingDetails'));
const ArticleList = lazy(() => import('./articles/ArticleListEnterprise'));
const CustomerList = lazy(() => import('./customers/CustomerList'));
const VehicleList = lazy(() => import('./vehicles/VehicleList'));
const BranchManagementPage = lazy(() => import('@/pages/BranchManagementPage'));
const WarehouseManagementPage = lazy(() => import('@/pages/WarehouseManagementPage'));
const RevenuePage = lazy(() => import('@/components/revenue/RevenuePage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const LoadingManagementPage = lazy(() => import('@/pages/LoadingManagementPage'));
const UnloadingPage = lazy(() => import('@/components/UnloadingPage'));
const PODDashboard = lazy(() => import('@/components/pod/PODDashboard'));
const PremiumSinglePageBookingForm = lazy(() => import('./bookings/PremiumSinglePageBookingForm'));
const PreferencesPage = lazy(() => import("@/pages/PreferencesPage"));
const OrganizationManagement = lazy(() => import('./organizations/OrganizationManagement').then(m => ({ default: m.OrganizationManagement })));
const ArticleTrackingDashboard = lazy(() => import('./tracking/ArticleTrackingDashboard').then(m => ({ default: m.ArticleTrackingDashboard })));
const PaymentDashboardPage = lazy(() => import('@/pages/PaymentDashboardPage'));
const PaymentListPage = lazy(() => import('@/pages/PaymentListPage'));
const OutstandingListPage = lazy(() => import('@/pages/OutstandingListPage'));
const FinancialDashboard = lazy(() => import('./FinancialDashboard'));
const ExpenseManagement = lazy(() => import('./expenses/ExpenseManagement'));
const CreditDashboard = lazy(() => import('./credit/CreditDashboard'));
const MobileScanningInterface = lazy(() => import('./scanning/MobileScanningInterface').then(m => ({ default: m.MobileScanningInterface })));
const ArticleMovementAnalytics = lazy(() => import('./analytics/ArticleMovementAnalytics').then(m => ({ default: m.ArticleMovementAnalytics })));

// Dashboard loading component
const DashboardLoader = () => (
  <div className="flex-1 flex items-center justify-center">
    <div className="flex items-center gap-2 text-blue-600" role="status" aria-live="polite">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" aria-hidden="true"></div>
      <span>Loading...</span>
    </div>
  </div>
);

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const location = useLocation();

  const getCurrentPage = () => {
    const path = location.pathname.split('/')[2] || 'dashboard';
    return path;
  };

  const handleNavigate = (page: string) => {
    // Close sidebar on navigation (mobile)
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-background relative overflow-hidden">
      {/* Skip link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-brand-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>
      
      {/* Gradient mesh background */}
      <div className="fixed inset-0 bg-gradient-mesh opacity-30 dark:opacity-10 pointer-events-none" />
      
      {/* Mobile navigation */}
      <MobileNav 
        currentPage={getCurrentPage()} 
        onNavigate={handleNavigate}
      />

      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar 
          onNavigate={handleNavigate} 
          currentPage={getCurrentPage()} 
          onOpenChat={() => setChatOpen(true)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Sidebar - Mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 lg:hidden"
            >
              <Sidebar 
                onNavigate={handleNavigate} 
                currentPage={getCurrentPage()} 
                onOpenChat={() => setChatOpen(true)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden relative" id="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <PageBreadcrumb />
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ 
                duration: 0.4,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
            >
              <Suspense fallback={<DashboardLoader />}>
                <Routes>
                  <Route path="/" element={<ExecutiveDashboard />} />
                  <Route path="/operational" element={<OperationalDashboard />} />
                  <Route path="/customers" element={<CustomerList />} />
                  <Route path="/vehicles" element={<VehicleList />} />
                  <Route path="/articles" element={<ArticleList />} />
                  <Route path="/bookings" element={<BookingListEnhanced />} />
                  <Route path="/bookings/new" element={<PremiumSinglePageBookingForm />} />
                  <Route path="/bookings/:id" element={<BookingDetails />} />
                  <Route path="/new-booking" element={<PremiumSinglePageBookingForm />} />
                  <Route path="/branches" element={<BranchManagementPage />} />
                  <Route path="/warehouse" element={<WarehouseManagementPage />} />
                  <Route path="/revenue" element={<RevenuePage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/loading" element={<LoadingManagementPage />} />
                  <Route path="/unloading" element={<UnloadingPage />} />
                  <Route path="/pod" element={<PODDashboard />} />
                  <Route path="/tracking" element={<ArticleTrackingDashboard />} />
                  <Route path="/scanner" element={<MobileScanningInterface />} />
                  <Route path="/analytics" element={<ArticleMovementAnalytics />} />
                  <Route path="/settings" element={<PreferencesPage />} />
                  <Route path="/organizations" element={<OrganizationManagement />} />
                  <Route path="/payments" element={<PaymentDashboardPage />} />
                  <Route path="/payments/list" element={<PaymentListPage />} />
                  <Route path="/payments/outstanding" element={<OutstandingListPage />} />
                  <Route path="/financial" element={<FinancialDashboard />} />
                  <Route path="/expenses" element={<ExpenseManagement />} />
                  <Route path="/credit" element={<CreditDashboard />} />
                </Routes>
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      
      {/* Chat Interface - Temporarily disabled */}
      {/* <AnimatePresence>
        {chatOpen && (
          <ChatInterface 
            isOpen={chatOpen} 
            onClose={() => setChatOpen(false)} 
          />
        )}
      </AnimatePresence> */}
    </div>
  );
}