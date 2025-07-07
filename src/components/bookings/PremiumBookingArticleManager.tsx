import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Package, 
  Weight, 
  IndianRupee, 
  AlertTriangle, 
  CheckCircle2,
  Scale,
  Zap,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Box,
  Calculator,
  Truck,
  Info,
  HelpCircle
} from 'lucide-react';
import { useArticles } from '@/hooks/useArticles';
import { cn } from '@/lib/utils';

export interface BookingArticle {
  id: string;
  article_id: string;
  quantity: number;
  unit_of_measure: 'Nos' | 'Kg' | 'Tons' | 'Boxes' | 'Bags' | 'Bundles' | 'Meters' | 'Liters';
  actual_weight: number;
  charged_weight?: number;
  
  // Dimensional fields for volumetric weight calculation
  length?: number; // in cm
  width?: number;  // in cm
  height?: number; // in cm
  dimensional_factor?: number; // Default: 5000 for air, 6000 for ground
  
  declared_value?: number;
  rate_per_unit: number;
  rate_type: 'per_kg' | 'per_quantity';
  loading_charge_per_unit: number;
  unloading_charge_per_unit: number;
  insurance_required: boolean;
  insurance_value?: number;
  insurance_charge: number;
  packaging_charge: number;
  description?: string;
  private_mark_number?: string;
  is_fragile: boolean;
  special_instructions?: string;
  warehouse_location?: string;
  
  // Calculated fields (read-only)
  dimensional_weight?: number;
  freight_amount?: number;
  total_loading_charges?: number;
  total_unloading_charges?: number;
  total_amount?: number;
}

interface PremiumBookingArticleManagerProps {
  articles: BookingArticle[];
  onArticlesChange: (articles: BookingArticle[]) => void;
  selectedCustomerId?: string;
  readonly?: boolean;
}

export default function PremiumBookingArticleManager({ 
  articles, 
  onArticlesChange, 
  selectedCustomerId, 
  readonly = false 
}: PremiumBookingArticleManagerProps) {
  const { articles: availableArticles } = useArticles();

  // Dimensional weight calculation utility
  const calculateDimensionalWeight = (length: number, width: number, height: number, dimensionalFactor: number = 5000): number => {
    if (!length || !width || !height) return 0;
    return (length * width * height) / dimensionalFactor;
  };

  // Calculate charged weight (higher of actual vs dimensional weight)
  const calculateChargedWeight = (article: BookingArticle): number => {
    const dimensionalWeight = article.length && article.width && article.height 
      ? calculateDimensionalWeight(article.length, article.width, article.height, article.dimensional_factor || 5000)
      : 0;
    
    return Math.max(article.actual_weight, dimensionalWeight);
  };

  const addArticle = () => {
    if (readonly) return;
    
    const newArticle: BookingArticle = {
      id: `temp_${Date.now()}`,
      article_id: '',
      quantity: 1,
      unit_of_measure: 'Nos',
      actual_weight: 1,
      charged_weight: 1,
      length: 0,
      width: 0,
      height: 0,
      dimensional_factor: 5000, // Default for ground transport
      declared_value: 0,
      rate_per_unit: 0,
      rate_type: 'per_quantity',
      loading_charge_per_unit: 0,
      unloading_charge_per_unit: 0,
      insurance_required: false,
      insurance_value: 0,
      insurance_charge: 0,
      packaging_charge: 0,
      description: '',
      private_mark_number: '',
      is_fragile: false,
      special_instructions: '',
      warehouse_location: '',
      // Calculated fields
      dimensional_weight: 0,
      freight_amount: 0,
      total_loading_charges: 0,
      total_unloading_charges: 0,
      total_amount: 0
    };
    
    onArticlesChange([...articles, newArticle]);
  };

  const removeArticle = (id: string) => {
    if (readonly || articles.length <= 1) return;
    onArticlesChange(articles.filter(article => article.id !== id));
  };

  const updateArticle = (id: string, field: keyof BookingArticle, value: any) => {
    if (readonly) return;
    
    onArticlesChange(articles.map(article => {
      if (article.id === id) {
        const updatedArticle = { ...article, [field]: value };
        
        // Auto-suggest rate based on article and customer
        if (field === 'article_id') {
          const selectedArticle = availableArticles.find(a => a.id === value);
          if (selectedArticle) {
            updatedArticle.rate_per_unit = selectedArticle.base_rate || 0;
            updatedArticle.unit_of_measure = selectedArticle.unit_of_measure as any || 'Nos';
            updatedArticle.description = selectedArticle.description || selectedArticle.name || '';
            
            // Set rate type based on unit of measure
            if (['Kg', 'Tons'].includes(selectedArticle.unit_of_measure || '')) {
              updatedArticle.rate_type = 'per_kg';
            }
          }
        }
        
        // Calculate dimensional weight when dimensions change
        if (['length', 'width', 'height', 'dimensional_factor'].includes(field)) {
          if (updatedArticle.length && updatedArticle.width && updatedArticle.height) {
            updatedArticle.dimensional_weight = calculateDimensionalWeight(
              updatedArticle.length, 
              updatedArticle.width, 
              updatedArticle.height, 
              updatedArticle.dimensional_factor || 5000
            );
          } else {
            updatedArticle.dimensional_weight = 0;
          }
        }
        
        // Auto-calculate charged weight (higher of actual vs dimensional)
        const calculatedChargedWeight = calculateChargedWeight(updatedArticle);
        if (field !== 'charged_weight') {
          updatedArticle.charged_weight = calculatedChargedWeight;
        } else {
          // Manual charged weight must be at least the calculated value
          updatedArticle.charged_weight = Math.max(value, calculatedChargedWeight);
        }
        
        // Always recalculate all derived values to ensure consistency
        
        // Calculate freight amount
        if (updatedArticle.rate_type === 'per_kg') {
          updatedArticle.freight_amount = (updatedArticle.charged_weight || updatedArticle.actual_weight) * updatedArticle.rate_per_unit;
        } else {
          updatedArticle.freight_amount = updatedArticle.quantity * updatedArticle.rate_per_unit;
        }
        
        // Calculate total charges
        updatedArticle.total_loading_charges = updatedArticle.quantity * updatedArticle.loading_charge_per_unit;
        updatedArticle.total_unloading_charges = updatedArticle.quantity * updatedArticle.unloading_charge_per_unit;
        
        // Calculate total amount
        updatedArticle.total_amount = (updatedArticle.freight_amount || 0) + 
                                     (updatedArticle.total_loading_charges || 0) + 
                                     (updatedArticle.total_unloading_charges || 0) + 
                                     (updatedArticle.insurance_charge || 0) + 
                                     (updatedArticle.packaging_charge || 0);
        
        return updatedArticle;
      }
      return article;
    }));
  };

  const calculateFreightAmount = (article: BookingArticle): number => {
    if (article.rate_type === 'per_kg') {
      return (article.charged_weight || article.actual_weight) * article.rate_per_unit;
    } else {
      return article.quantity * article.rate_per_unit;
    }
  };

  const calculateTotalAmount = (article: BookingArticle): number => {
    const freightAmount = calculateFreightAmount(article);
    const loadingCharges = article.loading_charge_per_unit * article.quantity;
    const unloadingCharges = article.unloading_charge_per_unit * article.quantity;
    const insuranceCharge = article.insurance_required ? article.insurance_charge : 0;
    const packagingCharge = article.packaging_charge;
    
    return freightAmount + loadingCharges + unloadingCharges + insuranceCharge + packagingCharge;
  };

  const grandTotal = articles.reduce((sum, article) => sum + calculateTotalAmount(article), 0);
  const totalWeight = articles.reduce((sum, article) => sum + (article.charged_weight || article.actual_weight), 0);

  // Check for duplicate articles
  const duplicateArticles = new Set();
  const hasDuplicates = articles.some(article => {
    if (duplicateArticles.has(article.article_id) && article.article_id) {
      return true;
    }
    if (article.article_id) duplicateArticles.add(article.article_id);
    return false;
  });

  if (articles.length === 0) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Articles & Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
            <Package className="h-12 w-12 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No articles added yet</h3>
          <p className="text-gray-500 mb-6">Add articles to calculate pricing and create your booking</p>
          <Button 
            onClick={addArticle} 
            disabled={readonly}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add First Article
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("shadow-lg border-0 bg-white/80 backdrop-blur", hasDuplicates && "border-red-200")}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Articles & Pricing
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {articles.length} item{articles.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
          
          {!readonly && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={addArticle}
              disabled={articles.length >= 50}
              className="bg-white hover:bg-blue-50 border-blue-200 text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Article
            </Button>
          )}
        </div>
        
        {hasDuplicates && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Duplicate articles detected. Each article can only be added once per booking.</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <AnimatePresence>
          {articles.map((article, index) => {
            const isSelected = !!article.article_id;
            const isDuplicate = articles.filter(a => a.article_id === article.article_id && a.article_id).length > 1;
            const selectedArticle = availableArticles.find(a => a.id === article.article_id);
            
            return (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "border rounded-xl p-6 bg-gradient-to-r transition-all duration-200",
                  isDuplicate 
                    ? "from-red-50 to-red-100 border-red-300" 
                    : isSelected 
                      ? "from-blue-50 to-indigo-50 border-blue-200" 
                      : "from-gray-50 to-gray-100 border-gray-200"
                )}
              >
                {/* Article Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      isSelected ? "bg-blue-600 text-white" : "bg-gray-400 text-white"
                    )}>
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Article {index + 1}
                        {selectedArticle && (
                          <span className="ml-2 text-blue-600">• {selectedArticle.name}</span>
                        )}
                      </h4>
                      {isDuplicate && (
                        <p className="text-sm text-red-600">⚠️ Duplicate article</p>
                      )}
                    </div>
                  </div>
                  
                  {!readonly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArticle(article.id)}
                      disabled={articles.length === 1}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Article Details Grid */}
                <div className="grid lg:grid-cols-5 md:grid-cols-3 gap-4">
                  {/* Article Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Article <span className="text-red-500">*</span></Label>
                    <Select
                      value={article.article_id}
                      onValueChange={(value) => updateArticle(article.id, 'article_id', value)}
                      disabled={readonly}
                    >
                      <SelectTrigger className={cn(
                        "h-11",
                        isDuplicate && "border-red-300",
                        !isSelected && "border-orange-300"
                      )}>
                        <SelectValue placeholder="Select article" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableArticles.map((availableArticle) => (
                          <SelectItem 
                            key={availableArticle.id} 
                            value={availableArticle.id}
                            disabled={articles.some(a => a.article_id === availableArticle.id && a.id !== article.id)}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{availableArticle.name}</span>
                              <span className="text-xs text-gray-500">
                                ₹{availableArticle.base_rate} • {availableArticle.unit_of_measure}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantity */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      max="999999"
                      value={article.quantity}
                      onChange={(e) => updateArticle(article.id, 'quantity', parseInt(e.target.value) || 1)}
                      className="h-11"
                      disabled={readonly}
                    />
                  </div>

                  {/* Weight & Dimensions */}
                  <div className="space-y-2 lg:col-span-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Weight & Dimensions</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs max-w-48">
                            <strong>Actual Weight:</strong> Physical weight of goods<br/>
                            <strong>Dimensions:</strong> L×W×H in cm for volumetric calculation<br/>
                            <strong>Charged Weight:</strong> Higher of actual vs dimensional weight
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                      {/* Actual Weight */}
                      <div>
                        <Label className="text-xs text-gray-600">Actual Weight (kg)</Label>
                        <Input
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={article.actual_weight}
                          onChange={(e) => updateArticle(article.id, 'actual_weight', parseFloat(e.target.value) || 0.001)}
                          placeholder="0.000"
                          className="h-11"
                          disabled={readonly}
                        />
                      </div>
                      
                      {/* Length */}
                      <div>
                        <Label className="text-xs text-gray-600">Length (cm)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={article.length || ''}
                          onChange={(e) => updateArticle(article.id, 'length', parseFloat(e.target.value) || 0)}
                          placeholder="0.0"
                          className="h-11"
                          disabled={readonly}
                        />
                      </div>
                      
                      {/* Width */}
                      <div>
                        <Label className="text-xs text-gray-600">Width (cm)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={article.width || ''}
                          onChange={(e) => updateArticle(article.id, 'width', parseFloat(e.target.value) || 0)}
                          placeholder="0.0"
                          className="h-11"
                          disabled={readonly}
                        />
                      </div>
                      
                      {/* Height */}
                      <div>
                        <Label className="text-xs text-gray-600">Height (cm)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={article.height || ''}
                          onChange={(e) => updateArticle(article.id, 'height', parseFloat(e.target.value) || 0)}
                          placeholder="0.0"
                          className="h-11"
                          disabled={readonly}
                        />
                      </div>
                    </div>
                    
                    {/* Calculated weights display */}
                    {(article.dimensional_weight || 0) > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                        <div className="text-center">
                          <Label className="text-xs text-blue-600">Dimensional Weight</Label>
                          <p className="text-sm font-semibold text-blue-700">
                            {(article.dimensional_weight || 0).toFixed(2)} kg
                          </p>
                        </div>
                        <div className="text-center">
                          <Label className="text-xs text-green-600">Charged Weight</Label>
                          <p className="text-sm font-semibold text-green-700">
                            {(article.charged_weight || article.actual_weight).toFixed(2)} kg
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Manual charged weight override */}
                    <div>
                      <Label className="text-xs text-gray-600">Manual Charged Weight Override (optional)</Label>
                      <Input
                        type="number"
                        min={Math.max(article.actual_weight, article.dimensional_weight || 0)}
                        step="0.001"
                        value={article.charged_weight !== Math.max(article.actual_weight, article.dimensional_weight || 0) ? article.charged_weight : ''}
                        onChange={(e) => updateArticle(article.id, 'charged_weight', parseFloat(e.target.value) || undefined)}
                        placeholder={`Auto: ${Math.max(article.actual_weight, article.dimensional_weight || 0).toFixed(2)} kg`}
                        className="h-11"
                        disabled={readonly}
                      />
                    </div>
                  </div>

                  {/* Rate */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Rate</Label>
                    <div className="space-y-1">
                      <Select
                        value={article.rate_type}
                        onValueChange={(value) => updateArticle(article.id, 'rate_type', value)}
                        disabled={readonly}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per_quantity">Per Quantity</SelectItem>
                          <SelectItem value="per_kg">Per Kg</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={article.rate_per_unit}
                        onChange={(e) => updateArticle(article.id, 'rate_per_unit', parseFloat(e.target.value) || 0)}
                        className="h-11"
                        disabled={readonly}
                        placeholder="₹0.00"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Charges Grid */}
                <div className="grid lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Loading Charge (per unit)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={article.loading_charge_per_unit}
                      onChange={(e) => updateArticle(article.id, 'loading_charge_per_unit', parseFloat(e.target.value) || 0)}
                      className="h-11"
                      placeholder="₹0.00"
                      disabled={readonly}
                    />
                    <p className="text-xs text-gray-500">
                      Total: ₹{(article.loading_charge_per_unit * article.quantity).toFixed(2)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Unloading Charge (per unit)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={article.unloading_charge_per_unit}
                      onChange={(e) => updateArticle(article.id, 'unloading_charge_per_unit', parseFloat(e.target.value) || 0)}
                      className="h-11"
                      placeholder="₹0.00"
                      disabled={readonly}
                    />
                    <p className="text-xs text-gray-500">
                      Total: ₹{(article.unloading_charge_per_unit * article.quantity).toFixed(2)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Additional Charges</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-gray-600">Insurance</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={article.insurance_charge}
                          onChange={(e) => updateArticle(article.id, 'insurance_charge', parseFloat(e.target.value) || 0)}
                          className="h-11"
                          placeholder="₹0.00"
                          disabled={readonly}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Packaging</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={article.packaging_charge}
                          onChange={(e) => updateArticle(article.id, 'packaging_charge', parseFloat(e.target.value) || 0)}
                          className="h-11"
                          placeholder="₹0.00"
                          disabled={readonly}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Totals Display */}
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <DollarSign className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-medium text-green-700">Freight</span>
                      </div>
                      <p className="text-lg font-bold text-green-600">₹{calculateFreightAmount(article).toFixed(2)}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className="h-3 w-3 text-blue-600" />
                        <span className="text-xs font-medium text-blue-700">Loading</span>
                      </div>
                      <p className="text-lg font-bold text-blue-600">₹{(article.loading_charge_per_unit * article.quantity).toFixed(2)}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Truck className="h-3 w-3 text-orange-600" />
                        <span className="text-xs font-medium text-orange-700">Unloading</span>
                      </div>
                      <p className="text-lg font-bold text-orange-600">₹{(article.unloading_charge_per_unit * article.quantity).toFixed(2)}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Calculator className="h-3 w-3 text-purple-600" />
                        <span className="text-xs font-medium text-purple-700">Total</span>
                      </div>
                      <p className="text-xl font-bold text-purple-600">₹{calculateTotalAmount(article).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Grand Total Summary */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Articles</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{articles.length}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Weight className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Weight</span>
                </div>
                <p className="text-2xl font-bold text-gray-700">{totalWeight.toFixed(2)} kg</p>
              </div>
              {hasDuplicates && (
                <div className="text-center">
                  <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-1" />
                  <p className="text-sm text-red-600">Fix Duplicates</p>
                </div>
              )}
            </div>
            
            <div className="text-right">
              <div className="flex items-center justify-center gap-1 mb-1">
                <IndianRupee className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">Grand Total</span>
              </div>
              <p className="text-4xl font-bold text-green-600">₹{grandTotal.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}