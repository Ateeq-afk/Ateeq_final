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
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useBranches } from '@/hooks/useBranches';
import { useArticles } from '@/hooks/useArticles';
import { useCustomers } from '@/hooks/useCustomers';
import { useLR } from '@/hooks/useLR';
import { useAuth } from '@/contexts/AuthContext';
import { Combobox } from '@/components/ui/combobox';
import BookingSuccess from './BookingSuccess';
import { motion } from 'framer-motion';
import type { Booking } from '@/types';
import { cleanDateField } from '@/lib/utils/date';

const bookingSchema = z.object({
  // Basic Information
  branch_id: z.string().min(1, 'Branch is required'),
  lr_type: z.enum(['system', 'manual']),
  manual_lr_number: z.string().optional(),
  
  // Route Information
  from_branch: z.string().min(1, 'From branch is required'),
  to_branch: z.string().min(1, 'To branch is required'),
  
  // Customer Information
  sender_id: z.string().min(1, 'Sender is required'),
  receiver_id: z.string().min(1, 'Receiver is required'),
  
  // Article Information
  article_id: z.string().min(1, 'Article is required'),
  description: z.string().optional(),
  uom: z.string().min(1, 'Unit of measurement is required'),
  actual_weight: z.number().min(0, 'Weight must be a positive number').optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  
  // Payment Information
  payment_type: z.enum(['Paid', 'To Pay', 'Quotation']),
  freight_per_qty: z.number().min(0, 'Freight must be a positive number'),
  loading_charges: z.number().min(0, 'Loading charges must be a positive number').optional(),
  unloading_charges: z.number().min(0, 'Unloading charges must be a positive number').optional(),
  
  // Additional Information
  private_mark_number: z.string().optional(),
  remarks: z.string().optional(),
  
  // Additional Options
  has_invoice: z.boolean().default(false),
  invoice_number: z.string().optional(),
  invoice_date: z.string().optional(),
  invoice_amount: z.number().optional(),
  eway_bill_number: z.string().optional(),
  
  delivery_type: z.enum(['Standard', 'Express', 'Same Day']).default('Standard'),
  insurance_required: z.boolean().default(false),
  insurance_value: z.number().optional(),
  insurance_charge: z.number().min(0).optional(),
  fragile: z.boolean().default(false),
  priority: z.enum(['Normal', 'High', 'Urgent']).default('Normal'),
  expected_delivery_date: z.string().optional(),
  packaging_type: z.string().optional(),
  packaging_charge: z.number().min(0).optional(),
  special_instructions: z.string().optional(),
  reference_number: z.string().optional(),
}).refine(data => {
  // If lr_type is manual, manual_lr_number is required
  if (data.lr_type === 'manual' && !data.manual_lr_number) {
    return false;
  }
  return true;
}, {
  message: 'Manual LR number is required',
  path: ['manual_lr_number']
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

type FormValues = z.infer<typeof bookingSchema>;

interface NewBookingFormProps {
  onSubmit: (data: any) => Promise<Booking>;
  onClose: () => void;
}

export default function NewBookingForm({ onSubmit, onClose }: NewBookingFormProps) {
  // Changed from 5 steps to 3 steps
  const [activeStep, setActiveStep] = useState<'basic' | 'details' | 'payment'>('basic');
  const [submitting, setSubmitting] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [senderSearch, setSenderSearch] = useState('');
  const [receiverSearch, setReceiverSearch] = useState('');
  const [articleSearch, setArticleSearch] = useState('');
  const [lrNumber, setLrNumber] = useState('');
  
  const { branches, loading: branchesLoading } = useBranches();
  const { articles, loading: articlesLoading } = useArticles();
  const { customers, loading: customersLoading } = useCustomers();
  const { generateLRNumber } = useLR();
  const { getCurrentUserBranch } = useAuth();
  
  const userBranch = getCurrentUserBranch();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      branch_id: userBranch?.id || '',
      lr_type: 'system',
      from_branch: userBranch?.id || '',
      payment_type: 'Paid',
      uom: 'Fixed',
      quantity: 1,
      freight_per_qty: 0,
      loading_charges: 0,
      unloading_charges: 0,
      has_invoice: false,
      insurance_required: false,
      fragile: false,
      delivery_type: 'Standard',
      priority: 'Normal',
    },
    mode: 'onChange',
  });
  
  const watchLrType = watch('lr_type');
  const watchFromBranch = watch('from_branch');
  const watchHasInvoice = watch('has_invoice');
  const watchInsuranceRequired = watch('insurance_required');
  const watchPaymentType = watch('payment_type');
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
  
  // Generate LR number on component mount
  useEffect(() => {
    const generateLR = async () => {
      try {
        const lr = await generateLRNumber();
        setLrNumber(lr);
      } catch (error) {
        console.error('Failed to generate LR number:', error);
      }
    };
    
    generateLR();
  }, [generateLRNumber]);
  
  // Filter branches for "To" dropdown to exclude the "From" branch
  const toBranches = branches.filter(branch => branch.id !== watchFromBranch);
  
  // Filter customers for sender and receiver dropdowns
  const filteredSenders = customers.filter(customer => 
    customer.name.toLowerCase().includes(senderSearch.toLowerCase()) ||
    customer.mobile.includes(senderSearch)
  );
  
  const filteredReceivers = customers.filter(customer => 
    customer.name.toLowerCase().includes(receiverSearch.toLowerCase()) ||
    customer.mobile.includes(receiverSearch)
  );
  
  // Filter articles
  const filteredArticles = articles.filter(article => 
    article.name.toLowerCase().includes(articleSearch.toLowerCase()) ||
    article.description?.toLowerCase().includes(articleSearch.toLowerCase())
  );
  
  // Format customers for combobox
  const senderOptions = filteredSenders.map(customer => ({
    value: customer.id,
    label: customer.name,
    icon: User,
    details: {
      mobile: customer.mobile,
      gst: customer.gst
    }
  }));
  
  const receiverOptions = filteredReceivers.map(customer => ({
    value: customer.id,
    label: customer.name,
    icon: User,
    details: {
      mobile: customer.mobile,
      gst: customer.gst
    }
  }));
  
  // Format articles for combobox
  const articleOptions = filteredArticles.map(article => ({
    value: article.id,
    label: article.name,
    icon: Package,
    details: {
      description: article.description,
      rate: `₹${article.base_rate}`
    }
  }));
  
  // Handle article selection to set default freight rate
  const handleArticleChange = (articleId: string) => {
    setValue('article_id', articleId);
    
    // Find the selected article
    const selectedArticle = articles.find(a => a.id === articleId);
    if (selectedArticle) {
      setValue('freight_per_qty', selectedArticle.base_rate);
      
      // If article has a unit of measure, set it
      if (selectedArticle.unit_of_measure) {
        setValue('uom', selectedArticle.unit_of_measure);
      }
    }
  };
  
  // Navigate between steps
  const goToNextStep = async () => {
    let fieldsToValidate: (keyof FormValues)[] = [];
    
    if (activeStep === 'basic') {
      // Validate basic info and customer info
      fieldsToValidate = [
        'branch_id', 'lr_type', 'manual_lr_number', 
        'from_branch', 'to_branch',
        'sender_id', 'receiver_id'
      ];
      const isValid = await trigger(fieldsToValidate);
      if (isValid) setActiveStep('details');
    } else if (activeStep === 'details') {
      // Validate article info and additional info
      fieldsToValidate = [
        'article_id', 'uom', 'quantity', 'actual_weight',
        'payment_type', 'freight_per_qty', 'loading_charges', 'unloading_charges'
      ];
      if (watchHasInvoice) {
        fieldsToValidate.push('invoice_number', 'invoice_date', 'invoice_amount');
      }
      const isValid = await trigger(fieldsToValidate);
      if (isValid) setActiveStep('payment');
    }
  };
  
  const goToPrevStep = () => {
    if (activeStep === 'details') setActiveStep('basic');
    else if (activeStep === 'payment') setActiveStep('details');
  };
  
  const handleFormSubmit = async (data: FormValues) => {
    try {
      setSubmitting(true);
      
      // Clean up date fields - convert empty strings to null
      const cleanedData = {
        ...data,
        expected_delivery_date: cleanDateField(data.expected_delivery_date),
        invoice_date: cleanDateField(data.invoice_date),
      };
      
      // Add LR number to data
      const bookingData = {
        ...cleanedData,
        lr_number: data.lr_type === 'system' ? lrNumber : data.manual_lr_number,
      };
      
      console.log("Submitting booking data:", bookingData);
      
      // Submit the form
      const booking = await onSubmit(bookingData);
      console.log("Booking created successfully:", booking);
      setCreatedBooking(booking);
      
    } catch (error) {
      console.error('Failed to create booking:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  // If booking was created successfully, show success screen
  if (createdBooking) {
    return (
      <BookingSuccess 
        booking={createdBooking} 
        onClose={onClose}
        onPrint={() => window.print()}
        onDownload={() => console.log('Downloading LR...')}
      />
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button 
              variant="ghost" 
              className="-ml-4 mb-2 flex items-center gap-2"
              onClick={onClose}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h2 className="text-2xl font-bold text-gray-900">New Booking</h2>
            <p className="text-gray-600 mt-1">Create a new booking/LR</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10 rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Progress Steps */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1 flex items-center">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  activeStep === 'basic' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
                }`}>
                  1
                </div>
                <div className={`flex-1 h-1 ${
                  activeStep === 'basic' ? 'bg-gray-200' : 'bg-blue-600'
                }`}></div>
              </div>
              <div className="flex-1 flex items-center">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  activeStep === 'details' ? 'bg-blue-600 text-white' : activeStep === 'payment' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
                }`}>
                  2
                </div>
                <div className={`flex-1 h-1 ${
                  activeStep === 'payment' ? 'bg-blue-600' : 'bg-gray-200'
                }`}></div>
              </div>
              <div className="flex-1 flex items-center">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  activeStep === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  3
                </div>
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Basic Information</span>
              <span>Shipment Details</span>
              <span>Payment & Review</span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="p-6">
              {/* Step 1: Basic Information */}
              {activeStep === 'basic' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Branch & LR Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Branch</Label>
                      <Select
                        value={watch('branch_id')}
                        onValueChange={(value) => setValue('branch_id', value)}
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
                      {errors.branch_id && (
                        <p className="text-sm text-red-500 mt-1">{errors.branch_id.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label>LR Type</Label>
                      <RadioGroup
                        value={watch('lr_type')}
                        onValueChange={(value: 'system' | 'manual') => setValue('lr_type', value)}
                        className="flex gap-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="system" id="system" />
                          <Label htmlFor="system" className="font-normal">System Generated</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="manual" id="manual" />
                          <Label htmlFor="manual" className="font-normal">Manual</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    {watchLrType === 'system' ? (
                      <div>
                        <Label>System LR Number</Label>
                        <Input
                          value={lrNumber}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                    ) : (
                      <div>
                        <Label>Manual LR Number</Label>
                        <Input
                          {...register('manual_lr_number')}
                          placeholder="Enter manual LR number"
                        />
                        {errors.manual_lr_number && (
                          <p className="text-sm text-red-500 mt-1">{errors.manual_lr_number.message}</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Route Information */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Route Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>From Branch</Label>
                        <Select
                          value={watch('from_branch')}
                          onValueChange={(value) => setValue('from_branch', value)}
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
                        {errors.from_branch && (
                          <p className="text-sm text-red-500 mt-1">{errors.from_branch.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label>To Branch</Label>
                        <Select
                          value={watch('to_branch')}
                          onValueChange={(value) => setValue('to_branch', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select to branch" />
                          </SelectTrigger>
                          <SelectContent>
                            {toBranches.map((branch) => (
                              <SelectItem key={branch.id} value={branch.id}>
                                {branch.name} - {branch.city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.to_branch && (
                          <p className="text-sm text-red-500 mt-1">{errors.to_branch.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Customer Information */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Customer Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>Sender</Label>
                        <div className="mt-1">
                          <Combobox
                            options={senderOptions}
                            value={watch('sender_id')}
                            onValueChange={(value) => setValue('sender_id', value)}
                            placeholder="Search sender by name or mobile"
                            searchPlaceholder="Type to search senders..."
                            onSearchChange={setSenderSearch}
                          />
                        </div>
                        {errors.sender_id && (
                          <p className="text-sm text-red-500 mt-1">{errors.sender_id.message}</p>
                        )}
                        <div className="mt-2 flex justify-end">
                          <Button type="button" variant="outline" size="sm" className="text-xs">
                            <Plus className="h-3 w-3 mr-1" />
                            Add New Sender
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Receiver</Label>
                        <div className="mt-1">
                          <Combobox
                            options={receiverOptions}
                            value={watch('receiver_id')}
                            onValueChange={(value) => setValue('receiver_id', value)}
                            placeholder="Search receiver by name or mobile"
                            searchPlaceholder="Type to search receivers..."
                            onSearchChange={setReceiverSearch}
                          />
                        </div>
                        {errors.receiver_id && (
                          <p className="text-sm text-red-500 mt-1">{errors.receiver_id.message}</p>
                        )}
                        <div className="mt-2 flex justify-end">
                          <Button type="button" variant="outline" size="sm" className="text-xs">
                            <Plus className="h-3 w-3 mr-1" />
                            Add New Receiver
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Step 2: Shipment Details */}
              {activeStep === 'details' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Article Information */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Article Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <Label>Article</Label>
                        <div className="mt-1">
                          <Combobox
                            options={articleOptions}
                            value={watch('article_id')}
                            onValueChange={handleArticleChange}
                            placeholder="Search article by name"
                            searchPlaceholder="Type to search articles..."
                            onSearchChange={setArticleSearch}
                          />
                        </div>
                        {errors.article_id && (
                          <p className="text-sm text-red-500 mt-1">{errors.article_id.message}</p>
                        )}
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label>Description</Label>
                        <Input
                          {...register('description')}
                          placeholder="Enter description (optional)"
                        />
                      </div>
                      
                      <div>
                        <Label>Unit of Measurement</Label>
                        <Select
                          value={watch('uom')}
                          onValueChange={(value) => setValue('uom', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select UOM" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Fixed">Fixed</SelectItem>
                            <SelectItem value="KG">KG</SelectItem>
                            <SelectItem value="Pieces">Pieces</SelectItem>
                            <SelectItem value="Boxes">Boxes</SelectItem>
                            <SelectItem value="Bundles">Bundles</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.uom && (
                          <p className="text-sm text-red-500 mt-1">{errors.uom.message}</p>
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
                      
                      <div>
                        <Label>Expected Delivery Date</Label>
                        <Input
                          type="date"
                          {...register('expected_delivery_date')}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Options */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Additional Options</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
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
                        
                        <div className="mt-4">
                          <Label>Delivery Type</Label>
                          <Select
                            value={watch('delivery_type')}
                            onValueChange={(value: 'Standard' | 'Express' | 'Same Day') => setValue('delivery_type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select delivery type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Standard">Standard</SelectItem>
                              <SelectItem value="Express">Express</SelectItem>
                              <SelectItem value="Same Day">Same Day</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
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
                </motion.div>
              )}
              
              {/* Step 3: Payment & Review */}
              {activeStep === 'payment' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Payment Information */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Payment Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>Payment Type</Label>
                        <Select
                          value={watch('payment_type')}
                          onValueChange={(value: 'Paid' | 'To Pay' | 'Quotation') => setValue('payment_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="To Pay">To Pay</SelectItem>
                            <SelectItem value="Quotation">Quotation</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.payment_type && (
                          <p className="text-sm text-red-500 mt-1">{errors.payment_type.message}</p>
                        )}
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
                    </div>
                  </div>
                  
                  {/* Invoice Information */}
                  <div>
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
                  
                  {/* Additional Information */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Additional Information</h4>
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
                      
                      <div className="md:col-span-2">
                        <Label>Remarks</Label>
                        <Input
                          {...register('remarks')}
                          placeholder="Enter remarks (optional)"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between">
              {activeStep !== 'basic' ? (
                <Button type="button" variant="outline" onClick={goToPrevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={onClose}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
              
              {activeStep !== 'payment' ? (
                <Button type="button" onClick={goToNextStep}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={submitting || !isValid}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating Booking...
                    </>
                  ) : (
                    'Create Booking'
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}