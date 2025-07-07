import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  MapPin,
  Search,
  Filter,
  QrCode,
  ArrowUpDown,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Eye,
  Edit,
  MoreVertical,
  RefreshCw,
  X,
  Warehouse,
  Box,
  Calendar,
  User,
  Activity,
  Zap,
  Target,
  Layers,
  Grid3X3,
  List,
  Download,
  Upload,
  Scan
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { warehouseService, InventoryRecord } from '@/services/warehouses';

// Mock inventory data
const mockInventoryRecords: InventoryRecord[] = [
  {
    id: '1',
    warehouse_location_id: 'loc-001',
    article_id: 'art-001',
    booking_id: 'book-001',
    item_code: 'ELEC-001',
    batch_number: 'BATCH-2024-001',
    serial_number: 'SN123456789',
    quantity: 250,
    reserved_quantity: 50,
    available_quantity: 200,
    weight_per_unit: 2.5,
    total_weight: 625,
    dimensions_per_unit: {
      length: 30,
      width: 20,
      height: 15,
      unit: 'cm'
    },
    status: 'available',
    condition_rating: 'excellent',
    received_date: '2024-07-01T10:00:00Z',
    expiry_date: '2025-07-01T10:00:00Z',
    last_moved_at: '2024-07-06T15:30:00Z',
    unit_cost: 150,
    total_cost: 37500,
    supplier_name: 'TechSupplies Ltd',
    supplier_batch_ref: 'TS-2024-Q3-001',
    quality_check_status: 'passed',
    quality_check_date: '2024-07-01T11:00:00Z',
    quality_check_by: 'Raj Kumar',
    compliance_certifications: {
      'CE': true,
      'RoHS': true,
      'ISO9001': true
    },
    remarks: 'High-quality electronic components for industrial use',
    created_at: '2024-07-01T10:00:00Z',
    updated_at: '2024-07-06T15:30:00Z',
    created_by: 'user-001',
    updated_by: 'user-002'
  },
  {
    id: '2',
    warehouse_location_id: 'loc-002',
    article_id: 'art-002',
    booking_id: 'book-002',
    item_code: 'TEXT-001',
    batch_number: 'BATCH-2024-002',
    quantity: 180,
    reserved_quantity: 30,
    available_quantity: 150,
    weight_per_unit: 1.2,
    total_weight: 216,
    dimensions_per_unit: {
      length: 40,
      width: 30,
      height: 10,
      unit: 'cm'
    },
    status: 'available',
    condition_rating: 'good',
    received_date: '2024-07-02T14:20:00Z',
    last_moved_at: '2024-07-05T09:15:00Z',
    unit_cost: 85,
    total_cost: 15300,
    supplier_name: 'Textile World',
    supplier_batch_ref: 'TW-2024-July-002',
    quality_check_status: 'passed',
    quality_check_date: '2024-07-02T15:00:00Z',
    quality_check_by: 'Priya Sharma',
    compliance_certifications: {
      'OEKO-TEX': true,
      'GOTS': true
    },
    remarks: 'Premium cotton fabric for apparel manufacturing',
    created_at: '2024-07-02T14:20:00Z',
    updated_at: '2024-07-05T09:15:00Z',
    created_by: 'user-002',
    updated_by: 'user-003'
  },
  {
    id: '3',
    warehouse_location_id: 'loc-003',
    article_id: 'art-003',
    booking_id: 'book-003',
    item_code: 'AUTO-001',
    batch_number: 'BATCH-2024-003',
    quantity: 75,
    reserved_quantity: 25,
    available_quantity: 50,
    weight_per_unit: 5.8,
    total_weight: 435,
    status: 'low_stock',
    condition_rating: 'excellent',
    received_date: '2024-07-03T08:45:00Z',
    last_moved_at: '2024-07-07T12:00:00Z',
    unit_cost: 320,
    total_cost: 24000,
    supplier_name: 'AutoParts Direct',
    supplier_batch_ref: 'APD-2024-Q3-003',
    quality_check_status: 'passed',
    quality_check_date: '2024-07-03T09:30:00Z',
    quality_check_by: 'Amit Singh',
    compliance_certifications: {
      'ISO/TS16949': true,
      'ISO14001': true
    },
    remarks: 'Critical automotive components - monitor stock levels',
    created_at: '2024-07-03T08:45:00Z',
    updated_at: '2024-07-07T12:00:00Z',
    created_by: 'user-003',
    updated_by: 'user-001'
  }
];

const mockLocations = [
  { id: 'loc-001', code: 'A-01-15', name: 'Electronics Storage Zone A', warehouse: 'Central Warehouse' },
  { id: 'loc-002', code: 'B-02-08', name: 'Textile Storage Zone B', warehouse: 'North Zone Hub' },
  { id: 'loc-003', code: 'C-01-12', name: 'Automotive Parts Zone C', warehouse: 'Central Warehouse' },
  { id: 'loc-004', code: 'A-02-05', name: 'General Storage Zone A2', warehouse: 'Central Warehouse' }
];

interface InventoryTrackerProps {
  warehouseId?: string;
  locationId?: string;
}

export default function InventoryTracker({ warehouseId, locationId }: InventoryTrackerProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCondition, setFilterCondition] = useState('all');
  const [sortBy, setSortBy] = useState('last_moved_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(false);
  const [inventoryRecords, setInventoryRecords] = useState<InventoryRecord[]>(mockInventoryRecords);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Load inventory data
  const loadInventory = async () => {
    setLoading(true);
    try {
      let data: InventoryRecord[];
      if (locationId) {
        data = await warehouseService.getInventory(locationId);
      } else {
        data = await warehouseService.getAllInventory();
      }
      setInventoryRecords(data);
    } catch (error) {
      console.error('Failed to load inventory:', error);
      // Use mock data as fallback
      setInventoryRecords(mockInventoryRecords);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [locationId, warehouseId]);

  // Filter and sort inventory
  const filteredInventory = inventoryRecords
    .filter(record => {
      const matchesSearch = 
        record.item_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.batch_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
      const matchesCondition = filterCondition === 'all' || record.condition_rating === filterCondition;
      
      return matchesSearch && matchesStatus && matchesCondition;
    })
    .sort((a, b) => {
      const aValue = a[sortBy as keyof InventoryRecord] as any;
      const bValue = b[sortBy as keyof InventoryRecord] as any;
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'reserved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'low_stock': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'out_of_stock': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'damaged': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'quarantine': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'good': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'fair': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'poor': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getLocationInfo = (locationId: string) => {
    return mockLocations.find(loc => loc.id === locationId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const InventoryCard = ({ record }: { record: InventoryRecord }) => {
    const location = getLocationInfo(record.warehouse_location_id);
    const isSelected = selectedItems.includes(record.id);
    
    return (
      <motion.div
        className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl border border-gray-200/30 dark:border-gray-700/30 shadow-2xl overflow-hidden group cursor-pointer transition-all duration-300 ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        }`}
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.3 }}
        onClick={() => {
          if (isSelected) {
            setSelectedItems(prev => prev.filter(id => id !== record.id));
          } else {
            setSelectedItems(prev => [...prev, record.id]);
          }
        }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                {record.item_code?.slice(-2) || 'IT'}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {record.item_code}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Batch: {record.batch_number}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Badge className={`${getStatusColor(record.status)} border-none text-xs`}>
                {record.status?.replace('_', ' ').toUpperCase()}
              </Badge>
              {record.condition_rating && (
                <Badge className={`${getConditionColor(record.condition_rating)} border-none text-xs`}>
                  {record.condition_rating.toUpperCase()}
                </Badge>
              )}
            </div>
          </div>

          {/* Quantity Info */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {record.quantity}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Total
              </p>
            </div>
            <div className="text-center p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {record.available_quantity}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Available
              </p>
            </div>
            <div className="text-center p-3 bg-orange-50/50 dark:bg-orange-900/20 rounded-2xl">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {record.reserved_quantity}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Reserved
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {location?.code} - {location?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {location?.warehouse}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {record.supplier_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Supplier
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatDate(record.last_moved_at)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Last Activity
                </p>
              </div>
            </div>
          </div>

          {/* Cost Info */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl mb-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Unit Cost</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                ₹{record.unit_cost?.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
              <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                ₹{record.total_cost?.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Actions */}
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
              <QrCode className="h-4 w-4" />
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
        
        {/* Hover Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </motion.div>
    );
  };

  const InventoryRow = ({ record }: { record: InventoryRecord }) => {
    const location = getLocationInfo(record.warehouse_location_id);
    const isSelected = selectedItems.includes(record.id);
    
    return (
      <motion.div
        className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-2xl border border-gray-200/30 dark:border-gray-700/30 shadow-xl p-4 cursor-pointer transition-all duration-300 ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        }`}
        whileHover={{ scale: 1.01 }}
        onClick={() => {
          if (isSelected) {
            setSelectedItems(prev => prev.filter(id => id !== record.id));
          } else {
            setSelectedItems(prev => [...prev, record.id]);
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-semibold">
              {record.item_code?.slice(-2) || 'IT'}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {record.item_code}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {location?.code} • {record.batch_number} • {record.supplier_name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {record.quantity}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
            </div>
            
            <div className="text-center">
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {record.available_quantity}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Available</p>
            </div>
            
            <div className="text-center">
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                ₹{record.total_cost?.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Value</p>
            </div>

            <div className="flex flex-col gap-1">
              <Badge className={`${getStatusColor(record.status)} border-none text-xs`}>
                {record.status?.replace('_', ' ').toUpperCase()}
              </Badge>
              {record.condition_rating && (
                <Badge className={`${getConditionColor(record.condition_rating)} border-none text-xs`}>
                  {record.condition_rating.toUpperCase()}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="rounded-xl">
                <Eye className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            className="pl-12 pr-12 bg-white/50 dark:bg-gray-700/50 border-gray-200/30 dark:border-gray-600/30 rounded-2xl h-12"
            placeholder="Search by item code, batch, serial number, or supplier..."
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
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
            <SelectItem value="low_stock">Low Stock</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            <SelectItem value="damaged">Damaged</SelectItem>
            <SelectItem value="quarantine">Quarantine</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterCondition} onValueChange={setFilterCondition}>
          <SelectTrigger className="w-40 bg-white/50 dark:bg-gray-700/50 border-gray-200/30 dark:border-gray-600/30 rounded-2xl h-12">
            <SelectValue placeholder="Condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Conditions</SelectItem>
            <SelectItem value="excellent">Excellent</SelectItem>
            <SelectItem value="good">Good</SelectItem>
            <SelectItem value="fair">Fair</SelectItem>
            <SelectItem value="poor">Poor</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48 bg-white/50 dark:bg-gray-700/50 border-gray-200/30 dark:border-gray-600/30 rounded-2xl h-12">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last_moved_at">Last Activity</SelectItem>
            <SelectItem value="quantity">Quantity</SelectItem>
            <SelectItem value="total_cost">Total Value</SelectItem>
            <SelectItem value="received_date">Received Date</SelectItem>
            <SelectItem value="item_code">Item Code</SelectItem>
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

        <div className="flex items-center gap-2">
          <Button className="bg-green-600 hover:bg-green-700 text-white rounded-2xl h-12 px-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Stock
          </Button>
          <Button variant="outline" className="rounded-2xl h-12 px-4">
            <Scan className="h-4 w-4 mr-2" />
            Scan QR
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <motion.div
          className="bg-blue-50/50 dark:bg-blue-900/20 backdrop-blur-sm rounded-2xl border border-blue-200/30 dark:border-blue-800/30 p-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="rounded-xl">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Move
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="rounded-xl"
                onClick={() => setSelectedItems([])}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Inventory Display */}
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
              {filteredInventory.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <InventoryCard record={record} />
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
              {filteredInventory.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <InventoryRow record={record} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {filteredInventory.length === 0 && !loading && (
        <motion.div
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl border border-gray-200/30 dark:border-gray-700/30 shadow-2xl p-16 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Package className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            No Inventory Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
            {searchQuery || filterStatus !== 'all' || filterCondition !== 'all'
              ? 'Try adjusting your filters to see more results.'
              : 'No inventory records found. Start by adding stock to your warehouse locations.'}
          </p>
          <Button className="bg-green-600 hover:bg-green-700 text-white rounded-2xl px-8 py-3">
            <Plus className="h-4 w-4 mr-2" />
            Add First Item
          </Button>
        </motion.div>
      )}
    </div>
  );
}