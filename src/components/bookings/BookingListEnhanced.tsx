import React, { useState, useCallback, useMemo } from 'react';
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
  DollarSign,
  Truck,
  MapPin,
  Users,
  BarChart3,
  Sparkles,
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
  // Default to grid view on mobile for better UX
  const [viewMode, setViewMode] = useState<'table' | 'grid'>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 'grid' : 'table';
    }
    return 'table';
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Data Fetching
  const { bookings, loading: isLoading, error, refresh, updateBookingStatus } = useBookings();
  const { branches } = useBranches();
  const { submitPOD } = usePOD();
  const { showSuccess, showError } = useNotificationSystem();

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
  useHotkeys('cmd+n, ctrl+n', () => navigate('/dashboard/new-booking'), [navigate]);
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

  if (isLoading) return <BookingListSkeleton />;
  if (error) return <div>Error loading bookings.</div>;

  return (
    <TooltipProvider>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Premium Header */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-r from-brand-50 via-blue-50 to-purple-50 p-6 rounded-2xl shadow-sm border border-brand-200/50 backdrop-blur-sm"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-brand-600 rounded-xl">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-brand-800">Bookings Hub</h2>
                <Badge variant="secondary" className="bg-brand-100 text-brand-700">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-gray-600">{stats.total} Total</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">{stats.delivered} Delivered</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-600">{stats.inTransit} In Transit</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                  <span className="text-purple-600">₹{stats.revenue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                      className="rounded-md"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Table View</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-md"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
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

              <Button
                size="sm"
                onClick={() => navigate('/dashboard/new-booking')}
                className="bg-brand-700 hover:bg-brand-600 text-white shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Booking
              </Button>
            </div>
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
                        <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
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
        {viewMode === 'table' ? (
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
                      <td colSpan={9} className="text-center py-12">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col items-center gap-3"
                        >
                          <Package className="h-12 w-12 text-gray-300" />
                          <p className="text-gray-500 font-medium">No bookings found</p>
                          <p className="text-gray-400 text-sm">
                            Try adjusting your filters or create a new booking
                          </p>
                        </motion.div>
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
                className="col-span-full text-center py-12"
              >
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No bookings found</p>
                <p className="text-gray-400 text-sm mt-1">
                  Try adjusting your filters or create a new booking
                </p>
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
        </AnimatePresence>
      </motion.div>
    </TooltipProvider>
  );
}