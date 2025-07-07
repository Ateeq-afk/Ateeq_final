import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Minus, Calculator } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { useQuery } from '@tanstack/react-query';
import { customerService } from '../../services/customers';
import { billingService } from '../../services/billing';
import { Invoice, InvoiceLineItem, Customer, BillingCycle } from '../../types';

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  hsn_sac_code: z.string().optional(),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unit: z.string().default('nos'),
  rate: z.number().min(0, 'Rate must be non-negative'),
  cgst_rate: z.number().min(0).max(50).default(0),
  sgst_rate: z.number().min(0).max(50).default(0),
  igst_rate: z.number().min(0).max(50).default(0),
  cess_rate: z.number().min(0).max(50).default(0),
  discount_amount: z.number().min(0).default(0)
});

const invoiceSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  billing_cycle_id: z.string().optional(),
  invoice_date: z.string().min(1, 'Invoice date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  service_period_start: z.string().optional(),
  service_period_end: z.string().optional(),
  discount_amount: z.number().min(0).default(0),
  discount_percentage: z.number().min(0).max(100).default(0),
  place_of_supply: z.string().optional(),
  reverse_charge: z.boolean().default(false),
  notes: z.string().optional(),
  terms_and_conditions: z.string().optional(),
  payment_terms: z.string().optional(),
  line_items: z.array(lineItemSchema).min(1, 'At least one line item is required')
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  invoice?: Invoice;
  onSubmit: (data: InvoiceFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  invoice,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getCustomers()
  });

  const { data: billingCycles } = useQuery({
    queryKey: ['billing-cycles'],
    queryFn: () => billingService.getBillingCycles()
  });

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customer_id: invoice?.customer_id || '',
      billing_cycle_id: invoice?.billing_cycle_id || '',
      invoice_date: invoice?.invoice_date || new Date().toISOString().split('T')[0],
      due_date: invoice?.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      service_period_start: invoice?.service_period_start || '',
      service_period_end: invoice?.service_period_end || '',
      discount_amount: invoice?.discount_amount || 0,
      discount_percentage: invoice?.discount_percentage || 0,
      place_of_supply: invoice?.place_of_supply || '',
      reverse_charge: invoice?.reverse_charge || false,
      notes: invoice?.notes || '',
      terms_and_conditions: invoice?.terms_and_conditions || '',
      payment_terms: invoice?.payment_terms || 'Payment due within 30 days',
      line_items: invoice?.invoice_line_items?.map(item => ({
        description: item.description,
        hsn_sac_code: item.hsn_sac_code || '',
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        cgst_rate: item.cgst_rate,
        sgst_rate: item.sgst_rate,
        igst_rate: item.igst_rate,
        cess_rate: item.cess_rate,
        discount_amount: item.discount_amount
      })) || [{
        description: '',
        hsn_sac_code: '',
        quantity: 1,
        unit: 'nos',
        rate: 0,
        cgst_rate: 0,
        sgst_rate: 0,
        igst_rate: 0,
        cess_rate: 0,
        discount_amount: 0
      }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'line_items'
  });

  const watchedLineItems = form.watch('line_items');
  const watchedCustomerId = form.watch('customer_id');
  const watchedDiscountAmount = form.watch('discount_amount');
  const watchedDiscountPercentage = form.watch('discount_percentage');

  // Update selected customer when customer_id changes
  useEffect(() => {
    if (watchedCustomerId && customers) {
      const customer = customers.find((c: Customer) => c.id === watchedCustomerId);
      setSelectedCustomer(customer || null);
      if (customer) {
        form.setValue('place_of_supply', customer.state || '');
      }
    }
  }, [watchedCustomerId, customers, form]);

  // Calculate line item totals
  const calculateLineItemTotals = (index: number) => {
    const item = watchedLineItems[index];
    if (!item) return null;

    const amount = item.quantity * item.rate;
    const discountedAmount = amount - (item.discount_amount || 0);
    
    const isIGST = selectedCustomer?.state !== 'Your State'; // Replace with actual logic
    const gstRate = isIGST ? item.igst_rate : (item.cgst_rate + item.sgst_rate);
    const gstAmount = (discountedAmount * gstRate) / 100;
    const cessAmount = (discountedAmount * item.cess_rate) / 100;
    
    return {
      amount,
      taxableValue: discountedAmount,
      gstAmount,
      cessAmount,
      totalAmount: discountedAmount + gstAmount + cessAmount
    };
  };

  // Calculate invoice totals
  const calculateInvoiceTotals = () => {
    let subtotal = 0;
    let totalTaxableAmount = 0;
    let totalTaxAmount = 0;
    let totalAmount = 0;

    watchedLineItems.forEach((_, index) => {
      const totals = calculateLineItemTotals(index);
      if (totals) {
        subtotal += totals.amount;
        totalTaxableAmount += totals.taxableValue;
        totalTaxAmount += totals.gstAmount + totals.cessAmount;
        totalAmount += totals.totalAmount;
      }
    });

    // Apply invoice-level discount
    const invoiceDiscount = watchedDiscountPercentage > 0 
      ? (subtotal * watchedDiscountPercentage) / 100
      : watchedDiscountAmount;

    const finalTaxableAmount = totalTaxableAmount - invoiceDiscount;
    const finalTotalAmount = totalAmount - invoiceDiscount;

    return {
      subtotal,
      invoiceDiscount,
      totalTaxableAmount: finalTaxableAmount,
      totalTaxAmount,
      totalAmount: finalTotalAmount
    };
  };

  const totals = calculateInvoiceTotals();

  const handleSubmit = async (data: InvoiceFormData) => {
    // Calculate final line items with taxes
    const processedLineItems = data.line_items.map((item, index) => {
      const itemTotals = calculateLineItemTotals(index);
      const isIGST = selectedCustomer?.state !== 'Your State'; // Replace with actual logic
      
      return {
        ...item,
        amount: itemTotals?.amount || 0,
        taxable_value: itemTotals?.taxableValue || 0,
        cgst_amount: isIGST ? 0 : (itemTotals?.taxableValue || 0) * (item.cgst_rate / 100),
        sgst_amount: isIGST ? 0 : (itemTotals?.taxableValue || 0) * (item.sgst_rate / 100),
        igst_amount: isIGST ? (itemTotals?.taxableValue || 0) * (item.igst_rate / 100) : 0,
        cess_amount: (itemTotals?.taxableValue || 0) * (item.cess_rate / 100),
        total_amount: itemTotals?.totalAmount || 0
      };
    });

    await onSubmit({
      ...data,
      line_items: processedLineItems
    });
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Invoice Header */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer_id">Customer *</Label>
              <Select
                value={form.watch('customer_id')}
                onValueChange={(value) => form.setValue('customer_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer: Customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.customer_id && (
                <p className="text-sm text-red-600">{form.formState.errors.customer_id.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="billing_cycle_id">Billing Cycle</Label>
              <Select
                value={form.watch('billing_cycle_id')}
                onValueChange={(value) => form.setValue('billing_cycle_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select billing cycle (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {billingCycles?.map((cycle: BillingCycle) => (
                    <SelectItem key={cycle.id} value={cycle.id}>
                      {cycle.name} ({cycle.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="invoice_date">Invoice Date *</Label>
              <Input
                type="date"
                {...form.register('invoice_date')}
              />
              {form.formState.errors.invoice_date && (
                <p className="text-sm text-red-600">{form.formState.errors.invoice_date.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="due_date">Due Date *</Label>
              <Input
                type="date"
                {...form.register('due_date')}
              />
              {form.formState.errors.due_date && (
                <p className="text-sm text-red-600">{form.formState.errors.due_date.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="service_period_start">Service Period Start</Label>
              <Input
                type="date"
                {...form.register('service_period_start')}
              />
            </div>

            <div>
              <Label htmlFor="service_period_end">Service Period End</Label>
              <Input
                type="date"
                {...form.register('service_period_end')}
              />
            </div>

            <div>
              <Label htmlFor="place_of_supply">Place of Supply</Label>
              <Input
                {...form.register('place_of_supply')}
                placeholder="State/UT"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="reverse_charge"
                {...form.register('reverse_charge')}
                className="rounded"
              />
              <Label htmlFor="reverse_charge">Reverse Charge Applicable</Label>
            </div>
          </div>

          {selectedCustomer && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Customer Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Name:</strong> {selectedCustomer.name}</p>
                  <p><strong>Phone:</strong> {selectedCustomer.phone}</p>
                  <p><strong>Email:</strong> {selectedCustomer.email}</p>
                </div>
                <div>
                  <p><strong>GSTIN:</strong> {selectedCustomer.gstin || 'Not provided'}</p>
                  <p><strong>Address:</strong> {selectedCustomer.address}</p>
                  <p><strong>State:</strong> {selectedCustomer.state}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Line Items</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({
                description: '',
                hsn_sac_code: '',
                quantity: 1,
                unit: 'nos',
                rate: 0,
                cgst_rate: 9,
                sgst_rate: 9,
                igst_rate: 0,
                cess_rate: 0,
                discount_amount: 0
              })}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fields.map((field, index) => {
              const totals = calculateLineItemTotals(index);
              return (
                <div key={field.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Label>Description *</Label>
                      <Input
                        {...form.register(`line_items.${index}.description`)}
                        placeholder="Item description"
                      />
                    </div>
                    <div>
                      <Label>HSN/SAC Code</Label>
                      <Input
                        {...form.register(`line_items.${index}.hsn_sac_code`)}
                        placeholder="HSN/SAC"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...form.register(`line_items.${index}.quantity`, {
                          valueAsNumber: true
                        })}
                      />
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Select
                        value={form.watch(`line_items.${index}.unit`)}
                        onValueChange={(value) => form.setValue(`line_items.${index}.unit`, value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nos">Nos</SelectItem>
                          <SelectItem value="kg">Kg</SelectItem>
                          <SelectItem value="ton">Ton</SelectItem>
                          <SelectItem value="box">Box</SelectItem>
                          <SelectItem value="pcs">Pieces</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Rate *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...form.register(`line_items.${index}.rate`, {
                          valueAsNumber: true
                        })}
                      />
                    </div>
                    <div>
                      <Label>Discount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...form.register(`line_items.${index}.discount_amount`, {
                          valueAsNumber: true
                        })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label>CGST Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...form.register(`line_items.${index}.cgst_rate`, {
                          valueAsNumber: true
                        })}
                      />
                    </div>
                    <div>
                      <Label>SGST Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...form.register(`line_items.${index}.sgst_rate`, {
                          valueAsNumber: true
                        })}
                      />
                    </div>
                    <div>
                      <Label>IGST Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...form.register(`line_items.${index}.igst_rate`, {
                          valueAsNumber: true
                        })}
                      />
                    </div>
                    <div>
                      <Label>Cess Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...form.register(`line_items.${index}.cess_rate`, {
                          valueAsNumber: true
                        })}
                      />
                    </div>
                  </div>

                  {totals && (
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>Amount: ₹{totals.amount.toFixed(2)}</div>
                        <div>Taxable: ₹{totals.taxableValue.toFixed(2)}</div>
                        <div>Tax: ₹{(totals.gstAmount + totals.cessAmount).toFixed(2)}</div>
                        <div className="font-medium">Total: ₹{totals.totalAmount.toFixed(2)}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Invoice Totals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Invoice Totals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label>Discount Amount</Label>
              <Input
                type="number"
                step="0.01"
                {...form.register('discount_amount', { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label>Discount Percentage (%)</Label>
              <Input
                type="number"
                step="0.01"
                {...form.register('discount_percentage', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>₹{totals.invoiceDiscount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxable Amount:</span>
              <span>₹{totals.totalTaxableAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Tax:</span>
              <span>₹{totals.totalTaxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total Amount:</span>
              <span>₹{totals.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              {...form.register('notes')}
              placeholder="Any additional notes for this invoice"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="terms_and_conditions">Terms & Conditions</Label>
            <Textarea
              {...form.register('terms_and_conditions')}
              placeholder="Terms and conditions"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="payment_terms">Payment Terms</Label>
            <Input
              {...form.register('payment_terms')}
              placeholder="Payment due within 30 days"
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : invoice ? 'Update Invoice' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  );
};