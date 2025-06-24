import React, { useState, useEffect } from 'react';
import { Package, User, Calendar, MapPin, CheckCircle2, AlertCircle, Search, Filter, Download, ChevronRight, Plus, FileText, BarChart3, Printer, RefreshCw, FileSignature as Signature, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePOD } from '@/hooks/usePOD';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import PODForm from './PODForm';
import PODDetails from './PODDetails';

export default function PODDashboard() {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [selectedPOD, setSelectedPOD] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const { getCurrentUserBranch } = useAuth();
  const { showSuccess, showError } = useNotificationSystem();
  const navigate = useNavigate();
  
  const userBranch = getCurrentUserBranch();
  const { 
    getPendingPODBookings, 
    submitPOD, 
    getPODHistory,
    getPODStats,
    loading: podLoading, 
    error: podError 
  } = usePOD();
  
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [podHistory, setPodHistory] = useState<any[]>([]);
  const [podStats, setPodStats] = useState<any>({
    totalDelivered: 0,
    totalPending: 0,
    withSignature: 0,
    withPhoto: 0,
    completionRate: 0
  });
  
  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        if (activeTab === 'pending') {
          const bookings = await getPendingPODBookings();
          setPendingBookings(bookings);
        } else {
          const history = await getPODHistory();
          setPodHistory(history);
          
          const stats = await getPODStats();
          setPodStats(stats);
        }
      } catch (err) {
        console.error('Error loading POD data:', err);
        showError('Loading Error', err instanceof Error ? err.message : 'Failed to load data');
      }
    };
    
    loadData();
  }, [activeTab, getPendingPODBookings, getPODHistory, getPODStats, refreshTrigger]);
  
  // Filter POD history based on search and filters
  const filteredHistory = React.useMemo(() => {
    return podHistory.filter(pod => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        pod.booking?.lr_number.toLowerCase().includes(searchLower) ||
        pod.receiver_name.toLowerCase().includes(searchLower) ||
        pod.receiver_phone.includes(searchLower) ||
        pod.booking?.sender?.name?.toLowerCase().includes(searchLower) ||
        pod.booking?.receiver?.name?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Date filter
      if (dateFilter !== 'all') {
        const podDate = new Date(pod.delivered_at);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        switch (dateFilter) {
          case 'today':
            if (podDate.toDateString() !== today.toDateString()) return false;
            break;
          case 'yesterday':
            if (podDate.toDateString() !== yesterday.toDateString()) return false;
            break;
          case 'last_week':
            if (podDate < lastWeek) return false;
            break;
          case 'last_month':
            if (podDate < lastMonth) return false;
            break;
        }
      }

      return true;
    });
  }, [podHistory, searchQuery, dateFilter]);
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Handle POD form submission
  const handlePODSubmit = async (data: any) => {
    try {
      await submitPOD(data);
      setSelectedBooking(null);
      handleRefresh();
      showSuccess('POD Submitted', 'Proof of delivery has been recorded successfully');
    } catch (err) {
      console.error('Failed to submit POD:', err);
      showError('POD Submission Failed', err instanceof Error ? err.message : 'Failed to submit proof of delivery');
    }
  };
  
  if (podError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Error Loading Data</h3>
            <p className="text-red-700 mt-1">{podError.message}</p>
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
  
  if (selectedBooking) {
    const booking = pendingBookings.find(b => b.id === selectedBooking);
    if (!booking) {
      return (
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">Booking Not Found</h3>
              <p className="text-yellow-700 mt-1">The selected booking could not be found.</p>
              <Button 
                onClick={() => setSelectedBooking(null)} 
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
      <PODForm 
        booking={booking}
        onSubmit={handlePODSubmit}
        onCancel={() => setSelectedBooking(null)}
      />
    );
  }
  
  if (selectedPOD) {
    const pod = podHistory.find(p => p.id === selectedPOD);
    if (!pod) {
      return (
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">POD Not Found</h3>
              <p className="text-yellow-700 mt-1">The selected proof of delivery could not be found.</p>
              <Button 
                onClick={() => setSelectedPOD(null)} 
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
      <PODDetails 
        pod={pod}
        onClose={() => setSelectedPOD(null)}
      />
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Proof of Delivery</h2>
          <p className="text-gray-600 mt-1">
            Manage delivery confirmations
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
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-1">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'pending' | 'history')}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="pending" className="py-3">
                <Package className="h-4 w-4 mr-2" />
                Pending Deliveries
              </TabsTrigger>
              <TabsTrigger value="history" className="py-3">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Delivery History
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {activeTab === 'pending' ? (
        <div className="space-y-6">
          {/* Pending Deliveries */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Pending Deliveries</h3>
                  <p className="text-gray-600 mt-1">
                    {pendingBookings.length} bookings waiting for POD
                  </p>
                </div>
              </div>
            </div>
            
            {podLoading ? (
              <div className="flex justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                  <p className="text-gray-600 font-medium">Loading deliveries...</p>
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
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Action</th>
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
                        <td className="px-6 py-4">
                          <Button 
                            onClick={() => setSelectedBooking(booking.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Confirm Delivery
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No Pending Deliveries</h3>
                <p className="text-gray-500 mt-1">All deliveries have been confirmed or there are no deliveries to confirm</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* POD Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Deliveries</h3>
              <p className="text-2xl font-bold text-gray-900">{podStats.totalDelivered}</p>
              <p className="text-xs text-gray-500 mt-1">Confirmed deliveries</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Pending</h3>
              <p className="text-2xl font-bold text-amber-600">{podStats.totalPending}</p>
              <p className="text-xs text-gray-500 mt-1">Awaiting confirmation</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">With Signature</h3>
              <p className="text-2xl font-bold text-blue-600">{podStats.withSignature}</p>
              <p className="text-xs text-gray-500 mt-1">{podStats.completionRate.toFixed(1)}% completion rate</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">With Photo</h3>
              <p className="text-2xl font-bold text-purple-600">{podStats.withPhoto}</p>
              <p className="text-xs text-gray-500 mt-1">{podStats.withPhoto > 0 && podStats.totalDelivered > 0 ? ((podStats.withPhoto / podStats.totalDelivered) * 100).toFixed(1) : 0}% with photos</p>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  className="pl-10"
                  placeholder="Search by LR number or receiver..."
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

              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* POD History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Delivery History</h3>
              <p className="text-gray-600 mt-1">
                {filteredHistory.length} confirmed deliveries
              </p>
            </div>
            
            {podLoading ? (
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
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">LR Number</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Date</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Receiver</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Sender</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Article</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Signature</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Photo</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredHistory.map((pod) => (
                      <tr key={pod.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-medium text-blue-600">{pod.booking?.lr_number || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {new Date(pod.delivered_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium">{pod.receiver_name}</div>
                            <div className="text-gray-500">{pod.receiver_phone}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {pod.booking?.sender?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {pod.booking?.article?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          {pod.signature_image_url ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Signature className="h-3 w-3" />
                              Available
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <X className="h-3 w-3" />
                              Not Available
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {pod.photo_evidence_url ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Camera className="h-3 w-3" />
                              Available
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <X className="h-3 w-3" />
                              Not Available
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPOD(pod.id)}
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
                <CheckCircle2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No Delivery History</h3>
                <p className="text-gray-500 mt-1">
                  {searchQuery || dateFilter !== 'all'
                    ? 'Try adjusting your filters to see more results'
                    : 'No deliveries have been confirmed yet'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}