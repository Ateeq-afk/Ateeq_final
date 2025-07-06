import React, { useState, lazy, Suspense } from 'react';
import {
  Menu,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import DashboardStats from './DashboardStats';
import { PageBreadcrumb } from './ui/breadcrumb';
// import ChatInterface from './chat/ChatInterface';

// Lazy load dashboard components for better code splitting
const BookingListEnhanced = lazy(() => import('./bookings/BookingListEnhanced'));
const BookingDetails = lazy(() => import('./bookings/BookingDetails'));
const ArticleList = lazy(() => import('./articles/ArticleList'));
const CustomerList = lazy(() => import('./customers/CustomerList'));
const VehicleList = lazy(() => import('./vehicles/VehicleList'));
const BranchManagementPage = lazy(() => import('@/pages/BranchManagementPage'));
const WarehouseManagementPage = lazy(() => import('@/pages/WarehouseManagementPage'));
const RevenuePage = lazy(() => import('@/components/revenue/RevenuePage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const LoadingManagementPage = lazy(() => import('@/pages/LoadingManagementPage'));
const UnloadingPage = lazy(() => import('@/components/UnloadingPage'));
const PODDashboard = lazy(() => import('@/components/pod/PODDashboard'));
const LazyBook = lazy(() => import('./bookings/LazyBook'));
const PreferencesPage = lazy(() => import("@/pages/PreferencesPage"));
const OrganizationManagement = lazy(() => import('./organizations/OrganizationManagement').then(m => ({ default: m.OrganizationManagement })));
const ArticleTrackingDashboard = lazy(() => import('./tracking/ArticleTrackingDashboard').then(m => ({ default: m.ArticleTrackingDashboard })));

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
  const [isLoading, setIsLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const getCurrentPage = () => {
    const path = location.pathname.split('/')[2] || 'dashboard';
    return path;
  };

  const handleNavigate = (page: string) => {
    // Close sidebar on navigation (mobile)
    setSidebarOpen(false);

    // Set loading state if navigating to new-booking
    if (page === 'new-booking') {
      setIsLoading(true);
      // Simulate loading delay
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
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

      {/* Sidebar */}
      <div
        className={`
        fixed inset-0 z-40 lg:relative
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        transition-transform duration-300 ease-in-out
        lg:flex lg:flex-shrink-0
      `}
      >
        {/* Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-md lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar content */}
        <motion.div
          initial={{ x: -280 }}
          animate={{ x: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          className="relative z-50 w-72 h-full glass-strong shadow-2xl border-r border-white/10"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 to-background/98 dark:from-background/80 dark:to-background/90" />
          <div className="relative z-10">
            <Sidebar 
              onNavigate={handleNavigate} 
              currentPage={getCurrentPage()} 
              onOpenChat={() => setChatOpen(true)}
            />
          </div>
        </motion.div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto relative" id="main-content">
        <div className="p-4 md:p-6 lg:p-8 pt-16 lg:pt-8">
          <Header />
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
                  <Route path="/" element={<DashboardStats />} />
                  <Route path="/customers" element={<CustomerList />} />
                  <Route path="/vehicles" element={<VehicleList />} />
                  <Route path="/articles" element={<ArticleList />} />
                  <Route path="/bookings" element={<BookingListEnhanced />} />
                  <Route path="/bookings/:id" element={<BookingDetails />} />
                  <Route path="/new-booking" element={<LazyBook />} />
                  <Route path="/branches" element={<BranchManagementPage />} />
                  <Route path="/warehouse" element={<WarehouseManagementPage />} />
                  <Route path="/revenue" element={<RevenuePage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/loading" element={<LoadingManagementPage />} />
                  <Route path="/unloading" element={<UnloadingPage />} />
                  <Route path="/pod" element={<PODDashboard />} />
                  <Route path="/tracking" element={<ArticleTrackingDashboard />} />
                  <Route path="/settings" element={<PreferencesPage />} />
                  <Route path="/organizations" element={<OrganizationManagement />} />
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