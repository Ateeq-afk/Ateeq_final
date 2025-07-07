import { useState, useEffect, memo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, User, Phone, FileText, Mail, MapPin, IndianRupee, Clock, Loader2, AlertTriangle, Shield, CreditCard, Calendar, Percent, FileSignature } from 'lucide-react';
import type { Customer } from '@/types';
import { useBranches } from '@/hooks/useBranches';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ValidatedInput, FormSection } from '@/components/ui/form-validation';
import { FormField, FormSelect } from '@/components/ui/form-field';
import { supabase } from '@/lib/supabaseClient';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { useDebounce } from '@/hooks/useDebounce';

const STORAGE_KEY = 'customer_form_data';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobile: z.string().min(10, 'Valid mobile number required'),
  gst: z.string().optional(),
  type: z.enum(['individual', 'company']),
  branch_id: z.string().min(1, 'Branch is required'),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  // Credit management fields
  category: z.enum(['Regular', 'Premium', 'Corporate']).default('Regular'),
  credit_limit: z.number().min(0).optional(),
  payment_terms: z.string().optional(),
  credit_status: z.enum(['Active', 'On Hold', 'Blocked', 'Suspended']).default('Active'),
  billing_cycle: z.enum(['Weekly', 'Biweekly', 'Monthly', 'Quarterly']).default('Monthly'),
  auto_invoice: z.boolean().default(false),
  portal_access: z.boolean().default(false),
  discount_percentage: z.number().min(0).max(100).default(0),
  sla_delivery_hours: z.number().min(0).default(48),
  sla_complaint_hours: z.number().min(0).default(24),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  initialData?: Partial<Customer>;
}

const CustomerForm = memo(function CustomerForm({ onSubmit, onCancel, initialData }: Props) {
  const { branches } = useBranches();
  const [activeTab, setActiveTab] = useState<'basic' | 'contact' | 'financial' | 'credit'>('basic');
  const [formData] = useState<FormValues | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { showError } = useNotificationSystem();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...formData,
      ...initialData,
      type: (initialData?.type as FormValues['type']) || formData?.type || 'individual',
      branch_id: initialData?.branch_id || formData?.branch_id || branches[0]?.id,
      credit_limit: initialData?.credit_limit || formData?.credit_limit || 0,
      category: (initialData?.category as FormValues['category']) || formData?.category || 'Regular',
      credit_status: (initialData?.credit_status as FormValues['credit_status']) || formData?.credit_status || 'Active',
      billing_cycle: (initialData?.billing_cycle as FormValues['billing_cycle']) || formData?.billing_cycle || 'Monthly',
      auto_invoice: initialData?.auto_invoice || formData?.auto_invoice || false,
      portal_access: initialData?.portal_access || formData?.portal_access || false,
      discount_percentage: initialData?.discount_percentage || formData?.discount_percentage || 0,
      sla_delivery_hours: initialData?.sla_delivery_hours || formData?.sla_delivery_hours || 48,
      sla_complaint_hours: initialData?.sla_complaint_hours || formData?.sla_complaint_hours || 24,
    },
    mode: 'onChange'
  });

  const customerType = watch('type');
  const branchId = watch('branch_id');
  const mobileNumber = watch('mobile');
  const debouncedMobile = useDebounce(mobileNumber, 500);

  // Check for duplicate mobile number in the same branch with debouncing
  useEffect(() => {
    const checkDuplicateMobile = async () => {
      if (!branchId || !debouncedMobile || debouncedMobile.length < 10) return;
      
      // Don't check if we're editing and this is the original mobile
      if (initialData && initialData.mobile === debouncedMobile && initialData.branch_id === branchId) {
        return;
      }
      
      setValidating(true);
      setValidationError(null);
      
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('id')
          .eq('branch_id', branchId)
          .eq('mobile', debouncedMobile);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          // If we're editing, check if the found customer is the same as the one we're editing
          if (initialData && data.some(c => c.id === initialData.id)) {
            // This is the same customer, no duplicate
            return;
          }
          
          setValidationError('A customer with this mobile number already exists for this branch');
        }
      } catch (err) {
        console.error('Error checking for duplicate mobile:', err);
      } finally {
        setValidating(false);
      }
    };
    
    checkDuplicateMobile();
  }, [branchId, debouncedMobile, initialData]);

  // Save form data to localStorage when it changes
  const watchAll = watch();
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(watchAll));
    } catch {
      // Ignore storage errors
    }
  }, [watchAll]);

  // Clear stored form data on successful submit or cancel
  const handleFormSubmit = async (data: FormValues) => {
    try {
      // Check for duplicate mobile number
      if (validationError) {
        showError('Validation Error', validationError);
        return;
      }
      
      await onSubmit(data);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Form submission failed:', err);
    }
  };

  const handleCancel = () => {
    localStorage.removeItem(STORAGE_KEY);
    onCancel();
  };

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Restore form data when tab becomes visible
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const data = JSON.parse(stored);
            Object.entries(data).forEach(([key, value]) => {
              setValue(key as keyof FormValues, value as any);
            });
          }
        } catch {
          // Ignore storage errors
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [setValue]);

  // Navigate between tabs with memoized callbacks
  const goToNextTab = useCallback(async () => {
    let fieldsToValidate: (keyof FormValues)[] = [];
    
    if (activeTab === 'basic') {
      fieldsToValidate = ['name', 'mobile', 'type', 'branch_id', 'gst'];
    } else if (activeTab === 'contact') {
      fieldsToValidate = ['email', 'address', 'city', 'state', 'pincode'];
    } else if (activeTab === 'financial') {
      fieldsToValidate = ['credit_limit', 'payment_terms'];
    }
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid && !validationError) {
      if (activeTab === 'basic') setActiveTab('contact');
      else if (activeTab === 'contact') setActiveTab('financial');
      else if (activeTab === 'financial') setActiveTab('credit');
    }
  }, [activeTab, trigger, validationError]);

  const goToPrevTab = useCallback(() => {
    if (activeTab === 'contact') setActiveTab('basic');
    else if (activeTab === 'financial') setActiveTab('contact');
    else if (activeTab === 'credit') setActiveTab('financial');
  }, [activeTab]);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="bg-white rounded-xl shadow-lg p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          {initialData ? 'Edit Customer' : 'Add New Customer'}
        </h2>
        <p className="text-gray-600 mt-1">
          {initialData ? 'Update customer details' : 'Add a new customer to your database'}
        </p>
      </div>

      {validationError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Validation Error</p>
            <p className="text-red-600 text-sm mt-1">{validationError}</p>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'basic' | 'contact' | 'financial' | 'credit')}>
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="contact">Contact Details</TabsTrigger>
          <TabsTrigger value="financial">Financial Info</TabsTrigger>
          <TabsTrigger value="credit">Credit Management</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <FormSelect
            label="Branch"
            error={errors.branch_id}
            required
          >
            <Select
              defaultValue={initialData?.branch_id || branches[0]?.id}
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
          </FormSelect>

          <FormSelect
            label="Customer Type"
            error={errors.type}
            required
          >
            <Select
              defaultValue={initialData?.type || 'individual'}
              onValueChange={(value) => setValue('type', value as FormValues['type'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="company">Company</SelectItem>
              </SelectContent>
            </Select>
          </FormSelect>

          <FormField
            label="Name"
            error={errors.name}
            required
            icon={customerType === 'individual' ? <User className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
          >
            <Input
              {...register('name')}
              placeholder="Enter customer name"
            />
          </FormField>

          <div>
            <Label>Mobile</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                {...register('mobile')}
                placeholder="Enter mobile number"
                className="pl-10"
              />
            </div>
            {errors.mobile && (
              <p className="text-sm text-red-500 mt-1">{errors.mobile.message}</p>
            )}
            {validating && (
              <div className="flex items-center gap-2 text-blue-600 mt-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs">Validating...</span>
              </div>
            )}
          </div>

          <div>
            <Label>GST Number {customerType === 'company' && <span className="text-red-500">*</span>}</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                {...register('gst')}
                placeholder="Enter GST number"
                className="pl-10"
              />
            </div>
            {errors.gst && (
              <p className="text-sm text-red-500 mt-1">{errors.gst.message}</p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="button" onClick={goToNextTab} disabled={!!validationError}>
              Next: Contact Details
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <div>
            <Label>Email (Optional)</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                {...register('email')}
                type="email"
                placeholder="Enter email address"
                className="pl-10"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label>Address (Optional)</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                {...register('address')}
                placeholder="Enter complete address"
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>City (Optional)</Label>
              <Input
                {...register('city')}
                placeholder="Enter city"
              />
            </div>

            <div>
              <Label>State (Optional)</Label>
              <Input
                {...register('state')}
                placeholder="Enter state"
              />
            </div>
          </div>

          <div>
            <Label>Pincode (Optional)</Label>
            <Input
              {...register('pincode')}
              placeholder="Enter pincode"
            />
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={goToPrevTab}>
              Back: Basic Info
            </Button>
            <Button type="button" onClick={goToNextTab}>
              Next: Financial Info
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div>
            <Label>Credit Limit (Optional)</Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                {...register('credit_limit', { valueAsNumber: true })}
                type="number"
                min="0"
                step="100"
                placeholder="Enter credit limit"
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label>Payment Terms (Optional)</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Select
                defaultValue={initialData?.payment_terms || ''}
                onValueChange={(value) => setValue('payment_terms', value)}
              >
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="Select payment terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="net15">Net 15 Days</SelectItem>
                  <SelectItem value="net30">Net 30 Days</SelectItem>
                  <SelectItem value="net45">Net 45 Days</SelectItem>
                  <SelectItem value="net60">Net 60 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={goToPrevTab}>
              Back: Contact Details
            </Button>
            <Button type="button" onClick={() => setActiveTab('credit')}>
              Next: Credit Management
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="credit" className="space-y-6">
          <FormSection title="Customer Category & Status">
            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label="Customer Category"
                error={errors.category}
                required
              >
                <Select
                  defaultValue={initialData?.category || 'Regular'}
                  onValueChange={(value) => setValue('category', value as FormValues['category'])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="Premium">Premium</SelectItem>
                    <SelectItem value="Corporate">Corporate</SelectItem>
                  </SelectContent>
                </Select>
              </FormSelect>

              <FormSelect
                label="Credit Status"
                error={errors.credit_status}
                required
              >
                <Select
                  defaultValue={initialData?.credit_status || 'Active'}
                  onValueChange={(value) => setValue('credit_status', value as FormValues['credit_status'])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                    <SelectItem value="Blocked">Blocked</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </FormSelect>
            </div>
          </FormSection>

          <FormSection title="Billing Configuration">
            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label="Billing Cycle"
                error={errors.billing_cycle}
                required
              >
                <Select
                  defaultValue={initialData?.billing_cycle || 'Monthly'}
                  onValueChange={(value) => setValue('billing_cycle', value as FormValues['billing_cycle'])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select billing cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Biweekly">Biweekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </FormSelect>

              <FormField
                label="Discount Percentage"
                error={errors.discount_percentage}
                icon={<Percent className="h-5 w-5" />}
              >
                <Input
                  {...register('discount_percentage', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="0"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="auto_invoice"
                  {...register('auto_invoice')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="auto_invoice" className="text-sm font-medium text-gray-700">
                  Enable Automated Invoicing
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="portal_access"
                  {...register('portal_access')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="portal_access" className="text-sm font-medium text-gray-700">
                  Enable Customer Portal Access
                </Label>
              </div>
            </div>
          </FormSection>

          <FormSection title="Service Level Agreement (SLA)">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Delivery SLA (hours)"
                error={errors.sla_delivery_hours}
                icon={<Clock className="h-5 w-5" />}
              >
                <Input
                  {...register('sla_delivery_hours', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  placeholder="48"
                />
              </FormField>

              <FormField
                label="Complaint Resolution SLA (hours)"
                error={errors.sla_complaint_hours}
                icon={<Clock className="h-5 w-5" />}
              >
                <Input
                  {...register('sla_complaint_hours', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  placeholder="24"
                />
              </FormField>
            </div>
          </FormSection>

          <FormField
            label="Internal Notes (Optional)"
            error={errors.notes}
            icon={<FileSignature className="h-5 w-5" />}
          >
            <textarea
              {...register('notes')}
              className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter any internal notes about this customer..."
            />
          </FormField>

          <div className="flex justify-between gap-4 mt-8">
            <Button type="button" variant="outline" onClick={() => setActiveTab('financial')}>
              Back: Financial Info
            </Button>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !!validationError}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : initialData ? 'Update Customer' : 'Add Customer'}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </form>
  );
});

export default CustomerForm;