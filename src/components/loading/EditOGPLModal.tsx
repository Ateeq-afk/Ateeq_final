import React, { useState, useEffect } from 'react';
import { 
  X, 
  Truck, 
  Calendar, 
  MapPin, 
  User, 
  Phone,
  AlertCircle,
  Loader2,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { loadingService, OGPL } from '@/services/loading';
import { motion } from 'framer-motion';

interface EditOGPLModalProps {
  isOpen: boolean;
  onClose: () => void;
  ogpl: OGPL;
  vehicles: any[];
  branches: any[];
  onSuccess: () => void;
}

export default function EditOGPLModal({ 
  isOpen, 
  onClose, 
  ogpl,
  vehicles, 
  branches,
  onSuccess 
}: EditOGPLModalProps) {
  const [formData, setFormData] = useState({
    vehicle_id: '',
    from_station: '',
    to_station: '',
    transit_date: '',
    primary_driver_name: '',
    primary_driver_mobile: '',
    secondary_driver_name: '',
    secondary_driver_mobile: '',
    remarks: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useNotificationSystem();

  // Initialize form data when OGPL changes
  useEffect(() => {
    if (ogpl) {
      setFormData({
        vehicle_id: ogpl.vehicle_id || '',
        from_station: ogpl.from_station || '',
        to_station: ogpl.to_station || '',
        transit_date: ogpl.transit_date || '',
        primary_driver_name: ogpl.primary_driver_name || '',
        primary_driver_mobile: ogpl.primary_driver_mobile || '',
        secondary_driver_name: ogpl.secondary_driver_name || '',
        secondary_driver_mobile: ogpl.secondary_driver_mobile || '',
        remarks: ogpl.remarks || ''
      });
    }
  }, [ogpl]);

  // Filter destination branches
  const destinationBranches = branches.filter(branch => branch.id !== formData.from_station);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validate form
  const validateForm = () => {
    if (!formData.vehicle_id) {
      showError('Validation Error', 'Please select a vehicle');
      return false;
    }
    if (!formData.from_station) {
      showError('Validation Error', 'Please select a source branch');
      return false;
    }
    if (!formData.to_station) {
      showError('Validation Error', 'Please select a destination branch');
      return false;
    }
    if (!formData.transit_date) {
      showError('Validation Error', 'Please select a transit date');
      return false;
    }
    if (!formData.primary_driver_name) {
      showError('Validation Error', 'Please enter driver name');
      return false;
    }
    if (!formData.primary_driver_mobile) {
      showError('Validation Error', 'Please enter driver mobile number');
      return false;
    }
    if (formData.primary_driver_mobile.length < 10) {
      showError('Validation Error', 'Driver mobile number must be at least 10 digits');
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      
      // Only send fields that have changed
      const changedFields: any = {};
      Object.keys(formData).forEach(key => {
        const fieldKey = key as keyof typeof formData;
        if (formData[fieldKey] !== ogpl[fieldKey as keyof OGPL]) {
          changedFields[key] = formData[fieldKey];
        }
      });

      if (Object.keys(changedFields).length === 0) {
        showError('No Changes', 'No changes were made to the OGPL');
        return;
      }

      await loadingService.updateOGPL(ogpl.id, changedFields);
      
      showSuccess('OGPL Updated', 'OGPL details have been updated successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to update OGPL:', error);
      showError('Update Failed', error instanceof Error ? error.message : 'Failed to update OGPL');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            Edit OGPL - {ogpl?.ogpl_number}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vehicle Selection */}
            <div className="space-y-2">
              <Label htmlFor="vehicle_id">Vehicle *</Label>
              <Select
                value={formData.vehicle_id}
                onValueChange={(value) => handleSelectChange('vehicle_id', value)}
              >
                <SelectTrigger id="vehicle_id">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.vehicle_number} - {vehicle.make} {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Transit Date */}
            <div className="space-y-2">
              <Label htmlFor="transit_date">Transit Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="transit_date"
                  type="date"
                  name="transit_date"
                  value={formData.transit_date}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* From Station */}
            <div className="space-y-2">
              <Label htmlFor="from_station">From Branch *</Label>
              <Select
                value={formData.from_station}
                onValueChange={(value) => handleSelectChange('from_station', value)}
              >
                <SelectTrigger id="from_station">
                  <SelectValue placeholder="Select source branch" />
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

            {/* To Station */}
            <div className="space-y-2">
              <Label htmlFor="to_station">To Branch *</Label>
              <Select
                value={formData.to_station}
                onValueChange={(value) => handleSelectChange('to_station', value)}
                disabled={!formData.from_station}
              >
                <SelectTrigger id="to_station">
                  <SelectValue placeholder="Select destination branch" />
                </SelectTrigger>
                <SelectContent>
                  {destinationBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name} - {branch.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Primary Driver Name */}
            <div className="space-y-2">
              <Label htmlFor="primary_driver_name">Primary Driver Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="primary_driver_name"
                  name="primary_driver_name"
                  value={formData.primary_driver_name}
                  onChange={handleInputChange}
                  placeholder="Enter driver name"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Primary Driver Mobile */}
            <div className="space-y-2">
              <Label htmlFor="primary_driver_mobile">Primary Driver Mobile *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="primary_driver_mobile"
                  name="primary_driver_mobile"
                  value={formData.primary_driver_mobile}
                  onChange={handleInputChange}
                  placeholder="Enter driver mobile"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Secondary Driver Name */}
            <div className="space-y-2">
              <Label htmlFor="secondary_driver_name">Secondary Driver Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="secondary_driver_name"
                  name="secondary_driver_name"
                  value={formData.secondary_driver_name}
                  onChange={handleInputChange}
                  placeholder="Enter secondary driver name"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Secondary Driver Mobile */}
            <div className="space-y-2">
              <Label htmlFor="secondary_driver_mobile">Secondary Driver Mobile</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="secondary_driver_mobile"
                  name="secondary_driver_mobile"
                  value={formData.secondary_driver_mobile}
                  onChange={handleInputChange}
                  placeholder="Enter secondary driver mobile"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              placeholder="Enter any additional remarks"
              rows={3}
            />
          </div>

          {/* Status Information */}
          {ogpl.status !== 'created' && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Limited Editing</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    This OGPL is in '{ogpl.status}' status. Some fields may not be editable.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}