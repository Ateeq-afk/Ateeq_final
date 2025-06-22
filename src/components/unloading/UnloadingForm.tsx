import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  Camera, 
  Upload, 
  X, 
  Truck, 
  MapPin, 
  Calendar, 
  User, 
  FileText,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { motion } from 'framer-motion';
import type { OGPL } from '@/types';

interface UnloadingFormProps {
  ogpl: OGPL;
  onSubmit: (ogplId: string, bookingIds: string[], conditions: any) => Promise<void>;
  onClose: () => void;
}

export default function UnloadingForm({ ogpl, onSubmit, onClose }: UnloadingFormProps) {
  const [conditions, setConditions] = useState<Record<string, { status: string; remarks?: string; photo?: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'review' | 'unloading' | 'complete'>('review');
  const [selectedLR, setSelectedLR] = useState<string | null>(null);
  const [photoUploads, setPhotoUploads] = useState<Record<string, File | null>>({});
  const { showSuccess, showError } = useNotificationSystem();

  // Initialize conditions for all bookings
  useEffect(() => {
    if (ogpl.loading_records?.length) {
      const initialConditions = {};
      ogpl.loading_records.forEach(record => {
        if (record.booking_id) {
          initialConditions[record.booking_id] = { 
            status: 'good',
            remarks: ''
          };
        }
      });
      setConditions(initialConditions);
    }
  }, [ogpl]);

  const handleStatusChange = (bookingId: string, status: string) => {
    setConditions(prev => ({
      ...prev,
      [bookingId]: { ...prev[bookingId], status }
    }));
  };

  const handleRemarksChange = (bookingId: string, remarks: string) => {
    setConditions(prev => ({
      ...prev,
      [bookingId]: { ...prev[bookingId], remarks }
    }));
  };

  const handlePhotoUpload = (bookingId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Store the file
      setPhotoUploads(prev => ({
        ...prev,
        [bookingId]: file
      }));
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setConditions(prev => ({
          ...prev,
          [bookingId]: { 
            ...prev[bookingId], 
            photo: reader.result as string 
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const bookingIds = ogpl.loading_records?.map(record => record.booking_id) || [];
      
      // Validate that all required fields are filled
      const hasInvalidEntries = Object.entries(conditions).some(([bookingId, condition]) => {
        if (condition.status === 'damaged' && !condition.remarks) {
          showError('Validation Error', 'Please provide remarks for all damaged items');
          return true;
        }
        return false;
      });
      
      if (hasInvalidEntries) {
        setSubmitting(false);
        return;
      }
      
      await onSubmit(ogpl.id, bookingIds, conditions);
      setStep('complete');
      showSuccess('Unloading Complete', 'All items have been successfully unloaded');
      
      // Close after a delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Failed to unload:', err);
      showError('Unloading Failed', 'There was an error during the unloading process');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'damaged':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'missing':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'damaged':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'missing':
        return <AlertCircle className="h-5 w-5 text-amber-600" />;
      default:
        return null;
    }
  };

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unloading Complete</h2>
            <p className="text-gray-600 mb-8">
              All items from OGPL #{ogpl.ogpl_number} have been successfully unloaded.
            </p>
            <Button onClick={onClose} size="lg">
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Unload OGPL</h2>
            <p className="text-gray-600 mt-1">OGPL Number: {ogpl.ogpl_number}</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            {step === 'review' ? (
              <Button onClick={() => setStep('unloading')}>
                Start Unloading
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Complete Unloading'
                )}
              </Button>
            )}
          </div>
        </div>

        {step === 'review' ? (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label className="text-gray-600">Vehicle</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Truck className="h-5 w-5 text-gray-400" />
                    <p className="font-medium">{ogpl.vehicle?.vehicle_number}</p>
                  </div>
                  <p className="text-sm text-gray-500 capitalize mt-1">{ogpl.vehicle?.type}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Driver</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-5 w-5 text-gray-400" />
                    <p className="font-medium">{ogpl.primary_driver_name}</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{ogpl.primary_driver_mobile}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Route</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <p className="font-medium">{ogpl.from_station?.name} → {ogpl.to_station?.name}</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Transit Date: {new Date(ogpl.transit_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">LRs to Unload</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {ogpl.loading_records?.length || 0} LRs loaded
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      <Package className="h-3.5 w-3.5" />
                      <span>Ready for Unloading</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {ogpl.loading_records?.map((record) => {
                  const booking = record.booking;
                  if (!booking) return null;

                  return (
                    <div key={booking.id} className="p-6">
                      <div className="flex items-start gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <Package className="h-5 w-5 text-gray-400" />
                            <div>
                              <h4 className="font-medium text-gray-900">LR #{booking.lr_number}</h4>
                              <p className="text-sm text-gray-500">
                                {booking.article?.name} • {booking.quantity} {booking.uom}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <Label className="text-gray-600">Sender</Label>
                              <p className="font-medium">{booking.sender?.name}</p>
                              <p className="text-sm text-gray-500">{booking.sender?.mobile}</p>
                            </div>
                            <div>
                              <Label className="text-gray-600">Receiver</Label>
                              <p className="font-medium">{booking.receiver?.name}</p>
                              <p className="text-sm text-gray-500">{booking.receiver?.mobile}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {(!ogpl.loading_records || ogpl.loading_records.length === 0) && (
                  <div className="p-8 text-center">
                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No LRs found in this OGPL</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">Unloading Instructions</h3>
                  <p className="text-blue-700 mt-1">
                    Please check each item carefully during unloading. Record any damages or missing items, and take photos as evidence when necessary.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Unloading Checklist</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {ogpl.loading_records?.length || 0} LRs to unload
                </p>
              </div>

              <div className="divide-y divide-gray-100">
                {ogpl.loading_records?.map((record) => {
                  const booking = record.booking;
                  if (!booking) return null;
                  
                  const condition = conditions[booking.id] || { status: 'good', remarks: '' };
                  const isSelected = selectedLR === booking.id;

                  return (
                    <div key={booking.id} className={`p-6 ${isSelected ? 'bg-blue-50' : ''}`}>
                      <div className="flex items-start gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <Package className="h-5 w-5 text-gray-400" />
                            <div>
                              <h4 className="font-medium text-gray-900">LR #{booking.lr_number}</h4>
                              <p className="text-sm text-gray-500">
                                {booking.article?.name} • {booking.quantity} {booking.uom}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <Label className="text-gray-600">Sender</Label>
                              <p className="font-medium">{booking.sender?.name}</p>
                              <p className="text-sm text-gray-500">{booking.sender?.mobile}</p>
                            </div>
                            <div>
                              <Label className="text-gray-600">Receiver</Label>
                              <p className="font-medium">{booking.receiver?.name}</p>
                              <p className="text-sm text-gray-500">{booking.receiver?.mobile}</p>
                            </div>
                          </div>
                        </div>

                        <div className="w-72 space-y-4">
                          <div>
                            <Label>Condition</Label>
                            <Select
                              value={condition.status}
                              onValueChange={(value) => handleStatusChange(booking.id, value)}
                            >
                              <SelectTrigger className={getStatusColor(condition.status)}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="good">Good Condition</SelectItem>
                                <SelectItem value="damaged">Damaged</SelectItem>
                                <SelectItem value="missing">Missing</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {condition.status === 'damaged' && (
                            <div className="space-y-3">
                              <div>
                                <Label>Damage Remarks <span className="text-red-500">*</span></Label>
                                <Textarea
                                  value={condition.remarks || ''}
                                  onChange={(e) => handleRemarksChange(booking.id, e.target.value)}
                                  placeholder="Describe the damage..."
                                  className="mt-1"
                                  rows={3}
                                />
                              </div>
                              
                              <div>
                                <Label>Photo Evidence</Label>
                                <div className="mt-1">
                                  {condition.photo ? (
                                    <div className="relative">
                                      <img 
                                        src={condition.photo} 
                                        alt="Damage evidence" 
                                        className="w-full h-auto rounded-lg border border-gray-200"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full"
                                        onClick={() => {
                                          setConditions(prev => ({
                                            ...prev,
                                            [booking.id]: { ...prev[booking.id], photo: undefined }
                                          }));
                                          setPhotoUploads(prev => {
                                            const newUploads = { ...prev };
                                            delete newUploads[booking.id];
                                            return newUploads;
                                          });
                                        }}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center h-32 bg-gray-50 border border-gray-200 border-dashed rounded-lg">
                                      <label className="flex flex-col items-center cursor-pointer">
                                        <Camera className="h-8 w-8 text-gray-400 mb-2" />
                                        <span className="text-sm text-gray-500">Take a photo</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => handlePhotoUpload(booking.id, e)}
                                        />
                                      </label>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {condition.status === 'missing' && (
                            <div>
                              <Label>Missing Item Remarks <span className="text-red-500">*</span></Label>
                              <Textarea
                                value={condition.remarks || ''}
                                onChange={(e) => handleRemarksChange(booking.id, e.target.value)}
                                placeholder="Provide details about the missing item..."
                                className="mt-1"
                                rows={3}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {(!ogpl.loading_records || ogpl.loading_records.length === 0) && (
                  <div className="p-8 text-center">
                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No LRs found in this OGPL</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Unloading Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium text-green-800">Good Condition</h4>
                  </div>
                  <p className="text-green-700">
                    {Object.values(conditions).filter(c => c.status === 'good').length} items
                  </p>
                </div>
                
                <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h4 className="font-medium text-red-800">Damaged</h4>
                  </div>
                  <p className="text-red-700">
                    {Object.values(conditions).filter(c => c.status === 'damaged').length} items
                  </p>
                </div>
                
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <h4 className="font-medium text-amber-800">Missing</h4>
                  </div>
                  <p className="text-amber-700">
                    {Object.values(conditions).filter(c => c.status === 'missing').length} items
                  </p>
                </div>
              </div>
              
              {Object.values(conditions).some(c => c.status === 'damaged' || c.status === 'missing') && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">Issues Detected</p>
                      <p className="text-yellow-700 text-sm mt-1">
                        Please ensure all damaged or missing items have proper documentation and photos before completing the unloading process.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}