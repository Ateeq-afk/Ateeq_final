import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Car, 
  Phone, 
  IdCard,
  Filter
} from 'lucide-react';
import { driversService, Driver } from '@/services/drivers';
import { DriverForm } from './DriverForm';
import { useToast } from '@/hooks/use-toast';

export const DriverList: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDrivers();
  }, [searchTerm, statusFilter]);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const data = await driversService.getAll({
        search: searchTerm || undefined,
        status: statusFilter || undefined
      });
      setDrivers(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load drivers',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (driver: Driver) => {
    if (!confirm(`Are you sure you want to delete driver ${driver.name}?`)) {
      return;
    }

    try {
      await driversService.delete(driver.id);
      toast({
        title: 'Success',
        description: 'Driver deleted successfully'
      });
      loadDrivers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete driver',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingDriver(null);
    loadDrivers();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.mobile.includes(searchTerm)
  );

  if (showForm) {
    return (
      <DriverForm
        driver={editingDriver}
        onClose={handleFormClose}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Drivers</h1>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Driver
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search drivers by name, code, or mobile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drivers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrivers.map((driver) => (
            <Card key={driver.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{driver.name}</CardTitle>
                    <p className="text-sm text-gray-600">{driver.employee_code}</p>
                  </div>
                  <Badge className={getStatusColor(driver.status)}>
                    {driver.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{driver.mobile}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <IdCard className="h-4 w-4 text-gray-400" />
                  <span>{driver.license_type} - {driver.license_number}</span>
                </div>
                {driver.vehicle_assignments && driver.vehicle_assignments.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4 text-gray-400" />
                    <span>
                      {driver.vehicle_assignments
                        .filter(a => a.is_active)
                        .map(a => a.vehicles?.vehicle_number)
                        .filter(Boolean)
                        .join(', ') || 'No active assignments'}
                    </span>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(driver)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(driver)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredDrivers.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No drivers found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};