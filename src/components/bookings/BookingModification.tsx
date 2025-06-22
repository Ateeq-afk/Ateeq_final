import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Package, 
  Edit, 
  Loader2, 
  AlertTriangle, 
  X,
  Save,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useBookings } from '@/hooks/useBookings';
import { useArticles } from '@/hooks/useArticles';
import { motion } from 'framer-motion';
import type { Booking } from '@/types';

// Define the form schema
const modificationSchema = z.object({
  // Only fields that can be modified
  description: z.string().optional(),
  actual_weight: z.number().min(0, 'Weight must be a positive number').optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  freight_per_qty: z.number().min(0, 'Freight must be a positive number'),
  loading_charges: z.number().min(0, 'Loading charges must be a positive number').optional(),
  unloading_charges: z.number().min(0, 'Unloading charges must be a positive number').optional(),
  private_mark_number: z.string().optional(),
  remarks: z.string().optional(),
  expected_delivery_date: z.string().optional(),
  special_instructions: z.string().optional(),
  reference_number: z.string().optional(),
  
  // Additional options
  has_invoice: z.boolean().default(false),
  invoice_number: z.string().optional(),
  invoice_date: z.string().optional(),
  invoice_amount: z.number().optional(),
  eway_bill_number: z.string().optional(),
  
  insurance_required: z.boolean().default(false),
  insurance_value: z.number().optional(),
  insurance_charge: z.number().min(0).optional(),
  fragile: z.boolean().default(false),
  priority: z.enum(['Normal', 'High', 'Urgent']).default('Normal'),
  packaging_type: z.string().optional(),
  packaging_charge: z.number().min(0).optional(),
}).refine(data => {
  // If has_invoice is true, invoice details are required
  if (data.has_invoice) {
    return !!data.invoice_number && !!data.invoice_date && !!data.invoice_amount;
  }
  return true;
}, {
  message: 'Invoice details are required',
  path: ['invoice_number']
}).refine(data => {
  // If insurance_required is true, insurance_value is required
  if (data.insurance_required) {
    return !!data.insurance_value;
  }
  return true;
}, {
  message: 'Insurance value is required',
  path: ['insurance_value']
});

type ModificationFormValues = z.infer<typeof modificationSchema>;

interface BookingModificationProps {
  bookingId: string;
  onClose: () => void;
  onSubmit: (bookingId: string, data: Partial<Booking>) => Promise<void>;
}

export default function BookingModification({ bookingId, onClose, onSubmit }: BookingModificationProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { bookings } = useBookings();
  const { articles } = useArticles();
  
  const booking = bookings.find(b => b.id === bookingId);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<ModificationFormValues>({
    resolver: zodResolver(modificationSchema),
    defaultValues: {
      description: booking?.description || '',
      actual_weight: booking?.actual_weight || 0,
      quantity: booking?.quantity || 1,
      freight_per_qty: booking?.freight_per_qty || 0,
      loading_charges: booking?.loading_charges || 0,
      unloading_charges: booking?.unloading_charges || 0,
      private_mark_number: booking?.private_mark_number || '',
      remarks: booking?.remarks || '',
      expected_delivery_date: booking?.expected_delivery_date || '',
      special_instructions: booking?.special_instructions || '',
      reference_number: booking?.reference_number || '',
      
      has_invoice: booking?.has_invoice || false,
      invoice_number: booking?.invoice_number || '',
      invoice_date: booking?.invoice_date || '',
      invoice_amount: booking?.invoice_amount || 0,
      eway_bill_number: booking?.eway_bill_number || '',
      
      insurance_required: booking?.insurance_required || false,
      insurance_value: booking?.insurance_value || 0,
      insurance_charge: booking?.insurance_charge || 0,
      fragile: booking?.fragile || false,
      priority: (booking?.priority as any) || 'Normal',
      packaging_type: booking?.packaging_type || '',
      packaging_charge: booking?.packaging_charge || 0,
    }
  });
  
  const watchHasInvoice = watch('has_invoice');
  const watchInsuranceRequired = watch('insurance_required');
  const watchFreightPerQty = watch('freight_per_qty');
  const watchQuantity = watch('quantity');
  const watchLoadingCharges = watch('loading_charges');
  const watchUnloadingCharges = watch('unloading_charges');
  const watchInsuranceCharge = watch('insurance_charge');
  const watchPackagingCharge = watch('packaging_charge');
  
  // Calculate total amount
  const totalAmount = (
    (watchQuantity || 0) * (watchFreightPerQty || 0) +
    (watchLoadingCharges || 0) +
    (watchUnloadingCharges || 0) +
    (watchInsuranceCharge || 0) +
    (watchPackagingCharge || 0)
  );
  
  const handleFormSubmit = async (data: ModificationFormValues) => {
    try {
      setLoading(true);
      setError(null);
      
      // Only include fields that have been changed
      const changedFields = Object.keys(dirtyFields).reduce((acc, key) => {
        acc[key] = data[key as keyof ModificationFormValues];
        return acc;
      }, {} as Record<string, any>);
      
      // If nothing changed, show error
      if (Object.keys(changedFields).length === 0) {
        setError('No changes were made');
        return;
      }
      
      // Submit changes
      await onSubmit(bookingId, changedFields);
      
      // Show success message
      setSuccess(true);
      
      // Close after a delay
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (err) {
      console.error('Failed to update booking:', err);
      setError(err instanceof Error ? err.message : 'Failed to update booking');
    } finally {
      setLoading(false);
    }
  };
  
  if (!booking) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl max-w-3xl w-full mx-4 p-8">
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Booking Not Found</h3>
              <p className="text-gray-600 mt-2">The booking you're trying to modify could not be found.</p>
              <Button onClick={onClose} className="mt-4">Close</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Check if booking can be modified
  const canModify = booking.status === 'booked' || booking.status === 'in_transit';
  
  if (!canModify) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl max-w-3xl w-full mx-4 p-8">
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Cannot Modify Booking</h3>
              <p className="text-gray-600 mt-2">
                This booking cannot be modified because it has been {booking.status}.
              </p>
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
            <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Edit className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Modify Booking</h2>
              <p className="text-gray-600">LR #{booking.lr_number}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <p className="text-green-700">Booking updated successfully!</p>
            </div>
          )}
          
          {/* Booking Summary */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">From</p>
                <p className="font-medium">{booking.from_branch_details?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">To</p>
                <p className="font-medium">{booking.to_branch_details?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium capitalize">{booking.status.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="space-y-6">
              {/* Article Information */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Article Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Article</Label>
                    <Input
                      value={booking.article?.name || 'N/A'}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  
                  <div>
                    <Label>Description</Label>
                    <Input
                      {...register('description')}
                      placeholder="Enter description (optional)"
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label>Actual Weight (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('actual_weight', { valueAsNumber: true })}
                      placeholder="Enter actual weight"
                    />
                    {errors.actual_weight && (
                      <p className="text-sm text-red-500 mt-1">{errors.actual_weight.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      {...register('quantity', { valueAsNumber: true })}
                      placeholder="Enter quantity"
                    />
                    {errors.quantity && (
                      <p className="text-sm text-red-500 mt-1">{errors.quantity.message}</p>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox
                        id="fragile"
                        checked={watch('fragile')}
                        onCheckedChange={(checked) => setValue('fragile', !!checked)}
                      />
                      <Label htmlFor="fragile" className="font-normal cursor-pointer">
                        Fragile Item
                      </Label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="insurance_required"
                        checked={watch('insurance_required')}
                        onCheckedChange={(checked) => setValue('insurance_required', !!checked)}
                      />
                      <Label htmlFor="insurance_required" className="font-normal cursor-pointer">
                        Insurance Required
                      </Label>
                    </div>
                    
                    {watchInsuranceRequired && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-blue-50 rounded-lg">
                        <div>
                          <Label>Insurance Value (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            {...register('insurance_value', { valueAsNumber: true })}
                            placeholder="Enter insurance value"
                          />
                          {errors.insurance_value && (
                            <p className="text-sm text-red-500 mt-1">{errors.insurance_value.message}</p>
                          )}
                        </div>
                        <div>
                          <Label>Insurance Charge (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            {...register('insurance_charge', { valueAsNumber: true })}
                            placeholder="Enter insurance charge"
                          />
                          {errors.insurance_charge && (
                            <p className="text-sm text-red-500 mt-1">{errors.insurance_charge.message}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Payment Information */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Payment Type</Label>
                    <Input
                      value={booking.payment_type}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  
                  <div>
                    <Label>Freight Per Quantity (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      {...register('freight_per_qty', { valueAsNumber: true })}
                      placeholder="Enter freight per quantity"
                    />
                    {errors.freight_per_qty && (
                      <p className="text-sm text-red-500 mt-1">{errors.freight_per_qty.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label>Loading Charges (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      {...register('loading_charges', { valueAsNumber: true })}
                      placeholder="Enter loading charges"
                    />
                    {errors.loading_charges && (
                      <p className="text-sm text-red-500 mt-1">{errors.loading_charges.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label>Unloading Charges (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      {...register('unloading_charges', { valueAsNumber: true })}
                      placeholder="Enter unloading charges"
                    />
                    {errors.unloading_charges && (
                      <p className="text-sm text-red-500 mt-1">{errors.unloading_charges.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label>Packaging Type</Label>
                    <Select
                      value={watch('packaging_type')}
                      onValueChange={(value) => setValue('packaging_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select packaging type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Standard">Standard</SelectItem>
                        <SelectItem value="Bubble Wrap">Bubble Wrap</SelectItem>
                        <SelectItem value="Wooden Crate">Wooden Crate</SelectItem>
                        <SelectItem value="Cardboard Box">Cardboard Box</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Packaging Charge (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      {...register('packaging_charge', { valueAsNumber: true })}
                      placeholder="Enter packaging charge"
                    />
                    {errors.packaging_charge && (
                      <p className="text-sm text-red-500 mt-1">{errors.packaging_charge.message}</p>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600">Freight Charges:</span>
                        <span className="font-medium">₹{((watchQuantity || 0) * (watchFreightPerQty || 0)).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600">Loading Charges:</span>
                        <span className="font-medium">₹{(watchLoadingCharges || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600">Unloading Charges:</span>
                        <span className="font-medium">₹{(watchUnloadingCharges || 0).toFixed(2)}</span>
                      </div>
                      {watchInsuranceCharge > 0 && (
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-600">Insurance Charges:</span>
                          <span className="font-medium">₹{(watchInsuranceCharge || 0).toFixed(2)}</span>
                        </div>
                      )}
                      {watchPackagingCharge > 0 && (
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-600">Packaging Charges:</span>
                          <span className="font-medium">₹{(watchPackagingCharge || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-2">
                        <span className="font-medium text-gray-900">Total Amount:</span>
                        <span className="font-bold text-lg text-blue-600">₹{totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox
                        id="has_invoice"
                        checked={watch('has_invoice')}
                        onCheckedChange={(checked) => setValue('has_invoice', !!checked)}
                      />
                      <Label htmlFor="has_invoice" className="font-normal cursor-pointer">
                        Has Invoice
                      </Label>
                    </div>
                    
                    {watchHasInvoice && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-blue-50 rounded-lg">
                        <div>
                          <Label>Invoice Number</Label>
                          <Input
                            {...register('invoice_number')}
                            placeholder="Enter invoice number"
                          />
                          {errors.invoice_number && (
                            <p className="text-sm text-red-500 mt-1">{errors.invoice_number.message}</p>
                          )}
                        </div>
                        <div>
                          <Label>Invoice Date</Label>
                          <Input
                            type="date"
                            {...register('invoice_date')}
                          />
                          {errors.invoice_date && (
                            <p className="text-sm text-red-500 mt-1">{errors.invoice_date.message}</p>
                          )}
                        </div>
                        <div>
                          <Label>Invoice Amount (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            {...register('invoice_amount', { valueAsNumber: true })}
                            placeholder="Enter invoice amount"
                          />
                          {errors.invoice_amount && (
                            <p className="text-sm text-red-500 mt-1">{errors.invoice_amount.message}</p>
                          )}
                        </div>
                        <div>
                          <Label>E-Way Bill Number</Label>
                          <Input
                            {...register('eway_bill_number')}
                            placeholder="Enter e-way bill number"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Additional Information */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Private Mark Number</Label>
                    <Input
                      {...register('private_mark_number')}
                      placeholder="Enter private mark number (optional)"
                    />
                  </div>
                  
                  <div>
                    <Label>Reference Number</Label>
                    <Input
                      {...register('reference_number')}
                      placeholder="Enter reference number (optional)"
                    />
                  </div>
                  
                  <div>
                    <Label>Priority</Label>
                    <Select
                      value={watch('priority')}
                      onValueChange={(value: 'Normal' | 'High' | 'Urgent') => setValue('priority', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Normal">Normal</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Expected Delivery Date</Label>
                    <Input
                      type="date"
                      {...register('expected_delivery_date')}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label>Remarks</Label>
                    <Input
                      {...register('remarks')}
                      placeholder="Enter remarks (optional)"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label>Special Instructions</Label>
                    <Input
                      {...register('special_instructions')}
                      placeholder="Enter special instructions (optional)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            
            <Button 
              type="button" 
              onClick={handleSubmit(handleFormSubmit)}
              disabled={loading || success}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}