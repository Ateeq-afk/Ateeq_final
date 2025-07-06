import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Package, 
  Truck, 
  User, 
  Calendar, 
  IndianRupee, 
  Loader2, 
  FileText, 
  Info, 
  AlertTriangle, 
  Shield, 
  X,
  Plus,
  Search,
  MapPin,
  Receipt,
  CreditCard,
  CheckCircle,
  Building2,
  Scale,
  Phone,
  Mail,
  Hash,
  Weight,
  Calculator
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useBranches } from '@/hooks/useBranches';
import { useArticles } from '@/hooks/useArticles';
import { useCustomers } from '@/hooks/useCustomers';
import { useBookings } from '@/hooks/useBookings';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import BookingSuccess from './BookingSuccess';
import { motion } from 'framer-motion';
import type { Booking } from '@/types';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';

const bookingSchema = z.object({
  // Basic Information
  branch_id: z.string().min(1, 'Branch is required'),
  lr_type: z.enum(['system', 'manual']),
  manual_lr_number: z.string().optional(),
  
  // Route Information
  from_branch: z.string().min(1, 'From branch is required'),
  to_branch: z.string().min(1, 'To branch is required'),
  
  // Sender Information
  sender_type: z.enum(['existing', 'new']),
  sender_id: z.string().optional(),
  sender_name: z.string().min(1, 'Sender name is required'),
  sender_mobile: z.string().min(10, 'Valid mobile number required'),
  sender_email: z.string().email().optional().or(z.literal('')),
  sender_address: z.string().min(1, 'Sender address is required'),
  sender_city: z.string().optional(),
  sender_state: z.string().optional(),
  sender_pincode: z.string().optional(),
  sender_gst: z.string().optional(),
  
  // Receiver Information
  receiver_type: z.enum(['existing', 'new']),
  receiver_id: z.string().optional(),
  receiver_name: z.string().min(1, 'Receiver name is required'),
  receiver_mobile: z.string().min(10, 'Valid mobile number required'),
  receiver_email: z.string().email().optional().or(z.literal('')),
  receiver_address: z.string().min(1, 'Receiver address is required'),
  receiver_city: z.string().optional(),
  receiver_state: z.string().optional(),
  receiver_pincode: z.string().optional(),
  receiver_gst: z.string().optional(),
  
  // Article Information
  article_id: z.string().min(1, 'Article is required'),
  description: z.string().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  uom: z.string().min(1, 'Unit of measure is required'),
  actual_weight: z.number().min(0.1, 'Weight must be greater than 0'),
  charged_weight: z.number().optional(),
  declared_value: z.number().optional(),
  
  // Pricing Information
  freight_per_qty: z.number().min(0, 'Freight per quantity cannot be negative'),
  loading_charges: z.number().min(0, 'Loading charges cannot be negative'),
  unloading_charges: z.number().min(0, 'Unloading charges cannot be negative'),
  
  // Payment Information
  payment_type: z.enum(['Quotation', 'To Pay', 'Paid']),
  
  // Additional Information
  private_mark_number: z.string().optional(),
  remarks: z.string().optional(),
  special_instructions: z.string().optional(),
  reference_number: z.string().optional(),
  
  // Optional Services
  insurance_required: z.boolean().optional(),
  insurance_value: z.number().optional(),
  insurance_charge: z.number().optional(),
  fragile: z.boolean().optional(),
  priority: z.enum(['Normal', 'High', 'Urgent']).optional(),
  delivery_type: z.enum(['Standard', 'Express', 'Same Day']).optional(),
  packaging_type: z.string().optional(),
  packaging_charge: z.number().optional(),
  expected_delivery_date: z.string().optional(),
  
  // Invoice Information
  has_invoice: z.boolean().optional(),
  invoice_number: z.string().optional(),
  invoice_amount: z.number().optional(),
  invoice_date: z.string().optional(),
  eway_bill_number: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface SinglePageBookingFormProps {
  onClose: () => void;
  onBookingCreated?: (booking: Booking) => void;
}

export default function SinglePageBookingForm({ onClose, onBookingCreated }: SinglePageBookingFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [lrNumber, setLrNumber] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  
  const { branches } = useBranches();
  const { articles } = useArticles();
  const { customers } = useCustomers();
  const { createBooking } = useBookings();
  const { getCurrentUserBranch, user } = useAuth();
  const { selectedBranch } = useBranchSelection();
  const { showSuccess, showError } = useNotificationSystem();
  
  const userBranch = getCurrentUserBranch();
  const effectiveBranchId = selectedBranch || userBranch?.id;

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      branch_id: effectiveBranchId || '',
      lr_type: 'system',
      sender_type: 'new',
      receiver_type: 'new',
      payment_type: 'To Pay',
      quantity: 1,
      uom: 'Nos',
      actual_weight: 1,
      freight_per_qty: 0,
      loading_charges: 0,
      unloading_charges: 0,
      insurance_required: false,
      fragile: false,
      priority: 'Normal',
      delivery_type: 'Standard',
      has_invoice: false,
    }
  });

  const watchLrType = form.watch('lr_type');
  const watchSenderType = form.watch('sender_type');
  const watchReceiverType = form.watch('receiver_type');
  const watchInsuranceRequired = form.watch('insurance_required');
  const watchHasInvoice = form.watch('has_invoice');
  const watchQuantity = form.watch('quantity');
  const watchFreightPerQty = form.watch('freight_per_qty');
  const watchLoadingCharges = form.watch('loading_charges');
  const watchUnloadingCharges = form.watch('unloading_charges');
  const watchInsuranceCharge = form.watch('insurance_charge');
  const watchPackagingCharge = form.watch('packaging_charge');

  // Auto-generate LR number for system type
  useEffect(() => {
    if (watchLrType === 'system' && !lrNumber) {
      const timestamp = Date.now().toString();
      const branchCode = effectiveBranchId?.slice(-4) || 'DFLT';
      const generatedLR = `LR${branchCode}${timestamp}`;
      setLrNumber(generatedLR);
    }
  }, [watchLrType, effectiveBranchId, lrNumber]);

  // Calculate total amount
  useEffect(() => {
    const quantity = watchQuantity || 0;
    const freightPerQty = watchFreightPerQty || 0;
    const loadingCharges = watchLoadingCharges || 0;
    const unloadingCharges = watchUnloadingCharges || 0;
    const insuranceCharge = watchInsuranceCharge || 0;
    const packagingCharge = watchPackagingCharge || 0;

    const total = (quantity * freightPerQty) + loadingCharges + unloadingCharges + insuranceCharge + packagingCharge;
    setTotalAmount(total);
  }, [watchQuantity, watchFreightPerQty, watchLoadingCharges, watchUnloadingCharges, watchInsuranceCharge, watchPackagingCharge]);

  const availableBranches = branches.filter(branch => branch.id !== form.watch('from_branch'));

  const handleSenderSelection = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      form.setValue('sender_id', customer.id);
      form.setValue('sender_name', customer.name);
      form.setValue('sender_mobile', customer.mobile);
      form.setValue('sender_email', customer.email || '');
      form.setValue('sender_address', customer.address || '');
      form.setValue('sender_city', customer.city || '');
      form.setValue('sender_state', customer.state || '');
      form.setValue('sender_pincode', customer.pincode || '');
      form.setValue('sender_gst', customer.gst || '');
    }
  };

  const handleReceiverSelection = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      form.setValue('receiver_id', customer.id);
      form.setValue('receiver_name', customer.name);
      form.setValue('receiver_mobile', customer.mobile);
      form.setValue('receiver_email', customer.email || '');
      form.setValue('receiver_address', customer.address || '');
      form.setValue('receiver_city', customer.city || '');
      form.setValue('receiver_state', customer.state || '');
      form.setValue('receiver_pincode', customer.pincode || '');
      form.setValue('receiver_gst', customer.gst || '');
    }
  };

  const onSubmit = async (data: BookingFormData) => {
    try {
      setSubmitting(true);

      const bookingData = {
        ...data,
        lr_number: watchLrType === 'system' ? lrNumber : data.manual_lr_number!,
        total_amount: totalAmount,
        charged_weight: data.charged_weight || data.actual_weight,
        expected_delivery_date: data.expected_delivery_date || undefined,
        invoice_date: data.invoice_date || undefined,
      };

      const booking = await createBooking(bookingData);
      setCreatedBooking(booking);
      showSuccess('Booking Created', `LR ${booking.lr_number} created successfully`);
      
      if (onBookingCreated) {
        onBookingCreated(booking);
      }
    } catch (error) {
      console.error('Failed to create booking:', error);
      showError('Booking Failed', error instanceof Error ? error.message : 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (createdBooking) {
    return (
      <BookingSuccess
        booking={createdBooking}
        onClose={onClose}
        onCreateAnother={() => {
          setCreatedBooking(null);
          form.reset();
          setLrNumber('');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8" />
                <div>
                  <h1 className="text-2xl font-bold">Create New Booking</h1>
                  <p className="text-blue-100">Complete all information in one form</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Branch *</Label>
                    <Select
                      value={form.watch('branch_id')}
                      onValueChange={(value) => form.setValue('branch_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name} - {branch.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.branch_id && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.branch_id.message}</p>
                    )}
                  </div>

                  <div>
                    <Label>LR Type *</Label>
                    <RadioGroup
                      value={form.watch('lr_type')}
                      onValueChange={(value: 'system' | 'manual') => form.setValue('lr_type', value)}
                      className="flex gap-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="system" id="system" />
                        <Label htmlFor="system">System Generated</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="manual" id="manual" />
                        <Label htmlFor="manual">Manual Entry</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {watchLrType === 'system' && lrNumber && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <Label className="text-green-800">Generated LR Number</Label>
                      <p className="text-green-900 font-mono font-bold">{lrNumber}</p>
                    </div>
                  )}

                  {watchLrType === 'manual' && (
                    <div>
                      <Label>Manual LR Number *</Label>
                      <Input
                        {...form.register('manual_lr_number')}
                        placeholder="Enter LR number"
                      />
                      {form.formState.errors.manual_lr_number && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.manual_lr_number.message}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <Label>Payment Type *</Label>
                    <Select
                      value={form.watch('payment_type')}
                      onValueChange={(value: 'Quotation' | 'To Pay' | 'Paid') => form.setValue('payment_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Quotation">Quotation</SelectItem>
                        <SelectItem value="To Pay">To Pay</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Route Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-600" />
                    Route Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>From Branch *</Label>
                    <Select
                      value={form.watch('from_branch')}
                      onValueChange={(value) => form.setValue('from_branch', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select from branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name} - {branch.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.from_branch && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.from_branch.message}</p>
                    )}
                  </div>

                  <div>
                    <Label>To Branch *</Label>
                    <Select
                      value={form.watch('to_branch')}
                      onValueChange={(value) => form.setValue('to_branch', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select to branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBranches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name} - {branch.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.to_branch && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.to_branch.message}</p>
                    )}
                  </div>

                  <div>
                    <Label>Expected Delivery Date</Label>
                    <Input
                      type="date"
                      {...form.register('expected_delivery_date')}
                    />
                  </div>

                  <div>
                    <Label>Delivery Type</Label>
                    <Select
                      value={form.watch('delivery_type')}
                      onValueChange={(value: 'Standard' | 'Express' | 'Same Day') => form.setValue('delivery_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Standard">Standard</SelectItem>
                        <SelectItem value="Express">Express</SelectItem>
                        <SelectItem value="Same Day">Same Day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Priority</Label>
                    <Select
                      value={form.watch('priority')}
                      onValueChange={(value: 'Normal' | 'High' | 'Urgent') => form.setValue('priority', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Normal">Normal</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-yellow-600" />
                    Pricing & Charges
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Freight per Quantity *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...form.register('freight_per_qty', { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                    {form.formState.errors.freight_per_qty && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.freight_per_qty.message}</p>
                    )}
                  </div>

                  <div>
                    <Label>Loading Charges</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...form.register('loading_charges', { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label>Unloading Charges</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...form.register('unloading_charges', { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                  </div>

                  {watchInsuranceRequired && (
                    <div>
                      <Label>Insurance Charges</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...form.register('insurance_charge', { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  <div>
                    <Label>Packaging Charges</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...form.register('packaging_charge', { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                  </div>

                  <Separator />

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-blue-800 font-semibold">Total Amount</Label>
                      <span className="text-2xl font-bold text-blue-900">₹{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Sender Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-purple-600" />
                    Sender Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Sender Type</Label>
                    <RadioGroup
                      value={form.watch('sender_type')}
                      onValueChange={(value: 'existing' | 'new') => form.setValue('sender_type', value)}
                      className="flex gap-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="existing" id="existing-sender" />
                        <Label htmlFor="existing-sender">Existing Customer</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="new" id="new-sender" />
                        <Label htmlFor="new-sender">New Customer</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {watchSenderType === 'existing' && (
                    <div>
                      <Label>Select Existing Sender</Label>
                      <Select onValueChange={handleSenderSelection}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} - {customer.mobile}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Sender Name *</Label>
                      <Input
                        {...form.register('sender_name')}
                        placeholder="Full name"
                      />
                      {form.formState.errors.sender_name && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.sender_name.message}</p>
                      )}
                    </div>

                    <div>
                      <Label>Mobile Number *</Label>
                      <Input
                        {...form.register('sender_mobile')}
                        placeholder="10-digit mobile"
                      />
                      {form.formState.errors.sender_mobile && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.sender_mobile.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      {...form.register('sender_email')}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <Label>Address *</Label>
                    <Textarea
                      {...form.register('sender_address')}
                      placeholder="Complete address"
                      rows={3}
                    />
                    {form.formState.errors.sender_address && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.sender_address.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>City</Label>
                      <Input
                        {...form.register('sender_city')}
                        placeholder="City"
                      />
                    </div>

                    <div>
                      <Label>State</Label>
                      <Input
                        {...form.register('sender_state')}
                        placeholder="State"
                      />
                    </div>

                    <div>
                      <Label>Pincode</Label>
                      <Input
                        {...form.register('sender_pincode')}
                        placeholder="6-digit pincode"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>GST Number</Label>
                    <Input
                      {...form.register('sender_gst')}
                      placeholder="GST registration number"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Receiver Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-orange-600" />
                    Receiver Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Receiver Type</Label>
                    <RadioGroup
                      value={form.watch('receiver_type')}
                      onValueChange={(value: 'existing' | 'new') => form.setValue('receiver_type', value)}
                      className="flex gap-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="existing" id="existing-receiver" />
                        <Label htmlFor="existing-receiver">Existing Customer</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="new" id="new-receiver" />
                        <Label htmlFor="new-receiver">New Customer</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {watchReceiverType === 'existing' && (
                    <div>
                      <Label>Select Existing Receiver</Label>
                      <Select onValueChange={handleReceiverSelection}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} - {customer.mobile}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Receiver Name *</Label>
                      <Input
                        {...form.register('receiver_name')}
                        placeholder="Full name"
                      />
                      {form.formState.errors.receiver_name && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.receiver_name.message}</p>
                      )}
                    </div>

                    <div>
                      <Label>Mobile Number *</Label>
                      <Input
                        {...form.register('receiver_mobile')}
                        placeholder="10-digit mobile"
                      />
                      {form.formState.errors.receiver_mobile && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.receiver_mobile.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      {...form.register('receiver_email')}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <Label>Address *</Label>
                    <Textarea
                      {...form.register('receiver_address')}
                      placeholder="Complete address"
                      rows={3}
                    />
                    {form.formState.errors.receiver_address && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.receiver_address.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>City</Label>
                      <Input
                        {...form.register('receiver_city')}
                        placeholder="City"
                      />
                    </div>

                    <div>
                      <Label>State</Label>
                      <Input
                        {...form.register('receiver_state')}
                        placeholder="State"
                      />
                    </div>

                    <div>
                      <Label>Pincode</Label>
                      <Input
                        {...form.register('receiver_pincode')}
                        placeholder="6-digit pincode"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>GST Number</Label>
                    <Input
                      {...form.register('receiver_gst')}
                      placeholder="GST registration number"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Article Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-red-600" />
                    Article Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Article Type *</Label>
                    <Select
                      value={form.watch('article_id')}
                      onValueChange={(value) => form.setValue('article_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select article" />
                      </SelectTrigger>
                      <SelectContent>
                        {articles.map((article) => (
                          <SelectItem key={article.id} value={article.id}>
                            {article.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.article_id && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.article_id.message}</p>
                    )}
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      {...form.register('description')}
                      placeholder="Item description"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        {...form.register('quantity', { valueAsNumber: true })}
                        placeholder="1"
                      />
                      {form.formState.errors.quantity && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.quantity.message}</p>
                      )}
                    </div>

                    <div>
                      <Label>Unit *</Label>
                      <Select
                        value={form.watch('uom')}
                        onValueChange={(value) => form.setValue('uom', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Nos">Nos</SelectItem>
                          <SelectItem value="Kg">Kg</SelectItem>
                          <SelectItem value="Tons">Tons</SelectItem>
                          <SelectItem value="Boxes">Boxes</SelectItem>
                          <SelectItem value="Bags">Bags</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Actual Weight (kg) *</Label>
                      <Input
                        type="number"
                        step="0.1"
                        {...form.register('actual_weight', { valueAsNumber: true })}
                        placeholder="1.0"
                      />
                      {form.formState.errors.actual_weight && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.actual_weight.message}</p>
                      )}
                    </div>

                    <div>
                      <Label>Charged Weight (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        {...form.register('charged_weight', { valueAsNumber: true })}
                        placeholder="Auto-calculated"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Declared Value (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...form.register('declared_value', { valueAsNumber: true })}
                      placeholder="Item value"
                    />
                  </div>

                  <div>
                    <Label>Packaging Type</Label>
                    <Input
                      {...form.register('packaging_type')}
                      placeholder="Box, Bag, etc."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Optional Services */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    Optional Services
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="insurance"
                      checked={form.watch('insurance_required')}
                      onCheckedChange={(checked) => form.setValue('insurance_required', !!checked)}
                    />
                    <Label htmlFor="insurance">Insurance Required</Label>
                  </div>

                  {watchInsuranceRequired && (
                    <div>
                      <Label>Insurance Value (₹)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...form.register('insurance_value', { valueAsNumber: true })}
                        placeholder="Insured amount"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fragile"
                      checked={form.watch('fragile')}
                      onCheckedChange={(checked) => form.setValue('fragile', !!checked)}
                    />
                    <Label htmlFor="fragile">Fragile Item</Label>
                  </div>

                  <div>
                    <Label>Private Mark Number</Label>
                    <Input
                      {...form.register('private_mark_number')}
                      placeholder="Private marking"
                    />
                  </div>

                  <div>
                    <Label>Reference Number</Label>
                    <Input
                      {...form.register('reference_number')}
                      placeholder="Your reference"
                    />
                  </div>

                  <div>
                    <Label>Special Instructions</Label>
                    <Textarea
                      {...form.register('special_instructions')}
                      placeholder="Handling instructions"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Remarks</Label>
                    <Textarea
                      {...form.register('remarks')}
                      placeholder="Additional notes"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Invoice Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-indigo-600" />
                    Invoice Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="has-invoice"
                      checked={form.watch('has_invoice')}
                      onCheckedChange={(checked) => form.setValue('has_invoice', !!checked)}
                    />
                    <Label htmlFor="has-invoice">Has Invoice</Label>
                  </div>

                  {watchHasInvoice && (
                    <>
                      <div>
                        <Label>Invoice Number</Label>
                        <Input
                          {...form.register('invoice_number')}
                          placeholder="INV-001"
                        />
                      </div>

                      <div>
                        <Label>Invoice Amount (₹)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          {...form.register('invoice_amount', { valueAsNumber: true })}
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <Label>Invoice Date</Label>
                        <Input
                          type="date"
                          {...form.register('invoice_date')}
                        />
                      </div>

                      <div>
                        <Label>E-Way Bill Number</Label>
                        <Input
                          {...form.register('eway_bill_number')}
                          placeholder="E-way bill number"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Submit Section */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose} size="lg">
                Cancel
              </Button>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-green-600">₹{totalAmount.toFixed(2)}</p>
                </div>
                
                <Button
                  type="submit"
                  disabled={submitting}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Creating Booking...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Create Booking
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}