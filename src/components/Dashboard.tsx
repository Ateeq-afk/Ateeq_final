import React, { useState } from 'react';
import {
  Truck,
  Package,
  BarChart3,
  Users,
  LayoutDashboard,
  Home,
  LogOut,
  FileText,
  IndianRupee,
  Building2,
  Upload,
  Download,
  ChevronRight,
  Settings,
  Menu,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Sidebar from './Sidebar';
import Header from './Header';
import BookingList from './bookings/BookingList';
import BookingDetails from './bookings/BookingDetails';
import ArticleList from './articles/ArticleList';
import CustomerList from './customers/CustomerList';
import VehicleList from './vehicles/VehicleList';
import BranchManagementPage from '@/pages/BranchManagementPage';
import RevenuePage from '@/components/revenue/RevenuePage';
import LoadingManagementPage from '@/pages/LoadingManagementPage';
import UnloadingPage from '@/components/UnloadingPage';
import PODDashboard from '@/components/pod/PODDashboard';
import LazyBook from './bookings/LazyBook';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
    <div className="flex h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white shadow-md border border-gray-200"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

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
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar content */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative z-50 w-64 bg-white h-full shadow-lg border-r border-gray-100"
        >
          <Sidebar onNavigate={handleNavigate} currentPage={getCurrentPage()} />
        </motion.div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-4 md:p-8 pt-16 lg:pt-8">
          <Header />
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Routes>
                <Route index element={<Navigate to="vehicles" replace />} />
                <Route path="/customers" element={<CustomerList />} />
                <Route path="/vehicles" element={<VehicleList />} />
                <Route path="/articles" element={<ArticleList />} />
                <Route path="/bookings" element={<BookingList />} />
                <Route path="/bookings/:id" element={<BookingDetails />} />
                <Route path="/new-booking" element={<LazyBook />} />
                <Route path="/branches" element={<BranchManagementPage />} />
                <Route path="/revenue" element={<RevenuePage />} />
                <Route path="/loading" element={<LoadingManagementPage />} />
                <Route path="/unloading" element={<UnloadingPage />} />
                <Route path="/pod" element={<PODDashboard />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}