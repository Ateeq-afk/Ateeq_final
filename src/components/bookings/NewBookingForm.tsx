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
  ArrowRight,
  MapPin,
  Receipt,
  CreditCard,
  CheckCircle,
  Clock,
  Building2,
  Scale
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
// import { Combobox } from '@/components/ui/combobox';
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
  charged_weight: z.number().min(0, 'Charged weight must be a positive number').optional(),
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
  // const ['', setSenderSearch] = useState('');
  // const ['', setReceiverSearch] = useState('');
  // const ['', setArticleSearch] = useState('');
  const [lrNumber, setLrNumber] = useState('');
  
  const { getCurrentUserBranch } = useAuth();
  const userBranch = getCurrentUserBranch();
  
  const { branches, loading: branchesLoading } = useBranches();
  const { articles, loading: articlesLoading, getCustomRateForCustomer } = useArticles(userBranch?.id);
  const { customers, loading: customersLoading } = useCustomers(userBranch?.id);
  const { generateLRNumber } = useLR(userBranch?.id);
  
  // Debug branches loading
  // console.log('NewBookingForm - Branches:', branches.length, 'Loading:', branchesLoading);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState,
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
  
  const { errors, isValid } = formState;
  
  const watchLrType = watch('lr_type');
  const watchFromBranch = watch('from_branch');
  const watchHasInvoice = watch('has_invoice');
  const watchInsuranceRequired = watch('insurance_required');
  const watchPaymentType = watch('payment_type');
  const watchFreightPerQty = watch('freight_per_qty');
  const watchQuantity = watch('quantity');
  const watchLoadingCharges = watch('loading_charges');
  const watchUnloadingCharges = watch('unloading_charges');
  const watchArticleId = watch('article_id');
  const watchInsuranceCharge = watch('insurance_charge');
  const watchPackagingCharge = watch('packaging_charge');
  
  // Generate LR number for system type
  useEffect(() => {
    if (watchLrType === 'system' && !lrNumber) {
      const timestamp = Date.now().toString();
      const branchCode = userBranch?.id?.slice(-4) || 'DFLT';
      const generatedLR = `LR${branchCode}${timestamp}`;
      setLrNumber(generatedLR);
    }
  }, [watchLrType, userBranch?.id, lrNumber]);
  
  // Auto-calculate loading and unloading charges based on quantity and article
  useEffect(() => {
    const selectedArticle = articles.find(a => a.id === watchArticleId);
    if (selectedArticle && watchQuantity > 0) {
      // Default loading charge: ₹20 per quantity for heavy items, ₹10 for regular
      const baseLoadingCharge = selectedArticle.requires_special_handling ? 25 : 15;
      const baseUnloadingCharge = selectedArticle.requires_special_handling ? 20 : 10;
      
      const calculatedLoadingCharges = baseLoadingCharge * watchQuantity;
      const calculatedUnloadingCharges = baseUnloadingCharge * watchQuantity;
      
      // Only update if values are currently 0 (to not override manual entries)
      if ((watchLoadingCharges || 0) === 0) {
        setValue('loading_charges', calculatedLoadingCharges);
      }
      if ((watchUnloadingCharges || 0) === 0) {
        setValue('unloading_charges', calculatedUnloadingCharges);
      }
    }
  }, [watchArticleId, watchQuantity, articles, setValue, watchLoadingCharges, watchUnloadingCharges]);

  // Calculate total amount
  const totalAmount = (
    (watchQuantity || 0) * (watchFreightPerQty || 0) +
    (watchLoadingCharges || 0) +
    (watchUnloadingCharges || 0) +
    (watchInsuranceCharge || 0) +
    (watchPackagingCharge || 0)
  );
  
  // LR number will be generated server-side on form submission
  // This prevents race conditions when multiple users create bookings simultaneously
  
  // Filter branches for "To" dropdown to exclude the "From" branch
  const toBranches = branches.filter(branch => branch.id !== watchFromBranch);
  
  // No filtering needed since we're using simple selects now
  // Articles and customers are used directly in the Select components

  // Handle article selection to set default freight rate
  const handleArticleChange = async (articleId: string) => {
    setValue('article_id', articleId);

    const selectedArticle = articles.find(a => a.id === articleId);
    if (!selectedArticle) return;

    let rate = selectedArticle.base_rate;
    const payerId =
      watchPaymentType === 'To Pay' ? watch('receiver_id') : watch('sender_id');
    if (payerId) {
      try {
        const custom = await getCustomRateForCustomer(payerId, articleId);
        if (custom !== null) rate = custom;
      } catch (err) {
        console.error('Failed to fetch custom rate:', err);
      }
    }

    setValue('freight_per_qty', rate);
    if (selectedArticle.unit_of_measure) {
      setValue('uom', selectedArticle.unit_of_measure);
    }
  };

  // Update freight rate when payer or article changes
  useEffect(() => {
    const applyRate = async () => {
      const articleId = watch('article_id');
      if (!articleId) return;

      const article = articles.find(a => a.id === articleId);
      if (!article) return;

      let rate = article.base_rate;
      const payerId =
        watchPaymentType === 'To Pay' ? watch('receiver_id') : watch('sender_id');
      if (payerId) {
        try {
          const custom = await getCustomRateForCustomer(payerId, articleId);
          if (custom !== null) rate = custom;
        } catch (err) {
          console.error('Failed to fetch custom rate:', err);
        }
      }
      setValue('freight_per_qty', rate);
    };

    applyRate();
  }, [watch('article_id'), watch('receiver_id'), watch('sender_id'), watchPaymentType]);
  
  // Navigate between steps
  const goToNextStep = async () => {
    let fieldsToValidate: (keyof FormValues)[] = [];
    
    if (activeStep === 'basic') {
      // Validate basic info and customer info
      fieldsToValidate = [
        'branch_id', 'lr_type', 
        'from_branch', 'to_branch',
        'sender_id', 'receiver_id'
      ];
      
      // Add manual LR number validation only if lr_type is manual
      if (watchLrType === 'manual') {
        fieldsToValidate.push('manual_lr_number');
      }
      
      const isValid = await trigger(fieldsToValidate);
      if (isValid) {
        setActiveStep('details');
      } else {
        // Show user-friendly error notification
        const errorFields = fieldsToValidate.filter(field => {
          const error = formState.errors[field as keyof FormValues];
          return !!error;
        });
        
        showError(
          'Validation Error', 
          `Please fill in all required fields before proceeding. Missing: ${errorFields.join(', ')}`
        );
        
        // Scroll to first error field
        const firstErrorField = document.querySelector('[aria-invalid="true"]');
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    } else if (activeStep === 'details') {
      // Validate article info and additional info
      fieldsToValidate = [
        'article_id', 'uom', 'quantity',
        'payment_type', 'freight_per_qty', 'loading_charges', 'unloading_charges'
      ];
      
      if (watchHasInvoice) {
        fieldsToValidate.push('invoice_number', 'invoice_date', 'invoice_amount');
      }
      
      if (watchInsuranceRequired) {
        fieldsToValidate.push('insurance_value');
      }
      
      const isValid = await trigger(fieldsToValidate);
      if (isValid) {
        setActiveStep('payment');
      } else {
        // Show user-friendly error notification
        const errorFields = fieldsToValidate.filter(field => {
          const error = formState.errors[field as keyof FormValues];
          return !!error;
        });
        
        showError(
          'Validation Error', 
          `Please complete all required article details. Missing: ${errorFields.join(', ')}`
        );
        
        // Scroll to first error field
        const firstErrorField = document.querySelector('[aria-invalid="true"]');
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
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
        lr_number: data.lr_type === 'manual' ? data.manual_lr_number : lrNumber,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-colors"
              onClick={onClose}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </div>
          <div className="text-center flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Create New Booking</h1>
            <p className="text-slate-600 text-sm sm:text-base">Generate a new LR and manage shipment details</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="h-10 w-10 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {/* Enhanced Progress Steps */}
          <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 flex items-center">
                <div className={`relative h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  activeStep === 'basic' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                    : 'bg-green-500 text-white shadow-lg shadow-green-200'
                }`}>
                  {activeStep === 'basic' ? (
                    <Building2 className="h-5 w-5" />
                  ) : (
                    <CheckCircle className="h-5 w-5" />
                  )}
                </div>
                <div className={`flex-1 h-2 mx-3 rounded-full transition-all duration-500 ${
                  activeStep === 'basic' ? 'bg-slate-200' : 'bg-green-400'
                }`}></div>
              </div>
              <div className="flex-1 flex items-center">
                <div className={`relative h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  activeStep === 'details' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                    : activeStep === 'payment' 
                    ? 'bg-green-500 text-white shadow-lg shadow-green-200' 
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {activeStep === 'details' ? (
                    <Package className="h-5 w-5" />
                  ) : activeStep === 'payment' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Package className="h-5 w-5" />
                  )}
                </div>
                <div className={`flex-1 h-2 mx-3 rounded-full transition-all duration-500 ${
                  activeStep === 'payment' ? 'bg-green-400' : 'bg-slate-200'
                }`}></div>
              </div>
              <div className="flex-1 flex items-center">
                <div className={`relative h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  activeStep === 'payment' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>
            </div>
            <div className="flex justify-between text-xs sm:text-sm font-medium">
              <span className={`transition-colors ${
                activeStep === 'basic' ? 'text-blue-600' : 'text-green-600'
              }`}>Basic Information</span>
              <span className={`transition-colors ${
                activeStep === 'details' ? 'text-blue-600' : activeStep === 'payment' ? 'text-green-600' : 'text-slate-500'
              }`}>Shipment Details</span>
              <span className={`transition-colors ${
                activeStep === 'payment' ? 'text-blue-600' : 'text-slate-500'
              }`}>Payment & Review</span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="p-4 sm:p-6">
              {/* Step 1: Basic Information */}
              {activeStep === 'basic' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  {/* Branch & LR Information */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-4">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-slate-900">Branch & LR Setup</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Branch *
                        </Label>
                        <Select
                          value={watch('branch_id')}
                          onValueChange={(value) => setValue('branch_id', value)}
                        >
                          <SelectTrigger className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-colors">
                            <SelectValue placeholder="Select your branch" />
                          </SelectTrigger>
                          <SelectContent>
                            {branches.map((branch) => (
                              <SelectItem key={branch.id} value={branch.id}>
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-slate-500" />
                                  <span>{branch.name} - {branch.city}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.branch_id && (
                          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{errors.branch_id.message}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          LR Type *
                        </Label>
                        <RadioGroup
                          value={watch('lr_type')}
                          onValueChange={(value: 'system' | 'manual') => setValue('lr_type', value)}
                          className="flex gap-4 mt-3"
                        >
                          <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer">
                            <RadioGroupItem value="system" id="system" className="border-blue-500" />
                            <Label htmlFor="system" className="font-medium text-slate-700 cursor-pointer flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              System Generated
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer">
                            <RadioGroupItem value="manual" id="manual" className="border-blue-500" />
                            <Label htmlFor="manual" className="font-medium text-slate-700 cursor-pointer flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-500" />
                              Manual Entry
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  </div>
                  
                  {/* LR Number Display */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    {watchLrType === 'system' ? (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Receipt className="h-4 w-4" />
                          Generated LR Number
                        </Label>
                        <div className="relative">
                          <Input
                            value={lrNumber}
                            readOnly
                            className="bg-green-50 border-green-200 text-green-800 font-semibold text-lg h-12 pr-12"
                          />
                          <CheckCircle className="absolute right-3 top-3 h-6 w-6 text-green-600" />
                        </div>
                        <p className="text-xs text-slate-600 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          Auto-generated system LR number
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Manual LR Number *
                        </Label>
                        <Input
                          {...register('manual_lr_number')}
                          placeholder="Enter your manual LR number"
                          className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                        {errors.manual_lr_number && (
                          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{errors.manual_lr_number.message}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Route Information */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="h-5 w-5 text-emerald-600" />
                      <h3 className="text-lg font-semibold text-slate-900">Route Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                          Origin Branch *
                        </Label>
                        <Select
                          value={watch('from_branch')}
                          onValueChange={(value) => setValue('from_branch', value)}
                        >
                          <SelectTrigger className="h-11 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 bg-white">
                            <SelectValue placeholder="Select departure branch" />
                          </SelectTrigger>
                          <SelectContent>
                            {branches.map((branch) => (
                              <SelectItem key={branch.id} value={branch.id}>
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                  <span>{branch.name} - {branch.city}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.from_branch && (
                          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{errors.from_branch.message}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-red-500"></div>
                          Destination Branch *
                        </Label>
                        <Select
                          value={watch('to_branch')}
                          onValueChange={(value) => setValue('to_branch', value)}
                          disabled={!watchFromBranch}
                        >
                          <SelectTrigger className={`h-11 border-slate-200 focus:border-red-500 focus:ring-red-500/20 bg-white transition-colors ${
                            !watchFromBranch ? 'opacity-50 cursor-not-allowed' : ''
                          }`}>
                            <SelectValue placeholder={!watchFromBranch ? "Select origin first" : "Select destination branch"} />
                          </SelectTrigger>
                          <SelectContent>
                            {toBranches.map((branch) => (
                              <SelectItem key={branch.id} value={branch.id}>
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                  <span>{branch.name} - {branch.city}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.to_branch && (
                          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{errors.to_branch.message}</span>
                          </div>
                        )}
                        {!watchFromBranch && (
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            Please select origin branch first
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Customer Information */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="h-5 w-5 text-purple-600" />
                      <h3 className="text-lg font-semibold text-slate-900">Customer Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                          Sender *
                        </Label>
                        <div className="relative">
                          <Select value={watch('sender_id')} onValueChange={(value) => setValue('sender_id', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select sender" />
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
                        {errors.sender_id && (
                          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{errors.sender_id.message}</span>
                          </div>
                        )}
                        {watch('sender_id') && (() => {
                          const selectedSender = customers.find(c => c.id === watch('sender_id'));
                          return selectedSender ? (
                            <div className="text-xs text-slate-600 bg-blue-50 p-2 rounded-md">
                              <p><strong>Mobile:</strong> {selectedSender.mobile}</p>
                              {selectedSender.gst && <p><strong>GST:</strong> {selectedSender.gst}</p>}
                            </div>
                          ) : null;
                        })()}
                        <div className="flex justify-end">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            className="text-xs bg-white hover:bg-blue-50 border-blue-200 text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add New Sender
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                          Receiver *
                        </Label>
                        <div className="relative">
                          <Select value={watch('receiver_id')} onValueChange={(value) => setValue('receiver_id', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select receiver" />
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
                        {errors.receiver_id && (
                          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{errors.receiver_id.message}</span>
                          </div>
                        )}
                        {watch('receiver_id') && (() => {
                          const selectedReceiver = customers.find(c => c.id === watch('receiver_id'));
                          return selectedReceiver ? (
                            <div className="text-xs text-slate-600 bg-orange-50 p-2 rounded-md">
                              <p><strong>Mobile:</strong> {selectedReceiver.mobile}</p>
                              {selectedReceiver.gst && <p><strong>GST:</strong> {selectedReceiver.gst}</p>}
                            </div>
                          ) : null;
                        })()}
                        <div className="flex justify-end">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            className="text-xs bg-white hover:bg-orange-50 border-orange-200 text-orange-600 hover:text-orange-700 transition-colors"
                          >
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
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  {/* Article Information */}
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-2 mb-4">
                      <Package className="h-5 w-5 text-amber-600" />
                      <h3 className="text-lg font-semibold text-slate-900">Article Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Select Article *
                        </Label>
                        <div className="relative">
                          <Select value={watch('article_id')} onValueChange={handleArticleChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select article" />
                            </SelectTrigger>
                            <SelectContent>
                              {articles.map((article) => (
                                <SelectItem key={article.id} value={article.id}>
                                  {article.name} - {article.description}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {watch('article_id') && (() => {
                          const selectedArticle = articles.find(a => a.id === watch('article_id'));
                          return selectedArticle ? (
                            <div className="text-xs text-slate-600 bg-amber-50 p-3 rounded-md border border-amber-200">
                              <div className="grid grid-cols-2 gap-2">
                                <p><strong>Base Rate:</strong> ₹{selectedArticle.base_rate}</p>
                                <p><strong>HSN Code:</strong> {selectedArticle.hsn_code || 'N/A'}</p>
                                {selectedArticle.requires_special_handling && (
                                  <p className="col-span-2 text-orange-600 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    <strong>Requires Special Handling</strong>
                                  </p>
                                )}
                                {selectedArticle.is_fragile && (
                                  <p className="col-span-2 text-red-600 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    <strong>Fragile Item</strong>
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : null;
                        })()}
                        {errors.article_id && (
                          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{errors.article_id.message}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Description (Optional)
                        </Label>
                        <Input
                          {...register('description')}
                          placeholder="Additional description for the shipment..."
                          className="h-11 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Scale className="h-4 w-4" />
                          Unit of Measurement *
                        </Label>
                        <Select
                          value={watch('uom')}
                          onValueChange={(value) => setValue('uom', value)}
                        >
                          <SelectTrigger className="h-11 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20">
                            <SelectValue placeholder="Select unit type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Fixed">Fixed Rate</SelectItem>
                            <SelectItem value="KG">Kilograms (KG)</SelectItem>
                            <SelectItem value="Pieces">Pieces</SelectItem>
                            <SelectItem value="Boxes">Boxes</SelectItem>
                            <SelectItem value="Bundles">Bundles</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.uom && (
                          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{errors.uom.message}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Scale className="h-4 w-4" />
                          Actual Weight (kg)
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...register('actual_weight', { valueAsNumber: true })}
                            placeholder="0.00"
                            className="h-11 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20 pr-12"
                          />
                          <span className="absolute right-3 top-3 text-sm text-slate-500">kg</span>
                        </div>
                        {errors.actual_weight && (
                          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{errors.actual_weight.message}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Scale className="h-4 w-4" />
                          Charged Weight (kg)
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...register('charged_weight', { valueAsNumber: true })}
                            placeholder="0.00"
                            className="h-11 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20 pr-12"
                          />
                          <span className="absolute right-3 top-3 text-sm text-slate-500">kg</span>
                        </div>
                        <p className="text-xs text-slate-600 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          Used for billing (volumetric weight if applicable)
                        </p>
                        {errors.charged_weight && (
                          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{errors.charged_weight.message}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Quantity *
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          {...register('quantity', { 
                            valueAsNumber: true,
                            onChange: (e) => {
                              // Reset loading/unloading charges to 0 when quantity changes
                              // so they can be recalculated
                              const newQuantity = parseInt(e.target.value) || 0;
                              if (newQuantity > 0) {
                                setValue('loading_charges', 0);
                                setValue('unloading_charges', 0);
                              }
                            }
                          })}
                          placeholder="1"
                          className="h-11 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"
                        />
                        <p className="text-xs text-slate-600 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          Loading/unloading charges will be calculated automatically
                        </p>
                        {errors.quantity && (
                          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{errors.quantity.message}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Expected Delivery Date
                        </Label>
                        <Input
                          type="date"
                          {...register('expected_delivery_date')}
                          className="h-11 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"
                          min={new Date().toISOString().split('T')[0]}
                        />
                        <p className="text-xs text-slate-600 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          Leave empty for standard delivery timeline
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Options */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="h-5 w-5 text-indigo-600" />
                      <h3 className="text-lg font-semibold text-slate-900">Additional Options</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-orange-300 transition-colors">
                          <Checkbox
                            id="fragile"
                            checked={watch('fragile')}
                            onCheckedChange={(checked) => setValue('fragile', !!checked)}
                            className="border-orange-500"
                          />
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            <Label htmlFor="fragile" className="font-medium text-slate-700 cursor-pointer">
                              Fragile Item
                            </Label>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
                          <Checkbox
                            id="insurance_required"
                            checked={watch('insurance_required')}
                            onCheckedChange={(checked) => setValue('insurance_required', !!checked)}
                            className="border-blue-500"
                          />
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-blue-500" />
                            <Label htmlFor="insurance_required" className="font-medium text-slate-700 cursor-pointer">
                              Insurance Required
                            </Label>
                          </div>
                        </div>
                        
                        {watchInsuranceRequired && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
                          >
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <IndianRupee className="h-4 w-4" />
                                Insurance Value (₹) *
                              </Label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  {...register('insurance_value', { valueAsNumber: true })}
                                  placeholder="0.00"
                                  className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 pr-12"
                                />
                                <span className="absolute right-3 top-3 text-sm text-slate-500">₹</span>
                              </div>
                              {errors.insurance_value && (
                                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span>{errors.insurance_value.message}</span>
                                </div>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <IndianRupee className="h-4 w-4" />
                                Insurance Charge (₹)
                              </Label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  {...register('insurance_charge', { valueAsNumber: true })}
                                  placeholder="0.00"
                                  className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 pr-12"
                                />
                                <span className="absolute right-3 top-3 text-sm text-slate-500">₹</span>
                              </div>
                              {errors.insurance_charge && (
                                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span>{errors.insurance_charge.message}</span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Priority Level
                          </Label>
                          <Select
                            value={watch('priority')}
                            onValueChange={(value: 'Normal' | 'High' | 'Urgent') => setValue('priority', value)}
                          >
                            <SelectTrigger className="h-11 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20">
                              <SelectValue placeholder="Select priority level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Normal">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                  <span>Normal Priority</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="High">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                                  <span>High Priority</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="Urgent">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                  <span>Urgent Priority</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            Delivery Type
                          </Label>
                          <Select
                            value={watch('delivery_type')}
                            onValueChange={(value: 'Standard' | 'Express' | 'Same Day') => setValue('delivery_type', value)}
                          >
                            <SelectTrigger className="h-11 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20">
                              <SelectValue placeholder="Select delivery type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Standard">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-blue-500" />
                                  <span>Standard Delivery</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="Express">
                                <div className="flex items-center gap-2">
                                  <Truck className="h-4 w-4 text-orange-500" />
                                  <span>Express Delivery</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="Same Day">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-red-500" />
                                  <span>Same Day Delivery</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Special Instructions
                        </Label>
                        <Input
                          {...register('special_instructions')}
                          placeholder="Any special handling instructions for this shipment..."
                          className="h-11 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                        />
                        <p className="text-xs text-slate-600 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          These instructions will be visible to drivers and handlers
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Step 3: Payment & Review */}
              {activeStep === 'payment' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  {/* Payment Information */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                    <div className="flex items-center gap-2 mb-4">
                      <CreditCard className="h-5 w-5 text-green-600" />
                      <h3 className="text-lg font-semibold text-slate-900">Payment Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Payment Type *
                        </Label>
                        <Select
                          value={watch('payment_type')}
                          onValueChange={(value: 'Paid' | 'To Pay' | 'Quotation') => setValue('payment_type', value)}
                        >
                          <SelectTrigger className="h-11 border-slate-200 focus:border-green-500 focus:ring-green-500/20">
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Paid">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>Paid (Advance Payment)</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="To Pay">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-orange-500" />
                                <span>To Pay (COD)</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="Quotation">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-500" />
                                <span>Quotation</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.payment_type && (
                          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{errors.payment_type.message}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <IndianRupee className="h-4 w-4" />
                          Freight Per Quantity (₹) *
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            {...register('freight_per_qty', { valueAsNumber: true })}
                            placeholder="0.00"
                            className="h-11 border-slate-200 focus:border-green-500 focus:ring-green-500/20 pr-12"
                          />
                          <span className="absolute right-3 top-3 text-sm text-slate-500">₹</span>
                        </div>
                        {errors.freight_per_qty && (
                          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{errors.freight_per_qty.message}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          Loading Charges (₹)
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Auto-calculated</span>
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            {...register('loading_charges', { valueAsNumber: true })}
                            placeholder="0.00"
                            className="h-11 border-slate-200 focus:border-green-500 focus:ring-green-500/20 pr-12 bg-green-50/50"
                          />
                          <span className="absolute right-3 top-3 text-sm text-slate-500">₹</span>
                        </div>
                        <p className="text-xs text-slate-600 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          Auto-calculated based on quantity. You can modify if needed.
                        </p>
                        {errors.loading_charges && (
                          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{errors.loading_charges.message}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Unloading Charges (₹)
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Auto-calculated</span>
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            {...register('unloading_charges', { valueAsNumber: true })}
                            placeholder="0.00"
                            className="h-11 border-slate-200 focus:border-green-500 focus:ring-green-500/20 pr-12 bg-green-50/50"
                          />
                          <span className="absolute right-3 top-3 text-sm text-slate-500">₹</span>
                        </div>
                        <p className="text-xs text-slate-600 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          Auto-calculated based on quantity. You can modify if needed.
                        </p>
                        {errors.unloading_charges && (
                          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{errors.unloading_charges.message}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="md:col-span-2">
                        <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 rounded-xl border border-slate-200">
                          <div className="flex items-center gap-2 mb-4">
                            <Receipt className="h-5 w-5 text-slate-600" />
                            <h4 className="font-semibold text-slate-900">Billing Summary</h4>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                              <span className="text-slate-600 flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Freight Charges:
                              </span>
                              <span className="font-semibold text-slate-900">₹{((watchQuantity || 0) * (watchFreightPerQty || 0)).toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border-l-4 border-green-400">
                              <span className="text-slate-600 flex items-center gap-2">
                                <Truck className="h-4 w-4" />
                                Loading Charges:
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Auto</span>
                              </span>
                              <span className="font-semibold text-slate-900">₹{(watchLoadingCharges || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border-l-4 border-blue-400">
                              <span className="text-slate-600 flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Unloading Charges:
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Auto</span>
                              </span>
                              <span className="font-semibold text-slate-900">₹{(watchUnloadingCharges || 0).toFixed(2)}</span>
                            </div>
                            {watchInsuranceCharge > 0 && (
                              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                                <span className="text-slate-600 flex items-center gap-2">
                                  <Shield className="h-4 w-4" />
                                  Insurance Charges:
                                </span>
                                <span className="font-semibold text-slate-900">₹{(watchInsuranceCharge || 0).toFixed(2)}</span>
                              </div>
                            )}
                            {watchPackagingCharge > 0 && (
                              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                                <span className="text-slate-600 flex items-center gap-2">
                                  <Package className="h-4 w-4" />
                                  Packaging Charges:
                                </span>
                                <span className="font-semibold text-slate-900">₹{(watchPackagingCharge || 0).toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-300">
                            <span className="font-bold text-lg text-slate-900 flex items-center gap-2">
                              <IndianRupee className="h-5 w-5" />
                              Total Amount:
                            </span>
                            <span className="font-bold text-2xl text-green-600 bg-green-50 px-4 py-2 rounded-lg">₹{totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Invoice Information */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-100">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="h-5 w-5 text-yellow-600" />
                      <h3 className="text-lg font-semibold text-slate-900">Invoice Information</h3>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-yellow-300 transition-colors mb-4">
                      <Checkbox
                        id="has_invoice"
                        checked={watch('has_invoice')}
                        onCheckedChange={(checked) => setValue('has_invoice', !!checked)}
                        className="border-yellow-500"
                      />
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-yellow-500" />
                        <Label htmlFor="has_invoice" className="font-medium text-slate-700 cursor-pointer">
                          This shipment has an invoice
                        </Label>
                      </div>
                    </div>
                    
                    {watchHasInvoice && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-yellow-200"
                      >
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Invoice Number *
                          </Label>
                          <Input
                            {...register('invoice_number')}
                            placeholder="INV-2024-001"
                            className="h-11 border-slate-200 focus:border-yellow-500 focus:ring-yellow-500/20"
                          />
                          {errors.invoice_number && (
                            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                              <AlertTriangle className="h-4 w-4" />
                              <span>{errors.invoice_number.message}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Invoice Date *
                          </Label>
                          <Input
                            type="date"
                            {...register('invoice_date')}
                            className="h-11 border-slate-200 focus:border-yellow-500 focus:ring-yellow-500/20"
                          />
                          {errors.invoice_date && (
                            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                              <AlertTriangle className="h-4 w-4" />
                              <span>{errors.invoice_date.message}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <IndianRupee className="h-4 w-4" />
                            Invoice Amount (₹) *
                          </Label>
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...register('invoice_amount', { valueAsNumber: true })}
                              placeholder="0.00"
                              className="h-11 border-slate-200 focus:border-yellow-500 focus:ring-yellow-500/20 pr-12"
                            />
                            <span className="absolute right-3 top-3 text-sm text-slate-500">₹</span>
                          </div>
                          {errors.invoice_amount && (
                            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                              <AlertTriangle className="h-4 w-4" />
                              <span>{errors.invoice_amount.message}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            E-Way Bill Number
                          </Label>
                          <Input
                            {...register('eway_bill_number')}
                            placeholder="EWB-123456789012"
                            className="h-11 border-slate-200 focus:border-yellow-500 focus:ring-yellow-500/20"
                          />
                          <p className="text-xs text-slate-600 flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            Required for goods worth more than ₹50,000
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Additional Information */}
                  <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-4">
                      <Info className="h-5 w-5 text-slate-600" />
                      <h3 className="text-lg font-semibold text-slate-900">Additional Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Private Mark Number
                        </Label>
                        <Input
                          {...register('private_mark_number')}
                          placeholder="PM-2024-001"
                          className="h-11 border-slate-200 focus:border-slate-500 focus:ring-slate-500/20"
                        />
                        <p className="text-xs text-slate-600 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          Internal tracking number for your records
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Reference Number
                        </Label>
                        <Input
                          {...register('reference_number')}
                          placeholder="REF-2024-001"
                          className="h-11 border-slate-200 focus:border-slate-500 focus:ring-slate-500/20"
                        />
                        <p className="text-xs text-slate-600 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          Customer's reference for this shipment
                        </p>
                      </div>
                      
                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Remarks
                        </Label>
                        <Input
                          {...register('remarks')}
                          placeholder="Any additional remarks or notes for this booking..."
                          className="h-11 border-slate-200 focus:border-slate-500 focus:ring-slate-500/20"
                        />
                        <p className="text-xs text-slate-600 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          These remarks will appear on the LR document
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            
            <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-50 to-blue-50 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between">
                {activeStep !== 'basic' ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={(e) => {
                      e.preventDefault();
                      goToPrevStep();
                    }}
                    className="bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Previous Step</span>
                    <span className="sm:hidden">Previous</span>
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="lg"
                    onClick={onClose}
                    className="bg-white hover:bg-red-50 border-slate-300 text-slate-700 hover:text-red-600 transition-colors"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
                
                {/* Quick Summary for Current Step */}
                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                  {activeStep === 'basic' && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`h-4 w-4 ${watch('sender_id') && watch('receiver_id') ? 'text-green-500' : 'text-slate-300'}`} />
                      <span>Customers: {watch('sender_id') && watch('receiver_id') ? 'Selected' : 'Pending'}</span>
                    </div>
                  )}
                  {activeStep === 'details' && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`h-4 w-4 ${watch('article_id') && watch('quantity') ? 'text-green-500' : 'text-slate-300'}`} />
                      <span>Article: {watch('article_id') ? 'Selected' : 'Pending'}</span>
                      <span className="mx-2">•</span>
                      <span>Qty: {watch('quantity') || 0}</span>
                    </div>
                  )}
                  {activeStep === 'payment' && (
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-green-600" />
                      <span>Total: ₹{totalAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                
                {activeStep !== 'payment' ? (
                  <Button
                    type="button"
                    size="lg"
                    onClick={(e) => {
                      e.preventDefault();
                      goToNextStep();
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <span className="hidden sm:inline">Continue to Next Step</span>
                    <span className="sm:hidden">Next</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    size="lg"
                    disabled={submitting || !isValid}
                    className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="hidden sm:inline">Creating Booking...</span>
                        <span className="sm:hidden">Creating...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Create Booking</span>
                        <span className="sm:hidden">Create</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              {/* Enhanced Progress indicator */}
              <div 
                className="mt-4 flex flex-col items-center gap-2"
                role="progressbar"
                aria-valuenow={activeStep === 'basic' ? 1 : activeStep === 'details' ? 2 : 3}
                aria-valuemin={1}
                aria-valuemax={3}
                aria-label="Form completion progress"
              >
                <div 
                  className="text-xs text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200"
                  aria-live="polite"
                >
                  Step {activeStep === 'basic' ? '1' : activeStep === 'details' ? '2' : '3'} of 3
                </div>
                {/* Quick validation summary */}
                <div className="flex items-center gap-4 text-xs">
                  <div className={`flex items-center gap-1 ${watch('sender_id') && watch('receiver_id') && watch('from_branch') && watch('to_branch') ? 'text-green-600' : 'text-slate-400'}`}>
                    <CheckCircle className="h-3 w-3" />
                    <span>Route & Customers</span>
                  </div>
                  <div className={`flex items-center gap-1 ${watch('article_id') && watch('quantity') ? 'text-green-600' : 'text-slate-400'}`}>
                    <CheckCircle className="h-3 w-3" />
                    <span>Article Details</span>
                  </div>
                  <div className={`flex items-center gap-1 ${totalAmount > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                    <CheckCircle className="h-3 w-3" />
                    <span>Payment Info</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}