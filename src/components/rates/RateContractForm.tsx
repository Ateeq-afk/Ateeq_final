import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CustomerSelect } from '@/components/customers/CustomerSelect';
import { ratesService, RateContract } from '@/services/rates';
import { toast } from 'sonner';

const rateContractSchema = z.object({
  contract_number: z.string().min(1, 'Contract number is required'),
  customer_id: z.string().min(1, 'Customer is required'),
  contract_type: z.enum(['standard', 'special', 'volume', 'seasonal']),
  valid_from: z.date({
    required_error: 'Valid from date is required',
  }),
  valid_until: z.date({
    required_error: 'Valid until date is required',
  }),
  minimum_business_commitment: z.number().optional(),
  payment_terms: z.string().optional(),
  credit_limit: z.number().optional(),
  base_discount_percentage: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  terms_and_conditions: z.string().optional(),
}).refine((data) => data.valid_until > data.valid_from, {
  message: 'Valid until date must be after valid from date',
  path: ['valid_until'],
});

type RateContractFormData = z.infer<typeof rateContractSchema>;

interface RateContractFormProps {
  contract?: RateContract;
  onSuccess?: () => void;
}

export function RateContractForm({ contract, onSuccess }: RateContractFormProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RateContractFormData>({
    resolver: zodResolver(rateContractSchema),
    defaultValues: {
      contract_number: contract?.contract_number || '',
      customer_id: contract?.customer_id || '',
      contract_type: contract?.contract_type || 'standard',
      valid_from: contract?.valid_from ? new Date(contract.valid_from) : new Date(),
      valid_until: contract?.valid_until ? new Date(contract.valid_until) : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      minimum_business_commitment: contract?.minimum_business_commitment || undefined,
      payment_terms: contract?.payment_terms || 'Net 30',
      credit_limit: contract?.credit_limit || undefined,
      base_discount_percentage: contract?.base_discount_percentage || undefined,
      notes: contract?.notes || '',
      terms_and_conditions: contract?.terms_and_conditions || '',
    },
  });

  const onSubmit = async (data: RateContractFormData) => {
    try {
      setIsSubmitting(true);
      
      const formattedData = {
        ...data,
        valid_from: format(data.valid_from, 'yyyy-MM-dd'),
        valid_until: format(data.valid_until, 'yyyy-MM-dd'),
      };

      const response = contract
        ? await ratesService.updateContract(contract.id, formattedData)
        : await ratesService.createContract(formattedData);

      if (response.success) {
        toast.success(contract ? 'Rate contract updated successfully' : 'Rate contract created successfully');
        if (onSuccess) {
          onSuccess();
        } else {
          navigate(`/rates/${response.data.id}`);
        }
      } else {
        toast.error(response.error || 'Failed to save rate contract');
      }
    } catch (error) {
      toast.error('An error occurred while saving the rate contract');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{contract ? 'Edit Rate Contract' : 'New Rate Contract'}</CardTitle>
            <CardDescription>
              Create a rate agreement with specific pricing terms for a customer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="contract_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Number</FormLabel>
                    <FormControl>
                      <Input placeholder="RC-2024-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <FormControl>
                      <CustomerSelect
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contract_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select contract type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="special">Special</SelectItem>
                        <SelectItem value="volume">Volume Based</SelectItem>
                        <SelectItem value="seasonal">Seasonal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment terms" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Immediate">Immediate</SelectItem>
                        <SelectItem value="Net 7">Net 7 Days</SelectItem>
                        <SelectItem value="Net 15">Net 15 Days</SelectItem>
                        <SelectItem value="Net 30">Net 30 Days</SelectItem>
                        <SelectItem value="Net 45">Net 45 Days</SelectItem>
                        <SelectItem value="Net 60">Net 60 Days</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valid_from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid From</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valid_until"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid Until</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < form.getValues('valid_from')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="base_discount_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Discount (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormDescription>
                      Default discount percentage for all bookings
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="credit_limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Limit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum outstanding amount allowed
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minimum_business_commitment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Business Commitment</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum monthly/yearly business volume
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Internal notes about this contract..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="terms_and_conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms and Conditions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Specific terms and conditions for this contract..."
                      className="resize-none"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/rates')}
            disabled={isSubmitting}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Saving...' : (contract ? 'Update Contract' : 'Create Contract')}
          </Button>
        </div>
      </form>
    </Form>
  );
}