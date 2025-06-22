import React, { useState, useEffect } from 'react';
import { Wrench, X, Calendar, Clock, MapPin, FileText, Truck, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVehicles } from '@/hooks/useVehicles';
import { motion } from 'framer-motion';

interface Props {
  vehicleId: string;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function VehicleMaintenanceForm({ vehicleId, onClose, onSubmit }: Props) {
  const { vehicles } = useVehicles();
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    maintenanceType: 'regular',
    scheduledDate: new Date().toISOString().split('T')[0],
    estimatedCost: '',
    description: '',
    odometer: '',
    priority: 'normal',
    assignedTo: '',
    notes: '',
    parts: [{ name: '', quantity: 1, cost: '' }]
  });

  useEffect(() => {
    if (vehicles.length > 0 && vehicleId) {
      const foundVehicle = vehicles.find(v => v.id === vehicleId);
      if (foundVehicle) {
        setVehicle(foundVehicle);
        
        // Set default odometer reading based on vehicle data
        // In a real app, this would come from the vehicle's last recorded odometer reading
        setFormData(prev => ({
          ...prev,
          odometer: '25000'
        }));
      }
    }
  }, [vehicles, vehicleId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePartChange = (index: number, field: string, value: string | number) => {
    const updatedParts = [...formData.parts];
    updatedParts[index] = { ...updatedParts[index], [field]: value };
    setFormData(prev => ({ ...prev, parts: updatedParts }));
  };

  const addPart = () => {
    setFormData(prev => ({
      ...prev,
      parts: [...prev.parts, { name: '', quantity: 1, cost: '' }]
    }));
  };

  const removePart = (index: number) => {
    const updatedParts = [...formData.parts];
    updatedParts.splice(index, 1);
    setFormData(prev => ({ ...prev, parts: updatedParts }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Calculate total cost
      const partsCost = formData.parts.reduce((sum, part) => {
        return sum + (Number(part.cost) * Number(part.quantity) || 0);
      }, 0);
      
      const totalCost = Number(formData.estimatedCost) + partsCost;
      
      // Prepare data for submission
      const maintenanceData = {
        ...formData,
        vehicleId,
        totalCost,
        status: 'scheduled',
        createdAt: new Date().toISOString()
      };
      
      await onSubmit(maintenanceData);
    } catch (error) {
      console.error('Failed to schedule maintenance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!vehicle) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl max-w-3xl w-full mx-4 p-8">
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Wrench className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Schedule Maintenance</h2>
              <p className="text-gray-600">{vehicle.vehicle_number} - {vehicle.make} {vehicle.model}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="maintenanceType">Maintenance Type</Label>
                <Select 
                  value={formData.maintenanceType} 
                  onValueChange={(value) => handleSelectChange('maintenanceType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select maintenance type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular Service</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="tire">Tire Replacement</SelectItem>
                    <SelectItem value="oil">Oil Change</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="scheduledDate">Scheduled Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="scheduledDate"
                    name="scheduledDate"
                    type="date"
                    value={formData.scheduledDate}
                    onChange={handleChange}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="odometer">Current Odometer (km)</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="odometer"
                    name="odometer"
                    type="number"
                    placeholder="Enter current odometer reading"
                    value={formData.odometer}
                    onChange={handleChange}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="estimatedCost">Estimated Cost (₹)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <Input
                    id="estimatedCost"
                    name="estimatedCost"
                    type="number"
                    placeholder="Enter estimated cost"
                    value={formData.estimatedCost}
                    onChange={handleChange}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => handleSelectChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Input
                  id="assignedTo"
                  name="assignedTo"
                  placeholder="Enter mechanic or garage name"
                  value={formData.assignedTo}
                  onChange={handleChange}
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="Enter maintenance description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="Enter any additional notes or instructions"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
            
            {/* Parts Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label>Parts Required</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addPart}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Part
                </Button>
              </div>
              
              <div className="space-y-3">
                {formData.parts.map((part, index) => (
                  <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1">
                      <Input
                        placeholder="Part name"
                        value={part.name}
                        onChange={(e) => handlePartChange(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="w-20">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={part.quantity}
                        onChange={(e) => handlePartChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="w-28">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                        <Input
                          type="number"
                          placeholder="Cost"
                          value={part.cost}
                          onChange={(e) => handlePartChange(index, 'cost', e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removePart(index)}
                      disabled={formData.parts.length === 1}
                      className="h-8 w-8 text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4 mr-2" />
                  Schedule Maintenance
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}