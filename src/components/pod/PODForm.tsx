import React, { useState, useRef, useEffect } from 'react';
import { 
  Package, 
  User, 
  Calendar, 
  MapPin, 
  Camera, 
  FileSignature as Signature, 
  Loader2, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';

interface PODFormProps {
  booking: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function PODForm({ booking, onSubmit, onCancel }: PODFormProps) {
  const [step, setStep] = useState<'details' | 'signature' | 'photo' | 'review' | 'complete'>('details');
  const [formData, setFormData] = useState({
    receiverName: booking?.receiver?.name || '',
    receiverPhone: booking?.receiver?.mobile || '',
    receiverDesignation: '',
    receivedDate: new Date().toISOString().split('T')[0],
    receivedTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
    remarks: '',
    signatureImage: null as string | null,
    photoEvidence: null as string | null,
  });
  const [submitting, setSubmitting] = useState(false);
  
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const { showError } = useNotificationSystem();
  
  // Set up signature canvas
  useEffect(() => {
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
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle signature clear
  const handleSignatureClear = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setFormData(prev => ({ ...prev, signatureImage: null }));
    }
  };
  
  // Handle signature save
  const handleSignatureSave = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      setFormData(prev => ({ ...prev, signatureImage: dataUrl }));
    }
  };
  
  // Handle photo upload
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
  
  // Go to next step
  const goToNextStep = () => {
    if (step === 'details') {
      // Validate details
      if (!formData.receiverName || !formData.receiverPhone) {
        showError('Validation Error', 'Please fill in all required fields');
        return;
      }
      setStep('signature');
    } else if (step === 'signature') {
      // Validate signature
      if (!formData.signatureImage) {
        showError('Validation Error', 'Signature is required');
        return;
      }
      setStep('photo');
    } else if (step === 'photo') {
      // Photo is optional, so we can proceed without validation
      setStep('review');
    }
  };
  
  // Go to previous step
  const goToPrevStep = () => {
    if (step === 'signature') {
      setStep('details');
    } else if (step === 'photo') {
      setStep('signature');
    } else if (step === 'review') {
      setStep('photo');
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      let signatureUrl: string | null = null;
      let photoUrl: string | null = null;

      if (formData.signatureImage) {
        const blob = await (await fetch(formData.signatureImage)).blob();
        const sigPath = `signatures/${booking.id}-${Date.now()}.png`;
        const { error } = await supabase.storage
          .from('pod_files')
          .upload(sigPath, blob, { upsert: true, contentType: 'image/png' });
        if (error) throw error;
        signatureUrl =
          supabase.storage.from('pod_files').getPublicUrl(sigPath).data.publicUrl;
      }

      if (formData.photoEvidence) {
        const blob = await (await fetch(formData.photoEvidence)).blob();
        const photoPath = `photos/${booking.id}-${Date.now()}.png`;
        const { error } = await supabase.storage
          .from('pod_files')
          .upload(photoPath, blob, { upsert: true, contentType: 'image/png' });
        if (error) throw error;
        photoUrl =
          supabase.storage.from('pod_files').getPublicUrl(photoPath).data.publicUrl;
      }

      await onSubmit({
        bookingId: booking.id,
        receiverName: formData.receiverName,
        receiverPhone: formData.receiverPhone,
        receiverDesignation: formData.receiverDesignation,
        signatureImage: signatureUrl ?? undefined,
        photoEvidence: photoUrl ?? undefined,
        remarks: formData.remarks
      });
      
      setStep('complete');
    } catch (err) {
      console.error('Failed to submit POD:', err);
      showError('Submission Failed', err instanceof Error ? err.message : 'Failed to submit proof of delivery');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Delivery Confirmed</h2>
            <p className="text-gray-600 mb-8">
              Proof of delivery has been successfully recorded for LR #{booking.lr_number}.
            </p>
            <Button onClick={onCancel} size="lg">
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
            <h2 className="text-3xl font-bold text-gray-900">Proof of Delivery</h2>
            <p className="text-gray-600 mt-1">LR Number: {booking.lr_number}</p>
          </div>
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        </div>
        
        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-2 relative">
            <div className="absolute left-4 right-4 top-1/2 h-1 bg-gray-200 -z-10"></div>
            <div className="flex-1 flex items-center justify-center">
              <motion.div 
                className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  step === 'details' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
                } z-10`}
                initial={false}
                animate={{ 
                  scale: step === 'details' ? 1.1 : 1,
                  boxShadow: step === 'details' ? '0 0 0 4px rgba(59, 130, 246, 0.2)' : 'none'
                }}
              >
                1
              </motion.div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <motion.div 
                className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  step === 'signature' ? 'bg-blue-600 text-white' : step === 'details' ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-600'
                } z-10`}
                initial={false}
                animate={{ 
                  scale: step === 'signature' ? 1.1 : 1,
                  boxShadow: step === 'signature' ? '0 0 0 4px rgba(59, 130, 246, 0.2)' : 'none'
                }}
              >
                2
              </motion.div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <motion.div 
                className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  step === 'photo' ? 'bg-blue-600 text-white' : step === 'details' || step === 'signature' ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-600'
                } z-10`}
                initial={false}
                animate={{ 
                  scale: step === 'photo' ? 1.1 : 1,
                  boxShadow: step === 'photo' ? '0 0 0 4px rgba(59, 130, 246, 0.2)' : 'none'
                }}
              >
                3
              </motion.div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <motion.div 
                className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  step === 'review' ? 'bg-blue-600 text-white' : step === 'details' || step === 'signature' || step === 'photo' ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-600'
                } z-10`}
                initial={false}
                animate={{ 
                  scale: step === 'review' ? 1.1 : 1,
                  boxShadow: step === 'review' ? '0 0 0 4px rgba(59, 130, 246, 0.2)' : 'none'
                }}
              >
                4
              </motion.div>
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-sm text-gray-600">Receiver Details</span>
            <span className="text-sm text-gray-600">Signature</span>
            <span className="text-sm text-gray-600">Photo</span>
            <span className="text-sm text-gray-600">Review</span>
          </div>
        </div>
        
        {/* Booking Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <p className="text-sm text-gray-600">Route</p>
                <p className="font-medium">{booking.from_branch_details?.name || 'N/A'} → {booking.to_branch_details?.name || 'N/A'}</p>
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
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Receiver Details</h3>
            </div>
            
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
                <Textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  placeholder="Enter any remarks about the delivery"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button 
                onClick={goToNextStep}
                className="flex items-center gap-2"
              >
                Next: Signature
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
        
        {step === 'signature' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Signature className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Receiver's Signature</h3>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <p className="text-sm text-gray-600 mb-4">
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
            
            <div className="flex justify-between mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={goToPrevStep}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back: Receiver Details
              </Button>
              <Button 
                onClick={goToNextStep}
                disabled={!formData.signatureImage}
                className="flex items-center gap-2"
              >
                Next: Photo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
        
        {step === 'photo' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Camera className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Photo Evidence</h3>
            </div>
            
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
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
                
                <p className="text-xs text-gray-500">
                  (Optional) You can skip this step if no photo evidence is required
                </p>
              </div>
            </div>
            
            {formData.photoEvidence && (
              <div className="mt-4">
                <p className="font-medium text-gray-900 mb-2">Preview:</p>
                <div className="relative border border-gray-200 rounded-lg overflow-hidden">
                  <img 
                    src={formData.photoEvidence} 
                    alt="Delivery evidence" 
                    className="w-full h-auto max-h-[300px] object-contain"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, photoEvidence: null }));
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex justify-between mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={goToPrevStep}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back: Signature
              </Button>
              <Button 
                onClick={goToNextStep}
                className="flex items-center gap-2"
              >
                Next: Review
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
        
        {step === 'review' && (
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
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-medium text-gray-900 mb-3">Receiver Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium text-gray-900">{formData.receiverName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium text-gray-900">{formData.receiverPhone}</p>
                    </div>
                    {formData.receiverDesignation && (
                      <div>
                        <p className="text-sm text-gray-600">Designation</p>
                        <p className="font-medium text-gray-900">{formData.receiverDesignation}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Received On</p>
                      <p className="font-medium text-gray-900">
                        {formData.receivedDate} at {formData.receivedTime}
                      </p>
                    </div>
                  </div>
                </div>
                
                {formData.remarks && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="font-medium text-gray-900 mb-3">Remarks</h4>
                    <p className="text-gray-600">{formData.remarks}</p>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formData.signatureImage && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Signature</h4>
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
                    <h4 className="font-medium text-gray-900 mb-3">Photo Evidence</h4>
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
            
            <div className="flex justify-between mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={goToPrevStep}
                disabled={submitting}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Confirm Delivery
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}