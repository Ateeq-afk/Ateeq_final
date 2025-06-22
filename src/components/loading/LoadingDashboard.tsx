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
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLoading } from '@/hooks/useLoading';
import { useVehicles } from '@/hooks/useVehicles';
import { useBranches } from '@/hooks/useBranches';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import LoadingForm from './LoadingForm';
import LoadingDetails from './LoadingDetails';

export default function LoadingDashboard() {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [showLoadingForm, setShowLoadingForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const { getCurrentUserBranch } = useAuth();
  const { showSuccess, showError } = useNotificationSystem();
  const navigate = useNavigate();
  
  const userBranch = getCurrentUserBranch();
  const { 
    getPendingBookings, 
    getActiveOGPLs, 
    createLoadingSession, 
    getLoadingHistory,
    loading: loadingData, 
    error: loadingError 
  } = useLoading(userBranch?.id);
  const { vehicles } = useVehicles(userBranch?.id);
  const { branches } = useBranches();
  
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [activeOGPLs, setActiveOGPLs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<any[]>([]);
  
  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (activeTab === 'pending') {
        const bookings = await getPendingBookings();
        setPendingBookings(bookings);
        
        const ogpls = await getActiveOGPLs();
        setActiveOGPLs(ogpls);
      } else {
        const history = await getLoadingHistory();
        setLoadingHistory(history);
      }
    };
    
    loadData();
  }, [activeTab, getPendingBookings, getActiveOGPLs, getLoadingHistory, refreshTrigger]);
  
  // Filter loading history based on search and filters
  const filteredHistory = React.useMemo(() => {
    return loadingHistory.filter(session => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        session.ogpl?.ogpl_number.toLowerCase().includes(searchLower) ||
        session.vehicle?.vehicle_number.toLowerCase().includes(searchLower) ||
        session.from_branch?.name.toLowerCase().includes(searchLower) ||
        session.to_branch?.name.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Vehicle filter
      const matchesVehicle = vehicleFilter === 'all' || session.vehicle_id === vehicleFilter;

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

      return matchesVehicle;
    });
  }, [loadingHistory, searchQuery, dateFilter, vehicleFilter]);
  
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
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'pending' | 'history')}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="pending" className="py-3">
                <Package className="h-4 w-4 mr-2" />
                Pending Loading
              </TabsTrigger>
              <TabsTrigger value="history" className="py-3">
                <Clock className="h-4 w-4 mr-2" />
                Loading History
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {activeTab === 'pending' ? (
        <div className="space-y-6">
          {/* Pending Bookings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Pending Bookings</h3>
                  <p className="text-gray-600 mt-1">
                    {pendingBookings.length} bookings waiting to be loaded
                  </p>
                </div>
                {pendingBookings.length > 0 && (
                  <Button 
                    onClick={() => setShowLoadingForm(true)}
                    className="flex items-center gap-2"
                  >
                    <Truck className="h-4 w-4" />
                    Load Bookings
                  </Button>
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
            ) : pendingBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">LR Number</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Date</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">From</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">To</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Sender</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Receiver</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Article</th>
                      <th className="text-right text-sm font-medium text-gray-600 px-6 py-4">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-medium text-blue-600">{booking.lr_number}</span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {booking.from_branch_details?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {booking.to_branch_details?.name || 'N/A'}
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
                            <div>{booking.article?.name || 'N/A'}</div>
                            <div className="text-gray-500">{booking.quantity} {booking.uom}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-medium">₹{booking.total_amount?.toFixed(2) || '0.00'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No Pending Bookings</h3>
                <p className="text-gray-500 mt-1">All bookings have been loaded or there are no bookings to load</p>
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
      ) : (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  className="pl-10"
                  placeholder="Search by OGPL number or vehicle..."
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
            </div>
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