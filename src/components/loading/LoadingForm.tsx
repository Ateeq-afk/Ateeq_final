import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Package, 
  Calendar, 
  MapPin, 
  User, 
  Search, 
  Plus, 
  Trash, 
  Loader2, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { useLoading } from '@/hooks/useLoading';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';

interface LoadingFormProps {
  pendingBookings: any[];
  vehicles: any[];
  branches: any[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function LoadingForm({ 
  pendingBookings, 
  vehicles, 
  branches, 
  onSubmit, 
  onCancel 
}: LoadingFormProps) {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [ogplData, setOgplData] = useState({
    vehicleId: '',
    fromBranchId: '',
    toBranchId: '',
    transitDate: new Date().toISOString().split('T')[0],
    driverName: '',
    driverMobile: '',
    remarks: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [ogplId, setOgplId] = useState<string | null>(null);
  
  const { createOGPL } = useLoading();
  const { showError } = useNotificationSystem();
  
  // Filter bookings based on search
  const filteredBookings = pendingBookings.filter(booking => 
    booking.lr_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.sender?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.receiver?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.article?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Set default from branch
  useEffect(() => {
    if (branches.length > 0 && !ogplData.fromBranchId) {
      setOgplData(prev => ({
        ...prev,
        fromBranchId: branches[0].id
      }));
    }
  }, [branches]);
  
  // Filter branches for destination (exclude source branch)
  const destinationBranches = branches.filter(branch => branch.id !== ogplData.fromBranchId);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOgplData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setOgplData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Toggle booking selection
  const toggleBookingSelection = (id: string) => {
    setSelectedBookings(prev => 
      prev.includes(id) 
        ? prev.filter(bookingId => bookingId !== id) 
        : [...prev, id]
    );
  };
  
  // Select/deselect all bookings
  const toggleSelectAll = () => {
    if (selectedBookings.length === filteredBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(filteredBookings.map(b => b.id));
    }
  };
  
  // Go to next step
  const goToNextStep = async () => {
    if (step === 1) {
      // Validate OGPL data
      if (!ogplData.vehicleId) {
        showError('Validation Error', 'Please select a vehicle');
        return;
      }
      if (!ogplData.fromBranchId) {
        showError('Validation Error', 'Please select a source branch');
        return;
      }
      if (!ogplData.toBranchId) {
        showError('Validation Error', 'Please select a destination branch');
        return;
      }
      if (!ogplData.driverName) {
        showError('Validation Error', 'Please enter driver name');
        return;
      }
      if (!ogplData.driverMobile) {
        showError('Validation Error', 'Please enter driver mobile number');
        return;
      }
      
      try {
        setSubmitting(true);
        
        // Create OGPL
        const ogpl = await createOGPL(ogplData);
        setOgplId(ogpl.id);
        
        setStep(2);
      } catch (err) {
        console.error('Failed to create OGPL:', err);
        showError('OGPL Creation Failed', 'Failed to create OGPL. Please try again.');
      } finally {
        setSubmitting(false);
      }
    } else if (step === 2) {
      // Validate booking selection
      if (selectedBookings.length === 0) {
        showError('Validation Error', 'Please select at least one booking to load');
        return;
      }
      
      setStep(3);
    }
  };
  
  // Go to previous step
  const goToPrevStep = () => {
    setStep(prev => prev - 1);
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!ogplId) {
      showError('Error', 'OGPL ID is missing');
      return;
    }
    
    try {
      setSubmitting(true);
      
      await onSubmit({
        ogplId,
        vehicleId: ogplData.vehicleId,
        fromBranchId: ogplData.fromBranchId,
        toBranchId: ogplData.toBranchId,
        bookingIds: selectedBookings,
        notes: ogplData.remarks
      });
    } catch (err) {
      console.error('Failed to submit loading form:', err);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create Loading Sheet</h2>
          <p className="text-gray-600 mt-1">Load bookings for transit</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Progress Steps */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-2 relative">
          <div className="absolute left-4 right-4 top-1/2 h-1 bg-gray-200 -z-10"></div>
          <div className="flex-1 flex items-center justify-center">
            <motion.div 
              className={`h-10 w-10 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              } z-10`}
              initial={false}
              animate={{ 
                scale: step === 1 ? 1.1 : 1,
                boxShadow: step === 1 ? '0 0 0 4px rgba(59, 130, 246, 0.2)' : 'none'
              }}
            >
              1
            </motion.div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <motion.div 
              className={`h-10 w-10 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              } z-10`}
              initial={false}
              animate={{ 
                scale: step === 2 ? 1.1 : 1,
                boxShadow: step === 2 ? '0 0 0 4px rgba(59, 130, 246, 0.2)' : 'none'
              }}
            >
              2
            </motion.div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <motion.div 
              className={`h-10 w-10 rounded-full flex items-center justify-center ${
                step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              } z-10`}
              initial={false}
              animate={{ 
                scale: step === 3 ? 1.1 : 1,
                boxShadow: step === 3 ? '0 0 0 4px rgba(59, 130, 246, 0.2)' : 'none'
              }}
            >
              3
            </motion.div>
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-sm text-gray-600">OGPL Details</span>
          <span className="text-sm text-gray-600">Select Bookings</span>
          <span className="text-sm text-gray-600">Review & Submit</span>
        </div>
      </div>
      
      {/* Step 1: OGPL Details */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">OGPL Details</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Vehicle</Label>
              <Select
                value={ogplData.vehicleId}
                onValueChange={(value) => handleSelectChange('vehicleId', value)}
              >
                <SelectTrigger>
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
            
            <div>
              <Label>Transit Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="date"
                  name="transitDate"
                  value={ogplData.transitDate}
                  onChange={handleInputChange}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>From Branch</Label>
              <Select
                value={ogplData.fromBranchId}
                onValueChange={(value) => handleSelectChange('fromBranchId', value)}
              >
                <SelectTrigger>
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
            
            <div>
              <Label>To Branch</Label>
              <Select
                value={ogplData.toBranchId}
                onValueChange={(value) => handleSelectChange('toBranchId', value)}
                disabled={!ogplData.fromBranchId}
              >
                <SelectTrigger>
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
            
            <div>
              <Label>Driver Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  name="driverName"
                  value={ogplData.driverName}
                  onChange={handleInputChange}
                  placeholder="Enter driver name"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>Driver Mobile</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  name="driverMobile"
                  value={ogplData.driverMobile}
                  onChange={handleInputChange}
                  placeholder="Enter driver mobile"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="md:col-span-2">
              <Label>Remarks (Optional)</Label>
              <Textarea
                name="remarks"
                value={ogplData.remarks}
                onChange={handleInputChange}
                placeholder="Enter any additional remarks"
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-between mt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={goToNextStep}
              disabled={submitting}
              className="flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating OGPL...
                </>
              ) : (
                <>
                  Next: Select Bookings
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}
      
      {/* Step 2: Select Bookings */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Select Bookings to Load</h3>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              onClick={toggleSelectAll}
              className="whitespace-nowrap"
            >
              {selectedBookings.length === filteredBookings.length && filteredBookings.length > 0 
                ? 'Deselect All' 
                : 'Select All'}
            </Button>
          </div>
          
          {filteredBookings.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">LR No</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">From</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">To</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Sender</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Receiver</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Article</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBookings.map((booking) => (
                    <motion.tr 
                      key={booking.id} 
                      className={`hover:bg-blue-50 cursor-pointer transition-colors ${
                        selectedBookings.includes(booking.id) ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => toggleBookingSelection(booking.id)}
                      whileHover={{ backgroundColor: 'rgba(239, 246, 255, 0.6)' }}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedBookings.includes(booking.id)}
                          onChange={() => toggleBookingSelection(booking.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-blue-600">{booking.lr_number}</td>
                      <td className="px-4 py-3 text-sm">{booking.from_branch_details?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">{booking.to_branch_details?.name || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium">{booking.sender?.name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{booking.sender?.mobile || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium">{booking.receiver?.name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{booking.receiver?.mobile || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{booking.article?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">₹{booking.total_amount?.toFixed(2) || '0.00'}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No Bookings Found</h3>
              <p className="text-gray-500 mt-1">
                {searchQuery 
                  ? 'No bookings match your search criteria' 
                  : 'No bookings available for loading'}
              </p>
            </div>
          )}
          
          <div className="flex justify-between mt-6">
            <Button type="button" variant="outline" onClick={goToPrevStep}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back: OGPL Details
            </Button>
            <Button 
              type="button" 
              onClick={goToNextStep}
              disabled={selectedBookings.length === 0}
              className="flex items-center gap-2"
            >
              Next: Review
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
      
      {/* Step 3: Review & Submit */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Review & Submit</h3>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">OGPL Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vehicle:</span>
                    <span className="font-medium">
                      {vehicles.find(v => v.id === ogplData.vehicleId)?.vehicle_number || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transit Date:</span>
                    <span className="font-medium">{ogplData.transitDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">From:</span>
                    <span className="font-medium">
                      {branches.find(b => b.id === ogplData.fromBranchId)?.name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">To:</span>
                    <span className="font-medium">
                      {branches.find(b => b.id === ogplData.toBranchId)?.name || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Driver Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Driver Name:</span>
                    <span className="font-medium">{ogplData.driverName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Driver Mobile:</span>
                    <span className="font-medium">{ogplData.driverMobile}</span>
                  </div>
                  {ogplData.remarks && (
                    <div>
                      <span className="text-gray-600">Remarks:</span>
                      <p className="font-medium mt-1">{ogplData.remarks}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Selected Bookings ({selectedBookings.length})</h4>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">LR Number</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">From → To</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Sender → Receiver</th>
                      <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Article</th>
                      <th className="text-right text-sm font-medium text-gray-600 px-4 py-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedBookings.map((id) => {
                      const booking = pendingBookings.find(b => b.id === id);
                      if (!booking) return null;
                      
                      return (
                        <tr key={id}>
                          <td className="px-4 py-3 font-medium text-blue-600">{booking.lr_number}</td>
                          <td className="px-4 py-3 text-sm">
                            {booking.from_branch_details?.name || 'N/A'} → {booking.to_branch_details?.name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {booking.sender?.name || 'N/A'} → {booking.receiver?.name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm">{booking.article?.name || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium">₹{booking.total_amount?.toFixed(2) || '0.00'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between mt-6">
            <Button type="button" variant="outline" onClick={goToPrevStep}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back: Select Bookings
            </Button>
            <Button 
              type="button" 
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Complete Loading
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}