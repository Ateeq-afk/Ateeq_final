import React, { useState, useEffect, useMemo } from 'react';
import { Vehicle } from '@/hooks/useVehicles';
import { 
  Truck, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Wrench, 
  FileText, 
  BarChart3,
  RefreshCw,
  Download,
  Upload,
  Grid3X3,
  List,
  Eye,
  Calendar,
  Activity,
  Settings,
  Fuel,
  MapPin,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVehicles } from '@/hooks/useVehicles';
import { useBranches } from '@/hooks/useBranches';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import VehicleForm from './VehicleForm';
import VehicleDetails from './VehicleDetails';
import VehicleMaintenanceForm from './VehicleMaintenanceForm';
import VehicleDocuments from './VehicleDocuments';
import VehicleAnalytics from './VehicleAnalytics';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  ActivityIndicator, 
  MetricCardSkeleton, 
  NoSearchResults,
  LoadingCard,
  TransactionSkeleton
} from '@/components/ui/loading-states';
import { EmptyState } from '@/components/ui/empty-states';

// Apple-inspired Vehicle Card Component
const AppleVehicleCard: React.FC<{
  vehicle: Vehicle;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
  onScheduleMaintenance: () => void;
  onManageDocuments: () => void;
  onUpdateStatus: (status: 'active' | 'maintenance' | 'inactive') => void;
}> = ({ vehicle, index, onEdit, onDelete, onViewDetails, onScheduleMaintenance, onManageDocuments, onUpdateStatus }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const getStatusColor = (status: string) => {
    const colors = {
      active: { bg: 'bg-green-50 dark:bg-green-950/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-200/50 dark:border-green-800/30', icon: CheckCircle2 },
      maintenance: { bg: 'bg-orange-50 dark:bg-orange-950/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200/50 dark:border-orange-800/30', icon: Wrench },
      inactive: { bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-200/50 dark:border-red-800/30', icon: XCircle },
    };
    return colors[status] || colors.active;
  };
  
  const getTypeColor = (type: string) => {
    const colors = {
      own: 'from-blue-500 to-blue-600',
      hired: 'from-purple-500 to-purple-600',
      attached: 'from-gray-500 to-gray-600'
    };
    return colors[type] || colors.own;
  };
  
  const statusConfig = getStatusColor(vehicle.status);
  const StatusIcon = statusConfig.icon;
  
  const isMaintenanceDue = vehicle.next_maintenance_date && new Date(vehicle.next_maintenance_date) <= new Date();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -2, scale: 1.005 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900/50",
        "border border-gray-200/50 dark:border-gray-800/50",
        "shadow-sm hover:shadow-lg transition-all duration-300",
        "backdrop-blur-sm cursor-pointer",
        "haptic-light hover-lift-subtle"
      )}
    >
      {/* Glass morphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/30 to-white/10 dark:from-gray-900/60 dark:via-gray-900/30 dark:to-gray-900/10" />
      
      {/* Noise texture for depth */}
      <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`
        }} />
      </div>
      
      {/* Status indicator */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r transition-all duration-300",
        vehicle.status === 'active' ? 'from-green-400 to-green-500' :
        vehicle.status === 'maintenance' ? 'from-orange-400 to-orange-500' :
        'from-red-400 to-red-500'
      )} />
      
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Vehicle icon with type-based gradient */}
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                "bg-gradient-to-br shadow-sm border border-white/20 dark:border-gray-800/20",
                getTypeColor(vehicle.type)
              )}
            >
              <Truck className="h-6 w-6 text-white" strokeWidth={1.5} />
            </motion.div>
            
            <div className="min-w-0 flex-1">
              <motion.button
                whileHover={{ x: 2 }}
                onClick={onViewDetails}
                className="font-semibold text-primary text-lg tracking-tight hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
              >
                {vehicle.vehicle_number}
              </motion.button>
              <p className="text-body-sm text-secondary font-medium">
                {vehicle.make} {vehicle.model} ({vehicle.year})
              </p>
            </div>
          </div>
          
          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center",
                  "border border-gray-200/50 dark:border-gray-700/50",
                  "bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm",
                  "hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200",
                  "opacity-0 group-hover:opacity-100"
                )}
              >
                <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Vehicle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onScheduleMaintenance}>
                <Wrench className="h-4 w-4 mr-2" />
                Schedule Maintenance
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onManageDocuments}>
                <FileText className="h-4 w-4 mr-2" />
                Manage Documents
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {vehicle.status !== 'active' && (
                <DropdownMenuItem onClick={() => onUpdateStatus('active')}>
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                  Mark as Active
                </DropdownMenuItem>
              )}
              {vehicle.status !== 'maintenance' && (
                <DropdownMenuItem onClick={() => onUpdateStatus('maintenance')}>
                  <Wrench className="h-4 w-4 mr-2 text-orange-600" />
                  Mark as Under Maintenance
                </DropdownMenuItem>
              )}
              {vehicle.status !== 'inactive' && (
                <DropdownMenuItem onClick={() => onUpdateStatus('inactive')}>
                  <XCircle className="h-4 w-4 mr-2 text-red-600" />
                  Mark as Inactive
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={onDelete}>
                <Trash className="h-4 w-4 mr-2" />
                Delete Vehicle
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Status and Type badges */}
        <div className="flex items-center gap-2 mb-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.1 }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
              "border backdrop-blur-sm",
              statusConfig.bg, statusConfig.text, statusConfig.border
            )}
          >
            <StatusIcon className="h-3.5 w-3.5" strokeWidth={2} />
            <span className="capitalize">{vehicle.status}</span>
          </motion.div>
          
          <Badge variant="outline" className="text-xs">
            {vehicle.type}
          </Badge>
          
          {isMaintenanceDue && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/30"
            >
              <AlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400" />
              <span className="text-xs font-medium text-red-600 dark:text-red-400">Maintenance Due</span>
            </motion.div>
          )}
        </div>
        
        {/* Maintenance info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-caption text-tertiary font-medium">Last Maintenance</span>
            <span className="text-caption text-secondary font-medium">
              {vehicle.last_maintenance_date ? new Date(vehicle.last_maintenance_date).toLocaleDateString() : 'Never'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-caption text-tertiary font-medium">Next Maintenance</span>
            <span className={cn(
              "text-caption font-medium",
              isMaintenanceDue ? "text-red-600 dark:text-red-400" : "text-secondary"
            )}>
              {vehicle.next_maintenance_date ? new Date(vehicle.next_maintenance_date).toLocaleDateString() : 'Not scheduled'}
            </span>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onViewDetails}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl",
              "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
              "border border-blue-200/50 dark:border-blue-800/30",
              "hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-all duration-200",
              "text-sm font-medium"
            )}
          >
            <Eye className="h-4 w-4" />
            <span>View Details</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onScheduleMaintenance}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl",
              "bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400",
              "border border-gray-200/50 dark:border-gray-700/50",
              "hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-all duration-200",
              "text-sm font-medium"
            )}
          >
            <Wrench className="h-4 w-4" />
            <span className="hidden sm:inline">Maintenance</span>
          </motion.button>
        </div>
        
        {/* Hover indicator */}
        <motion.div
          className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300"
          initial={{ x: 10, opacity: 0 }}
          whileHover={{ x: 0, opacity: 1 }}
        >
          <div className="w-8 h-8 rounded-full bg-white/10 dark:bg-black/10 backdrop-blur-sm flex items-center justify-center">
            <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default function VehicleList() {
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [showMaintenance, setShowMaintenance] = useState<string | null>(null);
  const [showDocuments, setShowDocuments] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('vehicle_number');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [refreshing, setRefreshing] = useState(false);
  const itemsPerPage = viewMode === 'grid' ? 9 : 10;

  const { vehicles, loading, error, createVehicle, updateVehicle, deleteVehicle, updateVehicleStatus, refresh } = useVehicles();
  const { branches } = useBranches();
  const { showSuccess, showError } = useNotificationSystem();

  // Apply filters and sorting
  const filteredVehicles = React.useMemo(() => {
    return vehicles.filter(vehicle => {
      // Search filter
      const matchesSearch = 
        vehicle.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Branch filter
      const matchesBranch = branchFilter === 'all' || vehicle.branch_id === branchFilter;
      
      // Type filter
      const matchesType = typeFilter === 'all' || vehicle.type === typeFilter;
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
      
      return matchesSearch && matchesBranch && matchesType && matchesStatus;
    }).sort((a, b) => {
      // Sorting
      if (sortField === 'vehicle_number') {
        return sortDirection === 'asc' 
          ? a.vehicle_number.localeCompare(b.vehicle_number)
          : b.vehicle_number.localeCompare(a.vehicle_number);
      } else if (sortField === 'make_model') {
        const aStr = `${a.make} ${a.model}`;
        const bStr = `${b.make} ${b.model}`;
        return sortDirection === 'asc'
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      } else if (sortField === 'year') {
        return sortDirection === 'asc'
          ? a.year - b.year
          : b.year - a.year;
      } else if (sortField === 'status') {
        return sortDirection === 'asc'
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      }
      return 0;
    });
  }, [vehicles, searchQuery, branchFilter, typeFilter, statusFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const paginatedVehicles = filteredVehicles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCreateVehicle = async (data) => {
    try {
      await createVehicle(data);
      setShowForm(false);
      showSuccess('Vehicle Created', 'Vehicle has been successfully created');
    } catch (err) {
      console.error('Failed to create vehicle:', err);
      showError(
        'Creation Failed',
        err instanceof Error ? err.message : 'Failed to create vehicle'
      );
    }
  };

  const handleUpdateVehicle = async (data) => {
    if (!editingVehicle) return;
    
    try {
      await updateVehicle(editingVehicle.id, data);
      setEditingVehicle(null);
      setShowForm(false);
      showSuccess('Vehicle Updated', 'Vehicle has been successfully updated');
    } catch (err) {
      console.error('Failed to update vehicle:', err);
      showError(
        'Update Failed',
        err instanceof Error ? err.message : 'Failed to update vehicle'
      );
    }
  };

  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return;

    try {
      setDeleteError(null);
      await deleteVehicle(vehicleToDelete);
      setVehicleToDelete(null);
      showSuccess('Vehicle Deleted', 'Vehicle has been successfully deleted');
    } catch (err) {
      console.error('Failed to delete vehicle:', err);
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete vehicle');
    }
  };

  const handleUpdateStatus = async (id: string, status: 'active' | 'maintenance' | 'inactive') => {
    try {
      await updateVehicleStatus(id, status);
      showSuccess('Status Updated', `Vehicle status has been updated to ${status}`);
    } catch (err) {
      console.error('Failed to update status:', err);
      showError(
        'Update Failed',
        err instanceof Error ? err.message : 'Failed to update vehicle status'
      );
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRefresh = async () => {
    try {
      await refresh();
      showSuccess('Refreshed', 'Vehicle list has been refreshed');
    } catch (err) {
      showError(
        'Refresh Failed',
        err instanceof Error ? err.message : 'Failed to refresh vehicle list'
      );
    }
  };

  const handleMaintenanceSubmit = async (data) => {
    try {
      // In a real implementation, this would create a maintenance record
      // For demo purposes, we'll just update the vehicle status and dates
      await updateVehicle(data.vehicleId, {
        status: 'maintenance',
        last_maintenance_date: new Date().toISOString(),
        next_maintenance_date: data.scheduledDate
      });
      
      setShowMaintenance(null);
      showSuccess('Maintenance Scheduled', 'Vehicle maintenance has been scheduled successfully');
    } catch (err) {
      console.error('Failed to schedule maintenance:', err);
      showError(
        'Scheduling Failed',
        err instanceof Error ? err.message : 'Failed to schedule vehicle maintenance'
      );
    }
  };

  const handleRefreshEnhanced = async () => {
    setRefreshing(true);
    try {
      await refresh();
      showSuccess('Refreshed', 'Vehicle list has been refreshed');
    } catch (err) {
      showError(
        'Refresh Failed',
        err instanceof Error ? err.message : 'Failed to refresh vehicle list'
      );
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
          
          {/* Filters skeleton */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/50 dark:border-gray-800/50 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
          
          {/* Content skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 flex items-center justify-center">
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load vehicles"
          description="There was an error loading your vehicles. Please try again."
          action={{
            label: "Try Again",
            onClick: () => window.location.reload()
          }}
        />
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-3xl mx-auto">
          <VehicleForm
            onSubmit={editingVehicle ? handleUpdateVehicle : handleCreateVehicle}
            onCancel={() => {
              setShowForm(false);
              setEditingVehicle(null);
            }}
            initialData={editingVehicle || undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Enhanced Header */}
      <div className="sticky top-0 z-10 bg-white/70 dark:bg-black/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-semibold text-gray-900 dark:text-gray-100"
              >
                Fleet Management
              </motion.h1>
              <Badge variant="outline" className="text-xs">
                {filteredVehicles.length} vehicles
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View mode toggle */}
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'list')} className="">
                <TabsList className="grid w-full grid-cols-2 h-9">
                  <TabsTrigger value="grid" className="text-xs">
                    <Grid3X3 className="h-3.5 w-3.5" />
                  </TabsTrigger>
                  <TabsTrigger value="list" className="text-xs">
                    <List className="h-3.5 w-3.5" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Button variant="outline" size="sm" onClick={() => setShowAnalytics(true)} className="h-9">
                <BarChart3 className="h-4 w-4 mr-1" />
                Analytics
              </Button>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshEnhanced}
                  disabled={refreshing}
                  className={cn(
                    "h-9 transition-all duration-300 haptic-medium",
                    refreshing && "cursor-not-allowed opacity-50"
                  )}
                >
                  <motion.div
                    animate={{ rotate: refreshing ? 360 : 0 }}
                    transition={{ 
                      duration: refreshing ? 1 : 0.3, 
                      repeat: refreshing ? Infinity : 0,
                      ease: refreshing ? "linear" : "easeOut"
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </motion.div>
                </Button>
              </motion.div>
              
              <Button onClick={() => setShowForm(true)} size="sm" className="h-9">
                <Plus className="h-4 w-4 mr-1" />
                Add Vehicle
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* Enhanced Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900/50 rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-sm backdrop-blur-sm"
        >
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="relative"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  className={cn(
                    "pl-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm",
                    "border-gray-200/50 dark:border-gray-700/50",
                    "focus:bg-white dark:focus:bg-gray-800 transition-all duration-200"
                  )}
                  placeholder="Search vehicles by number, make, or model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
                    <SelectValue placeholder="Filter by branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name} - {branch.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="own">Own</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                    <SelectItem value="attached">Attached</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Vehicle Display */}
        <AnimatePresence mode="wait">
          {paginatedVehicles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-12"
            >
              {searchQuery || branchFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all' ? (
                <NoSearchResults
                  title="No vehicles found"
                  description="Try adjusting your search terms or filters"
                  onClear={() => {
                    setSearchQuery('');
                    setBranchFilter('all');
                    setTypeFilter('all');
                    setStatusFilter('all');
                  }}
                />
              ) : (
                <EmptyState
                  illustration="data"
                  title="No vehicles found"
                  description="Get started by adding your first vehicle to the fleet"
                  action={{
                    label: "Add Vehicle",
                    onClick: () => setShowForm(true),
                    icon: Plus
                  }}
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedVehicles.map((vehicle, index) => (
                    <AppleVehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      index={index}
                      onEdit={() => {
                        setEditingVehicle(vehicle);
                        setShowForm(true);
                      }}
                      onDelete={() => setVehicleToDelete(vehicle.id)}
                      onViewDetails={() => setShowDetails(vehicle.id)}
                      onScheduleMaintenance={() => setShowMaintenance(vehicle.id)}
                      onManageDocuments={() => setShowDocuments(vehicle.id)}
                      onUpdateStatus={(status) => handleUpdateStatus(vehicle.id, status)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-900/50 rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-sm backdrop-blur-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                          <th 
                            className="text-left text-sm font-medium text-gray-600 dark:text-gray-400 px-6 py-4 cursor-pointer"
                            onClick={() => handleSort('vehicle_number')}
                          >
                            <div className="flex items-center gap-2">
                              Vehicle Number
                              {sortField === 'vehicle_number' && (
                                <span className="text-blue-600 dark:text-blue-400">
                                  {sortDirection === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                          <th 
                            className="text-left text-sm font-medium text-gray-600 dark:text-gray-400 px-6 py-4 cursor-pointer"
                            onClick={() => handleSort('make_model')}
                          >
                            <div className="flex items-center gap-2">
                              Make & Model
                              {sortField === 'make_model' && (
                                <span className="text-blue-600 dark:text-blue-400">
                                  {sortDirection === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                          <th 
                            className="text-left text-sm font-medium text-gray-600 dark:text-gray-400 px-6 py-4 cursor-pointer"
                            onClick={() => handleSort('year')}
                          >
                            <div className="flex items-center gap-2">
                              Year
                              {sortField === 'year' && (
                                <span className="text-blue-600 dark:text-blue-400">
                                  {sortDirection === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                          <th className="text-left text-sm font-medium text-gray-600 dark:text-gray-400 px-6 py-4">Type</th>
                          <th 
                            className="text-left text-sm font-medium text-gray-600 dark:text-gray-400 px-6 py-4 cursor-pointer"
                            onClick={() => handleSort('status')}
                          >
                            <div className="flex items-center gap-2">
                              Status
                              {sortField === 'status' && (
                                <span className="text-blue-600 dark:text-blue-400">
                                  {sortDirection === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                          <th className="text-left text-sm font-medium text-gray-600 dark:text-gray-400 px-6 py-4">Maintenance</th>
                          <th className="text-right text-sm font-medium text-gray-600 dark:text-gray-400 px-6 py-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {paginatedVehicles.map((vehicle, index) => (
                          <motion.tr 
                            key={vehicle.id} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <motion.span 
                                whileHover={{ x: 2 }}
                                className="font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                                onClick={() => setShowDetails(vehicle.id)}
                              >
                                {vehicle.vehicle_number}
                              </motion.span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                  <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-gray-100">{vehicle.make} {vehicle.model}</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{vehicle.type}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-900 dark:text-gray-100">{vehicle.year}</td>
                            <td className="px-6 py-4">
                              <Badge variant={
                                vehicle.type === 'own' ? 'default' : 
                                vehicle.type === 'hired' ? 'secondary' : 
                                'outline'
                              }>
                                {vehicle.type}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Badge variant={
                                  vehicle.status === 'active' 
                                    ? 'default' 
                                    : vehicle.status === 'maintenance' 
                                    ? 'secondary' 
                                    : 'destructive'
                                } className={cn(
                                  vehicle.status === 'active' && "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-800/30",
                                  vehicle.status === 'maintenance' && "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-300 dark:border-orange-800/30"
                                )}>
                                  {vehicle.status === 'active' ? (
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                  ) : vehicle.status === 'maintenance' ? (
                                    <Wrench className="h-3 w-3 mr-1" />
                                  ) : (
                                    <XCircle className="h-3 w-3 mr-1" />
                                  )}
                                  {vehicle.status}
                                </Badge>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm">
                                <div className="text-gray-900 dark:text-gray-100">Last: {vehicle.last_maintenance_date ? new Date(vehicle.last_maintenance_date).toLocaleDateString() : 'Never'}</div>
                                <div className={cn(
                                  "mt-1",
                                  vehicle.next_maintenance_date && new Date(vehicle.next_maintenance_date) <= new Date()
                                    ? 'text-red-600 dark:text-red-400 font-medium'
                                    : 'text-gray-500 dark:text-gray-400'
                                )}>
                                  Next: {vehicle.next_maintenance_date ? new Date(vehicle.next_maintenance_date).toLocaleDateString() : 'Not scheduled'}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setShowDetails(vehicle.id)}
                                  className="flex items-center gap-1"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="hidden sm:inline">View</span>
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="h-5 w-5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => {
                                      setEditingVehicle(vehicle);
                                      setShowForm(true);
                                    }}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Vehicle
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setShowMaintenance(vehicle.id)}>
                                      <Wrench className="h-4 w-4 mr-2" />
                                      Schedule Maintenance
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setShowDocuments(vehicle.id)}>
                                      <FileText className="h-4 w-4 mr-2" />
                                      Manage Documents
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {vehicle.status !== 'active' && (
                                      <DropdownMenuItem onClick={() => handleUpdateStatus(vehicle.id, 'active')}>
                                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                                        Mark as Active
                                      </DropdownMenuItem>
                                    )}
                                    {vehicle.status !== 'maintenance' && (
                                      <DropdownMenuItem onClick={() => handleUpdateStatus(vehicle.id, 'maintenance')}>
                                        <Wrench className="h-4 w-4 mr-2 text-orange-600" />
                                        Mark as Under Maintenance
                                      </DropdownMenuItem>
                                    )}
                                    {vehicle.status !== 'inactive' && (
                                      <DropdownMenuItem onClick={() => handleUpdateStatus(vehicle.id, 'inactive')}>
                                        <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                        Mark as Inactive
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="text-red-600 dark:text-red-400"
                                      onClick={() => setVehicleToDelete(vehicle.id)}
                                    >
                                      <Trash className="h-4 w-4 mr-2" />
                                      Delete Vehicle
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900/50 rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-sm backdrop-blur-sm"
          >
            <div className="flex items-center justify-between px-6 py-4">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredVehicles.length)}
                </span>{' '}
                of <span className="font-medium">{filteredVehicles.length}</span> vehicles
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show pages around current page
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        currentPage !== pageNum && "bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                      )}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                >
                  Next
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!vehicleToDelete} onOpenChange={() => {
        setVehicleToDelete(null);
        setDeleteError(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Vehicle</DialogTitle>
          </DialogHeader>
          
          {deleteError ? (
            <div className="flex items-start gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{deleteError}</span>
            </div>
          ) : (
            <div className="text-gray-600">
              Are you sure you want to delete this vehicle? This action cannot be undone.
            </div>
          )}
          
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setVehicleToDelete(null);
                setDeleteError(null);
              }}
            >
              Cancel
            </Button>
            {!deleteError && (
              <Button 
                onClick={() => handleDeleteVehicle()}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Vehicle Details Dialog */}
      {showDetails && (
        <VehicleDetails
          vehicleId={showDetails}
          onClose={() => setShowDetails(null)}
          onEdit={(vehicle) => {
            setEditingVehicle(vehicle);
            setShowDetails(null);
            setShowForm(true);
          }}
          onScheduleMaintenance={(vehicleId) => {
            setShowDetails(null);
            setShowMaintenance(vehicleId);
          }}
          onManageDocuments={(vehicleId) => {
            setShowDetails(null);
            setShowDocuments(vehicleId);
          }}
        />
      )}

      {/* Maintenance Form Dialog */}
      {showMaintenance && (
        <VehicleMaintenanceForm
          vehicleId={showMaintenance}
          onClose={() => setShowMaintenance(null)}
          onSubmit={handleMaintenanceSubmit}
        />
      )}

      {/* Documents Dialog */}
      {showDocuments && (
        <VehicleDocuments
          vehicleId={showDocuments}
          onClose={() => setShowDocuments(null)}
        />
      )}

      {/* Analytics Dialog */}
      {showAnalytics && (
        <VehicleAnalytics
          onClose={() => setShowAnalytics(false)}
        />
      )}
    </div>
  );
}