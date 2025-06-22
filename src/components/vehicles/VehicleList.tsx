import React, { useState, useEffect } from 'react';
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
  Upload
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
import { useVehicles } from '@/hooks/useVehicles';
import { useBranches } from '@/hooks/useBranches';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import VehicleForm from './VehicleForm';
import VehicleDetails from './VehicleDetails';
import VehicleMaintenanceForm from './VehicleMaintenanceForm';
import VehicleDocuments from './VehicleDocuments';
import VehicleAnalytics from './VehicleAnalytics';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

export default function VehicleList() {
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
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
  const itemsPerPage = 10;

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
      showError('Creation Failed', 'Failed to create vehicle');
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
      showError('Update Failed', 'Failed to update vehicle');
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
      showError('Update Failed', 'Failed to update vehicle status');
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
      showError('Refresh Failed', 'Failed to refresh vehicle list');
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
      showError('Scheduling Failed', 'Failed to schedule vehicle maintenance');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-2 text-blue-600">
          <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></div>
          <span>Loading vehicles...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          <span>Failed to load vehicles. Please try again.</span>
        </div>
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vehicles</h2>
          <p className="text-gray-600 mt-1">
            {filteredVehicles.length} vehicles found
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setShowAnalytics(true)} className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </Button>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Vehicle
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Search vehicles by number, make, or model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger>
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
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="own">Own</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
                <SelectItem value="attached">Attached</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th 
                  className="text-left text-sm font-medium text-gray-600 px-6 py-4 cursor-pointer"
                  onClick={() => handleSort('vehicle_number')}
                >
                  <div className="flex items-center gap-2">
                    Vehicle Number
                    {sortField === 'vehicle_number' && (
                      <span className="text-blue-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="text-left text-sm font-medium text-gray-600 px-6 py-4 cursor-pointer"
                  onClick={() => handleSort('make_model')}
                >
                  <div className="flex items-center gap-2">
                    Make & Model
                    {sortField === 'make_model' && (
                      <span className="text-blue-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="text-left text-sm font-medium text-gray-600 px-6 py-4 cursor-pointer"
                  onClick={() => handleSort('year')}
                >
                  <div className="flex items-center gap-2">
                    Year
                    {sortField === 'year' && (
                      <span className="text-blue-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Type</th>
                <th 
                  className="text-left text-sm font-medium text-gray-600 px-6 py-4 cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    Status
                    {sortField === 'status' && (
                      <span className="text-blue-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Maintenance</th>
                <th className="text-right text-sm font-medium text-gray-600 px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span 
                      className="font-medium text-blue-600 cursor-pointer hover:underline"
                      onClick={() => setShowDetails(vehicle.id)}
                    >
                      {vehicle.vehicle_number}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center">
                        <Truck className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{vehicle.make} {vehicle.model}</div>
                        <div className="text-sm text-gray-500 capitalize">{vehicle.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{vehicle.year}</td>
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        vehicle.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : vehicle.status === 'maintenance'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {vehicle.status === 'active' ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : vehicle.status === 'maintenance' ? (
                          <Wrench className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {vehicle.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div>Last: {vehicle.last_maintenance_date ? new Date(vehicle.last_maintenance_date).toLocaleDateString() : 'N/A'}</div>
                      <div className={`${
                        vehicle.next_maintenance_date && new Date(vehicle.next_maintenance_date) <= new Date()
                          ? 'text-red-600 font-medium'
                          : 'text-gray-500'
                      }`}>
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
                        <Truck className="h-4 w-4" />
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
                              <Wrench className="h-4 w-4 mr-2 text-yellow-600" />
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
                            className="text-red-600"
                            onClick={() => setVehicleToDelete(vehicle.id)}
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete Vehicle
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}

              {paginatedVehicles.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No vehicles found</h3>
                    <p className="text-gray-500 mt-1">
                      {searchQuery || branchFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all'
                        ? 'Try adjusting your filters to see more results'
                        : 'Add your first vehicle to get started'}
                    </p>
                    {!searchQuery && branchFilter === 'all' && typeFilter === 'all' && statusFilter === 'all' && (
                      <Button 
                        onClick={() => setShowForm(true)} 
                        className="mt-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Vehicle
                      </Button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
            <div className="text-sm text-gray-700">
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
              >
                Next
              </Button>
            </div>
          </div>
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