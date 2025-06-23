import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, ArrowLeft, IndianRupee, FileText, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

// Validation schema
const formSchema = z.object({
  name: z.string().min(1, 'Article name is required'),
  description: z.string().optional(),
  base_rate: z.number().min(0, 'Base rate must be a positive number'),
  hsn_code: z.string().optional(),
  tax_rate: z.number().min(0, 'Tax rate must be a positive number').optional(),
  unit_of_measure: z.string().optional(),
  min_quantity: z.number().min(1, 'Minimum quantity must be at least 1').optional(),
  is_fragile: z.boolean().optional(),
  requires_special_handling: z.boolean().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  initialData?: Partial<FormValues>;
}

export default function ArticleForm({ onSubmit, onCancel, initialData }: Props) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...initialData,
      base_rate: initialData?.base_rate ?? 0,
      tax_rate: initialData?.tax_rate ?? 0,
      min_quantity: initialData?.min_quantity ?? 1,
      is_fragile: initialData?.is_fragile ?? false,
      requires_special_handling: initialData?.requires_special_handling ?? false,
      notes: initialData?.notes ?? '',
      unit_of_measure: initialData?.unit_of_measure ?? '',
    },
    mode: 'onChange',
  });

  const submitForm = async (data: FormValues) => {
    setSubmitting(true);
    try {
      await onSubmit(data);
    } catch (e) {
      console.error('Form submission error:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(submitForm)} className="bg-white rounded-xl shadow-lg p-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          className="-ml-4 mb-4 flex items-center gap-2"
          onClick={onCancel}
          type="button"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h2 className="text-2xl font-bold text-gray-900">
          {initialData ? 'Edit Article' : 'Add New Article'}
        </h2>
        <p className="text-gray-600 mt-1">
          {initialData ? 'Update article details' : 'Add a new article to your catalog'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div>
          <Label htmlFor="name">Article Name</Label>
          <div className="relative">
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter article name"
              className="pl-10"
            />
          </div>
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Enter description (optional)"
            rows={3}
          />
        </div>

        {/* Base Rate */}
        <div>
          <Label htmlFor="base_rate">Base Rate (₹)</Label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="base_rate"
              type="number"
              step="0.01"
              min="0"
              {...register('base_rate', { valueAsNumber: true })}
              placeholder="0.00"
              className="pl-10"
            />
          </div>
          {errors.base_rate && <p className="text-red-500 text-sm mt-1">{errors.base_rate.message}</p>}
        </div>

        {/* HSN Code */}
        <div>
          <Label htmlFor="hsn_code">HSN Code</Label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="hsn_code"
              {...register('hsn_code')}
              placeholder="Optional"
              className="pl-10"
            />
          </div>
        </div>

        {/* Tax Rate */}
        <div>
          <Label htmlFor="tax_rate">Tax Rate %</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
            <Input
              id="tax_rate"
              type="number"
              step="0.01"
              min="0"
              {...register('tax_rate', { valueAsNumber: true })}
              placeholder="Optional"
              className="pl-10"
            />
          </div>
        </div>

        {/* Unit of Measure */}
        <div>
          <Label htmlFor="unit_of_measure">Unit of Measure</Label>
          <Select
            id="unit_of_measure"
            defaultValue={initialData?.unit_of_measure || ''}
            onValueChange={(v) => setValue('unit_of_measure', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              {['kg','pcs','box','bundle','roll','meter','liter','ton'].map(u => (
                <SelectItem key={u} value={u}>{u.toUpperCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Min Quantity */}
        <div>
          <Label htmlFor="min_quantity">Min Quantity</Label>
          <Input
            id="min_quantity"
            type="number"
            min="1"
            step="1"
            {...register('min_quantity', { valueAsNumber: true })}
            placeholder="1"
          />
          {errors.min_quantity && <p className="text-red-500 text-sm mt-1">{errors.min_quantity.message}</p>}
        </div>

        {/* Flags */}
        <div className="flex items-center space-x-2">
          <input
            id="is_fragile"
            type="checkbox"
            {...register('is_fragile')}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Label htmlFor="is_fragile" className="font-normal">Fragile</Label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            id="requires_special_handling"
            type="checkbox"
            {...register('requires_special_handling')}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Label htmlFor="requires_special_handling" className="font-normal">Special Handling</Label>
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            {...register('notes')}
            placeholder="Additional notes (optional)"
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-8">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />{initialData ? 'Updating...' : 'Creating...'}</>
          ) : (
            initialData ? 'Update Article' : 'Create Article'
          )}
        </Button>
      </div>
    </form>
  );
}
