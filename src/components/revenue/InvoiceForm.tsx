import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileText, Calendar, User, Plus, Minus, Trash, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCustomers } from '@/hooks/useCustomers';
import { Combobox } from '@/components/ui/combobox';
import type { ComboboxOption } from '@/components/ui/combobox';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  customer: {
    id: string;
    name: string;
    email?: string;
  };
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  notes?: string;
  terms?: string;
}

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  date: z.string().min(1, 'Invoice date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  customerId: z.string().min(1, 'Customer is required'),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(
    z.object({
      description: z.string().min(1, 'Description is required'),
      quantity: z.number().min(1, 'Quantity must be at least 1'),
      rate: z.number().min(0, 'Rate must be a positive number'),
    })
  ).min(1, 'At least one item is required'),
});

type FormValues = z.infer<typeof invoiceSchema>;

interface Props {
  invoice?: Invoice;
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
}

export default function InvoiceForm({ invoice, onSubmit, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const { customers } = useCustomers();
  const [customerSearch, setCustomerSearch] = useState('');
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: invoice ? {
      invoiceNumber: invoice.invoiceNumber,
      date: new Date(invoice.date).toISOString().split('T')[0],
      dueDate: new Date(invoice.dueDate).toISOString().split('T')[0],
      customerId: invoice.customer.id,
      notes: invoice.notes || '',
      terms: invoice.terms || '',
      items: invoice.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
      })),
    } : {
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      customerId: '',
      notes: 'Thank you for your business!',
      terms: 'Payment is due within 30 days.',
      items: [
        {
          description: '',
          quantity: 1,
          rate: 0,
        },
      ],
    },
  });
  
  const items = watch('items');
  
  // Calculate total amount
  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  
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
  
  const handleAddItem = () => {
    setValue('items', [
      ...items,
      {
        description: '',
        quantity: 1,
        rate: 0,
      },
    ]);
  };
  
  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setValue('items', items.filter((_, i) => i !== index));
    }
  };
  
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setValue('items', newItems);
  };
  
  const handleFormSubmit = async (data: FormValues) => {
    try {
      setLoading(true);
      await onSubmit(data);
    } catch (error) {
      console.error('Failed to submit invoice:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Invoice Number</Label>
          <Input
            {...register('invoiceNumber')}
            placeholder="Enter invoice number"
          />
          {errors.invoiceNumber && (
            <p className="text-sm text-red-500 mt-1">{errors.invoiceNumber.message}</p>
          )}
        </div>
        
        <div>
          <Label>Customer</Label>
          <Combobox
            options={customerOptions}
            value={watch('customerId')}
            onValueChange={(value) => setValue('customerId', value)}
            placeholder="Select customer"
            searchPlaceholder="Search customers..."
            onSearchChange={setCustomerSearch}
          />
          {errors.customerId && (
            <p className="text-sm text-red-500 mt-1">{errors.customerId.message}</p>
          )}
        </div>
        
        <div>
          <Label>Invoice Date</Label>
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
          <Label>Due Date</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="date"
              {...register('dueDate')}
              className="pl-10"
            />
          </div>
          {errors.dueDate && (
            <p className="text-sm text-red-500 mt-1">{errors.dueDate.message}</p>
          )}
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Invoice Items</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddItem}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
        
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 items-end">
              <div className="col-span-5">
                <Label>Description</Label>
                <Input
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  placeholder="Enter item description"
                />
                {errors.items?.[index]?.description && (
                  <p className="text-sm text-red-500 mt-1">{errors.items[index].description?.message}</p>
                )}
              </div>
              
              <div className="col-span-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                  placeholder="Qty"
                />
                {errors.items?.[index]?.quantity && (
                  <p className="text-sm text-red-500 mt-1">{errors.items[index].quantity?.message}</p>
                )}
              </div>
              
              <div className="col-span-2">
                <Label>Rate (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.rate}
                  onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                  placeholder="Rate"
                />
                {errors.items?.[index]?.rate && (
                  <p className="text-sm text-red-500 mt-1">{errors.items[index].rate?.message}</p>
                )}
              </div>
              
              <div className="col-span-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={(item.quantity * item.rate).toFixed(2)}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              
              <div className="col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(index)}
                  disabled={items.length === 1}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          <div className="flex justify-end pt-4 border-t border-gray-200 mt-4">
            <div className="w-1/3">
              <div className="flex justify-between mb-2">
                <span className="font-medium">Total:</span>
                <span className="font-bold">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Notes</Label>
          <Textarea
            {...register('notes')}
            placeholder="Enter notes for the customer"
            rows={4}
          />
        </div>
        
        <div>
          <Label>Terms & Conditions</Label>
          <Textarea
            {...register('terms')}
            placeholder="Enter terms and conditions"
            rows={4}
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
              <FileText className="h-4 w-4" />
              {invoice ? 'Update Invoice' : 'Create Invoice'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}