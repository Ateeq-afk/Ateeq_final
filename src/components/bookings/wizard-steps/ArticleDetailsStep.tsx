import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Weight, Hash, FileText, Scale, Plus, Minus, Calculator } from 'lucide-react';

interface ArticleDetailsStepProps {
  form: UseFormReturn<any>;
}

// Common article types
const ARTICLE_TYPES = [
  'Electronics', 'Clothing', 'Books', 'Furniture', 'Medicine', 
  'Food Items', 'Industrial Parts', 'Documents', 'Household Items', 'Others'
];

// Unit options
const UNIT_OPTIONS = [
  { value: 'pcs', label: 'Pieces (Pcs)' },
  { value: 'kg', label: 'Kilograms (Kg)' },
  { value: 'boxes', label: 'Boxes' },
  { value: 'cartons', label: 'Cartons' },
  { value: 'bags', label: 'Bags' },
  { value: 'rolls', label: 'Rolls' },
];

export const ArticleDetailsStep: React.FC<ArticleDetailsStepProps> = ({ form }) => {
  const { register, watch, setValue, formState: { errors } } = form;
  
  const quantity = watch('quantity') || 1;
  const actualWeight = watch('actual_weight') || 0;
  const chargedWeight = watch('charged_weight') || 0;
  const description = watch('description');
  const unit = watch('unit') || 'pcs';
  const articleType = watch('article_type');
  const dimensions = watch('dimensions');

  // Auto-calculate charged weight if not manually set
  React.useEffect(() => {
    if (!chargedWeight || chargedWeight === 0) {
      setValue('charged_weight', actualWeight);
    }
  }, [actualWeight, chargedWeight, setValue]);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, quantity + delta);
    setValue('quantity', newQuantity);
  };

  const handleWeightIncrement = (field: string, delta: number) => {
    const currentValue = watch(field) || 0;
    const newValue = Math.max(0, currentValue + delta);
    setValue(field, newValue);
  };

  return (
    <div className="space-y-6">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Package className="h-5 w-5 text-orange-600" />
          <h3 className="font-medium text-orange-900">Article Information</h3>
        </div>
        <p className="text-sm text-orange-700">
          Provide detailed information about the items being shipped. Accurate weight and description ensure proper handling.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Article Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Article Description
              <Badge variant="secondary" className="text-xs">Required</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="description">
                Item Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe the items being shipped (e.g., Electronics - Laptop computers, Books - Educational materials)"
                className={`resize-none ${errors.description ? 'border-red-500' : ''}`}
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="article_type">Article Type</Label>
              <Select value={articleType} onValueChange={(value) => setValue('article_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select article type" />
                </SelectTrigger>
                <SelectContent>
                  {ARTICLE_TYPES.map((type) => (
                    <SelectItem key={type} value={type.toLowerCase()}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dimensions">Dimensions (L x W x H)</Label>
              <Input
                id="dimensions"
                {...register('dimensions')}
                placeholder="e.g., 50cm x 30cm x 20cm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quantity & Weight */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-5 w-5 text-green-600" />
              Quantity & Weight
              <Badge variant="secondary" className="text-xs">Required</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>
                Quantity <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="h-10 w-10 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setValue('quantity', parseInt(e.target.value) || 1)}
                    className={`text-center ${errors.quantity ? 'border-red-500' : ''}`}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(1)}
                  className="h-10 w-10 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Select value={unit} onValueChange={(value) => setValue('unit', value)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {errors.quantity && (
                <p className="text-sm text-red-600 mt-1">{errors.quantity.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="actual_weight">
                Actual Weight (kg) <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Weight className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="actual_weight"
                    type="number"
                    step="0.1"
                    min="0.1"
                    {...register('actual_weight', { valueAsNumber: true })}
                    placeholder="0.0"
                    className={`pl-10 ${errors.actual_weight ? 'border-red-500' : ''}`}
                  />
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleWeightIncrement('actual_weight', -0.5)}
                    className="h-8 w-8 p-0"
                  >
                    -
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleWeightIncrement('actual_weight', 0.5)}
                    className="h-8 w-8 p-0"
                  >
                    +
                  </Button>
                </div>
              </div>
              {errors.actual_weight && (
                <p className="text-sm text-red-600 mt-1">{errors.actual_weight.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="charged_weight">
                Charged Weight (kg)
                <Badge variant="outline" className="ml-2 text-xs">Auto-calculated</Badge>
              </Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Calculator className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="charged_weight"
                    type="number"
                    step="0.1"
                    min="0"
                    {...register('charged_weight', { valueAsNumber: true })}
                    placeholder="Auto-calculated from actual weight"
                    className="pl-10"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setValue('charged_weight', actualWeight)}
                  title="Reset to actual weight"
                >
                  Reset
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Charged weight is used for billing. Usually same as actual weight unless volumetric weight applies.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Article Summary */}
      <Card className="bg-gray-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-700">Article Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{quantity}</div>
              <div className="text-sm text-gray-600">{unit.toUpperCase()}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{actualWeight}</div>
              <div className="text-sm text-gray-600">Actual Weight (kg)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{chargedWeight}</div>
              <div className="text-sm text-gray-600">Charged Weight (kg)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {description ? '✓' : '○'}
              </div>
              <div className="text-sm text-gray-600">Description</div>
            </div>
          </div>

          {description && quantity > 0 && actualWeight > 0 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm">
                <strong>Summary:</strong> {quantity} {unit} of {description} 
                {articleType && ` (${articleType})`} weighing {actualWeight}kg 
                {chargedWeight !== actualWeight && ` (charged: ${chargedWeight}kg)`}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};