import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Calendar,
  Filter,
  AlertCircle,
  Settings,
  Truck,
  Package,
  MapPin,
  User,
  Clock,
  ArrowRight,
  Download,
  Eye,
  MoreVertical,
  RefreshCw,
  Zap,
  TrendingUp,
  X,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUnloading } from '@/hooks/useUnloading';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import { useBranches } from '@/hooks/useBranches';
import UnloadingTableForm from './unloading/UnloadingTableForm';
import UnloadingHistory from './unloading/UnloadingHistory';

// Debug component to show branch selection state
const BranchDebugInfo = ({ selectedBranch, userBranch, branches, effectiveBranchId }: any) => {
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <motion.div 
      className="mb-4 p-3 bg-yellow-50/80 dark:bg-yellow-900/20 backdrop-blur-sm border border-yellow-200/50 dark:border-yellow-800/50 rounded-xl text-xs"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Branch Debug Info:</h4>
      <div className="mt-1 space-y-1 text-yellow-700 dark:text-yellow-300">
        <div>Selected Branch: {selectedBranch || 'null'}</div>
        <div>User Branch: {userBranch?.id || 'null'} ({userBranch?.name || 'N/A'})</div>
        <div>Effective Branch ID: {effectiveBranchId || 'null'}</div>
        <div>Available Branches: {branches.length}</div>
        {branches.length > 0 && (
          <div>First Branch: {branches[0]?.id} ({branches[0]?.name})</div>
        )}
      </div>
    </motion.div>
  );
};

export default function UnloadingPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedOGPL, setSelectedOGPL] = useState<string | null>(null);
  const [ogpls, setOGPLs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [vehicleType, setVehicleType] = useState('all');
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  const { organizations } = useOrganizations();
  const { getCurrentUserBranch } = useAuth();
  const { selectedBranch, setSelectedBranch } = useBranchSelection();
  const { branches } = useBranches();

  const organizationId = organizations[0]?.id;
  const userBranch = getCurrentUserBranch();
  const effectiveBranchId = selectedBranch?.id || selectedBranch || userBranch?.id;

  const { getIncomingOGPLs, unloadOGPL, loading, error } = useUnloading();

  // Auto-select branch if none is selected
  useEffect(() => {
    if (!selectedBranch && branches.length > 0) {
      let branchToSelect = null;
      
      if (userBranch) {
        console.log('UnloadingPage: Auto-selecting user branch:', userBranch);
        branchToSelect = userBranch.id;
      } else {
        console.log('UnloadingPage: Auto-selecting first available branch:', branches[0]);
        branchToSelect = branches[0].id;
      }
      
      if (branchToSelect) {
        setSelectedBranch(branchToSelect);
      }
    }
  }, [selectedBranch, userBranch, branches, setSelectedBranch]);

  useEffect(() => {
    if (organizationId && effectiveBranchId) {
      loadOGPLs();
    }
  }, [organizationId, effectiveBranchId]);

  const loadOGPLs = async () => {
    try {
      const data = await getIncomingOGPLs();
      setOGPLs(data || []);
    } catch (err) {
      console.error('Failed to load OGPLs:', err);
    }
  };

  const handleUnload = async (
    ogplId: string,
    bookingIds: string[],
    conditions: any
  ) => {
    try {
      if (!effectiveBranchId) {
        alert('Branch not selected. Please select a branch first.');
        return;
      }

      await unloadOGPL(ogplId, bookingIds, conditions, effectiveBranchId);
      setShowForm(false);
      loadOGPLs();
    } catch (err) {
      console.error('Failed to unload OGPL:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to unload OGPL';
      alert(`Failed to unload OGPL: ${errorMessage}`);
    }
  };

  // Filter OGPLs based on search and filters
  const filteredOGPLs = ogpls.filter((ogpl) => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      ogpl.ogpl_number.toLowerCase().includes(searchLower) ||
      ogpl.vehicle?.vehicle_number.toLowerCase().includes(searchLower) ||
      ogpl.from_station?.name.toLowerCase().includes(searchLower) ||
      ogpl.to_station?.name.toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    // Vehicle type filter
    if (vehicleType !== 'all' && ogpl.vehicle?.type !== vehicleType)
      return false;

    // Date range filter
    if (dateRange !== 'all') {
      const ogplDate = new Date(ogpl.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);

      switch (dateRange) {
        case 'today':
          if (ogplDate.toDateString() !== today.toDateString()) return false;
          break;
        case 'yesterday':
          if (ogplDate.toDateString() !== yesterday.toDateString())
            return false;
          break;
        case 'last_week':
          if (ogplDate < lastWeek) return false;
          break;
      }
    }

    return true;
  });

  if (!organizationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Organization Selected
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please select or create an organization first
          </p>
        </div>
      </div>
    );
  }

  if (!effectiveBranchId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 p-6">
        <BranchDebugInfo 
          selectedBranch={selectedBranch}
          userBranch={userBranch}
          branches={branches}
          effectiveBranchId={effectiveBranchId}
        />
        <div className="max-w-md mx-auto mt-20">
          <Card className="p-8 border-0 shadow-lg bg-white/80 backdrop-blur-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Branch Selection Required</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Please select a branch to continue
              </p>
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Branch
              </label>
              <Select value={selectedBranch || ''} onValueChange={setSelectedBranch}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Choose your branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{branch.name}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">{branch.city}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </motion.div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Loading OGPLs</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Fetching shipment data...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Dashboard Error</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Failed to load OGPL data</p>
          <Button onClick={() => loadOGPLs()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (showForm && selectedOGPL) {
    const ogpl = ogpls.find((o) => o.id === selectedOGPL);
    return (
      <UnloadingTableForm
        ogpl={ogpl}
        onSubmit={handleUnload}
        onClose={() => {
          setShowForm(false);
          setSelectedOGPL(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <motion.div 
          className="mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-semibold text-gray-900 dark:text-white">
                Unload OGPL
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-3 text-lg">
                Manage incoming shipments and deliveries with ease
              </p>
              {effectiveBranchId && (
                <div className="flex items-center gap-2 mt-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Active Branch: <span className="font-medium text-gray-900 dark:text-gray-100">{branches.find(b => b.id === effectiveBranchId)?.name || effectiveBranchId}</span>
                  </p>
                </div>
              )}
            </div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={loadOGPLs}
                variant="ghost"
                className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl px-5 py-2.5 font-medium transition-all"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Tabs Section */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as 'pending' | 'history')
            }
          >
            <TabsList className="grid grid-cols-2 w-full bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-xl p-1 rounded-xl">
              <TabsTrigger 
                value="pending" 
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm rounded-lg transition-all"
              >
                <div className="flex items-center gap-2.5 py-2">
                  <Truck className="h-4 w-4" />
                  <span className="font-medium">Pending Unloading</span>
                  <Badge variant="secondary" className="ml-2">{filteredOGPLs.length}</Badge>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm rounded-lg transition-all"
              >
                <div className="flex items-center gap-2.5 py-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">History</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {activeTab === 'pending' ? (
          <>
            {/* Search Filters */}
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Transit Date
                  </label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="h-10 bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-lg">
                      <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="last_week">Last Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Vehicle Type
                  </label>
                  <Select value={vehicleType} onValueChange={setVehicleType}>
                    <SelectTrigger className="h-10 bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-lg">
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="own">Own</SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
                      <SelectItem value="attached">Attached</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Quick Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      className="pl-10 pr-10 h-10 bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-lg"
                      placeholder="Search OGPL, vehicle, or location"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        onClick={() => setSearchQuery('')}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* OGPL Grid */}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <AnimatePresence mode="wait">
                {filteredOGPLs.map((ogpl, index) => (
                  <motion.div
                    key={ogpl.id}
                    className="group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card className="p-6 border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl h-full hover:shadow-xl transition-all duration-300">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg">
                            {ogpl.ogpl_number.slice(-2)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                              {ogpl.ogpl_number}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              In Transit
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          {ogpl.loading_records?.length || 0} Items
                        </Badge>
                      </div>

                      {/* Content */}
                      <div className="space-y-4 mb-6">
                        {/* Vehicle Info */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                              <Truck className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {ogpl.vehicle?.vehicle_number}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                {ogpl.vehicle?.type} Vehicle
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Route Info */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                              <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {ogpl.from_station?.name}
                                </p>
                                <ArrowRight className="h-3 w-3 text-gray-400" />
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {ogpl.to_station?.name}
                                </p>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Expected arrival: 2 hours
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Driver Info */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                              <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {ogpl.primary_driver_name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {ogpl.primary_driver_mobile}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        onClick={() => {
                          setSelectedOGPL(ogpl.id);
                          setShowForm(true);
                        }}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        Start Unloading
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Card>
                  </motion.div>
                ))}

                {filteredOGPLs.length === 0 && (
                  <motion.div
                    className="col-span-full"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card className="p-16 border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl text-center">
                      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Truck className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        No OGPLs Found
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        {searchQuery ||
                        dateRange !== 'all' ||
                        vehicleType !== 'all'
                          ? 'Try adjusting your filters to see more results'
                          : 'No OGPLs are currently awaiting unloading'}
                      </p>
                      {(searchQuery || dateRange !== 'all' || vehicleType !== 'all') && (
                        <Button
                          onClick={() => {
                            setSearchQuery('');
                            setDateRange('all');
                            setVehicleType('all');
                          }}
                          variant="outline"
                          className="border-gray-200 dark:border-gray-600"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Clear Filters
                        </Button>
                      )}
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <UnloadingHistory
              organizationId={organizationId}
              branchId={effectiveBranchId}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}