import React, { useState, useRef, useEffect } from 'react';
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
  X,
  CreditCard,
  Truck,
  FileText,
  AlertTriangle,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useBookings } from '@/hooks/useBookings';
import { usePOD } from '@/hooks/usePOD';
import { motion } from 'framer-motion';
import type { Booking, PODFormData } from '@/types';

interface ProofOfDeliveryProps {
  bookingId: string;
  onClose: () => void;
  onSubmit?: (data: any) => Promise<void>;
}

export default function ProofOfDelivery({ 
  bookingId, 
  onClose, 
  onSubmit 
}: ProofOfDeliveryProps) {
  const [step, setStep] = useState<'details' | 'verification' | 'condition' | 'signature' | 'photo' | 'complete'>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PODFormData>({
    receiverName: '',
    receiverPhone: '',
    receiverDesignation: '',
    receiverCompany: '',
    receiverIdType: undefined,
    receiverIdNumber: '',
    receivedDate: new Date().toISOString().split('T')[0],
    receivedTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
    deliveryCondition: 'good',
    damageDescription: '',
    shortageDescription: '',
    remarks: '',
    signatureImage: null,
    photoEvidence: null,
    receiverPhoto: null,
  });
  
  const { bookings } = useBookings();
  const { submitPOD } = usePOD();
  const booking = bookings.find(b => b.id === bookingId);
  
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const receiverPhotoRef = useRef<HTMLInputElement>(null);
  
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
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNextStep = () => {
    if (step === 'details') {
      // Validate details
      if (!formData.receiverName || !formData.receiverPhone) {
        setError('Please fill in all required fields');
        return;
      }
      if (formData.receiverPhone.length < 10) {
        setError('Please enter a valid phone number');
        return;
      }
      setStep('verification');
    } else if (step === 'verification') {
      // ID verification is optional
      setStep('condition');
    } else if (step === 'condition') {
      // Check if damage/shortage description is provided when needed
      if (formData.deliveryCondition === 'damaged' && !formData.damageDescription) {
        setError('Please describe the damage');
        return;
      }
      if (formData.deliveryCondition === 'partial' && !formData.shortageDescription) {
        setError('Please describe the shortage');
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
    if (step === 'verification') {
      setStep('details');
    } else if (step === 'condition') {
      setStep('verification');
    } else if (step === 'signature') {
      setStep('condition');
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
  
  const handlePhotoUpload = (type: 'evidence' | 'receiver') => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        if (type === 'evidence') {
          setFormData(prev => ({ ...prev, photoEvidence: reader.result as string }));
        } else {
          setFormData(prev => ({ ...prev, receiverPhoto: reader.result as string }));
        }
      };
      
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmitPOD = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the provided onSubmit or the default submitPOD
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Submit using the POD service
        await submitPOD({
          bookingId,
          deliveredBy: 'Current User', // This should come from auth context
          receiverName: formData.receiverName,
          receiverPhone: formData.receiverPhone,
          receiverDesignation: formData.receiverDesignation,
          receiverCompany: formData.receiverCompany,
          receiverIdType: formData.receiverIdType,
          receiverIdNumber: formData.receiverIdNumber,
          signatureImage: formData.signatureImage || undefined,
          photoEvidence: formData.photoEvidence || undefined,
          receiverPhoto: formData.receiverPhoto || undefined,
          deliveryCondition: formData.deliveryCondition,
          damageDescription: formData.damageDescription,
          shortageDescription: formData.shortageDescription,
          remarks: formData.remarks,
        });
      }
      
      // Success! The complete step will be shown
    } catch (err) {
      console.error('Failed to submit POD:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit proof of delivery');
      setStep('details'); // Go back to first step on error
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // Check if delivery proof exists
    const hasDeliveryProof = deliveryDetails.signature || deliveryDetails.photo || deliveryDetails.receiverPhoto;
    
    if (!hasDeliveryProof) {
      const confirmPrint = window.confirm(
        'No delivery proof uploaded. Print report anyway?\n\nThe report will be marked as "Pending Delivery Confirmation".'
      );
      if (!confirmPrint) return;
    }
    
    // Create a print-friendly version of the POD
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Proof of Delivery - ${booking.lr_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .pod-title { font-size: 20px; color: #333; }
            .section { margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
            .section-title { font-weight: bold; margin-bottom: 10px; color: #555; }
            .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
            .info-item { margin-bottom: 8px; }
            .label { font-weight: bold; color: #666; }
            .value { color: #333; }
            .signature-section { margin-top: 30px; text-align: center; }
            .signature-image { max-width: 300px; border: 1px solid #ddd; padding: 10px; }
            .photo-evidence { max-width: 400px; margin: 10px auto; }
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 48px;
              color: rgba(255, 0, 0, 0.2);
              font-weight: bold;
              z-index: -1;
              white-space: nowrap;
            }
            @media print { 
              body { margin: 10px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${!hasDeliveryProof ? '<div class="watermark">PENDING DELIVERY CONFIRMATION</div>' : ''}
          <div class="header">
            <div class="company-name">DesiCargo</div>
            <div class="pod-title">Proof of Delivery${!hasDeliveryProof ? ' - PENDING' : ''}</div>
          </div>

          <div class="section">
            <div class="section-title">Booking Details</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">LR Number:</span> <span class="value">${booking.lr_number}</span>
              </div>
              <div class="info-item">
                <span class="label">Booking Date:</span> <span class="value">${new Date(booking.booking_date).toLocaleDateString()}</span>
              </div>
              <div class="info-item">
                <span class="label">From:</span> <span class="value">${booking.from_branch_details?.name || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="label">To:</span> <span class="value">${booking.to_branch_details?.name || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="label">Article:</span> <span class="value">${booking.article?.name || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="label">Quantity:</span> <span class="value">${booking.quantity || 0}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Receiver Details</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Name:</span> <span class="value">${formData.receiverName}</span>
              </div>
              <div class="info-item">
                <span class="label">Phone:</span> <span class="value">${formData.receiverPhone}</span>
              </div>
              ${formData.receiverDesignation ? `
              <div class="info-item">
                <span class="label">Designation:</span> <span class="value">${formData.receiverDesignation}</span>
              </div>` : ''}
              ${formData.receiverCompany ? `
              <div class="info-item">
                <span class="label">Company:</span> <span class="value">${formData.receiverCompany}</span>
              </div>` : ''}
              ${formData.receiverIdType ? `
              <div class="info-item">
                <span class="label">ID Type:</span> <span class="value">${formData.receiverIdType}</span>
              </div>` : ''}
              ${formData.receiverIdNumber ? `
              <div class="info-item">
                <span class="label">ID Number:</span> <span class="value">${formData.receiverIdNumber}</span>
              </div>` : ''}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Delivery Details</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Delivery Date:</span> <span class="value">${formData.receivedDate}</span>
              </div>
              <div class="info-item">
                <span class="label">Delivery Time:</span> <span class="value">${formData.receivedTime}</span>
              </div>
              <div class="info-item">
                <span class="label">Condition:</span> <span class="value">${formData.deliveryCondition}</span>
              </div>
              ${formData.remarks ? `
              <div class="info-item" style="grid-column: span 2;">
                <span class="label">Remarks:</span> <span class="value">${formData.remarks}</span>
              </div>` : ''}
            </div>
          </div>

          ${formData.signatureImage ? `
          <div class="signature-section">
            <div class="section-title">Receiver Signature</div>
            <img src="${formData.signatureImage}" class="signature-image" alt="Signature" />
          </div>` : ''}

          ${formData.photoEvidence ? `
          <div class="signature-section">
            <div class="section-title">Photo Evidence</div>
            <img src="${formData.photoEvidence}" class="photo-evidence" alt="Delivery Photo" />
          </div>` : ''}

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };
  
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
        className="bg-white rounded-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
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
              {['details', 'verification', 'condition', 'signature', 'photo', 'complete'].map((stepName, index) => (
                <React.Fragment key={stepName}>
                  {index > 0 && (
                    <div 
                      className={`flex-1 h-1 ${
                        ['details', 'verification', 'condition', 'signature', 'photo', 'complete'].indexOf(step) >= index 
                          ? 'bg-green-500' 
                          : 'bg-gray-200'
                      }`}
                    ></div>
                  )}
                  <div 
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      step === stepName 
                        ? 'bg-green-500 text-white' 
                        : ['details', 'verification', 'condition', 'signature', 'photo', 'complete'].indexOf(step) > 
                          ['details', 'verification', 'condition', 'signature', 'photo', 'complete'].indexOf(stepName)
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
              <span>Receiver</span>
              <span>Verification</span>
              <span>Condition</span>
              <span>Signature</span>
              <span>Photo</span>
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
                <Truck className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Payment</p>
                  <p className="font-medium">{booking.payment_type}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Step Content */}
          {step === 'details' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5" />
                Receiver Details
              </h3>
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
                    placeholder="e.g., Manager, Owner"
                  />
                </div>
                
                <div>
                  <Label>Company/Organization</Label>
                  <Input
                    name="receiverCompany"
                    value={formData.receiverCompany}
                    onChange={handleInputChange}
                    placeholder="Enter company name"
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
              </div>
            </div>
          )}
          
          {step === 'verification' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Identity Verification (Optional)
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  For additional security, you can verify the receiver's identity. This step is optional.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>ID Type</Label>
                  <Select
                    value={formData.receiverIdType}
                    onValueChange={(value) => handleSelectChange('receiverIdType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aadhaar">Aadhaar Card</SelectItem>
                      <SelectItem value="PAN">PAN Card</SelectItem>
                      <SelectItem value="Driving License">Driving License</SelectItem>
                      <SelectItem value="Voter ID">Voter ID</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>ID Number</Label>
                  <Input
                    name="receiverIdNumber"
                    value={formData.receiverIdNumber}
                    onChange={handleInputChange}
                    placeholder="Enter ID number"
                    disabled={!formData.receiverIdType}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label>Receiver Photo</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="image/*"
                      ref={receiverPhotoRef}
                      onChange={handlePhotoUpload('receiver')}
                      className="hidden"
                    />
                    
                    {formData.receiverPhoto ? (
                      <div className="relative">
                        <img 
                          src={formData.receiverPhoto} 
                          alt="Receiver" 
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute -top-2 -right-2"
                          onClick={() => setFormData(prev => ({ ...prev, receiverPhoto: null }))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => receiverPhotoRef.current?.click()}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Take Photo
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {step === 'condition' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Delivery Condition
              </h3>
              
              <div>
                <Label>Shipment Condition</Label>
                <RadioGroup
                  value={formData.deliveryCondition}
                  onValueChange={(value: any) => handleSelectChange('deliveryCondition', value)}
                  className="mt-2 space-y-3"
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="good" id="good" />
                    <Label htmlFor="good" className="cursor-pointer flex-1">
                      <span className="font-medium">Good Condition</span>
                      <p className="text-sm text-gray-500">All items received in perfect condition</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="damaged" id="damaged" />
                    <Label htmlFor="damaged" className="cursor-pointer flex-1">
                      <span className="font-medium">Damaged</span>
                      <p className="text-sm text-gray-500">Some or all items received with damage</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="partial" id="partial" />
                    <Label htmlFor="partial" className="cursor-pointer flex-1">
                      <span className="font-medium">Partial Delivery</span>
                      <p className="text-sm text-gray-500">Not all items were received</p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              {formData.deliveryCondition === 'damaged' && (
                <div>
                  <Label>Damage Description <span className="text-red-500">*</span></Label>
                  <Textarea
                    name="damageDescription"
                    value={formData.damageDescription}
                    onChange={handleInputChange}
                    placeholder="Please describe the damage in detail"
                    rows={3}
                    required
                  />
                </div>
              )}
              
              {formData.deliveryCondition === 'partial' && (
                <div>
                  <Label>Shortage Description <span className="text-red-500">*</span></Label>
                  <Textarea
                    name="shortageDescription"
                    value={formData.shortageDescription}
                    onChange={handleInputChange}
                    placeholder="Please describe what items are missing"
                    rows={3}
                    required
                  />
                </div>
              )}
              
              <div>
                <Label>Additional Remarks</Label>
                <Textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  placeholder="Any additional notes about the delivery"
                  rows={2}
                />
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
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">Draw signature above</p>
                  <div className="flex gap-2">
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
                    Take a photo of the delivered goods as evidence
                  </p>
                </div>
                
                <input
                  type="file"
                  accept="image/*"
                  ref={photoInputRef}
                  onChange={handlePhotoUpload('evidence')}
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
                    Recommended but optional - helps with dispute resolution
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setFormData(prev => ({ ...prev, photoEvidence: null }))}
                  >
                    Remove Photo
                  </Button>
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
                    <p className="text-sm text-gray-600">Condition</p>
                    <p className="font-medium text-gray-900 capitalize">{formData.deliveryCondition}</p>
                  </div>
                  
                  {formData.receiverDesignation && (
                    <div>
                      <p className="text-sm text-gray-600">Designation</p>
                      <p className="font-medium text-gray-900">{formData.receiverDesignation}</p>
                    </div>
                  )}
                  
                  {formData.receiverCompany && (
                    <div>
                      <p className="text-sm text-gray-600">Company</p>
                      <p className="font-medium text-gray-900">{formData.receiverCompany}</p>
                    </div>
                  )}
                  
                  {formData.remarks && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">Remarks</p>
                      <p className="font-medium text-gray-900">{formData.remarks}</p>
                    </div>
                  )}
                </div>
                
                {(formData.damageDescription || formData.shortageDescription) && (
                  <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
                      <div>
                        <p className="font-medium text-yellow-800">Issues Reported</p>
                        {formData.damageDescription && (
                          <p className="text-sm text-yellow-700 mt-1">
                            <strong>Damage:</strong> {formData.damageDescription}
                          </p>
                        )}
                        {formData.shortageDescription && (
                          <p className="text-sm text-yellow-700 mt-1">
                            <strong>Shortage:</strong> {formData.shortageDescription}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
                className="ml-auto"
              >
                Next
              </Button>
            ) : (
              <>
                <Button 
                  type="button" 
                  onClick={handlePrint}
                  disabled={loading}
                  variant="outline"
                  className="ml-auto"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print POD
                </Button>
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
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}