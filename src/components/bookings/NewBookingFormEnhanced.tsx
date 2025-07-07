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
  Sparkles,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Clock,
  Search,
  Zap,
  Globe,
  Navigation,
  Target,
  BarChart3,
  Boxes,
  ShieldCheck,
  Star,
  Users,
  AlertCircle,
  Copy,
  Settings,
  Palette,
  Activity
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
import BookingArticleManager from './BookingArticleManager';
import type { BookingArticle } from '@/services/bookings';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

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
  sender_mobile: z.string().min(10, 'Valid mobile number required').refine(validateMobileNumber, {
    message: 'Invalid mobile number (10 digits starting with 6-9)'
  }),
  sender_email: z.string().optional().refine((val) => !val || validateEmail(val), {
    message: 'Invalid email address'
  }),
  sender_address: z.string().min(1, 'Sender address is required'),
  sender_city: z.string().optional(),
  sender_state: z.string().optional(),
  sender_pincode: z.string().optional().refine((val) => !val || validatePincode(val), {
    message: 'Invalid pincode (6 digits)'
  }),
  sender_gst: z.string().optional().refine((val) => !val || validateGSTNumber(val), {
    message: 'Invalid GST number format (e.g., 22AAAAA0000A1Z5)'
  }),
  
  // Receiver Information
  receiver_type: z.enum(['existing', 'new']),
  receiver_id: z.string().optional(),
  receiver_name: z.string().min(1, 'Receiver name is required'),
  receiver_mobile: z.string().min(10, 'Valid mobile number required').refine(validateMobileNumber, {
    message: 'Invalid mobile number (10 digits starting with 6-9)'
  }),
  receiver_email: z.string().optional().refine((val) => !val || validateEmail(val), {
    message: 'Invalid email address'
  }),
  receiver_address: z.string().min(1, 'Receiver address is required'),
  receiver_city: z.string().optional(),
  receiver_state: z.string().optional(),
  receiver_pincode: z.string().optional().refine((val) => !val || validatePincode(val), {
    message: 'Invalid pincode (6 digits)'
  }),
  receiver_gst: z.string().optional().refine((val) => !val || validateGSTNumber(val), {
    message: 'Invalid GST number format (e.g., 22AAAAA0000A1Z5)'
  }),
  
  // Articles are now handled by BookingArticleManager
  // No need for individual article fields in the form schema
  
  // Payment Information
  payment_type: z.enum(['Quotation', 'To Pay', 'Paid']),
  
  // Additional Information
  private_mark_number: z.string().optional(),
  remarks: z.string().optional(),
  special_instructions: z.string().optional(),
  
  // Optional Services
  insurance_required: z.boolean().optional(),
  insurance_value: z.number().optional(),
  insurance_charge: z.number().optional(),
  fragile: z.boolean().optional(),
  delivery_type: z.enum(['Standard', 'Express', 'Same Day']).optional(),
  packaging_type: z.string().optional(),
  packaging_charge: z.number().optional(),
  expected_delivery_date: z.string().optional(),
  
  // Invoice Information
  has_invoice: z.boolean().optional(),
  invoice_number: z.string().optional(),
  invoice_amount: z.number().optional(),
  invoice_date: z.string().optional(),
  eway_bill_number: z.string().optional().refine((val) => !val || validateEwayBill(val), {
    message: 'E-way bill must be a 12-digit number'
  }),
}).refine((data) => {
  // Ensure from_branch and to_branch are different
  if (data.from_branch && data.to_branch && data.from_branch === data.to_branch) {
    return false;
  }
  return true;
}, {
  message: 'Origin and destination branches cannot be the same',
  path: ['to_branch']
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface NewBookingFormEnhancedProps {
  onClose: () => void;
  onBookingCreated?: (booking: Booking) => void;
}

// Section component for better organization
const FormSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  color?: string;
  expanded?: boolean;
  onToggle?: () => void;
  required?: boolean;
  completed?: boolean;
}> = ({ title, icon, children, color = 'blue', expanded = true, onToggle, required = false, completed = false }) => {
  return (
    <motion.div
      layout
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeInUp}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-300",
        expanded ? "shadow-md" : "shadow-sm",
        completed && "border-green-200 bg-green-50/30"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "w-full px-6 py-4 flex items-center justify-between transition-colors",
          `hover:bg-${color}-50/50`,
          expanded && `bg-${color}-50/30`
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg transition-all",
            `bg-${color}-100 text-${color}-600`,
            completed && "bg-green-100 text-green-600"
          )}>
            {completed ? <CheckCircle className="h-5 w-5" /> : icon}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              {title}
              {required && <Badge variant="secondary" className="text-xs">Required</Badge>}
              {completed && <Badge variant="default" className="text-xs bg-green-600">Completed</Badge>}
            </h3>
          </div>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 text-gray-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 py-4 border-t border-gray-100">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Enhanced customer selector with search
const CustomerSelector: React.FC<{
  customers: any[];
  value: string;
  onSelect: (customerId: string) => void;
  placeholder: string;
  label: string;
}> = ({ customers, value, onSelect, placeholder, label }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(search.toLowerCase()) ||
    customer.mobile.includes(search)
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? customers.find((customer) => customer.id === value)?.name
            : placeholder}
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder={`Search ${label.toLowerCase()}...`}
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
          <CommandGroup>
            <ScrollArea className="h-72">
              {filteredCustomers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  onSelect={() => {
                    onSelect(customer.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{customer.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {customer.mobile}
                      </span>
                      {customer.gst && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          GST: {customer.gst}
                        </span>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </ScrollArea>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default function NewBookingFormEnhanced({ onClose, onBookingCreated }: NewBookingFormEnhancedProps) {
  const [submitting, setSubmitting] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [lrNumber, setLrNumber] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [bookingArticles, setBookingArticles] = useState<BookingArticle[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    route: true,
    sender: true,
    receiver: true,
    article: true,
    freight: true,
    services: false,
    invoice: false
  });
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});
  const [formProgress, setFormProgress] = useState(0);
  
  const { branches } = useBranches();
  const { articles } = useArticles();
  const { customers } = useCustomers();
  const { createBooking } = useBookings();
  const { getCurrentUserBranch, user } = useAuth();
  const { selectedBranch } = useBranchSelection();
  const { showSuccess, showError } = useNotificationSystem();
  
  const userBranch = getCurrentUserBranch();
  const effectiveBranchId = selectedBranch || userBranch?.id;
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      branch_id: effectiveBranchId || '',
      lr_type: 'system',
      sender_type: 'new',
      receiver_type: 'new',
      payment_type: 'To Pay',
      insurance_required: false,
      fragile: false,
      delivery_type: 'Standard',
      has_invoice: false,
    }
  });

  const watchedValues = form.watch();
  const availableToBranches = branches.filter(branch => branch.id !== watchedValues.from_branch);

  // Generate preview LR number for system type (for display only)
  useEffect(() => {
    if (watchedValues.lr_type === 'system') {
      const branchCode = effectiveBranchId?.slice(-4) || 'DFLT';
      const previewLR = `LR${branchCode}XXXXXXXX`;
      setLrNumber(previewLR);
    } else {
      setLrNumber('');
    }
  }, [watchedValues.lr_type, effectiveBranchId]);

  // Calculate total amount from booking articles
  useEffect(() => {
    const total = bookingArticles.reduce((sum, article) => {
      const freight = article.rate_type === 'per_kg' 
        ? article.charged_weight * article.rate_per_unit
        : article.quantity * article.rate_per_unit;
      const loading = article.quantity * article.loading_charge_per_unit;
      const unloading = article.quantity * article.unloading_charge_per_unit;
      const other = (article.insurance_charge || 0) + (article.packaging_charge || 0);
      return sum + freight + loading + unloading + other;
    }, 0);
    setTotalAmount(total);
  }, [bookingArticles]);

  // Track form progress
  useEffect(() => {
    const requiredFields = [
      'branch_id', 'from_branch', 'to_branch',
      'sender_name', 'sender_mobile', 'sender_address',
      'receiver_name', 'receiver_mobile', 'receiver_address',
      'article_id', 'quantity', 'actual_weight'
    ];
    
    const filledFields = requiredFields.filter(field => {
      const value = form.getValues(field as any);
      return value && value !== '';
    });
    
    const progress = (filledFields.length / requiredFields.length) * 100;
    setFormProgress(progress);
    
    // Update completed sections
    const newCompletedSections = {
      basic: !!(watchedValues.branch_id && (watchedValues.lr_type === 'manual' ? watchedValues.manual_lr_number : true)),
      route: !!(watchedValues.from_branch && watchedValues.to_branch),
      sender: !!(watchedValues.sender_name && watchedValues.sender_mobile && watchedValues.sender_address),
      receiver: !!(watchedValues.receiver_name && watchedValues.receiver_mobile && watchedValues.receiver_address),
      article: bookingArticles.length > 0,
      freight: bookingArticles.length > 0,
      services: true, // Optional section
      invoice: true // Optional section
    };
    setCompletedSections(newCompletedSections);
  }, [watchedValues, form, bookingArticles]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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

  const copyCustomerDetails = (from: 'sender' | 'receiver') => {
    const to = from === 'sender' ? 'receiver' : 'sender';
    const fields = ['name', 'mobile', 'email', 'address', 'city', 'state', 'pincode', 'gst'];
    
    fields.forEach(field => {
      const value = form.getValues(`${from}_${field}` as any);
      if (value) {
        form.setValue(`${to}_${field}` as any, value);
      }
    });
    
    showSuccess('Details Copied', `${from === 'sender' ? 'Sender' : 'Receiver'} details copied successfully`);
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
    <TooltipProvider>
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Enhanced Header */}
          <motion.header 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm"
          >
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg"
                  >
                    <Package className="h-6 w-6" />
                  </motion.div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Create New Booking
                    </h1>
                    <p className="text-gray-600 text-sm mt-1">Fill in the details to generate a new LR</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Progress Indicator */}
                  <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
                    <Activity className="h-4 w-4 text-gray-500" />
                    <Progress value={formProgress} className="w-32 h-2" />
                    <span className="text-sm font-medium text-gray-700">{Math.round(formProgress)}%</span>
                  </div>
                  
                  {/* Quick Actions */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-lg">
                        <Settings className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Form Settings</TooltipContent>
                  </Tooltip>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onClose} 
                    className="rounded-lg hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              {/* LR Number Display */}
              {lrNumber && watchedValues.lr_type === 'system' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-blue-600" />
                    <span className="text-blue-800 font-medium">LR Number Preview:</span>
                    <code className="font-mono font-bold text-blue-900 bg-blue-100 px-2 py-1 rounded">
                      {lrNumber}
                    </code>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">Actual number will be generated when booking is created</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(lrNumber);
                      showSuccess('Copied', 'LR number copied to clipboard');
                    }}
                    className="text-green-700 hover:text-green-900"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.header>

          {/* Main Form Content */}
          <div className="flex-1 overflow-auto">
            <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="p-6">
              <div className="max-w-5xl mx-auto space-y-4">
                {/* Basic Information */}
                <FormSection
                  title="Basic Information"
                  icon={<FileText className="h-5 w-5" />}
                  color="blue"
                  expanded={expandedSections.basic}
                  onToggle={() => toggleSection('basic')}
                  required
                  completed={completedSections.basic}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        Operating Branch *
                      </Label>
                      <Select
                        value={form.watch('branch_id')}
                        onValueChange={(value) => form.setValue('branch_id', value)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select branch" />
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
                      {form.formState.errors.branch_id && (
                        <p className="text-red-500 text-sm">{form.formState.errors.branch_id.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-gray-500" />
                        LR Type *
                      </Label>
                      <RadioGroup
                        value={form.watch('lr_type')}
                        onValueChange={(value: 'system' | 'manual') => form.setValue('lr_type', value)}
                        className="flex gap-4 mt-3"
                      >
                        <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                          <RadioGroupItem value="system" id="system" />
                          <span className="font-medium">System Generated</span>
                          <Badge variant="secondary" className="ml-2">Recommended</Badge>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                          <RadioGroupItem value="manual" id="manual" />
                          <span className="font-medium">Manual Entry</span>
                        </label>
                      </RadioGroup>
                    </div>

                    {watchedValues.lr_type === 'manual' && (
                      <div className="space-y-2 md:col-span-2">
                        <Label>Manual LR Number *</Label>
                        <Input
                          {...form.register('manual_lr_number')}
                          placeholder="Enter your LR number"
                          className="h-11"
                        />
                        {form.formState.errors.manual_lr_number && (
                          <p className="text-red-500 text-sm">{form.formState.errors.manual_lr_number.message}</p>
                        )}
                      </div>
                    )}

                    <div className="space-y-2 md:col-span-2">
                      <Label className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-500" />
                        Payment Type *
                      </Label>
                      <RadioGroup
                        value={form.watch('payment_type')}
                        onValueChange={(value: 'Quotation' | 'To Pay' | 'Paid') => form.setValue('payment_type', value)}
                        className="grid grid-cols-3 gap-3"
                      >
                        <label className={cn(
                          "flex items-center justify-center gap-2 cursor-pointer px-4 py-3 rounded-lg border-2 transition-all",
                          watchedValues.payment_type === 'Quotation' 
                            ? "border-blue-500 bg-blue-50 text-blue-700" 
                            : "border-gray-200 hover:border-gray-300"
                        )}>
                          <RadioGroupItem value="Quotation" id="quotation" className="sr-only" />
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">Quotation</span>
                        </label>
                        <label className={cn(
                          "flex items-center justify-center gap-2 cursor-pointer px-4 py-3 rounded-lg border-2 transition-all",
                          watchedValues.payment_type === 'To Pay' 
                            ? "border-yellow-500 bg-yellow-50 text-yellow-700" 
                            : "border-gray-200 hover:border-gray-300"
                        )}>
                          <RadioGroupItem value="To Pay" id="topay" className="sr-only" />
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">To Pay</span>
                        </label>
                        <label className={cn(
                          "flex items-center justify-center gap-2 cursor-pointer px-4 py-3 rounded-lg border-2 transition-all",
                          watchedValues.payment_type === 'Paid' 
                            ? "border-green-500 bg-green-50 text-green-700" 
                            : "border-gray-200 hover:border-gray-300"
                        )}>
                          <RadioGroupItem value="Paid" id="paid" className="sr-only" />
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-medium">Paid</span>
                        </label>
                      </RadioGroup>
                      {watchedValues.payment_type === 'To Pay' && (
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Cash collection required on delivery</span>
                        </div>
                      )}
                    </div>
                  </div>
                </FormSection>

                {/* Route Information */}
                <FormSection
                  title="Route Information"
                  icon={<MapPin className="h-5 w-5" />}
                  color="green"
                  expanded={expandedSections.route}
                  onToggle={() => toggleSection('route')}
                  required
                  completed={completedSections.route}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-green-600" />
                        Origin Branch *
                      </Label>
                      <Select
                        value={form.watch('from_branch')}
                        onValueChange={(value) => form.setValue('from_branch', value)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select origin" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                {branch.name} - {branch.city}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.from_branch && (
                        <p className="text-red-500 text-sm">{form.formState.errors.from_branch.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-red-600" />
                        Destination Branch *
                      </Label>
                      <Select
                        value={form.watch('to_branch')}
                        onValueChange={(value) => form.setValue('to_branch', value)}
                        disabled={!watchedValues.from_branch}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder={!watchedValues.from_branch ? "Select origin first" : "Select destination"} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableToBranches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-red-500" />
                                {branch.name} - {branch.city}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.to_branch && (
                        <p className="text-red-500 text-sm">{form.formState.errors.to_branch.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        Expected Delivery Date
                      </Label>
                      <Input
                        type="date"
                        {...form.register('expected_delivery_date')}
                        className="h-11"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-gray-500" />
                        Delivery Type
                      </Label>
                      <Select
                        value={form.watch('delivery_type')}
                        onValueChange={(value: 'Standard' | 'Express' | 'Same Day') => form.setValue('delivery_type', value)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Standard">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-blue-500" />
                              Standard Delivery
                            </div>
                          </SelectItem>
                          <SelectItem value="Express">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4 text-orange-500" />
                              Express Delivery
                            </div>
                          </SelectItem>
                          <SelectItem value="Same Day">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-red-500" />
                              Same Day Delivery
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Route Summary */}
                  {watchedValues.from_branch && watchedValues.to_branch && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full bg-green-500" />
                          <span className="font-medium text-gray-700">
                            {branches.find(b => b.id === watchedValues.from_branch)?.name}
                          </span>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                          <div className="h-3 w-3 rounded-full bg-red-500" />
                          <span className="font-medium text-gray-700">
                            {branches.find(b => b.id === watchedValues.to_branch)?.name}
                          </span>
                        </div>
                        <Badge variant="secondary">
                          {watchedValues.delivery_type || 'Standard'} Delivery
                        </Badge>
                      </div>
                    </motion.div>
                  )}
                </FormSection>

                {/* Sender Information */}
                <FormSection
                  title="Sender Information"
                  icon={<User className="h-5 w-5" />}
                  color="purple"
                  expanded={expandedSections.sender}
                  onToggle={() => toggleSection('sender')}
                  required
                  completed={completedSections.sender}
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
                          <span className="font-medium">New Customer</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <RadioGroupItem value="existing" id="existing-sender" />
                          <span className="font-medium">Existing Customer</span>
                        </label>
                      </RadioGroup>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyCustomerDetails('receiver')}
                        className="text-xs"
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
                        <Label className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          Sender Name *
                        </Label>
                        <Input
                          {...form.register('sender_name')}
                          placeholder="Full name"
                          className="h-11"
                        />
                        {form.formState.errors.sender_name && (
                          <p className="text-red-500 text-sm">{form.formState.errors.sender_name.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          Mobile Number *
                        </Label>
                        <Input
                          {...form.register('sender_mobile')}
                          placeholder="10-digit mobile"
                          className="h-11"
                        />
                        {form.formState.errors.sender_mobile && (
                          <p className="text-red-500 text-sm">{form.formState.errors.sender_mobile.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          Email
                        </Label>
                        <Input
                          type="email"
                          {...form.register('sender_email')}
                          placeholder="email@example.com"
                          className="h-11"
                        />
                        {form.formState.errors.sender_email && (
                          <p className="text-red-500 text-sm">{form.formState.errors.sender_email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          GST Number
                        </Label>
                        <Input
                          {...form.register('sender_gst')}
                          placeholder="GST registration number"
                          className="h-11"
                        />
                        {form.formState.errors.sender_gst && (
                          <p className="text-red-500 text-sm">{form.formState.errors.sender_gst.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        Address *
                      </Label>
                      <Textarea
                        {...form.register('sender_address')}
                        placeholder="Complete address"
                        rows={3}
                        className="resize-none"
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
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>State</Label>
                        <Input
                          {...form.register('sender_state')}
                          placeholder="State"
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Pincode</Label>
                        <Input
                          {...form.register('sender_pincode')}
                          placeholder="6-digit pincode"
                          className="h-11"
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
                  color="orange"
                  expanded={expandedSections.receiver}
                  onToggle={() => toggleSection('receiver')}
                  required
                  completed={completedSections.receiver}
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
                          <span className="font-medium">New Customer</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <RadioGroupItem value="existing" id="existing-receiver" />
                          <span className="font-medium">Existing Customer</span>
                        </label>
                      </RadioGroup>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyCustomerDetails('sender')}
                        className="text-xs"
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
                        <Label className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          Receiver Name *
                        </Label>
                        <Input
                          {...form.register('receiver_name')}
                          placeholder="Full name"
                          className="h-11"
                        />
                        {form.formState.errors.receiver_name && (
                          <p className="text-red-500 text-sm">{form.formState.errors.receiver_name.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          Mobile Number *
                        </Label>
                        <Input
                          {...form.register('receiver_mobile')}
                          placeholder="10-digit mobile"
                          className="h-11"
                        />
                        {form.formState.errors.receiver_mobile && (
                          <p className="text-red-500 text-sm">{form.formState.errors.receiver_mobile.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          Email
                        </Label>
                        <Input
                          type="email"
                          {...form.register('receiver_email')}
                          placeholder="email@example.com"
                          className="h-11"
                        />
                        {form.formState.errors.receiver_email && (
                          <p className="text-red-500 text-sm">{form.formState.errors.receiver_email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          GST Number
                        </Label>
                        <Input
                          {...form.register('receiver_gst')}
                          placeholder="GST registration number"
                          className="h-11"
                        />
                        {form.formState.errors.receiver_gst && (
                          <p className="text-red-500 text-sm">{form.formState.errors.receiver_gst.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        Address *
                      </Label>
                      <Textarea
                        {...form.register('receiver_address')}
                        placeholder="Complete address"
                        rows={3}
                        className="resize-none"
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
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>State</Label>
                        <Input
                          {...form.register('receiver_state')}
                          placeholder="State"
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Pincode</Label>
                        <Input
                          {...form.register('receiver_pincode')}
                          placeholder="6-digit pincode"
                          className="h-11"
                        />
                        {form.formState.errors.receiver_pincode && (
                          <p className="text-red-500 text-sm">{form.formState.errors.receiver_pincode.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </FormSection>

                {/* Article Details - Replaced by BookingArticleManager in Freight Calculation section */}



                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Weight className="h-4 w-4 text-gray-500" />
                          Actual Weight (kg) *
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          {...form.register('actual_weight', { valueAsNumber: true })}
                          placeholder="1.0"
                          className="h-11"
                        />
                        {form.formState.errors.actual_weight && (
                          <p className="text-red-500 text-sm">{form.formState.errors.actual_weight.message}</p>
                        )}
                      </div>


                {/* Freight Calculation */}
                <FormSection
                  title="Freight Calculation"
                  icon={<IndianRupee className="h-5 w-5" />}
                  color="yellow"
                  expanded={expandedSections.freight}
                  onToggle={() => toggleSection('freight')}
                  required
                  completed={completedSections.freight}
                >
                  <div className="space-y-4">
                    {/* BookingArticleManager handles all article details and rate calculations */}

                    <BookingArticleManager
                      articles={bookingArticles}
                      onArticlesChange={setBookingArticles}
                      branch_id={watchedValues.branch_id}
                    />
                    
                  </div>
                </FormSection>

                {/* Optional Services */}
                <FormSection
                  title="Optional Services"
                  icon={<Shield className="h-5 w-5" />}
                  color="indigo"
                  expanded={expandedSections.services}
                  onToggle={() => toggleSection('services')}
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className={cn(
                        "flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                        watchedValues.insurance_required 
                          ? "border-indigo-500 bg-indigo-50" 
                          : "border-gray-200 hover:border-gray-300"
                      )}>
                        <Checkbox
                          id="insurance"
                          checked={form.watch('insurance_required')}
                          onCheckedChange={(checked) => form.setValue('insurance_required', !!checked)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-indigo-600" />
                            <span className="font-medium">Insurance Required</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Protect valuable shipments</p>
                        </div>
                      </label>

                      <label className={cn(
                        "flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                        watchedValues.fragile 
                          ? "border-orange-500 bg-orange-50" 
                          : "border-gray-200 hover:border-gray-300"
                      )}>
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

                    <AnimatePresence>
                      {watchedValues.insurance_required && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                          <div className="space-y-2">
                            <Label>Insurance Value (₹)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              {...form.register('insurance_value', { valueAsNumber: true })}
                              placeholder="Insured amount"
                              className="h-11"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Insurance Charges (₹)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              {...form.register('insurance_charge', { valueAsNumber: true })}
                              placeholder="0.00"
                              className="h-11"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-2">
                      <Label>Private Mark Number</Label>
                      <Input
                        {...form.register('private_mark_number')}
                        placeholder="Private marking"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Special Instructions</Label>
                      <Textarea
                        {...form.register('special_instructions')}
                        placeholder="Handling instructions"
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Remarks</Label>
                      <Textarea
                        {...form.register('remarks')}
                        placeholder="Additional notes"
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </FormSection>

                {/* Invoice Information */}
                <FormSection
                  title="Invoice Information"
                  icon={<Receipt className="h-5 w-5" />}
                  color="teal"
                  expanded={expandedSections.invoice}
                  onToggle={() => toggleSection('invoice')}
                >
                  <div className="space-y-4">
                    <label className={cn(
                      "flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                      watchedValues.has_invoice 
                        ? "border-teal-500 bg-teal-50" 
                        : "border-gray-200 hover:border-gray-300"
                    )}>
                      <Checkbox
                        id="has-invoice"
                        checked={form.watch('has_invoice')}
                        onCheckedChange={(checked) => form.setValue('has_invoice', !!checked)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-teal-600" />
                          <span className="font-medium">Has Invoice</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Include invoice details with shipment</p>
                      </div>
                    </label>

                    <AnimatePresence>
                      {watchedValues.has_invoice && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                        >
                          <div className="space-y-2">
                            <Label>Invoice Number</Label>
                            <Input
                              {...form.register('invoice_number')}
                              placeholder="INV-001"
                              className="h-11"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Invoice Amount (₹)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              {...form.register('invoice_amount', { valueAsNumber: true })}
                              placeholder="0.00"
                              className="h-11"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Invoice Date</Label>
                            <Input
                              type="date"
                              {...form.register('invoice_date')}
                              className="h-11"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>E-Way Bill Number</Label>
                            <Input
                              {...form.register('eway_bill_number')}
                              placeholder="12-digit number"
                              className="h-11"
                            />
                            {form.formState.errors.eway_bill_number && (
                              <p className="text-red-500 text-sm">{form.formState.errors.eway_bill_number.message}</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </FormSection>

                {/* Summary Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                      Booking Summary
                    </h3>
                    <Badge variant="default" className="text-lg px-3 py-1">
                      Total: ₹{totalAmount.toFixed(2)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Freight Charges</p>
                      <p className="text-xl font-semibold text-gray-900">₹{bookingArticles.reduce((sum, article) => sum + article.freight_amount, 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Additional Charges</p>
                      <p className="text-xl font-semibold text-gray-900">
                        ₹{bookingArticles.reduce((sum, article) => 
                          sum + article.total_loading_charges + article.total_unloading_charges + article.insurance_charge + article.packaging_charge, 0
                        ).toFixed(2)}
                      </p>
                      <div className="text-xs text-gray-500 mt-1">
                        Loading: ₹{bookingArticles.reduce((sum, article) => sum + article.total_loading_charges, 0).toFixed(2)}
                        <br />
                        Unloading: ₹{bookingArticles.reduce((sum, article) => sum + article.total_unloading_charges, 0).toFixed(2)}
                      </div>
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
                </motion.div>
              </div>
            </form>
          </div>

          {/* Enhanced Footer */}
          <motion.footer 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white border-t border-gray-200 shadow-lg"
          >
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={onClose}
                  className="min-w-[120px]"
                >
                  Cancel
                </Button>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                      ₹{totalAmount.toFixed(2)}
                    </p>
                  </div>
                  
                  <Button
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={submitting}
                    size="lg"
                    className="min-w-[180px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Create Booking
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.footer>
        </div>
      </div>
    </TooltipProvider>
  );
}