import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Fuel, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  Calculator,
  Calendar,
  MapPin,
  CreditCard
} from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import { driversService, Driver } from '@/services/drivers';
import { fleetService, FuelRecord, MileageAnalytics } from '@/services/fleet';
import { useToast } from '@/hooks/use-toast';

interface FuelFormData {
  vehicle_id: string;
  driver_id: string;
  fuel_date: string;
  fuel_type: string;
  quantity: number;
  rate_per_unit: number;
  total_amount: number;
  fuel_station_name: string;
  location: string;
  bill_number: string;
  odometer_reading: number;
  payment_mode: 'cash' | 'card' | 'credit' | 'company_card';
}

export const FuelManagement: React.FC = () => {
  const { vehicles } = useVehicles();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [mileageAnalytics, setMileageAnalytics] = useState<MileageAnalytics | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [formData, setFormData] = useState<FuelFormData>({
    vehicle_id: '',
    driver_id: '',
    fuel_date: new Date().toISOString().split('T')[0],
    fuel_type: 'diesel',
    quantity: 0,
    rate_per_unit: 0,
    total_amount: 0,
    fuel_station_name: '',
    location: '',
    bill_number: '',
    odometer_reading: 0,
    payment_mode: 'cash'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDrivers();
  }, []);

  useEffect(() => {
    if (selectedVehicle) {
      loadFuelRecords(selectedVehicle);
      loadMileageAnalytics(selectedVehicle);
    }
  }, [selectedVehicle]);

  useEffect(() => {
    // Auto-calculate total amount
    const total = formData.quantity * formData.rate_per_unit;
    setFormData(prev => ({ ...prev, total_amount: total }));
  }, [formData.quantity, formData.rate_per_unit]);

  const loadDrivers = async () => {
    try {
      const data = await driversService.getAll({ status: 'active' });
      setDrivers(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load drivers',
        variant: 'destructive'
      });
    }
  };

  const loadFuelRecords = async (vehicleId: string) => {
    try {
      const data = await fleetService.fuel.getByVehicle(vehicleId);
      setFuelRecords(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load fuel records',
        variant: 'destructive'
      });
    }
  };

  const loadMileageAnalytics = async (vehicleId: string) => {
    try {
      const data = await fleetService.analytics.getMileage(vehicleId);
      setMileageAnalytics(data);
    } catch (error) {
      console.error('Failed to load mileage analytics:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fleetService.fuel.create(formData);
      toast({
        title: 'Success',
        description: 'Fuel record added successfully'
      });

      // Reset form and reload data
      setFormData({
        vehicle_id: selectedVehicle,
        driver_id: '',
        fuel_date: new Date().toISOString().split('T')[0],
        fuel_type: 'diesel',
        quantity: 0,
        rate_per_unit: 0,
        total_amount: 0,
        fuel_station_name: '',
        location: '',
        bill_number: '',
        odometer_reading: 0,
        payment_mode: 'cash'
      });
      setShowForm(false);
      loadFuelRecords(selectedVehicle);
      loadMileageAnalytics(selectedVehicle);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add fuel record',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FuelFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getPaymentModeColor = (mode: string) => {
    switch (mode) {
      case 'cash': return 'bg-green-100 text-green-800';
      case 'card': return 'bg-blue-100 text-blue-800';
      case 'credit': return 'bg-yellow-100 text-yellow-800';
      case 'company_card': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateMonthlyExpense = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return fuelRecords
      .filter(record => {
        const recordDate = new Date(record.fuel_date);
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
      })
      .reduce((total, record) => total + record.total_amount, 0);
  };

  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Fuel Management</h1>
        <Button 
          onClick={() => setShowForm(true)} 
          disabled={!selectedVehicle}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Fuel Record
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
                {vehicle.vehicle_number} - {vehicle.make} {vehicle.model} ({vehicle.fuel_type})
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Analytics Cards */}
      {selectedVehicle && mileageAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Mileage</p>
                  <p className="text-2xl font-bold">
                    {mileageAnalytics.average_mileage?.toFixed(2) || '0'} km/l
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Distance</p>
                  <p className="text-2xl font-bold">
                    {mileageAnalytics.total_distance_covered?.toLocaleString() || '0'} km
                  </p>
                </div>
                <Calculator className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Fuel</p>
                  <p className="text-2xl font-bold">
                    {mileageAnalytics.total_fuel_consumed?.toFixed(2) || '0'} L
                  </p>
                </div>
                <Fuel className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Expense</p>
                  <p className="text-2xl font-bold">
                    ₹{calculateMonthlyExpense().toLocaleString()}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fuel Entry Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Fuel Record</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="driver_id">Driver</Label>
                  <select
                    id="driver_id"
                    value={formData.driver_id}
                    onChange={(e) => handleInputChange('driver_id', e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="">Select driver (optional)</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} ({driver.employee_code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="fuel_date">Fuel Date *</Label>
                  <Input
                    id="fuel_date"
                    type="date"
                    value={formData.fuel_date}
                    onChange={(e) => handleInputChange('fuel_date', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fuel_type">Fuel Type *</Label>
                  <select
                    id="fuel_type"
                    value={formData.fuel_type}
                    onChange={(e) => handleInputChange('fuel_type', e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    required
                  >
                    <option value="diesel">Diesel</option>
                    <option value="petrol">Petrol</option>
                    <option value="cng">CNG</option>
                    <option value="electric">Electric</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="payment_mode">Payment Mode</Label>
                  <select
                    id="payment_mode"
                    value={formData.payment_mode}
                    onChange={(e) => handleInputChange('payment_mode', e.target.value as any)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="credit">Credit</option>
                    <option value="company_card">Company Card</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity (Liters) *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="rate_per_unit">Rate per Liter (₹) *</Label>
                  <Input
                    id="rate_per_unit"
                    type="number"
                    step="0.01"
                    value={formData.rate_per_unit}
                    onChange={(e) => handleInputChange('rate_per_unit', parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="total_amount">Total Amount (₹)</Label>
                  <Input
                    id="total_amount"
                    type="number"
                    step="0.01"
                    value={formData.total_amount}
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fuel_station_name">Fuel Station</Label>
                  <Input
                    id="fuel_station_name"
                    value={formData.fuel_station_name}
                    onChange={(e) => handleInputChange('fuel_station_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
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
                  <Label htmlFor="odometer_reading">Odometer Reading (km) *</Label>
                  <Input
                    id="odometer_reading"
                    type="number"
                    value={formData.odometer_reading}
                    onChange={(e) => handleInputChange('odometer_reading', parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Fuel Record'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Fuel Records */}
      {selectedVehicle && (
        <Card>
          <CardHeader>
            <CardTitle>Fuel History</CardTitle>
          </CardHeader>
          <CardContent>
            {fuelRecords.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No fuel records found for this vehicle
              </p>
            ) : (
              <div className="space-y-4">
                {fuelRecords.map((record) => (
                  <div key={record.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className={getPaymentModeColor(record.payment_mode || 'cash')}>
                          {record.payment_mode || 'cash'}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(record.fuel_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-lg font-semibold">
                        ₹{record.total_amount.toLocaleString()}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Fuel className="h-4 w-4 text-gray-400" />
                        <span>{record.quantity}L {record.fuel_type} @ ₹{record.rate_per_unit}/L</span>
                      </div>
                      {record.drivers && (
                        <div className="flex items-center gap-2">
                          <span className="h-4 w-4 text-gray-400">👤</span>
                          <span>{record.drivers.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-gray-400" />
                        <span>{record.odometer_reading.toLocaleString()} km</span>
                      </div>
                      {record.mileage && (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-gray-400" />
                          <span>{record.mileage.toFixed(2)} km/l</span>
                        </div>
                      )}
                    </div>

                    {(record.fuel_station_name || record.location) && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>
                            {record.fuel_station_name}
                            {record.fuel_station_name && record.location && ' - '}
                            {record.location}
                          </span>
                        </div>
                      </div>
                    )}

                    {record.distance_covered && record.distance_covered > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        Distance covered since last fuel: {record.distance_covered.toLocaleString()} km
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