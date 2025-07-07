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
  ChevronLeft,
  ChevronRight,
  Loader2,
  Truck,
  Shield,
  Clock,
  Building2,
  Phone,
  Mail,
  IndianRupee,
  Send,
  ArrowRight,
  Info,
  Sparkles,
  Navigation,
  Box,
  Receipt,
  Check
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
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

// Step configuration
const steps = [
  { id: 1, title: 'Route', icon: Navigation, description: 'Select origin and destination' },
  { id: 2, title: 'Customers', icon: Users, description: 'Sender and receiver details' },
  { id: 3, title: 'Articles', icon: Package, description: 'Add items to ship' },
  { id: 4, title: 'Invoice', icon: Receipt, description: 'Billing information' },
  { id: 5, title: 'Review', icon: CheckCircle2, description: 'Confirm booking details' }
];

// Step indicator component
const StepIndicator = ({ currentStep, steps }) => {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        const Icon = step.icon;

        return (
          <React.Fragment key={step.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={cn(
                  "relative w-12 h-12 rounded-2xl flex items-center justify-center",
                  "border-2 transition-all duration-300",
                  isActive && "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
                  isCompleted && "border-green-500 bg-green-50 dark:bg-green-900/20",
                  !isActive && !isCompleted && "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                )}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </motion.div>
                ) : (
                  <Icon className={cn(
                    "h-5 w-5",
                    isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-600"
                  )} />
                )}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-blue-500"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.1, opacity: 0 }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                className={cn(
                  "mt-2 text-xs font-medium",
                  isActive ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"
                )}
              >
                {step.title}
              </motion.p>
            </motion.div>
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2">
                <div className="h-0.5 bg-gray-200 dark:bg-gray-800 relative">
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-green-500"
                    initial={{ width: "0%" }}
                    animate={{ width: isCompleted ? "100%" : "0%" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  />
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Individual step components
const RouteStep = ({ form, branches }) => {
  const deliveryTypes = [
    { value: 'Standard', label: 'Standard', time: '3-5 days', icon: Truck, color: 'gray' },
    { value: 'Express', label: 'Express', time: '1-2 days', icon: Clock, color: 'blue' },
    { value: 'Same Day', label: 'Same Day', time: 'Today', icon: Sparkles, color: 'purple' }
  ];

  const priorities = [
    { value: 'Normal', label: 'Normal', color: 'gray' },
    { value: 'High', label: 'High', color: 'orange' },
    { value: 'Urgent', label: 'Urgent', color: 'red' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Origin Branch */}
        <div className="space-y-2">
          <Label htmlFor="from_branch" className="text-sm font-medium">
            Origin Branch
          </Label>
          <Select
            value={form.watch('from_branch')}
            onValueChange={(value) => form.setValue('from_branch', value)}
          >
            <SelectTrigger className="h-12 rounded-xl border-gray-200 dark:border-gray-800">
              <SelectValue placeholder="Select origin branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    {branch.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.from_branch && (
            <p className="text-xs text-red-500">{form.formState.errors.from_branch.message}</p>
          )}
        </div>

        {/* Destination Branch */}
        <div className="space-y-2">
          <Label htmlFor="to_branch" className="text-sm font-medium">
            Destination Branch
          </Label>
          <Select
            value={form.watch('to_branch')}
            onValueChange={(value) => form.setValue('to_branch', value)}
          >
            <SelectTrigger className="h-12 rounded-xl border-gray-200 dark:border-gray-800">
              <SelectValue placeholder="Select destination branch" />
            </SelectTrigger>
            <SelectContent>
              {branches
                .filter(b => b.id !== form.watch('from_branch'))
                .map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      {branch.name}
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {form.formState.errors.to_branch && (
            <p className="text-xs text-red-500">{form.formState.errors.to_branch.message}</p>
          )}
        </div>
      </div>

      {/* Delivery Type */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Delivery Type</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {deliveryTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = form.watch('delivery_type') === type.value;
            
            return (
              <motion.button
                key={type.value}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => form.setValue('delivery_type', type.value as any)}
                className={cn(
                  "relative p-4 rounded-xl border-2 transition-all",
                  "flex flex-col items-center gap-2 text-center",
                  isSelected 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                    : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                )}
              >
                <Icon className={cn(
                  "h-6 w-6",
                  isSelected ? "text-blue-600 dark:text-blue-400" : "text-gray-500"
                )} />
                <div>
                  <p className={cn(
                    "font-medium",
                    isSelected ? "text-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-gray-100"
                  )}>
                    {type.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{type.time}</p>
                </div>
                {isSelected && (
                  <motion.div
                    layoutId="selectedDelivery"
                    className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    <Check className="h-3 w-3 text-white" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Priority */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Priority</Label>
        <RadioGroup
          value={form.watch('priority')}
          onValueChange={(value) => form.setValue('priority', value as any)}
          className="flex gap-3"
        >
          {priorities.map((priority) => (
            <label
              key={priority.value}
              htmlFor={priority.value}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all",
                form.watch('priority') === priority.value
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
              )}
            >
              <RadioGroupItem value={priority.value} id={priority.value} />
              <span className="text-sm font-medium">{priority.label}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Expected Delivery Date */}
      <div className="space-y-2">
        <Label htmlFor="expected_delivery_date" className="text-sm font-medium">
          Expected Delivery Date
        </Label>
        <Input
          type="date"
          {...form.register('expected_delivery_date')}
          className="h-12 rounded-xl border-gray-200 dark:border-gray-800"
          min={new Date().toISOString().split('T')[0]}
        />
      </div>
    </motion.div>
  );
};

const CustomerStep = ({ form, customers }) => {
  const [showNewSender, setShowNewSender] = useState(false);
  const [showNewReceiver, setShowNewReceiver] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Sender Section */}
      <Card className="border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            Sender Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sender_id" className="text-sm font-medium">
              Select Sender
            </Label>
            <Select
              value={form.watch('sender_id')}
              onValueChange={(value) => {
                if (value === 'new') {
                  setShowNewSender(true);
                } else {
                  form.setValue('sender_id', value);
                  setShowNewSender(false);
                }
              }}
            >
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder="Choose existing or add new" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Add New Sender
                  </div>
                </SelectItem>
                <Separator className="my-1" />
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{customer.name}</span>
                      <span className="text-xs text-gray-500">{customer.phone}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showNewSender && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pt-4 border-t"
            >
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Name" className="h-12 rounded-xl" />
                <Input placeholder="Phone" className="h-12 rounded-xl" />
              </div>
              <Input placeholder="Email" type="email" className="h-12 rounded-xl" />
              <Textarea placeholder="Address" className="rounded-xl" rows={3} />
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Receiver Section */}
      <Card className="border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            Receiver Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="receiver_id" className="text-sm font-medium">
              Select Receiver
            </Label>
            <Select
              value={form.watch('receiver_id')}
              onValueChange={(value) => {
                if (value === 'new') {
                  setShowNewReceiver(true);
                } else {
                  form.setValue('receiver_id', value);
                  setShowNewReceiver(false);
                }
              }}
            >
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder="Choose existing or add new" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Add New Receiver
                  </div>
                </SelectItem>
                <Separator className="my-1" />
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{customer.name}</span>
                      <span className="text-xs text-gray-500">{customer.phone}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showNewReceiver && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pt-4 border-t"
            >
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Name" className="h-12 rounded-xl" />
                <Input placeholder="Phone" className="h-12 rounded-xl" />
              </div>
              <Input placeholder="Email" type="email" className="h-12 rounded-xl" />
              <Textarea placeholder="Address" className="rounded-xl" rows={3} />
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ArticleStep = ({ articles, setArticles, availableArticles }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <Card className="border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            Articles to Ship
          </CardTitle>
          <CardDescription>
            Add items with their details and pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PremiumBookingArticleManager
            articles={articles}
            setArticles={setArticles}
            availableArticles={availableArticles}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};

const InvoiceStep = ({ form }) => {
  const paymentTypes = [
    { value: 'Paid', label: 'Paid', icon: CheckCircle2, color: 'green' },
    { value: 'To Pay', label: 'To Pay', icon: Clock, color: 'orange' },
    { value: 'Quotation', label: 'Quotation', icon: FileText, color: 'blue' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Payment Type */}
      <Card className="border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {paymentTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = form.watch('payment_type') === type.value;
              
              return (
                <motion.button
                  key={type.value}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => form.setValue('payment_type', type.value as any)}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all",
                    "flex flex-col items-center gap-2",
                    isSelected 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                      : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5",
                    isSelected ? "text-blue-600 dark:text-blue-400" : "text-gray-500"
                  )} />
                  <span className={cn(
                    "text-sm font-medium",
                    isSelected ? "text-blue-900 dark:text-blue-100" : "text-gray-700 dark:text-gray-300"
                  )}>
                    {type.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Invoice Details */}
      <Card className="border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Receipt className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            Invoice Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="has_invoice"
              checked={form.watch('has_invoice')}
              onCheckedChange={(checked) => form.setValue('has_invoice', checked as boolean)}
            />
            <Label htmlFor="has_invoice" className="text-sm cursor-pointer">
              This shipment has an invoice
            </Label>
          </div>

          {form.watch('has_invoice') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pt-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice_number">Invoice Number</Label>
                  <Input
                    id="invoice_number"
                    {...form.register('invoice_number')}
                    className="h-12 rounded-xl"
                    placeholder="INV-2024-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice_date">Invoice Date</Label>
                  <Input
                    id="invoice_date"
                    type="date"
                    {...form.register('invoice_date')}
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice_amount">Invoice Amount</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="invoice_amount"
                    type="number"
                    {...form.register('invoice_amount', { valueAsNumber: true })}
                    className="h-12 rounded-xl pl-10"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </motion.div>
          )}

          <div className="space-y-2">
            <Label htmlFor="eway_bill_number">E-Way Bill Number (Optional)</Label>
            <Input
              id="eway_bill_number"
              {...form.register('eway_bill_number')}
              className="h-12 rounded-xl"
              placeholder="123456789012"
            />
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card className="border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            Additional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reference_number">Reference Number (Optional)</Label>
            <Input
              id="reference_number"
              {...form.register('reference_number')}
              className="h-12 rounded-xl"
              placeholder="Your internal reference"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Textarea
              id="remarks"
              {...form.register('remarks')}
              className="rounded-xl"
              rows={3}
              placeholder="Any special instructions or notes"
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ReviewStep = ({ form, articles, branches, customers }) => {
  const fromBranch = branches.find(b => b.id === form.watch('from_branch'));
  const toBranch = branches.find(b => b.id === form.watch('to_branch'));
  const sender = customers.find(c => c.id === form.watch('sender_id'));
  const receiver = customers.find(c => c.id === form.watch('receiver_id'));

  const totalAmount = articles.reduce((sum, article) => sum + (article.total_charge || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Summary Card */}
      <Card className="border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg">Booking Summary</CardTitle>
          <CardDescription>Review your booking details before confirming</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Route Summary */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Route</p>
                <p className="font-medium">{fromBranch?.name} → {toBranch?.name}</p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="mb-1">
                {form.watch('delivery_type')}
              </Badge>
              <p className="text-xs text-gray-500">Priority: {form.watch('priority')}</p>
            </div>
          </div>

          {/* Customer Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-gray-500" />
                <p className="text-sm font-medium text-gray-500">Sender</p>
              </div>
              <p className="font-medium">{sender?.name}</p>
              <p className="text-sm text-gray-500">{sender?.phone}</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-gray-500" />
                <p className="text-sm font-medium text-gray-500">Receiver</p>
              </div>
              <p className="font-medium">{receiver?.name}</p>
              <p className="text-sm text-gray-500">{receiver?.phone}</p>
            </div>
          </div>

          {/* Articles Summary */}
          <div>
            <h4 className="font-medium mb-3">Articles ({articles.length})</h4>
            <div className="space-y-2">
              {articles.map((article, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                  <div>
                    <p className="font-medium">{article.article_name}</p>
                    <p className="text-sm text-gray-500">
                      {article.quantity} × {article.weight}kg
                    </p>
                  </div>
                  <p className="font-medium">₹{article.total_charge?.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">Total Amount</p>
              <p className="text-sm text-gray-500">Payment: {form.watch('payment_type')}</p>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ₹{totalAmount.toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Message */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
        <CheckCircle2 className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          Please review all details carefully. Once confirmed, the booking will be created and an LR number will be generated.
        </AlertDescription>
      </Alert>
    </motion.div>
  );
};

export default function AppleBookingWizard() {
  const navigate = useNavigate();
  const { selectedBranch } = useBranchSelection();
  const { user } = useAuth();
  const { branches } = useBranches();
  const { customers } = useCustomers();
  const { articles: availableArticles } = useArticles();
  
  const [currentStep, setCurrentStep] = useState(1);
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

  // Auto-select branch
  useEffect(() => {
    if (selectedBranch && user) {
      if (user.role !== 'admin' || branches?.length === 1) {
        form.setValue('from_branch', selectedBranch.id);
      }
    }
  }, [selectedBranch, user, branches, form]);

  const handleNext = () => {
    // Validate current step before proceeding
    let fieldsToValidate: (keyof BookingFormData)[] = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['from_branch', 'to_branch', 'delivery_type', 'priority'];
        break;
      case 2:
        fieldsToValidate = ['sender_id', 'receiver_id'];
        break;
      case 3:
        if (bookingArticles.length === 0) {
          toast.error('Please add at least one article');
          return;
        }
        break;
    }

    // Trigger validation for specific fields
    if (fieldsToValidate.length > 0) {
      form.trigger(fieldsToValidate).then((isValid) => {
        if (isValid) {
          setCurrentStep(currentStep + 1);
        }
      });
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (data: BookingFormData) => {
    if (bookingArticles.length === 0) {
      toast.error('Please add at least one article');
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingData = {
        ...data,
        articles: bookingArticles.map(article => ({
          article_name: article.article_name,
          article_id: article.article_id,
          quantity: article.quantity,
          weight: article.weight,
          unit: article.unit || 'kg',
          rate: article.rate,
          labour_charge: article.labour_charge || 0,
          other_charge: article.other_charge || 0,
          total_charge: article.total_charge,
          pod_charge: article.pod_charge || 0,
          insurance_charge: article.insurance_charge || 0,
        })),
      };

      const response = await bookingService.create(bookingData);
      
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>Booking created successfully!</span>
        </div>
      );
      
      navigate(`/dashboard/bookings/${response.id}`);
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(error.message || 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard/bookings')}
            className="mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Bookings
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
                Create New Booking
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Follow the steps to create a shipment booking
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              <Shield className="h-3 w-3 mr-1" />
              Secure
            </Badge>
          </div>
        </motion.div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} steps={steps} />

        {/* Form */}
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <RouteStep key="route" form={form} branches={branches} />
            )}
            {currentStep === 2 && (
              <CustomerStep key="customer" form={form} customers={customers} />
            )}
            {currentStep === 3 && (
              <ArticleStep
                key="article"
                articles={bookingArticles}
                setArticles={setBookingArticles}
                availableArticles={availableArticles}
              />
            )}
            {currentStep === 4 && (
              <InvoiceStep key="invoice" form={form} />
            )}
            {currentStep === 5 && (
              <ReviewStep
                key="review"
                form={form}
                articles={bookingArticles}
                branches={branches}
                customers={customers}
              />
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between mt-8"
          >
            <Button
              type="button"
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {currentStep < 5 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="gap-2 bg-blue-500 hover:bg-blue-600"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 bg-green-500 hover:bg-green-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Create Booking
                  </>
                )}
              </Button>
            )}
          </motion.div>
        </form>
      </div>
    </div>
  );
}