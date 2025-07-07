import React, { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import MobileBottomNav from './mobile/MobileBottomNav';
import { useIsMobile } from '@/hooks/useIsMobile';
import ErrorBoundary, { SimpleErrorFallback } from './ui/ErrorBoundary';
const OperationalDashboard = lazy(() => import('./OperationalDashboard'));
const ExecutiveDashboard = lazy(() => import('./AppleExecutiveDashboard'));
const MobileDashboard = lazy(() => import('./mobile/MobileDashboard'));
const MobileBookingsList = lazy(() => import('./mobile/MobileBookingsList'));
import { PageBreadcrumb } from './ui/breadcrumb';
// import ChatInterface from './chat/ChatInterface';

// Lazy load dashboard components for better code splitting
const BookingListEnhanced = lazy(() => import('./bookings/BookingListEnhanced'));
const BookingDetails = lazy(() => import('./bookings/BookingDetails'));
const ArticleList = lazy(() => import('./articles/ArticleListEnterprise'));
const CustomerList = lazy(() => import('./customers/CustomerListModern'));
const VehicleList = lazy(() => import('./vehicles/VehicleList'));
const BranchManagementPage = lazy(() => import('@/pages/BranchManagementPage'));
const WarehouseDashboard = lazy(() => import('@/components/warehouse/WarehouseDashboard'));
const RevenuePage = lazy(() => import('@/components/revenue/RevenuePage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const LoadingManagementPage = lazy(() => import('@/pages/LoadingManagementPage'));
const UnloadingPage = lazy(() => import('@/components/UnloadingPage'));
const PODDashboard = lazy(() => import('@/components/pod/PODDashboard'));
const PremiumSinglePageBookingForm = lazy(() => import('./bookings/NewBookingFormClean'));
const PreferencesPage = lazy(() => import("@/pages/PreferencesPage"));
const OrganizationManagement = lazy(() => import('./organizations/OrganizationManagement').then(m => ({ default: m.OrganizationManagement })));
const ArticleTrackingDashboard = lazy(() => import('./tracking/AppleTrackingDashboard'));
const PaymentDashboardPage = lazy(() => import('@/pages/PaymentDashboardPage'));
const PaymentListPage = lazy(() => import('@/pages/PaymentListPage'));
const OutstandingListPage = lazy(() => import('@/pages/OutstandingListPage'));
const FinancialDashboard = lazy(() => import('./AppleFinancialDashboard'));
const ExpenseManagement = lazy(() => import('./expenses/ExpenseManagement'));
const CreditDashboard = lazy(() => import('./credit/CreditDashboard'));
const InvoiceDashboard = lazy(() => import('./invoices/InvoiceDashboard'));
const MobileScanningInterface = lazy(() => import('./scanning/MobileScanningInterface').then(m => ({ default: m.MobileScanningInterface })));
const ArticleMovementAnalytics = lazy(() => import('./analytics/ArticleMovementAnalytics').then(m => ({ default: m.ArticleMovementAnalytics })));

// Apple-inspired Dashboard loading component
const DashboardLoader = () => (
  <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6" 
      role="status" 
      aria-live="polite"
    >
      <div className="relative">
        <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-100 to-blue-200" />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 h-16 w-16 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-400"
        />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent mb-2">
          Loading Dashboard
        </h3>
        <p className="text-sm text-gray-500">Please wait while we prepare your experience...</p>
      </div>
    </motion.div>
  </div>
);

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();

  const getCurrentPage = () => {
    const path = location.pathname.split('/')[2] || 'dashboard';
    return path;
  };

  const handleNavigate = (page: string) => {
    // Close sidebar on navigation (mobile)
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 relative overflow-hidden">
      {/* Skip link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-blue-500 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>
      
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
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-md z-40 lg:hidden"
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
      <main className="flex-1 flex flex-col overflow-hidden relative bg-white dark:bg-black" id="main-content">
        {!isMobile && <Header onMenuClick={() => setSidebarOpen(true)} />}
        <div className="flex-1 overflow-y-auto">
          <div className={isMobile ? "p-0" : "max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8"}>
          {!isMobile && <PageBreadcrumb />}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ 
                duration: 0.3,
                ease: [0.32, 0.72, 0, 1]
              }}
            >
              <ErrorBoundary>
                <Suspense fallback={<DashboardLoader />}>
                  <Routes>
                  <Route path="/" element={isMobile ? <MobileDashboard /> : <ExecutiveDashboard />} />
                  <Route path="/operational" element={<OperationalDashboard />} />
                  <Route path="/customers" element={<CustomerList />} />
                  <Route path="/vehicles" element={<VehicleList />} />
                  <Route path="/articles" element={<ArticleList />} />
                  <Route path="/bookings" element={isMobile ? <MobileBookingsList /> : <BookingListEnhanced />} />
                  <Route path="/bookings/new" element={<PremiumSinglePageBookingForm />} />
                  <Route path="/bookings/:id" element={<BookingDetails />} />
                  <Route path="/new-booking" element={<PremiumSinglePageBookingForm />} />
                  <Route path="/branches" element={<BranchManagementPage />} />
                  <Route path="/warehouse" element={<WarehouseDashboard />} />
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
                  <Route path="/invoices" element={<InvoiceDashboard />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
          </div>
        </div>
      </main>
      
      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileBottomNav onOpenMenu={() => setMobileMenuOpen(true)} />
      )}
      
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