import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Plus, 
  Wrench, 
  Clock, 
  DollarSign,
  MapPin,
  FileText
} from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import { fleetService, VehicleMaintenance } from '@/services/fleet';
import { useToast } from '@/hooks/use-toast';

interface MaintenanceFormData {
  vehicle_id: string;
  maintenance_type: 'routine' | 'breakdown' | 'accident' | 'scheduled';
  description: string;
  service_date: string;
  next_service_date: string;
  labor_cost: number;
  parts_cost: number;
  total_cost: number;
  service_provider: string;
  service_location: string;
  bill_number: string;
  odometer_reading: number;
  parts_replaced: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes: string;
}

export const MaintenanceScheduler: React.FC = () => {
  const { vehicles } = useVehicles();
  const [maintenanceRecords, setMaintenanceRecords] = useState<VehicleMaintenance[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [formData, setFormData] = useState<MaintenanceFormData>({
    vehicle_id: '',
    maintenance_type: 'routine',
    description: '',
    service_date: new Date().toISOString().split('T')[0],
    next_service_date: '',
    labor_cost: 0,
    parts_cost: 0,
    total_cost: 0,
    service_provider: '',
    service_location: '',
    bill_number: '',
    odometer_reading: 0,
    parts_replaced: '',
    status: 'scheduled',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedVehicle) {
      loadMaintenanceRecords(selectedVehicle);
    }
  }, [selectedVehicle]);

  const loadMaintenanceRecords = async (vehicleId: string) => {
    try {
      const data = await fleetService.maintenance.getByVehicle(vehicleId);
      setMaintenanceRecords(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load maintenance records',
        variant: 'destructive'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calculate total cost
      const totalCost = formData.labor_cost + formData.parts_cost;
      const submitData = {
        ...formData,
        total_cost: totalCost
      };

      await fleetService.maintenance.create(submitData);
      toast({
        title: 'Success',
        description: 'Maintenance record created successfully'
      });

      // Reset form and reload records
      setFormData({
        vehicle_id: selectedVehicle,
        maintenance_type: 'routine',
        description: '',
        service_date: new Date().toISOString().split('T')[0],
        next_service_date: '',
        labor_cost: 0,
        parts_cost: 0,
        total_cost: 0,
        service_provider: '',
        service_location: '',
        bill_number: '',
        odometer_reading: 0,
        parts_replaced: '',
        status: 'scheduled',
        notes: ''
      });
      setShowForm(false);
      loadMaintenanceRecords(selectedVehicle);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create maintenance record',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof MaintenanceFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMaintenanceTypeColor = (type: string) => {
    switch (type) {
      case 'routine': return 'bg-green-100 text-green-800';
      case 'breakdown': return 'bg-red-100 text-red-800';
      case 'accident': return 'bg-red-100 text-red-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Maintenance Scheduler</h1>
        <Button 
          onClick={() => setShowForm(true)} 
          disabled={!selectedVehicle}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Schedule Maintenance
        </Button>
      </div>

      {/* Vehicle Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Vehicle</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-input bg-background"
          >
            <option value="">Select a vehicle...</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.vehicle_number} - {vehicle.make} {vehicle.model}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Maintenance Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Schedule New Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maintenance_type">Maintenance Type *</Label>
                  <select
                    id="maintenance_type"
                    value={formData.maintenance_type}
                    onChange={(e) => handleInputChange('maintenance_type', e.target.value as any)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    required
                  >
                    <option value="routine">Routine</option>
                    <option value="breakdown">Breakdown</option>
                    <option value="accident">Accident</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value as any)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  required
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service_date">Service Date *</Label>
                  <Input
                    id="service_date"
                    type="date"
                    value={formData.service_date}
                    onChange={(e) => handleInputChange('service_date', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="next_service_date">Next Service Date</Label>
                  <Input
                    id="next_service_date"
                    type="date"
                    value={formData.next_service_date}
                    onChange={(e) => handleInputChange('next_service_date', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="labor_cost">Labor Cost (₹)</Label>
                  <Input
                    id="labor_cost"
                    type="number"
                    value={formData.labor_cost}
                    onChange={(e) => handleInputChange('labor_cost', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="parts_cost">Parts Cost (₹)</Label>
                  <Input
                    id="parts_cost"
                    type="number"
                    value={formData.parts_cost}
                    onChange={(e) => handleInputChange('parts_cost', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="total_cost">Total Cost (₹)</Label>
                  <Input
                    id="total_cost"
                    type="number"
                    value={formData.labor_cost + formData.parts_cost}
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service_provider">Service Provider</Label>
                  <Input
                    id="service_provider"
                    value={formData.service_provider}
                    onChange={(e) => handleInputChange('service_provider', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="service_location">Service Location</Label>
                  <Input
                    id="service_location"
                    value={formData.service_location}
                    onChange={(e) => handleInputChange('service_location', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bill_number">Bill Number</Label>
                  <Input
                    id="bill_number"
                    value={formData.bill_number}
                    onChange={(e) => handleInputChange('bill_number', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="odometer_reading">Odometer Reading (km)</Label>
                  <Input
                    id="odometer_reading"
                    type="number"
                    value={formData.odometer_reading}
                    onChange={(e) => handleInputChange('odometer_reading', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="parts_replaced">Parts Replaced</Label>
                <Textarea
                  id="parts_replaced"
                  value={formData.parts_replaced}
                  onChange={(e) => handleInputChange('parts_replaced', e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Maintenance Record'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Maintenance Records */}
      {selectedVehicle && (
        <Card>
          <CardHeader>
            <CardTitle>Maintenance History</CardTitle>
          </CardHeader>
          <CardContent>
            {maintenanceRecords.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No maintenance records found for this vehicle
              </p>
            ) : (
              <div className="space-y-4">
                {maintenanceRecords.map((record) => (
                  <div key={record.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className={getMaintenanceTypeColor(record.maintenance_type)}>
                          {record.maintenance_type}
                        </Badge>
                        <Badge className={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(record.service_date).toLocaleDateString()}
                      </div>
                    </div>

                    <h4 className="font-medium mb-2">{record.description}</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      {record.service_provider && (
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-gray-400" />
                          <span>{record.service_provider}</span>
                        </div>
                      )}
                      {record.service_location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{record.service_location}</span>
                        </div>
                      )}
                      {record.total_cost && record.total_cost > 0 && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span>₹{record.total_cost.toLocaleString()}</span>
                        </div>
                      )}
                      {record.next_service_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>Next: {new Date(record.next_service_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {record.parts_replaced && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <p className="text-sm font-medium mb-1">Parts Replaced:</p>
                        <p className="text-sm text-gray-600">{record.parts_replaced}</p>
                      </div>
                    )}

                    {record.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <p className="text-sm font-medium mb-1">Notes:</p>
                        <p className="text-sm text-gray-600">{record.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};