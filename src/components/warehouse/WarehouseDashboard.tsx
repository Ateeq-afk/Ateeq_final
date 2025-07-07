import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Warehouse,
  Package,
  MapPin,
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Settings,
  Filter,
  RefreshCw,
  X,
  BarChart3,
  Grid3X3,
  List,
  Zap,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Layout,
  Thermometer,
  Droplets,
  Shield,
  Box,
  Calendar,
  ChevronRight,
  Layers,
  Target,
  PieChart,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { warehouseService, Warehouse as WarehouseType, WarehouseLocation, InventoryRecord } from '@/services/warehouses';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';

// Mock data for demonstration - replace with real API calls
const mockWarehouses: WarehouseType[] = [
  {
    id: '1',
    name: 'Central Warehouse',
    branch_id: 'branch1',
    organization_id: 'org1',
    address: '123 Industrial Area, Sector 15',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400012',
    phone: '+91 98765 43210',
    email: 'central@desicargo.com',
    status: 'active',
    warehouse_type: 'distribution',
    total_capacity_sqft: 25000,
    manager_name: 'Rajesh Kumar',
    manager_contact: '+91 98765 43211',
    operating_hours: {
      monday: { open: '06:00', close: '22:00' },
      tuesday: { open: '06:00', close: '22:00' },
      wednesday: { open: '06:00', close: '22:00' },
      thursday: { open: '06:00', close: '22:00' },
      friday: { open: '06:00', close: '22:00' },
      saturday: { open: '08:00', close: '18:00' },
      sunday: { open: '08:00', close: '18:00' }
    },
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'North Zone Hub',
    branch_id: 'branch1',
    organization_id: 'org1',
    address: '456 Logistics Park, Phase 2',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110045',
    phone: '+91 98765 43212',
    email: 'north@desicargo.com',
    status: 'active',
    warehouse_type: 'fulfillment',
    total_capacity_sqft: 15000,
    manager_name: 'Priya Sharma',
    manager_contact: '+91 98765 43213',
    operating_hours: {
      monday: { open: '05:00', close: '23:00' },
      tuesday: { open: '05:00', close: '23:00' },
      wednesday: { open: '05:00', close: '23:00' },
      thursday: { open: '05:00', close: '23:00' },
      friday: { open: '05:00', close: '23:00' },
      saturday: { open: '07:00', close: '20:00' },
      sunday: { open: '07:00', close: '20:00' }
    },
    created_at: '2024-02-01T14:20:00Z',
  }
];

const mockStats = {
  totalWarehouses: 8,
  totalLocations: 124,
  totalInventory: 2847,
  utilizationRate: 73,
  inboundToday: 145,
  outboundToday: 132,
  pendingMovements: 23,
  lowStockAlerts: 7
};

const mockRecentActivity = [
  {
    id: '1',
    type: 'inbound',
    warehouse: 'Central Warehouse',
    location: 'A-01-15',
    article: 'Electronic Components',
    quantity: 250,
    timestamp: '2 minutes ago'
  },
  {
    id: '2',
    type: 'outbound',
    warehouse: 'North Zone Hub',
    location: 'B-02-08',
    article: 'Textile Goods',
    quantity: 180,
    timestamp: '5 minutes ago'
  },
  {
    id: '3',
    type: 'transfer',
    warehouse: 'Central Warehouse',
    location: 'C-01-12 → A-02-05',
    article: 'Automotive Parts',
    quantity: 75,
    timestamp: '12 minutes ago'
  }
];

export default function WarehouseDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'warehouses' | 'inventory' | 'activity'>('overview');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [warehouses, setWarehouses] = useState<WarehouseType[]>(mockWarehouses);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseType | null>(null);

  const { getCurrentUserBranch } = useAuth();
  const { selectedBranch } = useBranchSelection();

  const effectiveBranchId = selectedBranch?.id || selectedBranch || getCurrentUserBranch()?.id;

  // Load warehouses
  const loadWarehouses = async () => {
    setLoading(true);
    try {
      const data = await warehouseService.getWarehouses({ 
        branch_id: effectiveBranchId 
      });
      setWarehouses(data);
    } catch (error) {
      console.error('Failed to load warehouses:', error);
      // Use mock data as fallback
      setWarehouses(mockWarehouses);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (effectiveBranchId) {
      loadWarehouses();
    }
  }, [effectiveBranchId]);

  // Filter warehouses
  const filteredWarehouses = warehouses.filter(warehouse => {
    const matchesSearch = warehouse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         warehouse.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         warehouse.manager_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || warehouse.status === filterStatus;
    const matchesType = filterType === 'all' || warehouse.warehouse_type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      case 'maintenance': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'distribution': return Building2;
      case 'fulfillment': return Package;
      case 'cold_storage': return Thermometer;
      case 'hazmat': return Shield;
      default: return Warehouse;
    }
  };

  const OverviewTab = () => (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl border border-gray-200/30 dark:border-gray-700/30 shadow-2xl p-6"
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
              <Warehouse className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{mockStats.totalWarehouses}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Warehouses</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-green-600 dark:text-green-400 text-sm font-medium">+12% from last month</span>
          </div>
        </motion.div>

        <motion.div
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl border border-gray-200/30 dark:border-gray-700/30 shadow-2xl p-6"
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center">
              <MapPin className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{mockStats.totalLocations}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Locations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-green-600 dark:text-green-400 text-sm font-medium">+8% from last month</span>
          </div>
        </motion.div>

        <motion.div
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl border border-gray-200/30 dark:border-gray-700/30 shadow-2xl p-6"
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
              <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{mockStats.totalInventory.toLocaleString()}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Items in Stock</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <span className="text-red-600 dark:text-red-400 text-sm font-medium">-3% from last week</span>
          </div>
        </motion.div>

        <motion.div
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl border border-gray-200/30 dark:border-gray-700/30 shadow-2xl p-6"
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{mockStats.utilizationRate}%</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Utilization</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-green-600 dark:text-green-400 text-sm font-medium">+5% from last month</span>
          </div>
        </motion.div>
      </div>

      {/* Daily Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl border-gray-200/30 dark:border-gray-700/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Today's Activity
            </CardTitle>
            <CardDescription>Real-time warehouse operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                    <ArrowDownRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{mockStats.inboundToday}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Inbound</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                    <ArrowUpRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{mockStats.outboundToday}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Outbound</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                    <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{mockStats.pendingMovements}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{mockStats.lowStockAlerts}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Low Stock</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl border-gray-200/30 dark:border-gray-700/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest warehouse movements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockRecentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-3 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl">
                <div className={`w-3 h-3 rounded-full ${
                  activity.type === 'inbound' ? 'bg-green-500' :
                  activity.type === 'outbound' ? 'bg-red-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {activity.article}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.warehouse} • {activity.location} • {activity.quantity} units
                  </p>
                </div>
                <span className="text-xs text-gray-400">{activity.timestamp}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const WarehouseCard = ({ warehouse }: { warehouse: WarehouseType }) => {
    const TypeIcon = getTypeIcon(warehouse.warehouse_type || '');
    
    return (
      <motion.div
        className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl border border-gray-200/30 dark:border-gray-700/30 shadow-2xl overflow-hidden group"
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.3 }}
        onClick={() => setSelectedWarehouse(warehouse)}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white">
                <TypeIcon className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {warehouse.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {warehouse.city}, {warehouse.state}
                </p>
              </div>
            </div>
            <Badge className={`${getStatusColor(warehouse.status)} border-none`}>
              {warehouse.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Manager
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {warehouse.manager_name}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Capacity
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {warehouse.total_capacity_sqft?.toLocaleString()} sq ft
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Type
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                {warehouse.warehouse_type?.replace('_', ' ')}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Contact
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {warehouse.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </motion.div>
    );
  };

  const WarehousesTab = () => (
    <div className="space-y-8">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            className="pl-12 pr-12 bg-white/50 dark:bg-gray-700/50 border-gray-200/30 dark:border-gray-600/30 rounded-2xl h-12"
            placeholder="Search warehouses by name, city, or manager..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 bg-white/50 dark:bg-gray-700/50 border-gray-200/30 dark:border-gray-600/30 rounded-2xl h-12">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40 bg-white/50 dark:bg-gray-700/50 border-gray-200/30 dark:border-gray-600/30 rounded-2xl h-12">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="distribution">Distribution</SelectItem>
            <SelectItem value="fulfillment">Fulfillment</SelectItem>
            <SelectItem value="cold_storage">Cold Storage</SelectItem>
            <SelectItem value="hazmat">Hazmat</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-xl h-12 px-4"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-xl h-12 px-4"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12 px-6">
          <Plus className="h-4 w-4 mr-2" />
          Add Warehouse
        </Button>
      </div>

      {/* Warehouses Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </motion.div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
            <motion.div
              key="grid"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {filteredWarehouses.map((warehouse, index) => (
                <motion.div
                  key={warehouse.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <WarehouseCard warehouse={warehouse} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {filteredWarehouses.map((warehouse, index) => (
                <motion.div
                  key={warehouse.id}
                  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-2xl border border-gray-200/30 dark:border-gray-700/30 shadow-xl p-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
                        <Warehouse className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {warehouse.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {warehouse.city}, {warehouse.state} • {warehouse.manager_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={`${getStatusColor(warehouse.status)} border-none`}>
                        {warehouse.status}
                      </Badge>
                      <Button size="sm" variant="outline" className="rounded-xl">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {filteredWarehouses.length === 0 && !loading && (
        <motion.div
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl border border-gray-200/30 dark:border-gray-700/30 shadow-2xl p-16 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Warehouse className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            No Warehouses Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
            {searchQuery || filterStatus !== 'all' || filterType !== 'all'
              ? 'Try adjusting your filters to see more results.'
              : 'Create your first warehouse to start managing inventory and operations.'}
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-8 py-3">
            <Plus className="h-4 w-4 mr-2" />
            Add First Warehouse
          </Button>
        </motion.div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-black dark:to-blue-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                Warehouse Management
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
                Monitor and manage your warehouse operations with real-time insights.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={loadWarehouses}
                variant="outline"
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl border-gray-200/30 dark:border-gray-700/30 hover:bg-white dark:hover:bg-gray-800 rounded-2xl px-6 py-3"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl px-6 py-3">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div 
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl border border-gray-200/30 dark:border-gray-700/30 shadow-2xl mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="p-3">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="grid grid-cols-4 w-full bg-gray-100/50 dark:bg-gray-900/50 rounded-2xl">
                <TabsTrigger 
                  value="overview" 
                  className="py-4 px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-xl rounded-2xl transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5" />
                    <span className="font-medium">Overview</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="warehouses" 
                  className="py-4 px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-xl rounded-2xl transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <Warehouse className="h-5 w-5" />
                    <span className="font-medium">Warehouses</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="inventory" 
                  className="py-4 px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-xl rounded-2xl transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5" />
                    <span className="font-medium">Inventory</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="activity" 
                  className="py-4 px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-xl rounded-2xl transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5" />
                    <span className="font-medium">Activity</span>
                  </div>
                </TabsTrigger>
              </TabsList>

              <div className="p-8">
                <TabsContent value="overview" className="mt-0">
                  <OverviewTab />
                </TabsContent>
                
                <TabsContent value="warehouses" className="mt-0">
                  <WarehousesTab />
                </TabsContent>
                
                <TabsContent value="inventory" className="mt-0">
                  <div className="text-center py-16">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Inventory Management
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Advanced inventory tracking and management features coming soon.
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="activity" className="mt-0">
                  <div className="text-center py-16">
                    <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Activity Logs
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Detailed activity tracking and audit trails coming soon.
                    </p>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </motion.div>
      </div>
    </div>
  );
}