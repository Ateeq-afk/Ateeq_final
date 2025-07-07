import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Plus, 
  Trash2, 
  Calculator, 
  Package, 
  Weight, 
  IndianRupee, 
  AlertTriangle, 
  Info,
  CheckCircle2,
  Scale,
  ChevronDown,
  Edit3,
  X
} from 'lucide-react';
import { useArticles } from '@/hooks/useArticles';
import { useCustomers } from '@/hooks/useCustomers';
import { cn } from '@/lib/utils';

export interface BookingArticle {
  id: string;
  article_id: string;
  quantity: number;
  unit_of_measure: 'Nos' | 'Kg' | 'Tons' | 'Boxes' | 'Bags' | 'Bundles' | 'Meters' | 'Liters';
  actual_weight: number;
  charged_weight?: number;
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
  freight_amount?: number;
  total_loading_charges?: number;
  total_unloading_charges?: number;
  total_amount?: number;
}

interface BookingArticleManagerProps {
  articles: BookingArticle[];
  onArticlesChange: (articles: BookingArticle[]) => void;
  selectedCustomerId?: string;
  readonly?: boolean;
  branch_id?: string;
}

export default function BookingArticleManagerApple({ 
  articles, 
  onArticlesChange, 
  selectedCustomerId, 
  readonly = false 
}: BookingArticleManagerProps) {
  const { articles: availableArticles } = useArticles();
  const { customers } = useCustomers();
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Find selected customer for rate suggestions
  useEffect(() => {
    if (selectedCustomerId) {
      const customer = customers.find(c => c.id === selectedCustomerId);
      setSelectedCustomer(customer);
    }
  }, [selectedCustomerId, customers]);

  const addArticle = () => {
    if (readonly) return;
    
    const newArticle: BookingArticle = {
      id: `temp_${Date.now()}`,
      article_id: '',
      quantity: 1,
      unit_of_measure: 'Nos',
      actual_weight: 1,
      charged_weight: 1,
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
        
        // Auto-calculate charged weight if not manually set
        if (field === 'actual_weight' && !article.charged_weight) {
          updatedArticle.charged_weight = value;
        }
        
        // Auto-suggest rate based on article and customer
        if (field === 'article_id') {
          const selectedArticle = availableArticles.find(a => a.id === value);
          if (selectedArticle) {
            updatedArticle.rate_per_unit = selectedArticle.base_rate || 0;
            updatedArticle.unit_of_measure = selectedArticle.unit_of_measure as any || 'Nos';
            updatedArticle.description = selectedArticle.description || '';
            
            // Set rate type based on unit of measure
            if (['Kg', 'Tons'].includes(selectedArticle.unit_of_measure || '')) {
              updatedArticle.rate_type = 'per_kg';
            }
          }
        }
        
        // Validate charged weight >= actual weight
        if (field === 'charged_weight' && value < updatedArticle.actual_weight) {
          updatedArticle.charged_weight = updatedArticle.actual_weight;
        }
        
        return calculateTotals(updatedArticle);
      }
      return article;
    }));
  };

  const calculateTotals = (article: BookingArticle): BookingArticle => {
    const effectiveWeight = article.charged_weight || article.actual_weight;
    const weightToUse = article.rate_type === 'per_kg' ? effectiveWeight : article.quantity;
    
    const freight_amount = article.rate_per_unit * weightToUse;
    const total_loading_charges = article.loading_charge_per_unit * article.quantity;
    const total_unloading_charges = article.unloading_charge_per_unit * article.quantity;
    const total_amount = freight_amount + total_loading_charges + total_unloading_charges + 
                        article.insurance_charge + article.packaging_charge;
    
    return {
      ...article,
      freight_amount,
      total_loading_charges,
      total_unloading_charges,
      total_amount
    };
  };

  // Calculate totals
  const grandTotal = articles.reduce((sum, article) => sum + (article.total_amount || 0), 0);
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="p-8 text-center">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center"
          >
            <Package className="w-10 h-10 text-blue-500" />
          </motion.div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles added yet</h3>
          <p className="text-gray-600 mb-6">Add articles to calculate freight and pricing</p>
          <Button 
            onClick={addArticle} 
            disabled={readonly}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Article
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-2xl shadow-sm overflow-hidden",
        hasDuplicates && "border-red-300/50"
      )}
    >
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Articles & Pricing</h3>
              <p className="text-sm text-gray-600">{articles.length} item{articles.length !== 1 ? 's' : ''} added</p>
            </div>
          </div>
          
          {!readonly && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                onClick={addArticle}
                disabled={articles.length >= 50}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Article
              </Button>
            </motion.div>
          )}
        </div>
        
        {hasDuplicates && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 flex items-center gap-3 p-4 bg-red-50/80 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/30 rounded-xl"
          >
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-red-700 dark:text-red-300">
              Duplicate articles detected. Each article can only be added once per booking.
            </span>
          </motion.div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-8">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 mb-4 px-4 py-3 bg-gray-50/80 dark:bg-gray-800/30 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300">
          <div className="col-span-3">Article</div>
          <div className="col-span-1 text-center">Qty</div>
          <div className="col-span-1 text-center">UOM</div>
          <div className="col-span-1 text-center">Weight (kg)</div>
          <div className="col-span-1 text-center">Rate Type</div>
          <div className="col-span-1 text-center">Rate (₹)</div>
          <div className="col-span-1 text-center">Freight (₹)</div>
          <div className="col-span-1 text-center">Loading (₹)</div>
          <div className="col-span-1 text-center">Total (₹)</div>
          {!readonly && <div className="col-span-1"></div>}
        </div>

        {/* Article Rows */}
        <div className="space-y-3">
          <AnimatePresence>
            {articles.map((article, index) => {
              const isSelected = !!article.article_id;
              const isDuplicate = articles.filter(a => a.article_id === article.article_id && a.article_id).length > 1;
              const selectedArticle = availableArticles.find(a => a.id === article.article_id);
              
              return (
                <motion.div
                  key={article.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "grid grid-cols-12 gap-4 p-4 rounded-xl border transition-all duration-200",
                    isDuplicate ? "bg-red-50/80 dark:bg-red-950/20 border-red-200/50 dark:border-red-800/30" :
                    !isSelected ? "bg-amber-50/80 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30" :
                    "bg-white/50 dark:bg-gray-800/30 border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/50"
                  )}
                >
                  {/* Article Selection */}
                  <div className="col-span-3">
                    <Select
                      value={article.article_id}
                      onValueChange={(value) => updateArticle(article.id, 'article_id', value)}
                      disabled={readonly}
                    >
                      <SelectTrigger className={cn(
                        "h-10 bg-white/80 dark:bg-gray-900/50 border-gray-200/50 dark:border-gray-700/50",
                        isDuplicate && "border-red-300/50",
                        !isSelected && "border-amber-300/50"
                      )}>
                        <SelectValue placeholder="Select article..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableArticles.map((availableArticle) => (
                          <SelectItem 
                            key={availableArticle.id} 
                            value={availableArticle.id}
                            disabled={articles.some(a => a.article_id === availableArticle.id && a.id !== article.id)}
                          >
                            <div className="flex flex-col py-1">
                              <span className="font-medium">{availableArticle.name}</span>
                              <span className="text-xs text-gray-500">
                                Base Rate: ₹{availableArticle.base_rate} | {availableArticle.unit_of_measure}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isDuplicate && (
                      <div className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">Duplicate article</div>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="col-span-1">
                    <Input
                      type="number"
                      min="1"
                      max="999999"
                      value={article.quantity}
                      onChange={(e) => updateArticle(article.id, 'quantity', parseInt(e.target.value) || 1)}
                      className="h-10 text-center bg-white/80 dark:bg-gray-900/50 border-gray-200/50 dark:border-gray-700/50"
                      disabled={readonly}
                    />
                  </div>

                  {/* Unit of Measure */}
                  <div className="col-span-1">
                    <Select
                      value={article.unit_of_measure}
                      onValueChange={(value) => updateArticle(article.id, 'unit_of_measure', value)}
                      disabled={readonly}
                    >
                      <SelectTrigger className="h-10 bg-white/80 dark:bg-gray-900/50 border-gray-200/50 dark:border-gray-700/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['Nos', 'Kg', 'Tons', 'Boxes', 'Bags', 'Bundles', 'Meters', 'Liters'].map((unit) => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Weight */}
                  <div className="col-span-1">
                    <Input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={article.actual_weight}
                      onChange={(e) => updateArticle(article.id, 'actual_weight', parseFloat(e.target.value) || 0.1)}
                      className="h-10 text-center bg-white/80 dark:bg-gray-900/50 border-gray-200/50 dark:border-gray-700/50"
                      disabled={readonly}
                    />
                  </div>

                  {/* Rate Type */}
                  <div className="col-span-1">
                    <Select
                      value={article.rate_type}
                      onValueChange={(value) => updateArticle(article.id, 'rate_type', value)}
                      disabled={readonly}
                    >
                      <SelectTrigger className="h-10 bg-white/80 dark:bg-gray-900/50 border-gray-200/50 dark:border-gray-700/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="per_quantity">Per Qty</SelectItem>
                        <SelectItem value="per_kg">Per Kg</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Rate */}
                  <div className="col-span-1">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={article.rate_per_unit}
                      onChange={(e) => updateArticle(article.id, 'rate_per_unit', parseFloat(e.target.value) || 0)}
                      className="h-10 text-center bg-white/80 dark:bg-gray-900/50 border-gray-200/50 dark:border-gray-700/50"
                      disabled={readonly}
                    />
                  </div>

                  {/* Freight Amount */}
                  <div className="col-span-1">
                    <div className="h-10 flex items-center justify-center text-sm font-medium text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-950/20 rounded-lg">
                      ₹{(article.freight_amount || 0).toFixed(2)}
                    </div>
                  </div>

                  {/* Loading Charges */}
                  <div className="col-span-1">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={article.loading_charge_per_unit}
                      onChange={(e) => updateArticle(article.id, 'loading_charge_per_unit', parseFloat(e.target.value) || 0)}
                      className="h-10 text-center bg-white/80 dark:bg-gray-900/50 border-gray-200/50 dark:border-gray-700/50"
                      disabled={readonly}
                    />
                  </div>

                  {/* Total */}
                  <div className="col-span-1">
                    <div className="h-10 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg">
                      ₹{(article.total_amount || 0).toFixed(2)}
                    </div>
                  </div>

                  {/* Actions */}
                  {!readonly && (
                    <div className="col-span-1 flex justify-center">
                      {articles.length > 1 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeArticle(article.id)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent>Remove article</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/50 dark:border-blue-800/30 rounded-xl p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {articles.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Articles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {totalWeight.toFixed(2)} kg
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Weight</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                ₹{grandTotal.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Grand Total</div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}