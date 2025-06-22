import React, { useState, useRef } from 'react';
import { 
  CheckCircle2, 
  Camera, 
  Upload, 
  Download, 
  Loader2, 
  AlertCircle, 
  Package, 
  User, 
  Calendar, 
  MapPin,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBookings } from '@/hooks/useBookings';
import { motion } from 'framer-motion';
import type { Booking } from '@/types';

interface ProofOfDeliveryProps {
  bookingId: string;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function ProofOfDelivery({ 
  bookingId, 
  onClose, 
  onSubmit 
}: ProofOfDeliveryProps) {
  const [step, setStep] = useState<'details' | 'signature' | 'photo' | 'complete'>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    receiverName: '',
    receiverPhone: '',
    receiverDesignation: '',
    receivedDate: new Date().toISOString().split('T')[0],
    receivedTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
    remarks: '',
    signatureImage: null as string | null,
    photoEvidence: null as string | null,
  });
  
  const { bookings } = useBookings();
  const booking = bookings.find(b => b.id === bookingId);
  
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize form with receiver details if available
  React.useEffect(() => {
    if (booking?.receiver) {
      setFormData(prev => ({
        ...prev,
        receiverName: booking.receiver?.name || '',
        receiverPhone: booking.receiver?.mobile || '',
      }));
    }
  }, [booking]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNextStep = () => {
    if (step === 'details') {
      // Validate details
      if (!formData.receiverName || !formData.receiverPhone) {
        setError('Please fill in all required fields');
        return;
      }
      setStep('signature');
    } else if (step === 'signature') {
      // Validate signature
      if (!formData.signatureImage) {
        setError('Signature is required');
        return;
      }
      setStep('photo');
    } else if (step === 'photo') {
      // Photo is optional, so we can proceed without validation
      setStep('complete');
    }
    
    setError(null);
  };
  
  const handlePrevStep = () => {
    if (step === 'signature') {
      setStep('details');
    } else if (step === 'photo') {
      setStep('signature');
    } else if (step === 'complete') {
      setStep('photo');
    }
    
    setError(null);
  };
  
  const handleSignatureClear = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setFormData(prev => ({ ...prev, signatureImage: null }));
    }
  };
  
  const handleSignatureSave = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      setFormData(prev => ({ ...prev, signatureImage: dataUrl }));
    }
  };
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoEvidence: reader.result as string }));
      };
      
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmitPOD = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare data for submission
      const podData = {
        bookingId,
        ...formData,
        submittedAt: new Date().toISOString(),
      };
      
      await onSubmit(podData);
      
      // Success! The complete step will be shown
    } catch (err) {
      console.error('Failed to submit POD:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit proof of delivery');
      setStep('details'); // Go back to first step on error
    } finally {
      setLoading(false);
    }
  };
  
  // Set up signature canvas
  React.useEffect(() => {
    if (step === 'signature' && signatureCanvasRef.current) {
      const canvas = signatureCanvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;
      
      // Set up canvas
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#000';
      
      // Variables for drawing
      let isDrawing = false;
      let lastX = 0;
      let lastY = 0;
      
      // Event handlers
      const startDrawing = (e: MouseEvent | TouchEvent) => {
        isDrawing = true;
        const { offsetX, offsetY } = getCoordinates(e);
        lastX = offsetX;
        lastY = offsetY;
      };
      
      const draw = (e: MouseEvent | TouchEvent) => {
        if (!isDrawing) return;
        
        const { offsetX, offsetY } = getCoordinates(e);
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
        
        lastX = offsetX;
        lastY = offsetY;
      };
      
      const stopDrawing = () => {
        isDrawing = false;
      };
      
      // Helper to get coordinates for both mouse and touch events
      function getCoordinates(e: MouseEvent | TouchEvent) {
        let offsetX, offsetY;
        
        if ('touches' in e) {
          // Touch event
          const touch = e.touches[0];
          const rect = canvas.getBoundingClientRect();
          offsetX = touch.clientX - rect.left;
          offsetY = touch.clientY - rect.top;
        } else {
          // Mouse event
          offsetX = e.offsetX;
          offsetY = e.offsetY;
        }
        
        return { offsetX, offsetY };
      }
      
      // Add event listeners
      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('mouseout', stopDrawing);
      
      // Touch events
      canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startDrawing(e);
      });
      canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        draw(e);
      });
      canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        stopDrawing();
      });
      
      // Clean up
      return () => {
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('mouseup', stopDrawing);
        canvas.removeEventListener('mouseout', stopDrawing);
        canvas.removeEventListener('touchstart', startDrawing as any);
        canvas.removeEventListener('touchmove', draw as any);
        canvas.removeEventListener('touchend', stopDrawing as any);
      };
    }
  }, [step]);
  
  if (!booking) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl max-w-3xl w-full mx-4 p-8">
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Booking Not Found</h3>
              <p className="text-gray-600 mt-2">The booking you're looking for could not be found.</p>
              <Button onClick={onClose} className="mt-4">Close</Button>
            </div>
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
            <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Proof of Delivery</h2>
              <p className="text-gray-600">LR #{booking.lr_number}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {['details', 'signature', 'photo', 'complete'].map((stepName, index) => (
                <React.Fragment key={stepName}>
                  {index > 0 && (
                    <div 
                      className={`flex-1 h-1 ${
                        ['details', 'signature', 'photo', 'complete'].indexOf(step) >= index 
                          ? 'bg-green-500' 
                          : 'bg-gray-200'
                      }`}
                    ></div>
                  )}
                  <div 
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      step === stepName 
                        ? 'bg-green-500 text-white' 
                        : ['details', 'signature', 'photo', 'complete'].indexOf(step) > 
                          ['details', 'signature', 'photo', 'complete'].indexOf(stepName)
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-600">
              <span>Receiver Details</span>
              <span>Signature</span>
              <span>Photo Evidence</span>
              <span>Complete</span>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {/* Booking Summary */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Article</p>
                  <p className="font-medium">{booking.article?.name || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Destination</p>
                  <p className="font-medium">{booking.to_branch_details?.name || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Booking Date</p>
                  <p className="font-medium">{new Date(booking.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Step Content */}
          {step === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Receiver Name <span className="text-red-500">*</span></Label>
                  <Input
                    name="receiverName"
                    value={formData.receiverName}
                    onChange={handleInputChange}
                    placeholder="Enter receiver's name"
                    required
                  />
                </div>
                
                <div>
                  <Label>Receiver Phone <span className="text-red-500">*</span></Label>
                  <Input
                    name="receiverPhone"
                    value={formData.receiverPhone}
                    onChange={handleInputChange}
                    placeholder="Enter receiver's phone"
                    required
                  />
                </div>
                
                <div>
                  <Label>Receiver Designation</Label>
                  <Input
                    name="receiverDesignation"
                    value={formData.receiverDesignation}
                    onChange={handleInputChange}
                    placeholder="Enter receiver's designation"
                  />
                </div>
                
                <div>
                  <Label>Received Date</Label>
                  <Input
                    type="date"
                    name="receivedDate"
                    value={formData.receivedDate}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <Label>Received Time</Label>
                  <Input
                    type="time"
                    name="receivedTime"
                    value={formData.receivedTime}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label>Remarks</Label>
                  <Input
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    placeholder="Enter any remarks about the delivery"
                  />
                </div>
              </div>
            </div>
          )}
          
          {step === 'signature' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Please ask the receiver to sign in the box below:
                </p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white">
                  <canvas
                    ref={signatureCanvasRef}
                    width={600}
                    height={200}
                    className="w-full touch-none"
                  ></canvas>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleSignatureClear}
                  >
                    Clear
                  </Button>
                  <Button 
                    type="button" 
                    size="sm"
                    onClick={handleSignatureSave}
                  >
                    Save Signature
                  </Button>
                </div>
              </div>
              
              {formData.signatureImage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-700 font-medium">Signature captured successfully</p>
                    <p className="text-green-600 text-sm mt-1">
                      The signature has been saved and will be included in the proof of delivery.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {step === 'photo' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="mb-4">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="text-gray-600 mt-2">
                    Take a photo of the delivered goods or upload an existing photo
                  </p>
                </div>
                
                <input
                  type="file"
                  accept="image/*"
                  ref={photoInputRef}
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                
                <div className="flex flex-col gap-3 items-center">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => photoInputRef.current?.click()}
                    className="w-full max-w-xs"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                  
                  <p className="text-xs text-gray-500">
                    (Optional) You can skip this step if no photo evidence is required
                  </p>
                </div>
              </div>
              
              {formData.photoEvidence && (
                <div className="mt-4">
                  <p className="font-medium text-gray-900 mb-2">Preview:</p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <img 
                      src={formData.photoEvidence} 
                      alt="Delivery evidence" 
                      className="w-full h-auto max-h-[300px] object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          
          {step === 'complete' && (
            <div className="space-y-6">
              <div className="text-center py-6">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900">Delivery Confirmation</h3>
                <p className="text-gray-600 mt-2 max-w-md mx-auto">
                  Please review the information below and confirm the delivery.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Receiver Name</p>
                    <p className="font-medium text-gray-900">{formData.receiverName}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Receiver Phone</p>
                    <p className="font-medium text-gray-900">{formData.receiverPhone}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Received Date & Time</p>
                    <p className="font-medium text-gray-900">
                      {formData.receivedDate} at {formData.receivedTime}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Designation</p>
                    <p className="font-medium text-gray-900">{formData.receiverDesignation || 'N/A'}</p>
                  </div>
                  
                  {formData.remarks && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">Remarks</p>
                      <p className="font-medium text-gray-900">{formData.remarks}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formData.signatureImage && (
                  <div>
                    <p className="font-medium text-gray-900 mb-2">Signature:</p>
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white p-2">
                      <img 
                        src={formData.signatureImage} 
                        alt="Receiver signature" 
                        className="w-full h-auto max-h-[150px] object-contain"
                      />
                    </div>
                  </div>
                )}
                
                {formData.photoEvidence && (
                  <div>
                    <p className="font-medium text-gray-900 mb-2">Photo Evidence:</p>
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white p-2">
                      <img 
                        src={formData.photoEvidence} 
                        alt="Delivery evidence" 
                        className="w-full h-auto max-h-[150px] object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            {step !== 'details' && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handlePrevStep}
                disabled={loading}
              >
                Previous
              </Button>
            )}
            
            {step === 'details' && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
            
            {step !== 'complete' ? (
              <Button 
                type="button" 
                onClick={handleNextStep}
                disabled={loading}
              >
                Next
              </Button>
            ) : (
              <Button 
                type="button" 
                onClick={handleSubmitPOD}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Confirm Delivery'
                )}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}