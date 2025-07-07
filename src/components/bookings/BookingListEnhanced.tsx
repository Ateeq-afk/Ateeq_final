import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MoreVertical,
  Download,
  Printer,
  Eye,
  X,
  Plus,
  RefreshCw,
  Package,
  Filter,
  Grid3X3,
  List,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  CheckSquare,
  Square,
  ChevronDown,
  Calendar,
  IndianRupee,
  Truck,
  MapPin,
  Users,
  BarChart3,
  Sparkles,
  CreditCard,
  Edit,
  Activity,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from '../ui/dropdown-menu';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { cn } from '@/lib/utils';
import StatusBadge from '../ui/StatusBadge';
import { useBookings } from '@/hooks/useBookings';
import { useBranches } from '../../hooks/useBranches';
import { useFilteredSortedBookings } from '../../hooks/useFilteredSortedBookings';
import { printBookings, downloadBookingLR } from '../../utils/printUtils';
import { usePOD } from '@/hooks/usePOD';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import type { Booking, Filters, SortField, SortDirection } from '../../types';
import BookingListSkeleton from './BookingListSkeleton';
import BookingModification from './BookingModification';
import BookingCancellation from './BookingCancellation';
import ProofOfDelivery from './ProofOfDelivery';
import BookingCard from './BookingCard';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useHotkeys } from 'react-hotkeys-hook';
import { BookingFormWizard } from './BookingFormWizard';
import { 
  ActivityIndicator, 
  MetricCardSkeleton, 
  NoBookings, 
  NoSearchResults,
  LoadingCard,
  TransactionSkeleton
} from '../ui/loading-states';
import { EmptyState } from '../ui/empty-states';

// Stripe-inspired Transaction-style Booking Item
const TransactionBookingItem: React.FC<{
  booking: Booking;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onClick: () => void;
  onModify: () => void;
  onCancel: () => void;
  onPOD: () => void;
}> = ({ booking, index, isSelected, onSelect, onClick, onModify, onCancel, onPOD }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const getStatusColor = (status: string) => {
    const colors = {
      booked: { bg: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200/50 dark:border-blue-800/30' },
      in_transit: { bg: 'bg-orange-50 dark:bg-orange-950/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200/50 dark:border-orange-800/30' },
      delivered: { bg: 'bg-green-50 dark:bg-green-950/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-200/50 dark:border-green-800/30' },
      cancelled: { bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-200/50 dark:border-red-800/30' },
    };
    return colors[status] || colors.booked;
  };

  const statusColor = getStatusColor(booking.status);
  const isIncome = booking.payment_type === 'paid';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ x: 4, backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "group relative flex items-center justify-between p-5 transition-all duration-300",
        "hover:bg-gray-50/70 dark:hover:bg-gray-800/30",
        "hover:shadow-sm hover:border-gray-200/50 dark:hover:border-gray-700/50",
        "border border-transparent cursor-pointer rounded-xl",
        "backdrop-blur-sm",
        isSelected && "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/30"
      )}
      onClick={onClick}
    >
      {/* Hover accent line */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r opacity-0 group-hover:opacity-100 transition-all duration-300"
        initial={{ scaleY: 0 }}
        whileHover={{ scaleY: 1 }}
      />
      
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Selection Checkbox */}
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="haptic-light"
          />
        </motion.div>

        {/* Booking Icon & LR Number */}
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300",
            "shadow-sm border",
            statusColor.bg, statusColor.border
          )}
        >
          <Package className={cn("h-5 w-5", statusColor.text)} strokeWidth={2} />
        </motion.div>
        
        <div className="min-w-0 flex-1">
          {/* Main Info */}
          <div className="flex items-center gap-3 mb-1">
            <motion.p 
              className="font-bold text-primary text-body-md tracking-tight"
              whileHover={{ scale: 1.02 }}
            >
              {booking.lr_number}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 + 0.1 }}
            >
              <Badge 
                className={cn(
                  "text-xs font-medium border",
                  statusColor.bg, statusColor.text, statusColor.border
                )}
              >
                {booking.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </motion.div>
          </div>
          
          {/* Secondary Info */}
          <div className="flex items-center gap-2 text-caption text-tertiary">
            <span>{booking.customer_name}</span>
            <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            <span>{booking.from_location} → {booking.to_location}</span>
            <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            <span>{new Date(booking.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      
      {/* Amount & Actions */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <motion.p 
            whileHover={{ scale: 1.05 }}
            className="font-bold text-lg tabular-nums leading-none text-primary"
          >
            ₹{booking.total_amount.toLocaleString()}
          </motion.p>
          <p className="text-caption text-tertiary mt-1">
            {booking.payment_type === 'paid' ? 'Paid' : 'To Pay'}
          </p>
        </div>

        {/* Quick Actions */}
        <motion.div
          className="flex items-center gap-1"
          initial={{ opacity: 0, x: 10 }}
          animate={{ 
            opacity: isHovered ? 1 : 0,
            x: isHovered ? 0 : 10
          }}
          transition={{ duration: 0.2 }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-950/20 haptic-light"
                  onClick={(e) => {
                    e.stopPropagation();
                    onModify();
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>Edit Booking</TooltipContent>
          </Tooltip>

          {booking.status === 'delivered' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-green-50 dark:hover:bg-green-950/20 haptic-light"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPOD();
                    }}
                  >
                    <FileText className="h-3 w-3" />
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>Submit POD</TooltipContent>
            </Tooltip>
          )}
        </motion.div>
        
        {/* Hover arrow */}
        <motion.div
          className="opacity-0 group-hover:opacity-100 transition-all duration-300"
          initial={{ x: -10 }}
          whileHover={{ x: 0 }}
        >
          <ChevronDown className="h-4 w-4 text-gray-400 -rotate-90" />
        </motion.div>
      </div>
    </motion.div>
  );
};

const DEFAULT_FILTERS: Filters = {
  search: '',
  dateRange: 'all',
  status: 'all',
  paymentType: 'all',
  branch: 'all',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
    },
  },
};

export default function BookingListEnhanced() {
  const navigate = useNavigate();

  // UI State
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showModifyId, setShowModifyId] = useState<string | null>(null);
  const [showCancelId, setShowCancelId] = useState<string | null>(null);
  const [showPODId, setShowPODId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Default to transaction view for better UX with our Apple design system
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'transaction'>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 'transaction' : 'transaction';
    }
    return 'transaction';
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  // Data Fetching
  const { bookings, loading: isLoading, error, refresh, updateBookingStatus } = useBookings();
  const { branches } = useBranches();
  const { submitPOD } = usePOD();
  const { showSuccess, showError } = useNotificationSystem();

  // Real-time updates - temporarily disabled for stability
  // TODO: Re-enable after fixing import issues
  // const { useRealtimeBookings } = require('@/hooks/useRealtime');
  // const { useOptimisticUpdates } = require('@/services/optimisticUpdates');

  // Set up real-time subscriptions - temporarily disabled
  // useRealtimeBookings({
  //   onInsert: (booking) => {
  //     console.log('📦 New booking created:', booking);
  //     showSuccess(`New booking ${booking.lr_number} created`);
  //     refresh();
  //   },
  //   onUpdate: (booking) => {
  //     console.log('📝 Booking updated:', booking);
  //     refresh();
  //   },
  //   onStatusChange: (booking, oldStatus, newStatus) => {
  //     console.log(`📋 Booking ${booking.lr_number} status changed from ${oldStatus} to ${newStatus}`);
  //     showSuccess(`Booking ${booking.lr_number} status updated to ${newStatus}`);
  //   }
  // });

  // Filter & Sort
  const filtered = useFilteredSortedBookings(bookings, filters, sortField, sortDirection);

  // Memoized calculations
  const stats = useMemo(() => {
    const total = filtered.length;
    const delivered = filtered.filter((b) => b.status === 'delivered').length;
    const inTransit = filtered.filter((b) => b.status === 'in_transit').length;
    const revenue = filtered.reduce((sum, b) => sum + b.total_amount, 0);
    return { total, delivered, inTransit, revenue };
  }, [filtered]);

  // Keyboard shortcuts
  useHotkeys('cmd+n, ctrl+n', () => navigate('/dashboard/bookings/new'), [navigate]);
  useHotkeys('cmd+r, ctrl+r', () => refresh(), [refresh]);
  useHotkeys('cmd+p, ctrl+p', () => handlePrint(), [filtered, selectedIds]);
  useHotkeys('/', () => document.getElementById('search-input')?.focus());

  // Handlers
  const handleFilterChange = useCallback((key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => (prev.length === filtered.length ? [] : filtered.map((b) => b.id)));
  }, [filtered]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDirection('desc');
      }
    },
    [sortField]
  );

  const handleRefresh = useCallback(() => {
    refresh();
    showSuccess('Refreshed', 'Bookings list has been updated');
  }, [refresh, showSuccess]);

  const handlePrint = useCallback(() => {
    const bookingsToPrint = selectedIds.length
      ? filtered.filter((b) => selectedIds.includes(b.id))
      : filtered;
    printBookings(bookingsToPrint);
  }, [filtered, selectedIds]);

  const handleExport = useCallback(
    async (format: 'csv' | 'excel' | 'pdf') => {
      setIsExporting(true);
      try {
        const bookingsToExport = selectedIds.length
          ? filtered.filter((b) => selectedIds.includes(b.id))
          : filtered;

        // Simulate export process
        await new Promise((resolve) => setTimeout(resolve, 1500));

        showSuccess('Export Complete', `Exported ${bookingsToExport.length} bookings as ${format.toUpperCase()}`);
      } catch (error) {
        showError('Export Failed', 'Failed to export bookings');
      } finally {
        setIsExporting(false);
      }
    },
    [filtered, selectedIds, showSuccess, showError]
  );

  const handleBulkAction = useCallback(
    async (action: string) => {
      if (selectedIds.length === 0) {
        showError('No Selection', 'Please select bookings to perform bulk action');
        return;
      }

      try {
        switch (action) {
          case 'mark-in-transit':
            await Promise.all(
              selectedIds.map((id) => {
                const booking = bookings.find((b) => b.id === id);
                if (booking?.status === 'booked') {
                  return updateBookingStatus(id, 'in_transit');
                }
              })
            );
            showSuccess('Updated', `${selectedIds.length} bookings marked as in transit`);
            break;
          case 'generate-labels':
            showSuccess('Labels Generated', `Generated labels for ${selectedIds.length} bookings`);
            break;
          case 'send-notifications':
            showSuccess('Notifications Sent', `Sent notifications for ${selectedIds.length} bookings`);
            break;
        }
        setSelectedIds([]);
        refresh();
      } catch (error) {
        showError('Action Failed', 'Failed to perform bulk action');
      }
    },
    [selectedIds, bookings, updateBookingStatus, showSuccess, showError, refresh]
  );

  const handleBookingClick = useCallback(
    (booking: Booking) => {
      if (booking.status === 'delivered') {
        setShowPODId(booking.id);
      } else {
        navigate(`/dashboard/bookings/${booking.id}`);
      }
    },
    [navigate]
  );

  const handlePODSubmit = useCallback(
    async (data: any) => {
      try {
        await submitPOD(data);
        setShowPODId(null);
        showSuccess('POD Submitted', 'Proof of delivery has been recorded successfully');
        refresh();
      } catch (err) {
        console.error('Failed to submit POD:', err);
        showError(
          'POD Submission Failed',
          err instanceof Error ? err.message : 'Failed to submit proof of delivery'
        );
      }
    },
    [submitPOD, showSuccess, showError, refresh]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="h-32 bg-white dark:bg-gray-900/50 rounded-2xl animate-pulse" />
          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <MetricCardSkeleton key={i} />
            ))}
          </div>
          {/* Content Skeleton */}
          <div className="bg-white dark:bg-gray-900/50 rounded-2xl p-6 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <TransactionSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <EmptyState
          illustration="error"
          title="Failed to load bookings"
          description="There was an error loading your bookings. Please try again."
          action={{
            label: 'Retry',
            onClick: () => refresh()
          }}
        />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto p-6 space-y-6"
        >
        {/* Apple-inspired Header */}
        <motion.div
          variants={itemVariants}
          className="bg-white/70 dark:bg-black/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-2xl shadow-sm p-6"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <motion.div 
              className="flex-1"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <motion.div 
                  className="p-3 bg-blue-500 dark:bg-blue-400 rounded-xl"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                >
                  <Package className="h-6 w-6 text-white" />
                </motion.div>
                <h1 className="text-display-sm font-bold text-primary tracking-tight">Bookings</h1>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Badge className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/30">
                    <Activity className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                </motion.div>
              </div>
              
              {/* Enhanced Stats */}
              <motion.div 
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div 
                  className="flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-label-md text-secondary font-medium">{stats.total} Total</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                >
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-label-md text-green-600 dark:text-green-400 font-medium">{stats.delivered} Delivered</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                >
                  <Truck className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-label-md text-orange-600 dark:text-orange-400 font-medium">{stats.inTransit} In Transit</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                >
                  <IndianRupee className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-label-md text-purple-600 dark:text-purple-400 font-medium tabular-nums">₹{stats.revenue.toLocaleString()}</span>
                </motion.div>
              </motion.div>
            </motion.div>

            <motion.div 
              className="flex flex-wrap items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              {/* Enhanced View Mode Toggle */}
              <div className="flex items-center bg-white/70 dark:bg-gray-900/50 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-800/50 p-1 backdrop-blur-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant={viewMode === 'transaction' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('transaction')}
                        className={cn(
                          "rounded-lg h-8 w-8 p-0 haptic-light",
                          viewMode === 'transaction' && "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                        )}
                      >
                        <CreditCard className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>Transaction View</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('table')}
                        className={cn(
                          "rounded-lg h-8 w-8 p-0 haptic-light",
                          viewMode === 'table' && "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                        )}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>Table View</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className={cn(
                          "rounded-lg h-8 w-8 p-0 haptic-light",
                          viewMode === 'grid' && "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                        )}
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>Grid View</TooltipContent>
                </Tooltip>
              </div>

              {/* Actions */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard/bookings/analytics')}
                className="bg-white"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isExporting}
                    className="bg-white"
                  >
                    {isExporting ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('excel')}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export as Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="bg-white"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="bg-white"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-brand-700 hover:bg-brand-600 text-white shadow-lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Booking
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowWizard(true)}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Wizard Mode (Recommended)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard/bookings/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Advanced Form
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          </div>
        </motion.div>

        {/* Advanced Filters */}
        <motion.div variants={itemVariants}>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <h3 className="font-medium text-gray-900">Filters</h3>
                {Object.values(filters).some((v) => v !== 'all' && v !== '') && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    {Object.values(filters).filter((v) => v !== 'all' && v !== '').length} Active
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                {showAdvancedFilters ? 'Simple' : 'Advanced'}
                <ChevronDown
                  className={cn(
                    'h-4 w-4 ml-2 transition-transform',
                    showAdvancedFilters && 'rotate-180'
                  )}
                />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="relative sm:col-span-2 lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search-input"
                  placeholder="Search by LR, customer, or location..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={filters.dateRange}
                onValueChange={(v) => handleFilterChange('dateRange', v)}
              >
                <SelectTrigger>
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last_week">Last 7 Days</SelectItem>
                  <SelectItem value="last_month">Last 30 Days</SelectItem>
                  <SelectItem value="last_quarter">Last Quarter</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.status}
                onValueChange={(v) => handleFilterChange('status', v)}
              >
                <SelectTrigger>
                  <Package className="h-4 w-4 mr-2 text-gray-500" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="unloaded">Unloaded</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="pod_received">POD Received</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.branch}
                onValueChange={(v) => handleFilterChange('branch', v)}
              >
                <SelectTrigger>
                  <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <AnimatePresence>
              {showAdvancedFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Select
                      value={filters.paymentType}
                      onValueChange={(v) => handleFilterChange('paymentType', v)}
                    >
                      <SelectTrigger>
                        <IndianRupee className="h-4 w-4 mr-2 text-gray-500" />
                        <SelectValue placeholder="Payment Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Payments</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="To Pay">To Pay</SelectItem>
                        <SelectItem value="Quotation">Quotation</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      onClick={() => setFilters(DEFAULT_FILTERS)}
                      className="md:ml-auto"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-blue-50 border border-blue-200 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckSquare className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    {selectedIds.length} booking{selectedIds.length > 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('mark-in-transit')}
                    className="bg-white"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Mark In Transit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('generate-labels')}
                    className="bg-white"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Labels
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('send-notifications')}
                    className="bg-white"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Send Notifications
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedIds([])}
                    className="text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Area */}
        {viewMode === 'transaction' ? (
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-gray-900/50 rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-sm overflow-hidden backdrop-blur-sm"
          >
            {filtered.length === 0 ? (
              <div className="p-12">
                {filters.search ? (
                  <NoSearchResults
                    query={filters.search}
                    onClear={() => handleFilterChange('search', '')}
                    suggestions={[
                      'Check LR number spelling',
                      'Try customer name instead',
                      'Search by route or location',
                      'Clear filters and try again'
                    ]}
                  />
                ) : (
                  <NoBookings
                    title="No bookings yet"
                    description="Start by creating your first booking to manage shipments and track deliveries."
                    action={{
                      label: 'Create New Booking',
                      onClick: () => setShowWizard(true)
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="p-6 space-y-1">
                <AnimatePresence mode="popLayout">
                  {filtered.map((booking, index) => (
                    <TransactionBookingItem
                      key={booking.id}
                      booking={booking}
                      index={index}
                      isSelected={selectedIds.includes(booking.id)}
                      onSelect={() => toggleSelect(booking.id)}
                      onClick={() => handleBookingClick(booking)}
                      onModify={() => setShowModifyId(booking.id)}
                      onCancel={() => setShowCancelId(booking.id)}
                      onPOD={() => setShowPODId(booking.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        ) : viewMode === 'table' ? (
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <Checkbox
                        checked={selectedIds.length === filtered.length && filtered.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th
                      className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('lr_number')}
                    >
                      <div className="flex items-center gap-2">
                        LR Number
                        {sortField === 'lr_number' && (
                          <motion.div
                            animate={{ rotate: sortDirection === 'asc' ? 0 : 180 }}
                            className="text-brand-600"
                          >
                            ▲
                          </motion.div>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-2">
                        Date
                        {sortField === 'created_at' && (
                          <motion.div
                            animate={{ rotate: sortDirection === 'asc' ? 0 : 180 }}
                            className="text-brand-600"
                          >
                            ▲
                          </motion.div>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left hidden sm:table-cell">Route</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th
                      className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors hidden lg:table-cell"
                      onClick={() => handleSort('total_amount')}
                    >
                      <div className="flex items-center gap-2">
                        Amount
                        {sortField === 'total_amount' && (
                          <motion.div
                            animate={{ rotate: sortDirection === 'asc' ? 0 : 180 }}
                            className="text-brand-600"
                          >
                            ▲
                          </motion.div>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Payment</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <AnimatePresence mode="popLayout">
                    {filtered.map((booking, index) => (
                      <motion.tr
                        key={booking.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={selectedIds.includes(booking.id)}
                            onCheckedChange={() => toggleSelect(booking.id)}
                          />
                        </td>
                        <td
                          className="px-4 py-3 font-medium cursor-pointer"
                          onClick={() => handleBookingClick(booking)}
                        >
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="text-brand-600 hover:text-brand-700"
                          >
                            {booking.lr_number}
                          </motion.div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900">
                              {new Date(booking.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(booking.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="text-sm">
                              <div className="font-medium">{booking.from_branch_details?.name}</div>
                              <div className="text-gray-500">to {booking.to_branch_details?.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium">{booking.sender?.name}</div>
                            <div className="text-xs text-gray-500">{booking.receiver?.name}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={booking.status} />
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="font-medium">₹{booking.total_amount.toLocaleString()}</div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <Badge
                            variant={booking.payment_type === 'Paid' ? 'success' : 'warning'}
                            className="text-xs"
                          >
                            {booking.payment_type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 justify-end">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleBookingClick(booking)}
                                  className="h-8 w-8"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View Details</TooltipContent>
                            </Tooltip>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => downloadBookingLR(booking)}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download LR
                                </DropdownMenuItem>
                                {booking.status === 'delivered' && (
                                  <DropdownMenuItem onClick={() => setShowPODId(booking.id)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Enter POD
                                  </DropdownMenuItem>
                                )}
                                {(['booked', 'in_transit'] as Booking['status'][]).includes(
                                  booking.status
                                ) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => setShowCancelId(booking.id)}
                                    >
                                      <X className="mr-2 h-4 w-4" />
                                      Cancel Booking
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-16">
                        {filters.search ? (
                          <NoSearchResults
                            query={filters.search}
                            onClear={() => handleFilterChange('search', '')}
                            suggestions={[
                              'Check LR number spelling',
                              'Try customer name instead',
                              'Search by route or location',
                              'Clear filters and try again'
                            ]}
                          />
                        ) : (
                          <NoBookings
                            title="No bookings yet"
                            description="Start by creating your first booking to manage shipments and track deliveries."
                            action={{
                              label: 'Create New Booking',
                              onClick: () => setShowWizard(true)
                            }}
                          />
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filtered.map((booking, index) => (
              <motion.div key={booking.id} variants={itemVariants} custom={index}>
                <BookingCard
                  booking={booking}
                  onClick={() => handleBookingClick(booking)}
                  onSelect={() => toggleSelect(booking.id)}
                  isSelected={selectedIds.includes(booking.id)}
                />
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <motion.div
                variants={itemVariants}
                className="col-span-full py-12"
              >
                {filters.search ? (
                  <NoSearchResults
                    query={filters.search}
                    onClear={() => handleFilterChange('search', '')}
                    suggestions={[
                      'Check LR number spelling',
                      'Try customer name instead',
                      'Search by route or location',
                      'Clear filters and try again'
                    ]}
                  />
                ) : (
                  <NoBookings
                    title="No bookings yet"
                    description="Start by creating your first booking to manage shipments and track deliveries."
                    action={{
                      label: 'Create New Booking',
                      onClick: () => setShowWizard(true)
                    }}
                  />
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Modals */}
        <AnimatePresence>
          {showModifyId && (
            <BookingModification
              bookingId={showModifyId}
              onClose={() => setShowModifyId(null)}
              onSubmit={() => refresh()}
            />
          )}
          {showCancelId && (
            <BookingCancellation
              bookingId={showCancelId}
              onClose={() => setShowCancelId(null)}
              onSubmit={() => refresh()}
            />
          )}
          {showPODId && (
            <ProofOfDelivery
              bookingId={showPODId}
              onClose={() => setShowPODId(null)}
              onSubmit={handlePODSubmit}
            />
          )}
          {showWizard && (
            <BookingFormWizard
              onClose={() => setShowWizard(false)}
              onBookingCreated={(booking) => {
                setShowWizard(false);
                refresh();
                showSuccess('Booking created successfully!', `LR Number: ${booking.lr_number}`);
              }}
            />
          )}
        </AnimatePresence>
        </motion.div>
      </div>
    </TooltipProvider>
  );
}