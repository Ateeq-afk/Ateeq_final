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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-black dark:to-blue-900 p-6 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Organization Selected
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Please select or create an organization first
          </p>
        </motion.div>
      </div>
    );
  }

  if (!effectiveBranchId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-black dark:to-blue-900 p-6">
        <BranchDebugInfo 
          selectedBranch={selectedBranch}
          userBranch={userBranch}
          branches={branches}
          effectiveBranchId={effectiveBranchId}
        />
        <motion.div 
          className="max-w-md mx-auto mt-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl p-8 border border-orange-200/30 dark:border-orange-800/30 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-10 w-10 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Branch Selection Required</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Please select a branch to continue with unloading operations.
              </p>
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Branch
              </label>
              <Select value={selectedBranch || ''} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-full bg-white/50 dark:bg-gray-700/50 border-gray-200/50 dark:border-gray-600/50 h-12">
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
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-black dark:to-blue-900 p-6 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </motion.div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Loading OGPLs</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Please wait while we fetch your data...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 dark:from-gray-900 dark:via-black dark:to-red-900 p-6 flex items-center justify-center">
        <motion.div 
          className="text-center max-w-md"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Loading Failed</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6">
            We couldn't load your OGPLs. Please check your connection and try again.
          </p>
          <Button 
            onClick={loadOGPLs}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-medium"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </motion.div>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-black dark:to-blue-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                Unload OGPL
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
                Manage incoming shipments and deliveries with ease.
              </p>
              {effectiveBranchId && (
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Active Branch: <span className="font-medium text-blue-600 dark:text-blue-400">{effectiveBranchId}</span>
                  </p>
                </div>
              )}
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={loadOGPLs}
                variant="outline"
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl border-gray-200/30 dark:border-gray-700/30 hover:bg-white dark:hover:bg-gray-800 rounded-2xl px-6 py-3"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Tabs Section */}
        <motion.div 
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl border border-gray-200/30 dark:border-gray-700/30 shadow-2xl mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="p-3">
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as 'pending' | 'history')
              }
            >
              <TabsList className="grid grid-cols-2 w-full bg-gray-100/50 dark:bg-gray-900/50 rounded-2xl">
                <TabsTrigger 
                  value="pending" 
                  className="py-4 px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-xl rounded-2xl transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                      <Truck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Pending Unloading</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {filteredOGPLs.length} shipments
                      </div>
                    </div>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="py-4 px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-xl rounded-2xl transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">History</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Past records</div>
                    </div>
                  </div>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </motion.div>

        {activeTab === 'pending' ? (
          <>
            {/* Search Filters */}
            <motion.div 
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl border border-gray-200/30 dark:border-gray-700/30 shadow-2xl p-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-3">
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Calendar className="h-4 w-4 mr-2" />
                    Transit Date
                  </label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-gray-200/30 dark:border-gray-600/30 hover:bg-white dark:hover:bg-gray-700 transition-colors rounded-xl h-12">
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

                <div className="space-y-3">
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Truck className="h-4 w-4 mr-2" />
                    Vehicle Type
                  </label>
                  <Select value={vehicleType} onValueChange={setVehicleType}>
                    <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-gray-200/30 dark:border-gray-600/30 hover:bg-white dark:hover:bg-gray-700 transition-colors rounded-xl h-12">
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

                <div className="md:col-span-2 space-y-3">
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Search className="h-4 w-4 mr-2" />
                    Quick Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      className="pl-12 pr-12 py-3 bg-white/50 dark:bg-gray-700/50 border-gray-200/30 dark:border-gray-600/30 rounded-xl focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-blue-500/20 transition-all h-12"
                      placeholder="Search by OGPL number, vehicle, or location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <motion.button
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => setSearchQuery('')}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X className="h-4 w-4" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* OGPL Grid */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <AnimatePresence mode="wait">
                {filteredOGPLs.map((ogpl, index) => (
                  <motion.div
                    key={ogpl.id}
                    className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl border border-gray-200/30 dark:border-gray-700/30 shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                  >
                    <div className="p-8">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {ogpl.ogpl_number.slice(-2)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-xl">
                              {ogpl.ogpl_number}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              OGPL Number
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <motion.button
                            className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Eye className="h-5 w-5 text-gray-400" />
                          </motion.button>
                          <motion.button
                            className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <MoreVertical className="h-5 w-5 text-gray-400" />
                          </motion.button>
                        </div>
                      </div>

                      {/* Content Grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Vehicle */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <Truck className="h-4 w-4" />
                            <span className="text-xs font-medium uppercase tracking-wide">Vehicle</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {ogpl.vehicle?.vehicle_number}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                              {ogpl.vehicle?.type}
                            </p>
                          </div>
                        </div>

                        {/* Route */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <MapPin className="h-4 w-4" />
                            <span className="text-xs font-medium uppercase tracking-wide">Route</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {ogpl.from_station?.name}
                            </p>
                            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                              <ArrowRight className="h-3 w-3" />
                              <span>{ogpl.to_station?.name}</span>
                            </div>
                          </div>
                        </div>

                        {/* Driver */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <User className="h-4 w-4" />
                            <span className="text-xs font-medium uppercase tracking-wide">Driver</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {ogpl.primary_driver_name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {ogpl.primary_driver_mobile}
                            </p>
                          </div>
                        </div>

                        {/* LRs */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <Package className="h-4 w-4" />
                            <span className="text-xs font-medium uppercase tracking-wide">Items</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {ogpl.loading_records?.length || 0} LRs
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Ready to unload
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          onClick={() => {
                            setSelectedOGPL(ogpl.id);
                            setShowForm(true);
                          }}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
                        >
                          <Zap className="h-5 w-5 mr-2" />
                          Start Unloading
                          <ArrowRight className="h-5 w-5 ml-2" />
                        </Button>
                      </motion.div>
                    </div>
                    
                    {/* Hover Effect Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  </motion.div>
                ))}

                {filteredOGPLs.length === 0 && (
                  <motion.div
                    className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl border border-gray-200/30 dark:border-gray-700/30 shadow-2xl p-16 text-center"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-8">
                      <Truck className="h-16 w-16 text-gray-400" />
                    </div>
                    <h3 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      No OGPLs Found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto text-lg">
                      {searchQuery ||
                      dateRange !== 'all' ||
                      vehicleType !== 'all'
                        ? 'Try adjusting your filters to see more results, or check back later for new shipments.'
                        : 'No OGPLs are currently awaiting unloading. Check back later for incoming shipments.'}
                    </p>
                    {(searchQuery || dateRange !== 'all' || vehicleType !== 'all') && (
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          onClick={() => {
                            setSearchQuery('');
                            setDateRange('all');
                            setVehicleType('all');
                          }}
                          variant="outline"
                          className="bg-white/50 dark:bg-gray-700/50 border-gray-200/30 dark:border-gray-600/30 rounded-2xl px-8 py-3"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Clear Filters
                        </Button>
                      </motion.div>
                    )}
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