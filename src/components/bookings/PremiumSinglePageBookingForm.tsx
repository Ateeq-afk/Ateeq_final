import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  ChevronLeft,
  Loader2,
  Truck,
  Shield,
  Clock,
  Building2,
  Phone,
  Mail,
  IndianRupee,
  Save,
  Send,
  ArrowRight,
  Info
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
import { cn } from '@/lib/utils';
import { useBranches } from '@/hooks/useBranches';
import { useCustomers } from '@/hooks/useCustomers';
import { useArticles } from '@/hooks/useArticles';
import { bookingService } from '@/services/bookings';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import { useAuth } from '@/contexts/AuthContext';
import PremiumBookingArticleManager, { BookingArticle } from './PremiumBookingArticleManager';

// Form validation schema
const bookingFormSchema = z.object({
  from_branch: z.string().min(1, 'Origin branch is required'),
  to_branch: z.string().min(1, 'Destination branch is required'),
  delivery_type: z.enum(['Standard', 'Express', 'Same Day']),
  priority: z.enum(['Normal', 'High', 'Urgent']),
  expected_delivery_date: z.string().optional(),
  sender_id: z.string().min(1, 'Sender is required'),
  receiver_id: z.string().min(1, 'Receiver is required'),
  reference_number: z.string().optional(),
  remarks: z.string().optional(),
  has_invoice: z.boolean().default(false),
  invoice_number: z.string().optional(),
  invoice_date: z.string().optional(),
  invoice_amount: z.number().optional(),
  eway_bill_number: z.string().optional(),
  payment_type: z.enum(['Paid', 'To Pay', 'Quotation']),
  lr_type: z.enum(['manual', 'system']).default('system'),
  manual_lr_number: z.string().optional(),
}).refine(data => {
  // If lr_type is manual, manual_lr_number is required
  if (data.lr_type === 'manual' && !data.manual_lr_number) {
    return false;
  }
  return true;
}, {
  message: 'Manual LR number is required when lr_type is manual',
  path: ['manual_lr_number']
}).refine(data => {
  // Validate from_branch and to_branch are different
  if (data.from_branch && data.to_branch && data.from_branch === data.to_branch) {
    return false;
  }
  return true;
}, {
  message: 'Origin and destination branches cannot be the same',
  path: ['to_branch']
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

export default function PremiumSinglePageBookingForm() {
  const navigate = useNavigate();
  const { selectedBranch } = useBranchSelection();
  const { user } = useAuth();
  const { branches } = useBranches();
  const { customers } = useCustomers();
  const { articles: availableArticles } = useArticles();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingArticles, setBookingArticles] = useState<BookingArticle[]>([]);
  
  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      delivery_type: 'Standard',
      priority: 'Normal',
      payment_type: 'Paid',
      lr_type: 'system',
      has_invoice: false,
    },
  });

  // Auto-select branch and set proper defaults
  useEffect(() => {
    
    // Auto-select branch based on role
    if (selectedBranch) {
      if (user?.role !== 'admin') {
        // Non-admin users: auto-select their assigned branch
        form.setValue('from_branch', selectedBranch.id);
      } else if (user?.role === 'admin' && branches?.length === 1) {
        // Admin with only one branch: auto-select it
        form.setValue('from_branch', selectedBranch.id);
      } else if (user?.role === 'admin' && selectedBranch) {
        // Admin with selected branch: use it as default
        form.setValue('from_branch', selectedBranch.id);
      }
    }
    
    // Set default delivery date
    const today = new Date();
    const threeDays = new Date(today);
    threeDays.setDate(threeDays.getDate() + 3);
    form.setValue('expected_delivery_date', threeDays.toISOString().split('T')[0]);
  }, [selectedBranch, user, branches, form]);

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

  // Form validation
  const isFormValid = () => {
    const formData = form.getValues();
    
    // Branch validation
    const hasValidBranches = formData.from_branch && formData.to_branch && 
                           formData.from_branch !== formData.to_branch;
    
    // Customer validation
    const hasValidCustomers = formData.sender_id && formData.receiver_id;
    
    // Articles validation
    const hasValidArticles = bookingArticles.length > 0 && 
                           bookingArticles.every(a => 
                             (a.article_id || a.description) && // Either article_id or description required
                             a.quantity > 0 && 
                             a.actual_weight > 0 && 
                             a.rate_per_unit >= 0
                           );
    
    // Payment validation
    const hasValidPayment = formData.payment_type && 
                          (formData.lr_type === 'system' || 
                           (formData.lr_type === 'manual' && formData.manual_lr_number));
    
    // Invoice validation (if has_invoice is true)
    const hasValidInvoice = !formData.has_invoice || 
                          (formData.has_invoice && formData.invoice_number);
    
    
    return hasValidBranches && hasValidCustomers && hasValidArticles && hasValidPayment && hasValidInvoice;
  };

  // Submit handler
  const onSubmit = async (data: BookingFormData) => {
    if (!isFormValid()) {
      toast.error('Please complete all required fields');
      return;
    }

    if (bookingArticles.length === 0) {
      toast.error('Please add at least one article');
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare articles with calculated fields and proper backend format
      const articlesWithCalculations = bookingArticles.map(article => {
        const freight_amount = article.rate_type === 'per_kg' 
          ? (article.charged_weight || article.actual_weight) * article.rate_per_unit
          : article.quantity * article.rate_per_unit;
        
        const total_loading_charges = article.quantity * article.loading_charge_per_unit;
        const total_unloading_charges = article.quantity * article.unloading_charge_per_unit;
        const total_amount = freight_amount + total_loading_charges + total_unloading_charges + 
                           (article.insurance_charge || 0) + (article.packaging_charge || 0);
        
        // Get the article details for proper description
        const selectedArticle = availableArticles?.find(a => a.id === article.article_id);
        const articleDescription = article.description || selectedArticle?.description || selectedArticle?.name || `Article ${article.article_id}`;
        
        // Prepare article for backend (ensure description is provided)
        return {
          article_id: article.article_id || undefined, // Make optional for backend
          description: articleDescription, // Required by backend
          private_mark_number: article.private_mark_number,
          quantity: article.quantity,
          unit_of_measure: article.unit_of_measure,
          actual_weight: article.actual_weight,
          charged_weight: article.charged_weight || article.actual_weight,
          declared_value: article.declared_value || 0,
          rate_per_unit: article.rate_per_unit,
          rate_type: article.rate_type,
          freight_amount,
          loading_charge_per_unit: article.loading_charge_per_unit,
          unloading_charge_per_unit: article.unloading_charge_per_unit,
          insurance_required: article.insurance_required,
          insurance_value: article.insurance_value,
          insurance_charge: article.insurance_charge || 0,
          packaging_charge: article.packaging_charge || 0,
          is_fragile: article.is_fragile,
          special_instructions: article.special_instructions,
        };
      });

      const bookingData = {
        ...data,
        articles: articlesWithCalculations,
        branch_id: selectedBranch?.id,
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

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button variant="ghost" onClick={() => navigate('/dashboard/bookings')} className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Bookings
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Create New Booking
              </h1>
              <p className="text-gray-600 mt-2">Complete the form below to create a new shipment booking</p>
            </div>
            <div className="text-right space-y-3">
              {/* Branch Selection */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <Label className="text-sm text-gray-600">Branch</Label>
                  <Select
                    value={form.watch('from_branch')}
                    onValueChange={(value) => form.setValue('from_branch', value)}
                  >
                    <SelectTrigger className="w-64 h-12 bg-white/80 backdrop-blur border-gray-200">
                      <SelectValue placeholder="Select Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {branch.name} - {branch.city}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* System LR Preview */}
                <div className="text-right">
                  <Label className="text-sm text-gray-600">System LR</Label>
                  <div className="h-12 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-lg flex items-center">
                    <span className="text-green-800 font-mono text-sm">
                      {form.watch('lr_type') === 'system' 
                        ? `LR${Date.now().toString().slice(-6)}${form.watch('from_branch')?.slice(0,2).toUpperCase() || 'XX'}`
                        : 'Manual LR'
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Total Amount */}
              {totals.total > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                  <div className="text-sm text-green-700">Total Amount</div>
                  <div className="text-3xl font-bold text-green-600">₹{totals.total.toFixed(2)}</div>
                  <div className="text-xs text-green-600 mt-1">
                    {bookingArticles.length} article{bookingArticles.length !== 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Route & Customer Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Route & Delivery */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-blue-600" />
                      Route & Delivery Options
                    </CardTitle>
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
                          disabled={user?.role !== 'admin' && branches?.length <= 1}
                        >
                          <SelectTrigger className="h-12">
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
                        {user?.role !== 'admin' && branches?.length <= 1 && (
                          <p className="text-xs text-gray-500">Auto-selected based on your branch</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="to_branch">
                          Destination Branch <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={form.watch('to_branch')}
                          onValueChange={(value) => form.setValue('to_branch', value)}
                        >
                          <SelectTrigger className="h-12">
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

                    {form.watch('from_branch') === form.watch('to_branch') && form.watch('to_branch') && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Origin and destination branches cannot be the same
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Priority Level</Label>
                        <Select
                          value={form.watch('priority')}
                          onValueChange={(value) => form.setValue('priority', value as any)}
                        >
                          <SelectTrigger className="h-12">
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
                          className="h-12"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Customer Details */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Customer Details
                    </CardTitle>
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
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Choose a sender" />
                            </SelectTrigger>
                            <SelectContent>
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
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Choose a receiver" />
                            </SelectTrigger>
                            <SelectContent>
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
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Articles & Pricing */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <PremiumBookingArticleManager
                  articles={bookingArticles}
                  onArticlesChange={setBookingArticles}
                  selectedCustomerId={form.watch('sender_id')}
                />
              </motion.div>
            </div>

            {/* Right Column - Additional Info & Summary */}
            <div className="space-y-8">
              {/* Payment Options */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      Payment Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Label>Payment Type <span className="text-red-500">*</span></Label>
                      <RadioGroup
                        value={form.watch('payment_type')}
                        onValueChange={(value) => form.setValue('payment_type', value as any)}
                      >
                        <div className="grid grid-cols-1 gap-3">
                          {[
                            { 
                              value: 'Paid', 
                              label: 'Paid', 
                              description: 'Payment completed upfront',
                              icon: CheckCircle2,
                              gradient: 'from-green-500 to-emerald-600',
                              bgGradient: 'from-green-50 to-emerald-50',
                              borderColor: 'border-green-200',
                              textColor: 'text-green-700'
                            },
                            { 
                              value: 'To Pay', 
                              label: 'To Pay', 
                              description: 'Pay on delivery (COD)',
                              icon: Truck,
                              gradient: 'from-orange-500 to-amber-600',
                              bgGradient: 'from-orange-50 to-amber-50',
                              borderColor: 'border-orange-200',
                              textColor: 'text-orange-700'
                            },
                            { 
                              value: 'Quotation', 
                              label: 'Quotation', 
                              description: 'Quote only - no confirmed booking',
                              icon: FileText,
                              gradient: 'from-blue-500 to-indigo-600',
                              bgGradient: 'from-blue-50 to-indigo-50',
                              borderColor: 'border-blue-200',
                              textColor: 'text-blue-700'
                            }
                          ].map((option) => {
                            const Icon = option.icon;
                            const isSelected = form.watch('payment_type') === option.value;
                            return (
                              <label
                                key={option.value}
                                className={cn(
                                  "relative flex cursor-pointer rounded-xl p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg",
                                  isSelected 
                                    ? `bg-gradient-to-r ${option.bgGradient} border-2 ${option.borderColor} shadow-lg` 
                                    : "bg-white border-2 border-gray-200 hover:border-gray-300"
                                )}
                              >
                                <RadioGroupItem value={option.value} className="sr-only" />
                                <div className="flex items-center gap-4 w-full">
                                  <div className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center",
                                    isSelected 
                                      ? `bg-gradient-to-r ${option.gradient} text-white shadow-lg`
                                      : "bg-gray-100 text-gray-400"
                                  )}>
                                    <Icon className="h-6 w-6" />
                                  </div>
                                  <div className="flex-1">
                                    <p className={cn(
                                      "font-semibold text-lg",
                                      isSelected ? option.textColor : "text-gray-700"
                                    )}>
                                      {option.label}
                                    </p>
                                    <p className={cn(
                                      "text-sm mt-1",
                                      isSelected ? option.textColor.replace('700', '600') : "text-gray-500"
                                    )}>
                                      {option.description}
                                    </p>
                                  </div>
                                  {isSelected && (
                                    <div className={cn(
                                      "w-6 h-6 rounded-full bg-gradient-to-r",
                                      option.gradient,
                                      "flex items-center justify-center shadow-lg"
                                    )}>
                                      <CheckCircle2 className="h-4 w-4 text-white" />
                                    </div>
                                  )}
                                </div>
                              </label>
                            );
                          })}
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
                            <Label htmlFor="system" className="cursor-pointer text-sm">
                              System Generated (Recommended)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="manual" id="manual" />
                            <Label htmlFor="manual" className="cursor-pointer text-sm">
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
                            className="h-12"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Additional Information */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Additional Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Reference Number</Label>
                      <Input
                        {...form.register('reference_number')}
                        placeholder="Enter reference number"
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>E-Way Bill Number</Label>
                      <Input
                        {...form.register('eway_bill_number')}
                        placeholder="Enter e-way bill number"
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="has_invoice"
                          checked={form.watch('has_invoice')}
                          onCheckedChange={(checked) => form.setValue('has_invoice', !!checked)}
                        />
                        <Label htmlFor="has_invoice" className="cursor-pointer text-sm">
                          This shipment has an invoice
                        </Label>
                      </div>

                      {form.watch('has_invoice') && (
                        <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                          <div className="space-y-2">
                            <Label>Invoice Number</Label>
                            <Input
                              {...form.register('invoice_number')}
                              placeholder="INV-001"
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Invoice Date</Label>
                            <Input
                              type="date"
                              {...form.register('invoice_date')}
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Invoice Amount</Label>
                            <Input
                              type="number"
                              {...form.register('invoice_amount', { valueAsNumber: true })}
                              placeholder="0.00"
                              className="h-10"
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
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Pricing Summary */}
              {bookingArticles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-blue-50 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IndianRupee className="h-5 w-5 text-green-600" />
                        Pricing Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
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
                        <div className="text-center text-sm text-gray-600">
                          {bookingArticles.length} article{bookingArticles.length !== 1 ? 's' : ''} • 
                          Payment: {form.watch('payment_type')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Button
                  type="submit"
                  disabled={!isFormValid() || isSubmitting}
                  className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                      Creating Booking...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-3" />
                      Create Booking
                      <ArrowRight className="h-5 w-5 ml-3" />
                    </>
                  )}
                </Button>

                {!isFormValid() && (
                  <div className="mt-3 text-center">
                    <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                      <Info className="h-4 w-4" />
                      Complete all required fields to create booking
                    </p>
                  </div>
                )}

                {form.watch('payment_type') === 'Quotation' && (
                  <Alert className="mt-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Quotation mode selected. This will create a quote without confirmed booking.
                    </AlertDescription>
                  </Alert>
                )}
              </motion.div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}