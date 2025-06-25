import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CreditCard, Calendar, User, FileText, Loader2, ArrowLeft, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCustomers } from '@/hooks/useCustomers';
import { useVendors } from '@/hooks/useVendors';
import { Combobox } from '@/components/ui/combobox';
import type { ComboboxOption } from '@/components/ui/combobox';

const customerSchema = z.object({
  amount: z.number().min(1, 'Amount must be at least 1'),
  date: z.string().min(1, 'Payment date is required'),
  method: z.enum(['Cash', 'Bank Transfer', 'UPI', 'Cheque']),
  reference: z.string().optional(),
  customerId: z.string().min(1, 'Customer is required'),
  invoiceNumber: z.string().optional(),
  notes: z.string().optional(),
});

const vendorSchema = customerSchema.extend({
  customerId: z.undefined(),
  vendorId: z.string().min(1, 'Vendor is required'),
});

type CustomerFormValues = z.infer<typeof customerSchema>;
type VendorFormValues = z.infer<typeof vendorSchema>;
type FormValues = CustomerFormValues | VendorFormValues;

interface Props {
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  loading?: boolean;
  mode?: 'customer' | 'vendor';
}

export default function PaymentForm({ onSubmit, onCancel, loading = false, mode = 'customer' }: Props) {
  const { customers } = useCustomers();
  const { vendors } = useVendors();
  const [customerSearch, setCustomerSearch] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(mode === 'vendor' ? vendorSchema : customerSchema),
    defaultValues: {
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      method: 'Cash',
      reference: '',
      ...(mode === 'vendor' ? { vendorId: '' } : { customerId: '' }),
      invoiceNumber: '',
      notes: '',
    },
  });
  
  // Format customers for combobox
  const customerOptions: ComboboxOption[] = customers.map(customer => ({
    value: customer.id,
    label: customer.name,
    icon: User,
    details: {
      mobile: customer.mobile,
      gst: customer.gst,
      email: customer.email
    }
  }));

  const vendorOptions: ComboboxOption[] = vendors.map(vendor => ({
    value: vendor.id,
    label: `${vendor.name} (${vendor.type})`,
    icon: User,
    details: {
      mobile: vendor.contact,
      gst: vendor.gst_number,
      email: vendor.email
    }
  }));
  
  const handleFormSubmit = async (data: FormValues) => {
    onSubmit(data);
  };
  
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Amount (₹) <span className="text-red-500">*</span></Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
            <Input
              type="number"
              min="1"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              placeholder="Enter payment amount"
              className="pl-8"
            />
          </div>
          {errors.amount && (
            <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>
          )}
        </div>
        
        <div>
          <Label>Payment Date <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="date"
              {...register('date')}
              className="pl-10"
            />
          </div>
          {errors.date && (
            <p className="text-sm text-red-500 mt-1">{errors.date.message}</p>
          )}
        </div>
        
        <div>
          <Label>Payment Method <span className="text-red-500">*</span></Label>
          <Select
            value={watch('method')}
            onValueChange={(value: 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque') => setValue('method', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              <SelectItem value="UPI">UPI</SelectItem>
              <SelectItem value="Cheque">Cheque</SelectItem>
            </SelectContent>
          </Select>
          {errors.method && (
            <p className="text-sm text-red-500 mt-1">{errors.method.message}</p>
          )}
        </div>
        
        <div>
          <Label>Reference Number</Label>
          <Input
            {...register('reference')}
            placeholder="Enter reference number (optional)"
          />
        </div>
        
        <div>
          <Label>
            {mode === 'vendor' ? 'Vendor' : 'Customer'}{' '}
            <span className="text-red-500">*</span>
          </Label>
          <Combobox
            options={mode === 'vendor' ? vendorOptions : customerOptions}
            value={watch(mode === 'vendor' ? 'vendorId' : 'customerId')}
            onValueChange={(value) =>
              setValue(mode === 'vendor' ? 'vendorId' : 'customerId', value)
            }
            placeholder={`Select ${mode === 'vendor' ? 'vendor' : 'customer'}`}
            searchPlaceholder={`Search ${mode === 'vendor' ? 'vendors' : 'customers'}...`}
            onSearchChange={mode === 'vendor' ? setVendorSearch : setCustomerSearch}
          />
          {mode === 'vendor' && errors.vendorId && (
            <p className="text-sm text-red-500 mt-1">{errors.vendorId.message}</p>
          )}
          {mode === 'customer' && errors.customerId && (
            <p className="text-sm text-red-500 mt-1">{errors.customerId.message}</p>
          )}
        </div>
        
        <div>
          <Label>Invoice Number</Label>
          <Input
            {...register('invoiceNumber')}
            placeholder="Enter invoice number (optional)"
          />
        </div>
        
        <div className="md:col-span-2">
          <Label>Notes</Label>
          <Textarea
            {...register('notes')}
            placeholder="Enter payment notes (optional)"
            rows={3}
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </Button>
        
        <Button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              Record Payment
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
