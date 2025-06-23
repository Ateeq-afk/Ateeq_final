import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  Package, 
  Truck, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search,
  Filter,
  Download,
  ChevronRight,
  Plus,
  FileText,
  BarChart3,
  Printer,
  MapPin,
  Phone,
  Mail,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBookings } from '@/hooks/useBookings';
import { useBranches } from '@/hooks/useBranches';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PrintButton } from '@/components/ui/print-button';

export default function BranchOperations() {
  const { selectedBranch, setSelectedBranch } = useBranchSelection();
  const [activeTab, setActiveTab] = useState<'inbound' | 'outbound'>('inbound');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { branches, loading: branchesLoading } = useBranches();
  const { bookings, loading: bookingsLoading } = useBookings(selectedBranch);
  const { getCurrentUserBranch } = useAuth();
  const navigate = useNavigate();
  
  const userBranch = getCurrentUserBranch();
  
  // Set user's branch as default selected branch
  useEffect(() => {
    if (userBranch && !selectedBranch) {
      setSelectedBranch(userBranch.id);
    } else if (branches.length > 0 && !selectedBranch) {
      setSelectedBranch(branches[0].id);
    }
  }, [userBranch, branches, selectedBranch]);
  
  // Get current branch details
  const currentBranch = React.useMemo(() => {
    return branches.find(branch => branch.id === selectedBranch);
  }, [branches, selectedBranch]);
  
  // Filter bookings based on tab, search, and filters
  const filteredBookings = React.useMemo(() => {
    if (!bookings.length) return [];
    
    return bookings.filter(booking => {
      // Filter by tab (inbound/outbound)
      const isInbound = booking.to_branch === selectedBranch;
      const isOutbound = booking.from_branch === selectedBranch;
      
      if (activeTab === 'inbound' && !isInbound) return false;
      if (activeTab === 'outbound' && !isOutbound) return false;
      
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        booking.lr_number.toLowerCase().includes(searchLower) ||
        booking.sender?.name?.toLowerCase().includes(searchLower) ||
        booking.receiver?.name?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
      
      // Status filter
      if (statusFilter !== 'all' && booking.status !== statusFilter) return false;
      
      // Date filter
      if (dateFilter !== 'all') {
        const bookingDate = new Date(booking.created_at);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        switch (dateFilter) {
          case 'today':
            if (bookingDate.toDateString() !== today.toDateString()) return false;
            break;
          case 'yesterday':
            if (bookingDate.toDateString() !== yesterday.toDateString()) return false;
            break;
          case 'last_week':
            if (bookingDate < lastWeek) return false;
            break;
          case 'last_month':
            if (bookingDate < lastMonth) return false;
            break;
        }
      }
      
      return true;
    });
  }, [bookings, selectedBranch, activeTab, searchQuery, statusFilter, dateFilter]);

  // Calculate summary statistics
  const summary = React.useMemo(() => {
    const total = filteredBookings.length;
    const booked = filteredBookings.filter(b => b.status === 'booked').length;
    const inTransit = filteredBookings.filter(b => b.status === 'in_transit').length;
    const delivered = filteredBookings.filter(b => b.status === 'delivered').length;
    const cancelled = filteredBookings.filter(b => b.status === 'cancelled').length;
    
    return { total, booked, inTransit, delivered, cancelled };
  }, [filteredBookings]);
  
  // Handle branch change
  const handleBranchChange = (branchId: string) => {
    setSelectedBranch(branchId);
  };
  
  // Handle booking click
  const handleBookingClick = (bookingId: string) => {
    navigate(`/dashboard/bookings/${bookingId}`);
  };
  
  // Handle print manifest
  const handlePrintManifest = () => {
    // In a real app, this would generate a proper manifest
    window.print();
  };
  
  const isLoading = bookingsLoading || branchesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2 text-blue-600">
          <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
          <span>Loading branch data...</span>
        </div>
      </div>
    );
  }

  if (!currentBranch && selectedBranch) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Branch Not Found</h3>
          <p className="text-gray-600 mt-1">The selected branch could not be found</p>
        </div>
      </div>
    );
  }

  if (!selectedBranch) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Branch Selected</h3>
          <p className="text-gray-600 mt-1">Please select a branch to view its operations</p>
          {branches.length > 0 && (
            <div className="mt-4">
              <Select value={selectedBranch || ''} onValueChange={handleBranchChange}>
                <SelectTrigger className="w-[200px] mx-auto">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name} - {branch.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Branch Operations</h2>
          <p className="text-gray-600 mt-1">
            Manage daily operations for {currentBranch.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedBranch} onValueChange={handleBranchChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name} - {branch.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <PrintButton 
            onPrint={handlePrintManifest}
            className="flex items-center gap-2"
          >
            Print Manifest
          </PrintButton>
        </div>
      </div>
      
      {/* Branch Info Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 print-content"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{currentBranch.name}</h3>
              <div className="flex items-center gap-2 text-gray-600 mt-1">
                <span>{currentBranch.code}</span>
                <span>•</span>
                <span>{currentBranch.city}, {currentBranch.state}</span>
              </div>
            </div>
          </div>
          
          <div className="print-hide">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                <Clock className="h-3.5 w-3.5" />
                <span>Today's Operations</span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Status: {currentBranch.status}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Operations Summary */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-5 gap-4 print-content"
      >
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Total</h3>
            <Package className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{summary.total}</p>
          <p className="text-xs text-gray-500">Shipments</p>
          <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Booked</h3>
            <Package className="h-4 w-4 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-yellow-600 mt-2">{summary.booked}</p>
          <p className="text-xs text-gray-500">Awaiting dispatch</p>
          <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${summary.total ? (summary.booked / summary.total) * 100 : 0}%` }}></div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">In Transit</h3>
            <Truck className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-2">{summary.inTransit}</p>
          <p className="text-xs text-gray-500">On the way</p>
          <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${summary.total ? (summary.inTransit / summary.total) * 100 : 0}%` }}></div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Delivered</h3>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600 mt-2">{summary.delivered}</p>
          <p className="text-xs text-gray-500">Completed</p>
          <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${summary.total ? (summary.delivered / summary.total) * 100 : 0}%` }}></div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Cancelled</h3>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600 mt-2">{summary.cancelled}</p>
          <p className="text-xs text-gray-500">Cancelled</p>
          <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full" style={{ width: `${summary.total ? (summary.cancelled / summary.total) * 100 : 0}%` }}></div>
          </div>
        </div>
      </motion.div>
      
      {/* Tabs and Filters */}
      <div className="print-hide">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="inbound" className="flex items-center gap-1">
                <ArrowDownRight className="h-4 w-4" />
                Inbound
              </TabsTrigger>
              <TabsTrigger value="outbound" className="flex items-center gap-1">
                <ArrowUpRight className="h-4 w-4" />
                Outbound
              </TabsTrigger>
            </TabsList>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  className="pl-10 w-full md:w-64"
                  placeholder="Search by LR or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last_week">Last 7 Days</SelectItem>
                  <SelectItem value="last_month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <TabsContent value="inbound" className="mt-0">
            <BranchShipmentList 
              bookings={filteredBookings} 
              type="inbound"
              onBookingClick={handleBookingClick}
            />
          </TabsContent>
          
          <TabsContent value="outbound" className="mt-0">
            <BranchShipmentList 
              bookings={filteredBookings} 
              type="outbound"
              onBookingClick={handleBookingClick}
            />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Print View */}
      <div className="hidden print:block">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          {activeTab === 'inbound' ? 'Inbound Shipments' : 'Outbound Shipments'} - {new Date().toLocaleDateString()}
        </h3>
        <BranchShipmentList 
          bookings={filteredBookings} 
          type={activeTab as 'inbound' | 'outbound'}
          onBookingClick={() => {}}
          isPrintView
        />
      </div>
    </div>
  );
}

interface BranchShipmentListProps {
  bookings: any[];
  type: 'inbound' | 'outbound';
  onBookingClick: (id: string) => void;
  isPrintView?: boolean;
}

function BranchShipmentList({ bookings, type, onBookingClick, isPrintView = false }: BranchShipmentListProps) {
  return (
    <motion.div
      initial={isPrintView ? {} : { opacity: 0, y: 20 }}
      animate={isPrintView ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">LR Number</th>
              <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Date</th>
              <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">
                {type === 'inbound' ? 'From' : 'To'}
              </th>
              <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">
                {type === 'inbound' ? 'Sender' : 'Receiver'}
              </th>
              <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Article</th>
              <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Status</th>
              <th className="text-right text-sm font-medium text-gray-600 px-6 py-4">Amount</th>
              {!isPrintView && (
                <th className="text-right text-sm font-medium text-gray-600 px-6 py-4">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map((booking) => (
              <tr 
                key={booking.id} 
                className={`hover:bg-gray-50 transition-colors ${!isPrintView ? 'cursor-pointer' : ''}`}
                onClick={!isPrintView ? () => onBookingClick(booking.id) : undefined}
              >
                <td className="px-6 py-4">
                  <span className="font-medium text-blue-600">{booking.lr_number}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(booking.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {type === 'inbound' 
                    ? booking.from_branch_details?.name
                    : booking.to_branch_details?.name
                  }
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <div className="font-medium">
                      {type === 'inbound' 
                        ? booking.sender?.name
                        : booking.receiver?.name
                      }
                    </div>
                    <div className="text-gray-500">
                      {type === 'inbound' 
                        ? booking.sender?.mobile
                        : booking.receiver?.mobile
                      }
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div>
                    <div>{booking.article?.name}</div>
                    <div className="text-gray-500">{booking.quantity} {booking.uom}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    booking.status === 'delivered'
                      ? 'bg-green-100 text-green-800'
                      : booking.status === 'in_transit'
                      ? 'bg-blue-100 text-blue-800'
                      : booking.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.status.replace('_', ' ').charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-medium">₹{booking.total_amount}</span>
                </td>
                {!isPrintView && (
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="flex items-center gap-1">
                      <ChevronRight className="h-4 w-4" />
                      <span className="hidden md:inline">View</span>
                    </Button>
                  </td>
                )}
              </tr>
            ))}
            
            {bookings.length === 0 && (
              <tr>
                <td colSpan={isPrintView ? 7 : 8} className="px-6 py-8 text-center text-gray-500">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">No shipments found</h3>
                  <p className="text-gray-500 mt-1">
                    No {type} shipments available for the selected filters
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}