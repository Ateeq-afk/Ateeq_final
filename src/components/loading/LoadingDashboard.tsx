import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Package, 
  ArrowUpRight, 
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
  RefreshCw,
  Weight,
  Calculator,
  Route,
  Users,
  Timer,
  Target,
  TrendingUp,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLoading } from '@/hooks/useLoading';
import { useVehicles } from '@/hooks/useVehicles';
import { useBranches } from '@/hooks/useBranches';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import LoadingForm from './LoadingForm';
import LoadingDetails from './LoadingDetails';

export default function LoadingDashboard() {
  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'analytics'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [routeFilter, setRouteFilter] = useState('all');
  const [driverFilter, setDriverFilter] = useState('all');
  const [showLoadingForm, setShowLoadingForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [showLoadingOptimizer, setShowLoadingOptimizer] = useState(false);
  const [loadingStats, setLoadingStats] = useState<any>(null);
  
  const { getCurrentUserBranch, user } = useAuth();
  const { showSuccess, showError } = useNotificationSystem();
  const navigate = useNavigate();
  const { selectedBranch, setSelectedBranch } = useBranchSelection();

  const userBranch = getCurrentUserBranch();
  const userRole = user?.user_metadata?.role || '';
  const effectiveBranchId = selectedBranch || userBranch?.id;
  
  const {
    getPendingBookings,
    getActiveOGPLs,
    createLoadingSession,
    getLoadingHistory,
    loading: loadingData,
    error: loadingError
  } = useLoading();
  
  const { vehicles } = useVehicles();
  const { branches } = useBranches();

  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [activeOGPLs, setActiveOGPLs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<any[]>([]);
  const [routeStats, setRouteStats] = useState<any[]>([]);
  const [vehicleUtilization, setVehicleUtilization] = useState<any[]>([]);

  useEffect(() => {
    // Only set branch if none is selected
    if (!selectedBranch) {
      // First priority: user's assigned branch
      if (userBranch) {
        setSelectedBranch(userBranch.id);
      } else if (userRole === 'admin' || userRole === 'superadmin') {
        // For admins: select first available branch if they don't have a specific assignment
        if (branches.length > 0) {
          setSelectedBranch(branches[0].id);
        }
      }
    }
  }, [userBranch, branches, selectedBranch, userRole]);
  
  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!effectiveBranchId) {
        console.warn('No effective branch ID available for loading data');
        return;
      }
      
      try {
        if (activeTab === 'pending') {
          const bookings = await getPendingBookings();
          setPendingBookings(bookings);
          
          const ogpls = await getActiveOGPLs();
          setActiveOGPLs(ogpls);
          
          // Calculate loading statistics
          calculateLoadingStats(bookings, ogpls);
        } else if (activeTab === 'history') {
          const history = await getLoadingHistory();
          setLoadingHistory(history);
        } else if (activeTab === 'analytics') {
          const history = await getLoadingHistory();
          setLoadingHistory(history);
          calculateAnalytics(history);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        showError('Loading Error', err instanceof Error ? err.message : 'Failed to load data');
      }
    };
    
    loadData();
  }, [activeTab, getPendingBookings, getActiveOGPLs, getLoadingHistory, refreshTrigger, effectiveBranchId]);
  
  // Calculate loading statistics
  const calculateLoadingStats = (bookings: any[], ogpls: any[]) => {
    const totalBookings = bookings.length;
    const totalWeight = bookings.reduce((sum, booking) => sum + (booking.actual_weight || 0), 0);
    const totalValue = bookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
    const avgWeight = totalBookings > 0 ? totalWeight / totalBookings : 0;
    
    const routeDistribution = bookings.reduce((acc, booking) => {
      const route = `${booking.from_branch_details?.city || 'Unknown'} → ${booking.to_branch_details?.city || 'Unknown'}`;
      acc[route] = (acc[route] || 0) + 1;
      return acc;
    }, {});
    
    setLoadingStats({
      totalBookings,
      totalWeight,
      totalValue,
      avgWeight,
      activeOGPLs: ogpls.length,
      routeDistribution
    });
  };
  
  // Calculate analytics for history
  const calculateAnalytics = (history: any[]) => {
    // Route performance analysis
    const routes = history.reduce((acc, session) => {
      const route = `${session.from_branch?.name} → ${session.to_branch?.name}`;
      if (!acc[route]) {
        acc[route] = {
          count: 0,
          totalItems: 0,
          avgLoadTime: 0,
          utilization: 0
        };
      }
      acc[route].count += 1;
      acc[route].totalItems += session.total_items || 0;
      return acc;
    }, {});
    
    setRouteStats(Object.entries(routes).map(([route, stats]: [string, any]) => ({
      route,
      ...stats,
      avgItems: stats.totalItems / stats.count
    })));
    
    // Vehicle utilization analysis
    const vehicleStats = history.reduce((acc, session) => {
      const vehicleId = session.vehicle?.vehicle_number || 'Unknown';
      if (!acc[vehicleId]) {
        acc[vehicleId] = {
          trips: 0,
          totalItems: 0,
          totalValue: 0,
          routes: new Set()
        };
      }
      acc[vehicleId].trips += 1;
      acc[vehicleId].totalItems += session.total_items || 0;
      acc[vehicleId].routes.add(`${session.from_branch?.name} → ${session.to_branch?.name}`);
      return acc;
    }, {});
    
    setVehicleUtilization(Object.entries(vehicleStats).map(([vehicle, stats]: [string, any]) => ({
      vehicle,
      trips: stats.trips,
      totalItems: stats.totalItems,
      avgItems: stats.totalItems / stats.trips,
      routeCount: stats.routes.size
    })));
  };
  
  // Enhanced filtering with route and driver filters
  const filteredHistory = React.useMemo(() => {
    return loadingHistory.filter(session => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        session.ogpl?.ogpl_number.toLowerCase().includes(searchLower) ||
        session.vehicle?.vehicle_number.toLowerCase().includes(searchLower) ||
        session.from_branch?.name.toLowerCase().includes(searchLower) ||
        session.to_branch?.name.toLowerCase().includes(searchLower) ||
        session.ogpl?.primary_driver_name?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Vehicle filter
      const matchesVehicle = vehicleFilter === 'all' || session.vehicle_id === vehicleFilter;
      
      // Route filter
      const route = `${session.from_branch?.name} → ${session.to_branch?.name}`;
      const matchesRoute = routeFilter === 'all' || route.includes(routeFilter);
      
      // Driver filter
      const matchesDriver = driverFilter === 'all' || 
        session.ogpl?.primary_driver_name?.toLowerCase().includes(driverFilter.toLowerCase());

      // Date filter
      if (dateFilter !== 'all') {
        const sessionDate = new Date(session.loaded_at);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        switch (dateFilter) {
          case 'today':
            if (sessionDate.toDateString() !== today.toDateString()) return false;
            break;
          case 'yesterday':
            if (sessionDate.toDateString() !== yesterday.toDateString()) return false;
            break;
          case 'last_week':
            if (sessionDate < lastWeek) return false;
            break;
          case 'last_month':
            if (sessionDate < lastMonth) return false;
            break;
        }
      }

      return matchesVehicle && matchesRoute && matchesDriver;
    });
  }, [loadingHistory, searchQuery, dateFilter, vehicleFilter, routeFilter, driverFilter]);
  
  // Filter pending bookings
  const filteredPendingBookings = React.useMemo(() => {
    return pendingBookings.filter(booking => {
      const searchLower = searchQuery.toLowerCase();
      return !searchQuery || 
        booking.lr_number.toLowerCase().includes(searchLower) ||
        booking.sender?.name?.toLowerCase().includes(searchLower) ||
        booking.receiver?.name?.toLowerCase().includes(searchLower) ||
        booking.article?.name?.toLowerCase().includes(searchLower) ||
        booking.from_branch_details?.name?.toLowerCase().includes(searchLower) ||
        booking.to_branch_details?.name?.toLowerCase().includes(searchLower);
    });
  }, [pendingBookings, searchQuery]);
  
  // Bulk selection handlers
  const toggleBookingSelection = (bookingId: string) => {
    setSelectedBookings(prev => 
      prev.includes(bookingId) 
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };
  
  const selectAllBookings = () => {
    setSelectedBookings(filteredPendingBookings.map(b => b.id));
  };
  
  const clearSelection = () => {
    setSelectedBookings([]);
  };
  
  // Smart loading optimizer
  const optimizeLoading = () => {
    if (filteredPendingBookings.length === 0) return;
    
    // Group by route for efficiency
    const routeGroups = filteredPendingBookings.reduce((acc: Record<string, any[]>, booking) => {
      const route = `${booking.from_branch}-${booking.to_branch}`;
      if (!acc[route]) acc[route] = [];
      acc[route].push(booking);
      return acc;
    }, {});
    
    // Find the route with most bookings
    const optimalRoute = Object.entries(routeGroups)
      .sort((a, b) => b[1].length - a[1].length)[0];
    
    if (optimalRoute) {
      const [, bookings] = optimalRoute;
      setSelectedBookings(bookings.map((b: any) => b.id));
      showSuccess('Loading Optimized', `Selected ${bookings.length} bookings for route optimization`);
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Handle loading form submission
  const handleLoadingSubmit = async (data: any) => {
    try {
      await createLoadingSession(data);
      setShowLoadingForm(false);
      handleRefresh();
    } catch (err) {
      console.error('Failed to create loading session:', err);
      showError('Loading Failed', 'Failed to create loading session');
    }
  };
  
  // Show error state if there's a loading error
  if (loadingError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Error Loading Data</h3>
            <p className="text-red-700 mt-1">{loadingError.message}</p>
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              className="mt-4 border-red-300 text-red-700 hover:bg-red-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Show branch selection if no effective branch
  if (!effectiveBranchId) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800">No Branch Selected</h3>
            <p className="text-yellow-700 mt-1">Please select a branch to view loading operations.</p>
            <div className="mt-4">
              <Select value={selectedBranch || ''} onValueChange={setSelectedBranch}>
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
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (showLoadingForm) {
    return (
      <LoadingForm 
        pendingBookings={pendingBookings}
        vehicles={vehicles}
        branches={branches}
        onSubmit={handleLoadingSubmit}
        onCancel={() => setShowLoadingForm(false)}
      />
    );
  }
  
  if (selectedSession) {
    const session = loadingHistory.find(s => s.id === selectedSession);
    if (!session) {
      return (
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">Session Not Found</h3>
              <p className="text-yellow-700 mt-1">The selected loading session could not be found.</p>
              <Button 
                onClick={() => setSelectedSession(null)} 
                variant="outline" 
                className="mt-4"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <LoadingDetails 
        session={session}
        onClose={() => setSelectedSession(null)}
      />
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Loading Management</h2>
          <p className="text-gray-600 mt-1">
            Manage loading operations for outbound shipments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedBranch || ''} onValueChange={setSelectedBranch}>
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
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          {activeTab === 'pending' && (
            <Button 
              onClick={() => setShowLoadingForm(true)}
              className="flex items-center gap-2"
              disabled={pendingBookings.length === 0}
            >
              <Plus className="h-4 w-4" />
              Create Loading Sheet
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-1">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'pending' | 'history' | 'analytics')}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="pending" className="py-3">
                <Package className="h-4 w-4 mr-2" />
                Pending Loading
              </TabsTrigger>
              <TabsTrigger value="history" className="py-3">
                <Clock className="h-4 w-4 mr-2" />
                Loading History
              </TabsTrigger>
              <TabsTrigger value="analytics" className="py-3">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {activeTab === 'pending' ? (
        <div className="space-y-6">
          {/* Loading Statistics */}
          {loadingStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Bookings</p>
                    <p className="text-2xl font-bold">{loadingStats.totalBookings}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Total Weight</p>
                    <p className="text-2xl font-bold">{loadingStats.totalWeight.toFixed(1)} kg</p>
                  </div>
                  <Weight className="h-8 w-8 text-green-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Total Value</p>
                    <p className="text-2xl font-bold">₹{loadingStats.totalValue.toLocaleString()}</p>
                  </div>
                  <Calculator className="h-8 w-8 text-purple-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Active OGPLs</p>
                    <p className="text-2xl font-bold">{loadingStats.activeOGPLs}</p>
                  </div>
                  <Truck className="h-8 w-8 text-orange-200" />
                </div>
              </div>
            </div>
          )}
          
          {/* Pending Bookings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Pending Bookings</h3>
                  <p className="text-gray-600 mt-1">
                    {filteredPendingBookings.length} bookings waiting to be loaded
                    {selectedBookings.length > 0 && (
                      <span className="ml-2 text-blue-600 font-medium">
                        ({selectedBookings.length} selected)
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!bulkSelectMode ? (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={optimizeLoading}
                        className="flex items-center gap-2"
                        disabled={filteredPendingBookings.length === 0}
                      >
                        <Target className="h-4 w-4" />
                        Smart Select
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setBulkSelectMode(true)}
                        className="flex items-center gap-2"
                        disabled={filteredPendingBookings.length === 0}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Bulk Select
                      </Button>
                      {pendingBookings.length > 0 && (
                        <Button 
                          onClick={() => setShowLoadingForm(true)}
                          className="flex items-center gap-2"
                        >
                          <Truck className="h-4 w-4" />
                          Load Bookings
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={selectAllBookings}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Select All
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={clearSelection}
                        className="flex items-center gap-2"
                      >
                        Clear
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setBulkSelectMode(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => setShowLoadingForm(true)}
                        disabled={selectedBookings.length === 0}
                        className="flex items-center gap-2"
                      >
                        <Truck className="h-4 w-4" />
                        Load Selected ({selectedBookings.length})
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Search and Filter */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    className="pl-10"
                    placeholder="Search bookings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {filteredPendingBookings.length > 0 && (
                  <div className="text-sm text-gray-500">
                    {filteredPendingBookings.length} of {pendingBookings.length} bookings
                  </div>
                )}
              </div>
            </div>
            
            {loadingData ? (
              <div className="flex justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                  <p className="text-gray-600 font-medium">Loading bookings...</p>
                </div>
              </div>
            ) : filteredPendingBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      {bulkSelectMode && (
                        <th className="text-left text-sm font-medium text-gray-600 px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedBookings.length === filteredPendingBookings.length && filteredPendingBookings.length > 0}
                            onChange={() => {
                              if (selectedBookings.length === filteredPendingBookings.length) {
                                clearSelection();
                              } else {
                                selectAllBookings();
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                      )}
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">LR Number</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Date</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Route</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Sender</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Receiver</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Article</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Weight</th>
                      <th className="text-right text-sm font-medium text-gray-600 px-6 py-4">Amount</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPendingBookings.map((booking) => (
                      <tr 
                        key={booking.id} 
                        className={`hover:bg-gray-50 ${
                          selectedBookings.includes(booking.id) ? 'bg-blue-50' : ''
                        } ${
                          booking.priority === 'Urgent' ? 'border-l-4 border-l-red-500' :
                          booking.priority === 'High' ? 'border-l-4 border-l-orange-500' : ''
                        }`}
                        onClick={() => bulkSelectMode && toggleBookingSelection(booking.id)}
                      >
                        {bulkSelectMode && (
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedBookings.includes(booking.id)}
                              onChange={() => toggleBookingSelection(booking.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <span className="font-medium text-blue-600">{booking.lr_number}</span>
                          {booking.fragile && (
                            <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                              Fragile
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Route className="h-4 w-4 text-gray-400" />
                            <span>{booking.from_branch_details?.city || 'N/A'} → {booking.to_branch_details?.city || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium">{booking.sender?.name || 'N/A'}</div>
                            <div className="text-gray-500">{booking.sender?.mobile || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium">{booking.receiver?.name || 'N/A'}</div>
                            <div className="text-gray-500">{booking.receiver?.mobile || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div>
                            <div className="font-medium">{booking.article?.name || 'N/A'}</div>
                            <div className="text-gray-500">{booking.quantity} {booking.uom}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Weight className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{booking.actual_weight || 0} kg</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-medium">₹{booking.total_amount?.toFixed(2) || '0.00'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            booking.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                            booking.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.priority || 'Normal'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">
                  {searchQuery ? 'No matching bookings found' : 'No Pending Bookings'}
                </h3>
                <p className="text-gray-500 mt-1">
                  {searchQuery ? 'Try adjusting your search criteria' : 'All bookings have been loaded or there are no bookings to load'}
                </p>
              </div>
            )}
          </div>
          
          {/* Active OGPLs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Active OGPLs</h3>
              <p className="text-gray-600 mt-1">
                {activeOGPLs.length} active outward gate passes
              </p>
            </div>
            
            {loadingData ? (
              <div className="flex justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                  <p className="text-gray-600 font-medium">Loading OGPLs...</p>
                </div>
              </div>
            ) : activeOGPLs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">OGPL No</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Date</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Vehicle</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">From</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">To</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Driver</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">LRs</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activeOGPLs.map((ogpl) => (
                      <tr key={ogpl.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-medium text-blue-600">{ogpl.ogpl_number}</span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {new Date(ogpl.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium">{ogpl.vehicle?.vehicle_number || 'N/A'}</div>
                              <div className="text-sm text-gray-500 capitalize">{ogpl.vehicle?.type || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {ogpl.from_station?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {ogpl.to_station?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium">{ogpl.primary_driver_name || 'N/A'}</div>
                            <div className="text-gray-500">{ogpl.primary_driver_mobile || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {ogpl.loading_records?.length || 0} LRs
                        </td>
                        <td className="px-6 py-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowLoadingForm(true)}
                            className="flex items-center gap-1"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add LRs
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No Active OGPLs</h3>
                <p className="text-gray-500 mt-1">Create a new loading sheet to generate an OGPL</p>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'analytics' ? (
        <div className="space-y-6">
          {/* Analytics Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Route Performance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Route className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Route Performance</h3>
              </div>
              
              {routeStats.length > 0 ? (
                <div className="space-y-3">
                  {routeStats.slice(0, 5).map((route, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{route.route}</div>
                        <div className="text-xs text-gray-500">{route.count} trips</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">{route.avgItems.toFixed(1)} avg items</div>
                        <div className="text-xs text-gray-500">{route.totalItems} total</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Route className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No route data available</p>
                </div>
              )}
            </div>
            
            {/* Vehicle Utilization */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Truck className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Vehicle Utilization</h3>
              </div>
              
              {vehicleUtilization.length > 0 ? (
                <div className="space-y-3">
                  {vehicleUtilization.slice(0, 5).map((vehicle, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{vehicle.vehicle}</div>
                        <div className="text-xs text-gray-500">{vehicle.trips} trips • {vehicle.routeCount} routes</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">{vehicle.avgItems.toFixed(1)} avg items</div>
                        <div className="text-xs text-gray-500">{vehicle.totalItems} total</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No vehicle data available</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Performance Metrics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Performance Insights</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {loadingHistory.length}
                </div>
                <div className="text-sm text-blue-800 mt-1">Total Loading Sessions</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {loadingHistory.reduce((sum, session) => sum + (session.total_items || 0), 0)}
                </div>
                <div className="text-sm text-green-800 mt-1">Total Items Loaded</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {loadingHistory.length > 0 ? 
                    (loadingHistory.reduce((sum, session) => sum + (session.total_items || 0), 0) / loadingHistory.length).toFixed(1) : 
                    '0'
                  }
                </div>
                <div className="text-sm text-orange-800 mt-1">Average Items per Load</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Enhanced Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  className="pl-10"
                  placeholder="Search by OGPL, vehicle, or driver..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last_week">Last Week</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                </SelectContent>
              </Select>

              <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.vehicle_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                placeholder="Filter by route..."
                value={routeFilter}
                onChange={(e) => setRouteFilter(e.target.value)}
              />
              
              <Input
                placeholder="Filter by driver..."
                value={driverFilter}
                onChange={(e) => setDriverFilter(e.target.value)}
              />
            </div>
            
            {(searchQuery || dateFilter !== 'all' || vehicleFilter !== 'all' || routeFilter || driverFilter) && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-gray-500">Active filters:</span>
                {searchQuery && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Search: {searchQuery}
                  </span>
                )}
                {dateFilter !== 'all' && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                    Date: {dateFilter}
                  </span>
                )}
                {vehicleFilter !== 'all' && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                    Vehicle
                  </span>
                )}
                {routeFilter && (
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                    Route: {routeFilter}
                  </span>
                )}
                {driverFilter && (
                  <span className="bg-pink-100 text-pink-800 px-2 py-1 rounded text-xs">
                    Driver: {driverFilter}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setDateFilter('all');
                    setVehicleFilter('all');
                    setRouteFilter('');
                    setDriverFilter('');
                  }}
                  className="text-xs"
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>
          
          {/* Loading History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Loading History</h3>
              <p className="text-gray-600 mt-1">
                {filteredHistory.length} loading sessions
              </p>
            </div>
            
            {loadingData ? (
              <div className="flex justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                  <p className="text-gray-600 font-medium">Loading history...</p>
                </div>
              </div>
            ) : filteredHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">OGPL No</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Date</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Vehicle</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">From</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">To</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Items</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Status</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredHistory.map((session) => (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-medium text-blue-600">{session.ogpl?.ogpl_number || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {new Date(session.loaded_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium">{session.vehicle?.vehicle_number || 'N/A'}</div>
                              <div className="text-sm text-gray-500 capitalize">{session.vehicle?.type || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {session.from_branch?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {session.to_branch?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {session.total_items || 0} items
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedSession(session.id)}
                            className="flex items-center gap-1"
                          >
                            <ChevronRight className="h-4 w-4" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No Loading History</h3>
                <p className="text-gray-500 mt-1">
                  {searchQuery || dateFilter !== 'all' || vehicleFilter !== 'all'
                    ? 'Try adjusting your filters to see more results'
                    : 'No loading operations have been completed yet'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}