import React, { useState, useEffect, useRef } from 'react';
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
  Calculator,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  ShieldCheck,
  BarChart3
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
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useBranches } from '@/hooks/useBranches';
import { useArticles } from '@/hooks/useArticles';
import { useCustomers } from '@/hooks/useCustomers';
import { useBookings } from '@/hooks/useBookings';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import BookingSuccess from './BookingSuccess';
import { motion, AnimatePresence } from 'framer-motion';
import type { Booking } from '@/types';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { validateGSTNumber, validateEwayBill, validateMobileNumber, validateEmail, validatePincode } from '@/utils/validation';
import BookingArticleManagerApple from './BookingArticleManagerApple';
import type { BookingArticle } from '@/services/bookings';

const bookingSchema = z.object({
  // Basic Information
  branch_id: z.string().min(1, 'Branch is required'),
  lr_type: z.enum(['system', 'manual']),
  manual_lr_number: z.string().optional(),
  payment_type: z.enum(['Quotation', 'To Pay', 'Paid']),
  
  // Route Information
  from_branch: z.string().min(1, 'Origin branch is required'),
  to_branch: z.string().min(1, 'Destination branch is required'),
  delivery_type: z.enum(['Standard', 'Express', 'Same Day']),
  priority: z.enum(['Normal', 'High', 'Urgent']).default('Normal'),
  expected_delivery_date: z.string().optional(),
  
  // Sender Information
  sender_type: z.enum(['existing', 'new']).default('new'),
  sender_id: z.string().optional(),
  sender_name: z.string().min(1, 'Sender name is required'),
  sender_mobile: z.string().refine(validateMobileNumber, 'Invalid mobile number'),
  sender_email: z.string().optional().refine((val) => !val || validateEmail(val), 'Invalid email'),
  sender_gst: z.string().optional().refine((val) => !val || validateGSTNumber(val), 'Invalid GST number'),
  sender_address: z.string().min(1, 'Sender address is required'),
  sender_city: z.string().optional(),
  sender_state: z.string().optional(),
  sender_pincode: z.string().optional().refine((val) => !val || validatePincode(val), 'Invalid pincode'),
  
  // Receiver Information
  receiver_type: z.enum(['existing', 'new']).default('new'),
  receiver_id: z.string().optional(),
  receiver_name: z.string().min(1, 'Receiver name is required'),
  receiver_mobile: z.string().refine(validateMobileNumber, 'Invalid mobile number'),
  receiver_email: z.string().optional().refine((val) => !val || validateEmail(val), 'Invalid email'),
  receiver_gst: z.string().optional().refine((val) => !val || validateGSTNumber(val), 'Invalid GST number'),
  receiver_address: z.string().min(1, 'Receiver address is required'),
  receiver_city: z.string().optional(),
  receiver_state: z.string().optional(),
  receiver_pincode: z.string().optional().refine((val) => !val || validatePincode(val), 'Invalid pincode'),
  
  // Optional Services
  insurance_required: z.boolean().default(false),
  insurance_value: z.number().optional(),
  insurance_charge: z.number().optional(),
  fragile: z.boolean().default(false),
  private_mark_number: z.string().optional(),
  special_instructions: z.string().optional(),
  remarks: z.string().optional(),
  
  // Invoice Information
  has_invoice: z.boolean().default(false),
  invoice_number: z.string().optional(),
  invoice_date: z.string().optional(),
  invoice_amount: z.number().optional(),
  eway_bill_number: z.string().optional().refine((val) => !val || validateEwayBill(val), 'Invalid E-way bill number'),
  
  // Reference
  reference_number: z.string().optional(),
}).refine((data) => {
  if (data.lr_type === 'manual' && !data.manual_lr_number) {
    return false;
  }
  return true;
}, {
  message: 'Manual LR number is required when LR type is manual',
  path: ['manual_lr_number'],
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface FormSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  required?: boolean;
  completed?: boolean;
}

const FormSection: React.FC<FormSectionProps> = ({ 
  title, 
  icon, 
  children, 
  expanded, 
  onToggle, 
  required = false,
  completed = false 
}) => {
  return (
    <Card className="overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader 
        className="cursor-pointer p-4 bg-gradient-to-r from-gray-50 to-white"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-blue-600">{icon}</div>
            <CardTitle className="text-base font-semibold text-gray-900">
              {title}
              {required && <span className="text-red-500 ml-1">*</span>}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {completed && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="p-6 bg-white">
          {children}
        </CardContent>
      )}
    </Card>
  );
};

// Customer Selector Component
const CustomerSelector: React.FC<{
  customers: any[];
  value: string;
  onSelect: (customerId: string) => void;
  placeholder: string;
  label: string;
}> = ({ customers, value, onSelect, placeholder, label }) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.mobile?.includes(searchQuery) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-11 font-normal"
        >
          {value
            ? customers.find((customer) => customer.id === value)?.name
            : placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder={`Search ${label.toLowerCase()}...`} 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>No customer found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {filteredCustomers.map((customer) => (
              <CommandItem
                key={customer.id}
                value={customer.id}
                onSelect={() => {
                  onSelect(customer.id);
                  setOpen(false);
                  setSearchQuery('');
                }}
              >
                <div className="flex-1">
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-sm text-gray-500">
                    {customer.mobile} {customer.email && `• ${customer.email}`}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default function NewBookingFormClean({ onClose, onBookingCreated }: { 
  onClose: () => void;
  onBookingCreated?: (booking: Booking) => void;
}) {
  const { branches, isLoading: branchesLoading } = useBranches();
  const { articles, isLoading: articlesLoading } = useArticles();
  const { customers, isLoading: customersLoading } = useCustomers();
  const { createBooking } = useBookings();
  const { user } = useAuth();
  const { selectedBranch } = useBranchSelection();
  const { showSuccess, showError } = useNotificationSystem();
  
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lrNumber, setLrNumber] = useState('');
  const [bookingArticles, setBookingArticles] = useState<BookingArticle[]>([]);
  
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    route: true,
    sender: true,
    receiver: true,
    freight: true,
    services: false,
    invoice: false,
  });
  
  const formRef = useRef<HTMLFormElement>(null);
  
  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      branch_id: selectedBranch?.id || '',
      lr_type: 'system',
      payment_type: 'To Pay',
      delivery_type: 'Standard',
      priority: 'Normal',
      sender_type: 'new',
      receiver_type: 'new',
      insurance_required: false,
      fragile: false,
      has_invoice: false,
    },
  });
  
  const watchedValues = form.watch();
  
  // Calculate total amount from articles
  const totalAmount = bookingArticles.reduce((sum, article) => sum + article.total_amount, 0);
  
  // Filter available destination branches
  const availableToBranches = branches.filter(b => b.id !== watchedValues.from_branch);
  
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  // Generate LR number preview
  useEffect(() => {
    if (watchedValues.lr_type === 'system' && watchedValues.branch_id) {
      const branch = branches.find(b => b.id === watchedValues.branch_id);
      if (branch) {
        const prefix = branch.code || branch.name.substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString().slice(-6);
        setLrNumber(`${prefix}-${timestamp}`);
      }
    }
  }, [watchedValues.lr_type, watchedValues.branch_id, branches]);
  
  const handleSenderSelection = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      form.setValue('sender_id', customer.id);
      form.setValue('sender_name', customer.name);
      form.setValue('sender_mobile', customer.mobile || '');
      form.setValue('sender_email', customer.email || '');
      form.setValue('sender_gst', customer.gst_number || '');
      form.setValue('sender_address', customer.address || '');
      form.setValue('sender_city', customer.city || '');
      form.setValue('sender_state', customer.state || '');
      form.setValue('sender_pincode', customer.pincode || '');
    }
  };
  
  const handleReceiverSelection = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      form.setValue('receiver_id', customer.id);
      form.setValue('receiver_name', customer.name);
      form.setValue('receiver_mobile', customer.mobile || '');
      form.setValue('receiver_email', customer.email || '');
      form.setValue('receiver_gst', customer.gst_number || '');
      form.setValue('receiver_address', customer.address || '');
      form.setValue('receiver_city', customer.city || '');
      form.setValue('receiver_state', customer.state || '');
      form.setValue('receiver_pincode', customer.pincode || '');
    }
  };
  
  const copyCustomerDetails = (from: 'sender' | 'receiver') => {
    const prefix = from === 'sender' ? 'sender' : 'receiver';
    const toPrefix = from === 'sender' ? 'receiver' : 'sender';
    
    form.setValue(`${toPrefix}_name` as any, form.getValues(`${prefix}_name` as any));
    form.setValue(`${toPrefix}_mobile` as any, form.getValues(`${prefix}_mobile` as any));
    form.setValue(`${toPrefix}_email` as any, form.getValues(`${prefix}_email` as any));
    form.setValue(`${toPrefix}_gst` as any, form.getValues(`${prefix}_gst` as any));
    form.setValue(`${toPrefix}_address` as any, form.getValues(`${prefix}_address` as any));
    form.setValue(`${toPrefix}_city` as any, form.getValues(`${prefix}_city` as any));
    form.setValue(`${toPrefix}_state` as any, form.getValues(`${prefix}_state` as any));
    form.setValue(`${toPrefix}_pincode` as any, form.getValues(`${prefix}_pincode` as any));
    
    showSuccess('Copied', `Customer details copied from ${from}`);
  };
  
  const onSubmit = async (data: BookingFormData) => {
    try {
      setSubmitting(true);

      // Validate we have at least one article
      if (bookingArticles.length === 0) {
        showError('No Articles', 'Please add at least one article to the booking');
        return;
      }

      const bookingData = {
        lr_type: data.lr_type,
        manual_lr_number: watchedValues.lr_type === 'manual' ? data.manual_lr_number : undefined,
        branch_id: data.branch_id,
        from_branch: data.from_branch,
        to_branch: data.to_branch,
        sender_id: data.sender_id,
        receiver_id: data.receiver_id,
        articles: bookingArticles,
        payment_type: data.payment_type,
        delivery_type: data.delivery_type,
        priority: data.priority,
        expected_delivery_date: data.expected_delivery_date || undefined,
        reference_number: data.reference_number,
        remarks: data.remarks,
        has_invoice: data.has_invoice,
        invoice_number: data.invoice_number,
        invoice_date: data.invoice_date || undefined,
        invoice_amount: data.invoice_amount,
        eway_bill_number: data.eway_bill_number,
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
    <div className="fixed inset-0 bg-gray-50 overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6 text-blue-600" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Create New Booking</h1>
                  <p className="text-sm text-gray-600">Fill in the details to generate a new LR</p>
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="rounded-lg"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* LR Number Display */}
            {lrNumber && watchedValues.lr_type === 'system' && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-blue-800">LR Number Preview:</span>
                <code className="font-mono font-bold text-blue-900">{lrNumber}</code>
                <span className="text-xs text-blue-600 ml-auto">Actual number will be generated when booking is created</span>
              </div>
            )}
          </div>
        </header>

        {/* Main Form Content */}
        <div className="flex-1 overflow-auto">
          <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="p-6">
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Basic Information */}
              <FormSection
                title="Basic Information"
                icon={<FileText className="h-5 w-5" />}
                expanded={expandedSections.basic}
                onToggle={() => toggleSection('basic')}
                required
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Operating Branch *</Label>
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
                      <p className="text-red-500 text-sm">{form.formState.errors.branch_id.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>LR Type *</Label>
                    <RadioGroup
                      value={form.watch('lr_type')}
                      onValueChange={(value: 'system' | 'manual') => form.setValue('lr_type', value)}
                      className="flex gap-4"
                    >
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <RadioGroupItem value="system" id="system" />
                        <span>System Generated</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <RadioGroupItem value="manual" id="manual" />
                        <span>Manual Entry</span>
                      </label>
                    </RadioGroup>
                  </div>

                  {watchedValues.lr_type === 'manual' && (
                    <div className="space-y-2 md:col-span-2">
                      <Label>Manual LR Number *</Label>
                      <Input
                        {...form.register('manual_lr_number')}
                        placeholder="Enter your LR number"
                      />
                      {form.formState.errors.manual_lr_number && (
                        <p className="text-red-500 text-sm">{form.formState.errors.manual_lr_number.message}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2 md:col-span-2">
                    <Label>Payment Type *</Label>
                    <RadioGroup
                      value={form.watch('payment_type')}
                      onValueChange={(value: 'Quotation' | 'To Pay' | 'Paid') => form.setValue('payment_type', value)}
                      className="grid grid-cols-3 gap-3"
                    >
                      <label className={cn(
                        "flex items-center justify-center gap-2 cursor-pointer px-4 py-2 rounded-lg border transition-colors",
                        watchedValues.payment_type === 'Quotation' 
                          ? "border-blue-500 bg-blue-50 text-blue-700" 
                          : "border-gray-200 hover:border-gray-300"
                      )}>
                        <RadioGroupItem value="Quotation" id="quotation" className="sr-only" />
                        <FileText className="h-4 w-4" />
                        <span>Quotation</span>
                      </label>
                      <label className={cn(
                        "flex items-center justify-center gap-2 cursor-pointer px-4 py-2 rounded-lg border transition-colors",
                        watchedValues.payment_type === 'To Pay' 
                          ? "border-yellow-500 bg-yellow-50 text-yellow-700" 
                          : "border-gray-200 hover:border-gray-300"
                      )}>
                        <RadioGroupItem value="To Pay" id="topay" className="sr-only" />
                        <Clock className="h-4 w-4" />
                        <span>To Pay</span>
                      </label>
                      <label className={cn(
                        "flex items-center justify-center gap-2 cursor-pointer px-4 py-2 rounded-lg border transition-colors",
                        watchedValues.payment_type === 'Paid' 
                          ? "border-green-500 bg-green-50 text-green-700" 
                          : "border-gray-200 hover:border-gray-300"
                      )}>
                        <RadioGroupItem value="Paid" id="paid" className="sr-only" />
                        <CheckCircle className="h-4 w-4" />
                        <span>Paid</span>
                      </label>
                    </RadioGroup>
                  </div>
                </div>
              </FormSection>

              {/* Route Information */}
              <FormSection
                title="Route Information"
                icon={<MapPin className="h-5 w-5" />}
                expanded={expandedSections.route}
                onToggle={() => toggleSection('route')}
                required
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Origin Branch *</Label>
                    <Select
                      value={form.watch('from_branch')}
                      onValueChange={(value) => form.setValue('from_branch', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select origin" />
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
                      <p className="text-red-500 text-sm">{form.formState.errors.from_branch.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Destination Branch *</Label>
                    <Select
                      value={form.watch('to_branch')}
                      onValueChange={(value) => form.setValue('to_branch', value)}
                      disabled={!watchedValues.from_branch}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={!watchedValues.from_branch ? "Select origin first" : "Select destination"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableToBranches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name} - {branch.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.to_branch && (
                      <p className="text-red-500 text-sm">{form.formState.errors.to_branch.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Expected Delivery Date</Label>
                    <Input
                      type="date"
                      {...form.register('expected_delivery_date')}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Delivery Type</Label>
                    <Select
                      value={form.watch('delivery_type')}
                      onValueChange={(value: 'Standard' | 'Express' | 'Same Day') => form.setValue('delivery_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Standard">Standard Delivery</SelectItem>
                        <SelectItem value="Express">Express Delivery</SelectItem>
                        <SelectItem value="Same Day">Same Day Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Route Summary */}
                {watchedValues.from_branch && watchedValues.to_branch && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">
                        {branches.find(b => b.id === watchedValues.from_branch)?.name}
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-700">
                        {branches.find(b => b.id === watchedValues.to_branch)?.name}
                      </span>
                      <Badge variant="secondary" className="ml-auto">
                        {watchedValues.delivery_type || 'Standard'} Delivery
                      </Badge>
                    </div>
                  </div>
                )}
              </FormSection>

              {/* Sender Information */}
              <FormSection
                title="Sender Information"
                icon={<User className="h-5 w-5" />}
                expanded={expandedSections.sender}
                onToggle={() => toggleSection('sender')}
                required
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <RadioGroup
                      value={form.watch('sender_type')}
                      onValueChange={(value: 'existing' | 'new') => form.setValue('sender_type', value)}
                      className="flex gap-4"
                    >
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <RadioGroupItem value="new" id="new-sender" />
                        <span>New Customer</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <RadioGroupItem value="existing" id="existing-sender" />
                        <span>Existing Customer</span>
                      </label>
                    </RadioGroup>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyCustomerDetails('receiver')}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy from Receiver
                    </Button>
                  </div>

                  {watchedValues.sender_type === 'existing' && (
                    <div className="space-y-2">
                      <Label>Select Sender</Label>
                      <CustomerSelector
                        customers={customers}
                        value={form.watch('sender_id') || ''}
                        onSelect={handleSenderSelection}
                        placeholder="Search and select sender..."
                        label="Sender"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Sender Name *</Label>
                      <Input
                        {...form.register('sender_name')}
                        placeholder="Full name"
                      />
                      {form.formState.errors.sender_name && (
                        <p className="text-red-500 text-sm">{form.formState.errors.sender_name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Mobile Number *</Label>
                      <Input
                        {...form.register('sender_mobile')}
                        placeholder="10-digit mobile"
                      />
                      {form.formState.errors.sender_mobile && (
                        <p className="text-red-500 text-sm">{form.formState.errors.sender_mobile.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        {...form.register('sender_email')}
                        placeholder="email@example.com"
                      />
                      {form.formState.errors.sender_email && (
                        <p className="text-red-500 text-sm">{form.formState.errors.sender_email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>GST Number</Label>
                      <Input
                        {...form.register('sender_gst')}
                        placeholder="GST registration number"
                      />
                      {form.formState.errors.sender_gst && (
                        <p className="text-red-500 text-sm">{form.formState.errors.sender_gst.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Address *</Label>
                    <Textarea
                      {...form.register('sender_address')}
                      placeholder="Complete address"
                      rows={3}
                    />
                    {form.formState.errors.sender_address && (
                      <p className="text-red-500 text-sm">{form.formState.errors.sender_address.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        {...form.register('sender_city')}
                        placeholder="City"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input
                        {...form.register('sender_state')}
                        placeholder="State"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Pincode</Label>
                      <Input
                        {...form.register('sender_pincode')}
                        placeholder="6-digit pincode"
                      />
                      {form.formState.errors.sender_pincode && (
                        <p className="text-red-500 text-sm">{form.formState.errors.sender_pincode.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </FormSection>

              {/* Receiver Information */}
              <FormSection
                title="Receiver Information"
                icon={<Building2 className="h-5 w-5" />}
                expanded={expandedSections.receiver}
                onToggle={() => toggleSection('receiver')}
                required
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <RadioGroup
                      value={form.watch('receiver_type')}
                      onValueChange={(value: 'existing' | 'new') => form.setValue('receiver_type', value)}
                      className="flex gap-4"
                    >
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <RadioGroupItem value="new" id="new-receiver" />
                        <span>New Customer</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <RadioGroupItem value="existing" id="existing-receiver" />
                        <span>Existing Customer</span>
                      </label>
                    </RadioGroup>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyCustomerDetails('sender')}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy from Sender
                    </Button>
                  </div>

                  {watchedValues.receiver_type === 'existing' && (
                    <div className="space-y-2">
                      <Label>Select Receiver</Label>
                      <CustomerSelector
                        customers={customers}
                        value={form.watch('receiver_id') || ''}
                        onSelect={handleReceiverSelection}
                        placeholder="Search and select receiver..."
                        label="Receiver"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Receiver Name *</Label>
                      <Input
                        {...form.register('receiver_name')}
                        placeholder="Full name"
                      />
                      {form.formState.errors.receiver_name && (
                        <p className="text-red-500 text-sm">{form.formState.errors.receiver_name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Mobile Number *</Label>
                      <Input
                        {...form.register('receiver_mobile')}
                        placeholder="10-digit mobile"
                      />
                      {form.formState.errors.receiver_mobile && (
                        <p className="text-red-500 text-sm">{form.formState.errors.receiver_mobile.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        {...form.register('receiver_email')}
                        placeholder="email@example.com"
                      />
                      {form.formState.errors.receiver_email && (
                        <p className="text-red-500 text-sm">{form.formState.errors.receiver_email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>GST Number</Label>
                      <Input
                        {...form.register('receiver_gst')}
                        placeholder="GST registration number"
                      />
                      {form.formState.errors.receiver_gst && (
                        <p className="text-red-500 text-sm">{form.formState.errors.receiver_gst.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Address *</Label>
                    <Textarea
                      {...form.register('receiver_address')}
                      placeholder="Complete address"
                      rows={3}
                    />
                    {form.formState.errors.receiver_address && (
                      <p className="text-red-500 text-sm">{form.formState.errors.receiver_address.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        {...form.register('receiver_city')}
                        placeholder="City"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input
                        {...form.register('receiver_state')}
                        placeholder="State"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Pincode</Label>
                      <Input
                        {...form.register('receiver_pincode')}
                        placeholder="6-digit pincode"
                      />
                      {form.formState.errors.receiver_pincode && (
                        <p className="text-red-500 text-sm">{form.formState.errors.receiver_pincode.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </FormSection>

              {/* Article Details & Freight Calculation */}
              <FormSection
                title="Article Details & Freight Calculation"
                icon={<Package className="h-5 w-5" />}
                expanded={expandedSections.freight}
                onToggle={() => toggleSection('freight')}
                required
              >
                <BookingArticleManagerApple
                  articles={bookingArticles}
                  onArticlesChange={setBookingArticles}
                  branch_id={watchedValues.branch_id}
                />
              </FormSection>

              {/* Optional Services */}
              <FormSection
                title="Optional Services"
                icon={<Shield className="h-5 w-5" />}
                expanded={expandedSections.services}
                onToggle={() => toggleSection('services')}
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                      <Checkbox
                        id="insurance"
                        checked={form.watch('insurance_required')}
                        onCheckedChange={(checked) => form.setValue('insurance_required', !!checked)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Insurance Required</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Protect valuable shipments</p>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                      <Checkbox
                        id="fragile"
                        checked={form.watch('fragile')}
                        onCheckedChange={(checked) => form.setValue('fragile', !!checked)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <span className="font-medium">Fragile Item</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Handle with extra care</p>
                      </div>
                    </label>
                  </div>

                  {watchedValues.insurance_required && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Insurance Value (₹)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          {...form.register('insurance_value', { valueAsNumber: true })}
                          placeholder="Insured amount"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Insurance Charges (₹)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          {...form.register('insurance_charge', { valueAsNumber: true })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Private Mark Number</Label>
                    <Input
                      {...form.register('private_mark_number')}
                      placeholder="Private marking"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Special Instructions</Label>
                    <Textarea
                      {...form.register('special_instructions')}
                      placeholder="Handling instructions"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Remarks</Label>
                    <Textarea
                      {...form.register('remarks')}
                      placeholder="Additional notes"
                      rows={2}
                    />
                  </div>
                </div>
              </FormSection>

              {/* Invoice Information */}
              <FormSection
                title="Invoice Information"
                icon={<Receipt className="h-5 w-5" />}
                expanded={expandedSections.invoice}
                onToggle={() => toggleSection('invoice')}
              >
                <div className="space-y-4">
                  <label className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                    <Checkbox
                      id="has-invoice"
                      checked={form.watch('has_invoice')}
                      onCheckedChange={(checked) => form.setValue('has_invoice', !!checked)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Has Invoice</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Include invoice details with shipment</p>
                    </div>
                  </label>

                  {watchedValues.has_invoice && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Invoice Number</Label>
                        <Input
                          {...form.register('invoice_number')}
                          placeholder="INV-001"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Invoice Amount (₹)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          {...form.register('invoice_amount', { valueAsNumber: true })}
                          placeholder="0.00"
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
                        <Label>E-Way Bill Number</Label>
                        <Input
                          {...form.register('eway_bill_number')}
                          placeholder="12-digit number"
                        />
                        {form.formState.errors.eway_bill_number && (
                          <p className="text-red-500 text-sm">{form.formState.errors.eway_bill_number.message}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </FormSection>

              {/* Summary Section */}
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      Booking Summary
                    </h3>
                    <Badge variant="default" className="text-lg px-3 py-1">
                      Total: ₹{totalAmount.toFixed(2)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Freight Charges</p>
                      <p className="text-xl font-semibold text-gray-900">
                        ₹{bookingArticles.reduce((sum, article) => sum + article.freight_amount, 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Additional Charges</p>
                      <p className="text-xl font-semibold text-gray-900">
                        ₹{bookingArticles.reduce((sum, article) => 
                          sum + article.total_loading_charges + article.total_unloading_charges + article.insurance_charge + article.packaging_charge, 0
                        ).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Payment Type</p>
                      <p className="text-xl font-semibold">
                        <Badge variant={
                          watchedValues.payment_type === 'Paid' ? 'default' : 
                          watchedValues.payment_type === 'To Pay' ? 'secondary' : 
                          'outline'
                        } className="text-base">
                          {watchedValues.payment_type}
                        </Badge>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </form>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={onClose}
              >
                Cancel
              </Button>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-xl font-bold text-gray-900">₹{totalAmount.toFixed(2)}</p>
                </div>
                
                <Button
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={submitting}
                  size="lg"
                  className="min-w-[150px]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Booking'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}