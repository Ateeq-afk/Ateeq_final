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
import { useBranches } from '@/hooks/useBranches';
import type { Article } from '@/types';

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
  initialData?: Partial<Article>;
}

export default function ArticleForm({ onSubmit, onCancel, initialData }: Props) {
  const { branches } = useBranches();
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
      base_rate: initialData?.base_rate || 0,
      tax_rate: initialData?.tax_rate || 0,
      min_quantity: initialData?.min_quantity || 1,
      is_fragile: initialData?.is_fragile || false,
      requires_special_handling: initialData?.requires_special_handling || false,
    },
    mode: 'onChange'
  });

  const handleFormSubmit = async (data: FormValues) => {
    try {
      setSubmitting(true);
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="bg-white rounded-xl shadow-lg p-8">
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
        <div>
          <Label>Article Name</Label>
          <div className="relative">
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              {...register('name')}
              placeholder="Enter article name"
              className="pl-10"
            />
          </div>
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <Label>Description</Label>
          <Textarea
            {...register('description')}
            placeholder="Enter article description (optional)"
            rows={3}
          />
          {errors.description && (
            <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
          )}
        </div>

        <div>
          <Label>Base Rate (₹)</Label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register('base_rate', { valueAsNumber: true })}
              placeholder="Enter base rate"
              className="pl-10"
            />
          </div>
          {errors.base_rate && (
            <p className="text-sm text-red-500 mt-1">{errors.base_rate.message}</p>
          )}
        </div>

        <div>
          <Label>HSN Code (Optional)</Label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              {...register('hsn_code')}
              placeholder="Enter HSN code"
              className="pl-10"
            />
          </div>
          {errors.hsn_code && (
            <p className="text-sm text-red-500 mt-1">{errors.hsn_code.message}</p>
          )}
        </div>

        <div>
          <Label>Tax Rate % (Optional)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register('tax_rate', { valueAsNumber: true })}
              placeholder="Enter tax rate"
              className="pl-10"
            />
          </div>
          {errors.tax_rate && (
            <p className="text-sm text-red-500 mt-1">{errors.tax_rate.message}</p>
          )}
        </div>

        <div>
          <Label>Unit of Measure (Optional)</Label>
          <Select
            defaultValue={initialData?.unit_of_measure || ''}
            onValueChange={(value) => setValue('unit_of_measure', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select unit of measure" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kg">Kilogram (kg)</SelectItem>
              <SelectItem value="pcs">Pieces (pcs)</SelectItem>
              <SelectItem value="box">Box</SelectItem>
              <SelectItem value="bundle">Bundle</SelectItem>
              <SelectItem value="roll">Roll</SelectItem>
              <SelectItem value="meter">Meter</SelectItem>
              <SelectItem value="liter">Liter</SelectItem>
              <SelectItem value="ton">Ton</SelectItem>
              <SelectItem value="Fixed">Fixed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Minimum Quantity (Optional)</Label>
          <Input
            type="number"
            min="1"
            step="1"
            {...register('min_quantity', { valueAsNumber: true })}
            placeholder="Enter minimum quantity"
          />
          {errors.min_quantity && (
            <p className="text-sm text-red-500 mt-1">{errors.min_quantity.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_fragile"
            {...register('is_fragile')}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Label htmlFor="is_fragile" className="font-normal">
            Fragile Item
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="requires_special_handling"
            {...register('requires_special_handling')}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Label htmlFor="requires_special_handling" className="font-normal">
            Requires Special Handling
          </Label>
        </div>

        <div className="md:col-span-2">
          <Label>Additional Notes (Optional)</Label>
          <Textarea
            {...register('notes')}
            placeholder="Enter any additional notes about this article"
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-8">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting || !isValid}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {initialData ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            initialData ? 'Update Article' : 'Create Article'
          )}
        </Button>
      </div>
    </form>
  );
}