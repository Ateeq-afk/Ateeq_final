import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  Scale
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

export default function BookingArticleManager({ 
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
        
        // Calculate freight amount whenever relevant fields change
        if (['rate_type', 'rate_per_unit', 'quantity', 'actual_weight', 'charged_weight'].includes(field)) {
          if (updatedArticle.rate_type === 'per_kg') {
            updatedArticle.freight_amount = (updatedArticle.charged_weight || updatedArticle.actual_weight) * updatedArticle.rate_per_unit;
          } else {
            updatedArticle.freight_amount = updatedArticle.quantity * updatedArticle.rate_per_unit;
          }
        }
        
        // Calculate total charges whenever quantity or per-unit charges change
        if (['quantity', 'loading_charge_per_unit', 'unloading_charge_per_unit'].includes(field)) {
          updatedArticle.total_loading_charges = updatedArticle.quantity * updatedArticle.loading_charge_per_unit;
          updatedArticle.total_unloading_charges = updatedArticle.quantity * updatedArticle.unloading_charge_per_unit;
        }
        
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Articles & Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No articles added yet</p>
          <Button onClick={addArticle} disabled={readonly}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Article
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(hasDuplicates && "border-red-200")}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Articles & Pricing
            <Badge variant="secondary">{articles.length} item{articles.length !== 1 ? 's' : ''}</Badge>
          </CardTitle>
          
          {!readonly && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={addArticle}
              disabled={articles.length >= 50}
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
      
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Article</TableHead>
                <TableHead className="w-[80px]">Qty</TableHead>
                <TableHead className="w-[80px]">UOM</TableHead>
                <TableHead className="w-[100px]">Weight (kg)</TableHead>
                <TableHead className="w-[120px]">Rate Type</TableHead>
                <TableHead className="w-[100px]">Rate (₹)</TableHead>
                <TableHead className="w-[100px]">Freight (₹)</TableHead>
                <TableHead className="w-[100px]">Loading (₹)</TableHead>
                <TableHead className="w-[100px]">Total (₹)</TableHead>
                {!readonly && <TableHead className="w-[50px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article, index) => {
                const isSelected = !!article.article_id;
                const isDuplicate = articles.filter(a => a.article_id === article.article_id && a.article_id).length > 1;
                const selectedArticle = availableArticles.find(a => a.id === article.article_id);
                
                return (
                  <TableRow key={article.id} className={cn(
                    isDuplicate && "bg-red-50",
                    !isSelected && "bg-gray-50"
                  )}>
                    {/* Article Selection */}
                    <TableCell>
                      <Select
                        value={article.article_id}
                        onValueChange={(value) => updateArticle(article.id, 'article_id', value)}
                        disabled={readonly}
                      >
                        <SelectTrigger className={cn(
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
                                  Base Rate: ₹{availableArticle.base_rate} | {availableArticle.unit_of_measure}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isDuplicate && (
                        <div className="text-xs text-red-600 mt-1">Duplicate article</div>
                      )}
                    </TableCell>

                    {/* Quantity */}
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        max="999999"
                        value={article.quantity}
                        onChange={(e) => updateArticle(article.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full"
                        disabled={readonly}
                      />
                    </TableCell>

                    {/* Unit of Measure */}
                    <TableCell>
                      <Select
                        value={article.unit_of_measure}
                        onValueChange={(value) => updateArticle(article.id, 'unit_of_measure', value)}
                        disabled={readonly}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Nos">Nos</SelectItem>
                          <SelectItem value="Kg">Kg</SelectItem>
                          <SelectItem value="Tons">Tons</SelectItem>
                          <SelectItem value="Boxes">Boxes</SelectItem>
                          <SelectItem value="Bags">Bags</SelectItem>
                          <SelectItem value="Bundles">Bundles</SelectItem>
                          <SelectItem value="Meters">Meters</SelectItem>
                          <SelectItem value="Liters">Liters</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Weight */}
                    <TableCell>
                      <div className="space-y-1">
                        <Input
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={article.actual_weight}
                          onChange={(e) => updateArticle(article.id, 'actual_weight', parseFloat(e.target.value) || 0.001)}
                          placeholder="Actual"
                          className="w-full"
                          disabled={readonly}
                        />
                        <Input
                          type="number"
                          min={article.actual_weight}
                          step="0.001"
                          value={article.charged_weight || ''}
                          onChange={(e) => updateArticle(article.id, 'charged_weight', parseFloat(e.target.value) || undefined)}
                          placeholder="Charged"
                          className="w-full text-xs"
                          disabled={readonly}
                        />
                      </div>
                    </TableCell>

                    {/* Rate Type */}
                    <TableCell>
                      <Select
                        value={article.rate_type}
                        onValueChange={(value) => updateArticle(article.id, 'rate_type', value)}
                        disabled={readonly}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per_quantity">
                            <div className="flex items-center gap-2">
                              <Scale className="h-3 w-3" />
                              Per Quantity
                            </div>
                          </SelectItem>
                          <SelectItem value="per_kg">
                            <div className="flex items-center gap-2">
                              <Weight className="h-3 w-3" />
                              Per Kg
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Rate */}
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={article.rate_per_unit}
                        onChange={(e) => updateArticle(article.id, 'rate_per_unit', parseFloat(e.target.value) || 0)}
                        className="w-full"
                        disabled={readonly}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {article.rate_type === 'per_kg' ? '₹/kg' : '₹/unit'}
                      </div>
                    </TableCell>

                    {/* Freight Amount */}
                    <TableCell>
                      <div className="font-medium text-green-600">
                        ₹{calculateFreightAmount(article).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {article.rate_type === 'per_kg' 
                          ? `${(article.charged_weight || article.actual_weight).toFixed(3)}kg × ₹${article.rate_per_unit}`
                          : `${article.quantity} × ₹${article.rate_per_unit}`
                        }
                      </div>
                    </TableCell>

                    {/* Loading Charges */}
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={article.loading_charge_per_unit}
                        onChange={(e) => updateArticle(article.id, 'loading_charge_per_unit', parseFloat(e.target.value) || 0)}
                        className="w-full"
                        placeholder="Per unit"
                        disabled={readonly}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Total: ₹{(article.loading_charge_per_unit * article.quantity).toFixed(2)}
                      </div>
                    </TableCell>

                    {/* Total Amount */}
                    <TableCell>
                      <div className="font-bold text-blue-600">
                        ₹{calculateTotalAmount(article).toFixed(2)}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    {!readonly && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArticle(article.id)}
                          disabled={articles.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="mt-6 flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Articles</p>
              <p className="text-xl font-bold text-blue-600">{articles.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Weight</p>
              <p className="text-xl font-bold text-gray-900">{totalWeight.toFixed(3)} kg</p>
            </div>
            {hasDuplicates && (
              <div className="text-center">
                <AlertTriangle className="h-6 w-6 text-red-500 mx-auto" />
                <p className="text-sm text-red-600">Fix Duplicates</p>
              </div>
            )}
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-600">Grand Total</p>
            <p className="text-3xl font-bold text-green-600">₹{grandTotal.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}