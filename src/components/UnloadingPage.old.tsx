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
    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
      <h4 className="font-semibold text-yellow-800">Branch Debug Info:</h4>
      <div className="mt-1 space-y-1 text-yellow-700">
        <div>Selected Branch: {selectedBranch || 'null'}</div>
        <div>User Branch: {userBranch?.id || 'null'} ({userBranch?.name || 'N/A'})</div>
        <div>Effective Branch ID: {effectiveBranchId || 'null'}</div>
        <div>Available Branches: {branches.length}</div>
        {branches.length > 0 && (
          <div>First Branch: {branches[0]?.id} ({branches[0]?.name})</div>
        )}
      </div>
    </div>
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

  const { getIncomingOGPLs, unloadOGPL, loading, error } =
    useUnloading();

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
    console.log('UnloadingPage: organizationId or effectiveBranchId changed:', {
      organizationId,
      effectiveBranchId,
      selectedBranch
    });
    if (organizationId && effectiveBranchId) {
      loadOGPLs();
    }
  }, [organizationId, effectiveBranchId]);

  const loadOGPLs = async () => {
    try {
      console.log('loadOGPLs called with:', { effectiveBranchId, selectedBranch });
      const data = await getIncomingOGPLs();
      console.log('loadOGPLs result:', data);
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
      console.log('Selected Branch:', selectedBranch);
      console.log('Calling unloadOGPL with:', {
        ogplId,
        bookingIds: bookingIds.length,
        branch_id: effectiveBranchId,
      });

      if (!effectiveBranchId) {
        console.error('UnloadingPage: No branch selected. Current state:', {
          selectedBranch,
          userBranch,
          branchesLength: branches.length,
          firstBranch: branches[0]
        });
        alert('Branch not selected. Please select a branch first. If this persists, please refresh the page.');
        return;
      }

      await unloadOGPL(ogplId, bookingIds, conditions, effectiveBranchId);
      setShowForm(false);
      loadOGPLs(); // Refresh the list
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            No Organization Selected
          </h3>
          <p className="text-gray-600 mt-1">
            Please select or create an organization first
          </p>
        </div>
      </div>
    );
  }

  if (!effectiveBranchId) {
    return (
      <div className="p-6">
        <BranchDebugInfo 
          selectedBranch={selectedBranch}
          userBranch={userBranch}
          branches={branches}
          effectiveBranchId={effectiveBranchId}
        />
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">No Branch Selected</h3>
              <p className="text-yellow-700 mt-1">
                Please select a branch to continue with unloading operations.
              </p>
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
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-2 text-blue-600">
          <Settings className="h-5 w-5 animate-spin" />
          <span>Loading OGPLs...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>Failed to load OGPLs. Please try again.</span>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Unload OGPL</h2>
          <p className="text-gray-600 mt-1">
            Unload the transit / dispatch list received for delivery.
          </p>
          {effectiveBranchId && (
            <p className="text-sm text-blue-600 mt-1">
              Current Branch: {effectiveBranchId}
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-1">
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as 'pending' | 'history')
              }
            >
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="pending" className="py-3">
                  <Truck className="h-4 w-4 mr-2" />
                  Pending Unloading
                </TabsTrigger>
                <TabsTrigger value="history" className="py-3">
                  <Clock className="h-4 w-4 mr-2" />
                  Unloading History
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {activeTab === 'pending' ? (
          <>
            {/* Search Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transit Date
                  </label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Type
                  </label>
                  <Select value={vehicleType} onValueChange={setVehicleType}>
                    <SelectTrigger>
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      className="pl-10"
                      placeholder="Search by OGPL number, vehicle, or location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* OGPL List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">
                        OGPL No
                      </th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">
                        Vehicle
                      </th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">
                        From
                      </th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">
                        To
                      </th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">
                        Driver
                      </th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">
                        LRs
                      </th>
                      <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOGPLs.map((ogpl) => (
                      <tr key={ogpl.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600 font-medium">
                              {ogpl.ogpl_number}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium">
                                {ogpl.vehicle?.vehicle_number}
                              </div>
                              <div className="text-sm text-gray-500 capitalize">
                                {ogpl.vehicle?.type}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{ogpl.from_station?.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{ogpl.to_station?.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium">
                                {ogpl.primary_driver_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {ogpl.primary_driver_mobile}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span>{ogpl.loading_records?.length || 0} LRs</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            onClick={() => {
                              setSelectedOGPL(ogpl.id);
                              setShowForm(true);
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Unload
                          </Button>
                        </td>
                      </tr>
                    ))}

                    {filteredOGPLs.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900">
                            No OGPLs found
                          </h3>
                          <p className="text-gray-500 mt-1">
                            {searchQuery ||
                            dateRange !== 'all' ||
                            vehicleType !== 'all'
                              ? 'Try adjusting your filters to see more results'
                              : 'No OGPLs are currently in transit'}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <UnloadingHistory
            organizationId={organizationId}
            branchId={effectiveBranchId}
          />
        )}
      </div>
    </div>
  );
}