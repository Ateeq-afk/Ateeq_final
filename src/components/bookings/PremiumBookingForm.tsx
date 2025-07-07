import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { 
  Package, 
  Users, 
  MapPin, 
  Calendar,
  FileText,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Truck,
  Shield,
  Clock,
  Info,
  Building2,
  Phone,
  Mail,
  IndianRupee,
  Weight,
  Box
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useBranches } from '@/hooks/useBranches';
import { useCustomers } from '@/hooks/useCustomers';
import { bookingService } from '@/services/bookings';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import { useAuth } from '@/contexts/AuthContext';
import BookingArticleManager, { BookingArticle } from './BookingArticleManager';

// Form validation schema
const bookingFormSchema = z.object({
  // Step 1: Shipment Details
  from_branch: z.string().min(1, 'Origin branch is required'),
  to_branch: z.string().min(1, 'Destination branch is required'),
  delivery_type: z.enum(['Standard', 'Express', 'Same Day']),
  priority: z.enum(['Normal', 'High', 'Urgent']),
  expected_delivery_date: z.string().optional(),
  
  // Step 2: Customer Details
  sender_id: z.string().min(1, 'Sender is required'),
  receiver_id: z.string().min(1, 'Receiver is required'),
  
  // Step 3: Articles (handled separately)
  
  // Step 4: Additional Info
  reference_number: z.string().optional(),
  remarks: z.string().optional(),
  has_invoice: z.boolean().default(false),
  invoice_number: z.string().optional(),
  invoice_date: z.string().optional(),
  invoice_amount: z.number().optional(),
  eway_bill_number: z.string().optional(),
  
  // Step 5: Payment
  payment_type: z.enum(['Cash', 'Credit', 'To Pay', 'FOD']),
  lr_type: z.enum(['manual', 'system']).default('system'),
  manual_lr_number: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

const steps = [
  { id: 1, title: 'Route & Delivery', icon: Truck, description: 'Select origin and destination' },
  { id: 2, title: 'Customer Details', icon: Users, description: 'Sender and receiver information' },
  { id: 3, title: 'Articles & Pricing', icon: Package, description: 'Add items and calculate charges' },
  { id: 4, title: 'Additional Info', icon: FileText, description: 'Invoice and reference details' },
  { id: 5, title: 'Payment & Review', icon: CreditCard, description: 'Payment method and summary' },
];

export default function PremiumBookingForm() {
  const navigate = useNavigate();
  const { selectedBranch } = useBranchSelection();
  const { user } = useAuth();
  const { branches } = useBranches();
  const { customers } = useCustomers();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingArticles, setBookingArticles] = useState<BookingArticle[]>([]);
  
  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      from_branch: selectedBranch?.id || '',
      delivery_type: 'Standard',
      priority: 'Normal',
      payment_type: 'Cash',
      lr_type: 'system',
      has_invoice: false,
    },
  });

  // Auto-select branch for non-admin users
  useEffect(() => {
    if (user?.role !== 'admin' && selectedBranch) {
      form.setValue('from_branch', selectedBranch.id);
    }
  }, [user, selectedBranch, form]);

  // Calculate delivery estimates
  const getDeliveryEstimate = (type: string) => {
    const today = new Date();
    switch (type) {
      case 'Same Day':
        return today.toISOString().split('T')[0];
      case 'Express':
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
      case 'Standard':
      default:
        const threeDays = new Date(today);
        threeDays.setDate(threeDays.getDate() + 3);
        return threeDays.toISOString().split('T')[0];
    }
  };

  // Handle step navigation
  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return form.getValues('from_branch') && form.getValues('to_branch') && 
               form.getValues('from_branch') !== form.getValues('to_branch');
      case 2:
        return form.getValues('sender_id') && form.getValues('receiver_id');
      case 3:
        return bookingArticles.length > 0 && bookingArticles.every(a => a.article_id && a.quantity > 0);
      case 4:
        return true; // Additional info is optional
      case 5:
        return form.getValues('payment_type') && 
               (form.getValues('lr_type') === 'system' || form.getValues('manual_lr_number'));
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceedToNext() && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else if (!canProceedToNext()) {
      toast.error('Please complete all required fields');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    const freight = bookingArticles.reduce((sum, article) => {
      const freightAmount = article.rate_type === 'per_kg' 
        ? (article.charged_weight || article.actual_weight) * article.rate_per_unit
        : article.quantity * article.rate_per_unit;
      return sum + freightAmount;
    }, 0);

    const loading = bookingArticles.reduce((sum, article) => 
      sum + (article.quantity * article.loading_charge_per_unit), 0);
    
    const unloading = bookingArticles.reduce((sum, article) => 
      sum + (article.quantity * article.unloading_charge_per_unit), 0);
    
    const insurance = bookingArticles.reduce((sum, article) => 
      sum + (article.insurance_charge || 0), 0);
    
    const packaging = bookingArticles.reduce((sum, article) => 
      sum + (article.packaging_charge || 0), 0);

    return {
      freight,
      loading,
      unloading,
      insurance,
      packaging,
      total: freight + loading + unloading + insurance + packaging
    };
  };

  // Submit handler
  const onSubmit = async (data: BookingFormData) => {
    if (!canProceedToNext()) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare articles with calculated fields
      const articlesWithCalculations = bookingArticles.map(article => {
        const freight_amount = article.rate_type === 'per_kg' 
          ? (article.charged_weight || article.actual_weight) * article.rate_per_unit
          : article.quantity * article.rate_per_unit;
        
        const total_loading_charges = article.quantity * article.loading_charge_per_unit;
        const total_unloading_charges = article.quantity * article.unloading_charge_per_unit;
        const total_amount = freight_amount + total_loading_charges + total_unloading_charges + 
                           (article.insurance_charge || 0) + (article.packaging_charge || 0);
        
        return {
          ...article,
          freight_amount,
          total_loading_charges,
          total_unloading_charges,
          total_amount
        };
      });

      const bookingData = {
        ...data,
        articles: articlesWithCalculations,
        branch_id: user?.role === 'admin' ? data.from_branch : selectedBranch?.id,
      };

      const response = await bookingService.create(bookingData);
      
      toast.success(`Booking created successfully! LR: ${response.lr_number}`, {
        duration: 5000,
        action: {
          label: 'View',
          onClick: () => navigate(`/dashboard/bookings/${response.id}`),
        },
      });
      
      navigate('/dashboard/bookings');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create booking');
      console.error('Booking creation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get selected customer details
  const getSenderDetails = () => customers.find(c => c.id === form.watch('sender_id'));
  const getReceiverDetails = () => customers.find(c => c.id === form.watch('receiver_id'));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/dashboard/bookings')} className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Bookings
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Booking</h1>
              <p className="text-gray-600 mt-1">Complete all steps to create a shipment booking</p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Building2 className="h-4 w-4 mr-2" />
              {selectedBranch?.name || 'Select Branch'}
            </Badge>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isActive ? 1.1 : 1,
                        backgroundColor: isActive ? '#3b82f6' : isCompleted ? '#10b981' : '#e5e7eb',
                      }}
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                        isActive && "ring-4 ring-blue-100",
                        isCompleted && "ring-2 ring-green-100"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      ) : (
                        <Icon className={cn(
                          "h-6 w-6",
                          isActive ? "text-white" : "text-gray-400"
                        )} />
                      )}
                    </motion.div>
                    <div className="mt-2 text-center">
                      <p className={cn(
                        "text-sm font-medium",
                        isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-500"
                      )}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 max-w-[120px]">{step.description}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-[2px] bg-gray-200 mx-4 relative">
                      <motion.div
                        initial={false}
                        animate={{
                          width: currentStep > step.id ? '100%' : '0%',
                        }}
                        transition={{ duration: 0.5 }}
                        className="absolute top-0 left-0 h-full bg-green-500"
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Route & Delivery */}
              {currentStep === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-blue-600" />
                      Route & Delivery Options
                    </CardTitle>
                    <CardDescription>
                      Select the origin and destination branches for this shipment
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="from_branch">
                          Origin Branch <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={form.watch('from_branch')}
                          onValueChange={(value) => form.setValue('from_branch', value)}
                          disabled={user?.role !== 'admin'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select origin branch" />
                          </SelectTrigger>
                          <SelectContent>
                            {branches.map((branch) => (
                              <SelectItem key={branch.id} value={branch.id}>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  {branch.name} - {branch.city}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="to_branch">
                          Destination Branch <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={form.watch('to_branch')}
                          onValueChange={(value) => form.setValue('to_branch', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select destination branch" />
                          </SelectTrigger>
                          <SelectContent>
                            {branches.filter(b => b.id !== form.watch('from_branch')).map((branch) => (
                              <SelectItem key={branch.id} value={branch.id}>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  {branch.name} - {branch.city}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <Label>Delivery Type</Label>
                      <RadioGroup
                        value={form.watch('delivery_type')}
                        onValueChange={(value) => {
                          form.setValue('delivery_type', value as any);
                          form.setValue('expected_delivery_date', getDeliveryEstimate(value));
                        }}
                      >
                        <div className="grid md:grid-cols-3 gap-4">
                          {[
                            { value: 'Standard', label: 'Standard', time: '3-5 days', icon: Truck },
                            { value: 'Express', label: 'Express', time: '1-2 days', icon: Clock },
                            { value: 'Same Day', label: 'Same Day', time: 'Today', icon: Shield }
                          ].map((option) => {
                            const Icon = option.icon;
                            return (
                              <label
                                key={option.value}
                                className={cn(
                                  "relative flex cursor-pointer rounded-lg border p-4 hover:bg-gray-50 transition-colors",
                                  form.watch('delivery_type') === option.value && "border-blue-600 bg-blue-50"
                                )}
                              >
                                <RadioGroupItem value={option.value} className="sr-only" />
                                <div className="flex items-center gap-3">
                                  <Icon className="h-5 w-5 text-gray-600" />
                                  <div>
                                    <p className="font-medium">{option.label}</p>
                                    <p className="text-sm text-gray-500">{option.time}</p>
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Priority Level</Label>
                        <Select
                          value={form.watch('priority')}
                          onValueChange={(value) => form.setValue('priority', value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Normal">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-gray-400" />
                                Normal Priority
                              </div>
                            </SelectItem>
                            <SelectItem value="High">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-orange-400" />
                                High Priority
                              </div>
                            </SelectItem>
                            <SelectItem value="Urgent">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-400" />
                                Urgent Priority
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Expected Delivery Date</Label>
                        <Input
                          type="date"
                          {...form.register('expected_delivery_date')}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Customer Details */}
              {currentStep === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Customer Details
                    </CardTitle>
                    <CardDescription>
                      Select or add sender and receiver information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Sender Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">Sender Details</h3>
                          <Badge variant="outline">From</Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Select Sender <span className="text-red-500">*</span></Label>
                          <Select
                            value={form.watch('sender_id')}
                            onValueChange={(value) => form.setValue('sender_id', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a sender" />
                            </SelectTrigger>
                            <SelectContent>
                              <div className="p-2">
                                <Input placeholder="Search customers..." className="mb-2" />
                              </div>
                              {customers.map((customer) => (
                                <SelectItem key={customer.id} value={customer.id}>
                                  <div className="flex items-center justify-between w-full">
                                    <div>
                                      <p className="font-medium">{customer.name}</p>
                                      <p className="text-sm text-gray-500">{customer.email}</p>
                                    </div>
                                    <Badge variant="secondary" className="ml-2">
                                      {customer.customer_type}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {getSenderDetails() && (
                          <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">{getSenderDetails()?.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-3 w-3" />
                              {getSenderDetails()?.phone}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="h-3 w-3" />
                              {getSenderDetails()?.email}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-3 w-3" />
                              {getSenderDetails()?.address}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Receiver Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">Receiver Details</h3>
                          <Badge variant="outline">To</Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Select Receiver <span className="text-red-500">*</span></Label>
                          <Select
                            value={form.watch('receiver_id')}
                            onValueChange={(value) => form.setValue('receiver_id', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a receiver" />
                            </SelectTrigger>
                            <SelectContent>
                              <div className="p-2">
                                <Input placeholder="Search customers..." className="mb-2" />
                              </div>
                              {customers.map((customer) => (
                                <SelectItem key={customer.id} value={customer.id}>
                                  <div className="flex items-center justify-between w-full">
                                    <div>
                                      <p className="font-medium">{customer.name}</p>
                                      <p className="text-sm text-gray-500">{customer.email}</p>
                                    </div>
                                    <Badge variant="secondary" className="ml-2">
                                      {customer.customer_type}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {getReceiverDetails() && (
                          <div className="p-4 bg-green-50 rounded-lg space-y-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-green-600" />
                              <span className="font-medium">{getReceiverDetails()?.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-3 w-3" />
                              {getReceiverDetails()?.phone}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="h-3 w-3" />
                              {getReceiverDetails()?.email}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-3 w-3" />
                              {getReceiverDetails()?.address}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Articles & Pricing */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <BookingArticleManager
                    articles={bookingArticles}
                    onArticlesChange={setBookingArticles}
                    selectedCustomerId={form.watch('sender_id')}
                  />
                  
                  {bookingArticles.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <IndianRupee className="h-5 w-5 text-green-600" />
                          Pricing Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {(() => {
                            const totals = calculateTotals();
                            return (
                              <>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Freight Charges</span>
                                  <span className="font-medium">₹{totals.freight.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Loading Charges</span>
                                  <span className="font-medium">₹{totals.loading.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Unloading Charges</span>
                                  <span className="font-medium">₹{totals.unloading.toFixed(2)}</span>
                                </div>
                                {totals.insurance > 0 && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Insurance</span>
                                    <span className="font-medium">₹{totals.insurance.toFixed(2)}</span>
                                  </div>
                                )}
                                {totals.packaging > 0 && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Packaging</span>
                                    <span className="font-medium">₹{totals.packaging.toFixed(2)}</span>
                                  </div>
                                )}
                                <Separator />
                                <div className="flex justify-between text-lg font-bold">
                                  <span>Total Amount</span>
                                  <span className="text-green-600">₹{totals.total.toFixed(2)}</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Step 4: Additional Information */}
              {currentStep === 4 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Additional Information
                    </CardTitle>
                    <CardDescription>
                      Add invoice details and other references (optional)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Reference Number</Label>
                        <Input
                          {...form.register('reference_number')}
                          placeholder="Enter reference number"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>E-Way Bill Number</Label>
                        <Input
                          {...form.register('eway_bill_number')}
                          placeholder="Enter e-way bill number"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="has_invoice"
                          checked={form.watch('has_invoice')}
                          onCheckedChange={(checked) => form.setValue('has_invoice', !!checked)}
                        />
                        <Label htmlFor="has_invoice" className="cursor-pointer">
                          This shipment has an invoice
                        </Label>
                      </div>

                      {form.watch('has_invoice') && (
                        <div className="grid md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                          <div className="space-y-2">
                            <Label>Invoice Number</Label>
                            <Input
                              {...form.register('invoice_number')}
                              placeholder="INV-001"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Invoice Date</Label>
                            <Input
                              type="date"
                              {...form.register('invoice_date')}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Invoice Amount</Label>
                            <Input
                              type="number"
                              {...form.register('invoice_amount', { valueAsNumber: true })}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Remarks / Special Instructions</Label>
                      <Textarea
                        {...form.register('remarks')}
                        placeholder="Add any special instructions or remarks..."
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 5: Payment & Review */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  {/* Payment Options */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        Payment Options
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Payment Type</Label>
                        <RadioGroup
                          value={form.watch('payment_type')}
                          onValueChange={(value) => form.setValue('payment_type', value as any)}
                        >
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                              { value: 'Cash', label: 'Cash', description: 'Pay on pickup' },
                              { value: 'Credit', label: 'Credit', description: 'Bill later' },
                              { value: 'To Pay', label: 'To Pay', description: 'Pay on delivery' },
                              { value: 'FOD', label: 'FOD', description: 'Freight on delivery' }
                            ].map((option) => (
                              <label
                                key={option.value}
                                className={cn(
                                  "relative flex cursor-pointer rounded-lg border p-4 hover:bg-gray-50",
                                  form.watch('payment_type') === option.value && "border-blue-600 bg-blue-50"
                                )}
                              >
                                <RadioGroupItem value={option.value} className="sr-only" />
                                <div className="text-center w-full">
                                  <p className="font-medium">{option.label}</p>
                                  <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </RadioGroup>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <Label>LR Number Type</Label>
                        <RadioGroup
                          value={form.watch('lr_type')}
                          onValueChange={(value) => form.setValue('lr_type', value as any)}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="system" id="system" />
                              <Label htmlFor="system" className="cursor-pointer">
                                System Generated (Recommended)
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="manual" id="manual" />
                              <Label htmlFor="manual" className="cursor-pointer">
                                Manual LR Number
                              </Label>
                            </div>
                          </div>
                        </RadioGroup>

                        {form.watch('lr_type') === 'manual' && (
                          <div className="space-y-2">
                            <Label>Manual LR Number <span className="text-red-500">*</span></Label>
                            <Input
                              {...form.register('manual_lr_number')}
                              placeholder="Enter LR number"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Booking Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Booking Summary
                      </CardTitle>
                      <CardDescription>
                        Review all details before creating the booking
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Route Summary */}
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Route Details
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-600">From</p>
                            <p className="font-medium">
                              {branches.find(b => b.id === form.watch('from_branch'))?.name}
                            </p>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg">
                            <p className="text-sm text-gray-600">To</p>
                            <p className="font-medium">
                              {branches.find(b => b.id === form.watch('to_branch'))?.name}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-sm">
                          <Badge>{form.watch('delivery_type')}</Badge>
                          <Badge variant="outline">{form.watch('priority')} Priority</Badge>
                          {form.watch('expected_delivery_date') && (
                            <span className="text-gray-600">
                              Expected: {new Date(form.watch('expected_delivery_date')).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <Separator />

                      {/* Customer Summary */}
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Customer Details
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">Sender</p>
                            <p className="font-medium">{getSenderDetails()?.name}</p>
                            <p className="text-sm text-gray-500">{getSenderDetails()?.phone}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">Receiver</p>
                            <p className="font-medium">{getReceiverDetails()?.name}</p>
                            <p className="text-sm text-gray-500">{getReceiverDetails()?.phone}</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Articles Summary */}
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Articles Summary
                        </h4>
                        <div className="space-y-2">
                          {bookingArticles.map((article, index) => (
                            <div key={article.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Badge variant="secondary">{index + 1}</Badge>
                                <div>
                                  <p className="font-medium">{article.description || 'Article'}</p>
                                  <p className="text-sm text-gray-500">
                                    {article.quantity} {article.unit_of_measure} • {article.actual_weight} kg
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">₹{article.total_amount?.toFixed(2) || '0.00'}</p>
                                <p className="text-sm text-gray-500">{article.rate_type}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Final Total */}
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-medium">Total Amount</p>
                            <p className="text-sm text-gray-600">
                              {bookingArticles.length} article{bookingArticles.length !== 1 ? 's' : ''} • 
                              Payment: {form.watch('payment_type')}
                            </p>
                          </div>
                          <p className="text-3xl font-bold text-green-600">
                            ₹{calculateTotals().total.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Warnings */}
                      {form.watch('payment_type') === 'Credit' && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Credit payment selected. Ensure customer has sufficient credit limit.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                Step {currentStep} of {steps.length}
              </span>
            </div>

            {currentStep < steps.length ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={!canProceedToNext()}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!canProceedToNext() || isSubmitting}
                className="min-w-[150px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Create Booking
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}