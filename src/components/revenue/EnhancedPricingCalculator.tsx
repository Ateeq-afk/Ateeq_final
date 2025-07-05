import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, IndianRupee, Truck, Package, Shield, AlertTriangle, Info, Target, Percent, TrendingUp, User, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useArticles } from '@/hooks/useArticles';
import { useCustomers } from '@/hooks/useCustomers';
import type { Article, Customer } from '@/types';

interface PricingCalculatorProps {
  onCalculationChange?: (calculation: PricingCalculation) => void;
  initialValues?: Partial<PricingInputs>;
  mode?: 'standalone' | 'embedded';
}

interface PricingInputs {
  articleId: string;
  customerId: string;
  quantity: number;
  weight: number;
  distance: number;
  urgency: 'standard' | 'express' | 'urgent';
  fragile: boolean;
  insurance: boolean;
  insuranceValue: number;
  packaging: 'basic' | 'premium' | 'custom';
  fuelSurcharge: boolean;
  seasonalAdjustment: boolean;
  bulkDiscount: boolean;
  loyaltyDiscount: number; // percentage
}

interface PricingCalculation {
  baseRate: number;
  freightCharges: number;
  loadingCharges: number;
  unloadingCharges: number;
  fuelSurcharge: number;
  insuranceCharges: number;
  packagingCharges: number;
  urgencyCharges: number;
  fragilityCharges: number;
  seasonalAdjustment: number;
  bulkDiscount: number;
  loyaltyDiscount: number;
  subtotal: number;
  taxes: number;
  total: number;
  profitMargin: number;
  profitAmount: number;
  competitiveAnalysis: {
    marketRate: number;
    pricePosition: 'competitive' | 'premium' | 'budget';
    recommendation: string;
  };
}

export default function EnhancedPricingCalculator({ onCalculationChange, initialValues, mode = 'standalone' }: PricingCalculatorProps) {
  const { articles } = useArticles();
  const { customers } = useCustomers();
  
  const [inputs, setInputs] = useState<PricingInputs>({
    articleId: '',
    customerId: '',
    quantity: 1,
    weight: 0,
    distance: 100,
    urgency: 'standard',
    fragile: false,
    insurance: false,
    insuranceValue: 0,
    packaging: 'basic',
    fuelSurcharge: true,
    seasonalAdjustment: true,
    bulkDiscount: true,
    loyaltyDiscount: 0,
    ...initialValues
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get selected article and customer
  const selectedArticle = useMemo(() => 
    articles.find(a => a.id === inputs.articleId), 
    [articles, inputs.articleId]
  );
  
  const selectedCustomer = useMemo(() => 
    customers.find(c => c.id === inputs.customerId), 
    [customers, inputs.customerId]
  );

  // Advanced pricing calculation with multiple factors
  const calculation = useMemo((): PricingCalculation => {
    if (!selectedArticle) {
      return {
        baseRate: 0, freightCharges: 0, loadingCharges: 0, unloadingCharges: 0,
        fuelSurcharge: 0, insuranceCharges: 0, packagingCharges: 0, urgencyCharges: 0,
        fragilityCharges: 0, seasonalAdjustment: 0, bulkDiscount: 0, loyaltyDiscount: 0,
        subtotal: 0, taxes: 0, total: 0, profitMargin: 30, profitAmount: 0,
        competitiveAnalysis: { marketRate: 0, pricePosition: 'competitive', recommendation: '' }
      };
    }

    let baseRate = selectedArticle.base_rate;
    
    // Distance-based freight calculation
    const distanceMultiplier = inputs.distance <= 50 ? 1 : 
                              inputs.distance <= 200 ? 1.2 : 
                              inputs.distance <= 500 ? 1.5 : 1.8;
    
    const freightCharges = baseRate * inputs.quantity * distanceMultiplier;
    
    // Loading/Unloading charges with special handling consideration
    const baseLoadingRate = selectedArticle.requires_special_handling ? 30 : 20;
    const baseUnloadingRate = selectedArticle.requires_special_handling ? 25 : 15;
    const loadingCharges = baseLoadingRate * inputs.quantity;
    const unloadingCharges = baseUnloadingRate * inputs.quantity;
    
    // Fuel surcharge (3-5% of freight based on current fuel prices)
    const fuelSurcharge = inputs.fuelSurcharge ? freightCharges * 0.04 : 0;
    
    // Insurance charges (0.5% of insured value)
    const insuranceCharges = inputs.insurance ? inputs.insuranceValue * 0.005 : 0;
    
    // Packaging charges
    const packagingRates = { basic: 0, premium: 50, custom: 100 };
    const packagingCharges = packagingRates[inputs.packaging] * inputs.quantity;
    
    // Urgency charges
    const urgencyMultipliers = { standard: 0, express: 0.25, urgent: 0.5 };
    const urgencyCharges = freightCharges * urgencyMultipliers[inputs.urgency];
    
    // Fragility charges (extra handling)
    const fragilityCharges = inputs.fragile ? freightCharges * 0.15 : 0;
    
    // Seasonal adjustment (peak season surcharge/discount)
    const currentMonth = new Date().getMonth();
    const isPeakSeason = [10, 11, 0, 1].includes(currentMonth); // Nov-Feb
    const seasonalRate = isPeakSeason ? 0.1 : -0.05;
    const seasonalAdjustment = inputs.seasonalAdjustment ? freightCharges * seasonalRate : 0;
    
    // Bulk discount (5% for 10+ items, 10% for 50+ items)
    let bulkDiscountRate = 0;
    if (inputs.bulkDiscount && inputs.quantity >= 50) bulkDiscountRate = 0.1;
    else if (inputs.bulkDiscount && inputs.quantity >= 10) bulkDiscountRate = 0.05;
    const bulkDiscount = freightCharges * bulkDiscountRate;
    
    // Customer loyalty discount
    const loyaltyDiscount = freightCharges * (inputs.loyaltyDiscount / 100);
    
    // Calculate subtotal
    const subtotal = freightCharges + loadingCharges + unloadingCharges + 
                    fuelSurcharge + insuranceCharges + packagingCharges + 
                    urgencyCharges + fragilityCharges + seasonalAdjustment - 
                    bulkDiscount - loyaltyDiscount;
    
    // Tax calculation (18% GST)
    const taxes = subtotal * 0.18;
    const total = subtotal + taxes;
    
    // Profit margin calculation
    const estimatedCosts = total * 0.70; // Assuming 70% cost ratio
    const profitAmount = total - estimatedCosts;
    const profitMargin = (profitAmount / total) * 100;
    
    // Competitive analysis
    const marketRate = baseRate * inputs.quantity * 1.4; // Estimated market rate
    const pricePosition: 'competitive' | 'premium' | 'budget' = 
      total > marketRate * 1.1 ? 'premium' : 
      total < marketRate * 0.9 ? 'budget' : 'competitive';
    
    const recommendation = 
      pricePosition === 'premium' ? 'Consider reducing optional charges for better competitiveness' :
      pricePosition === 'budget' ? 'Great value pricing - ensure service quality matches the price point' :
      'Well-positioned pricing in the market';

    return {
      baseRate,
      freightCharges,
      loadingCharges,
      unloadingCharges,
      fuelSurcharge,
      insuranceCharges,
      packagingCharges,
      urgencyCharges,
      fragilityCharges,
      seasonalAdjustment,
      bulkDiscount,
      loyaltyDiscount,
      subtotal,
      taxes,
      total,
      profitMargin,
      profitAmount,
      competitiveAnalysis: {
        marketRate,
        pricePosition,
        recommendation
      }
    };
  }, [selectedArticle, inputs]);

  // Notify parent component of calculation changes
  useEffect(() => {
    onCalculationChange?.(calculation);
  }, [calculation, onCalculationChange]);

  const updateInput = (key: keyof PricingInputs, value: any) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className={`space-y-6 ${mode === 'embedded' ? 'bg-transparent' : 'bg-white p-6 rounded-2xl shadow-lg border'}`}>
      {mode === 'standalone' && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calculator className="h-6 w-6 text-blue-600" />
              Advanced Pricing Calculator
            </h2>
            <p className="text-gray-600 mt-1">Dynamic pricing with multiple factors and market analysis</p>
          </div>
          <Badge variant={calculation.competitiveAnalysis.pricePosition === 'competitive' ? 'default' : 
                         calculation.competitiveAnalysis.pricePosition === 'premium' ? 'destructive' : 'secondary'}>
            {calculation.competitiveAnalysis.pricePosition}
          </Badge>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="options">Options</TabsTrigger>
          <TabsTrigger value="result">Pricing Result</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Article Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Article & Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Article</Label>
                  <Select value={inputs.articleId} onValueChange={(value) => updateInput('articleId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select article" />
                    </SelectTrigger>
                    <SelectContent>
                      {articles.map(article => (
                        <SelectItem key={article.id} value={article.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{article.name}</span>
                            <span className="text-sm text-gray-500 ml-2">₹{article.base_rate}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedArticle && (
                    <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                      <p>Base Rate: ₹{selectedArticle.base_rate}</p>
                      {selectedArticle.requires_special_handling && (
                        <p className="text-orange-600">⚠️ Requires special handling</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Customer</Label>
                  <Select value={inputs.customerId} onValueChange={(value) => updateInput('customerId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex items-center gap-2">
                            {customer.type === 'individual' ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                            <span>{customer.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCustomer && (
                    <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                      <p>Type: {selectedCustomer.type}</p>
                      <p>Mobile: {selectedCustomer.mobile}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Basic Parameters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Basic Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={inputs.quantity}
                      onChange={(e) => updateInput('quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <Label>Weight (kg)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={inputs.weight}
                      onChange={(e) => updateInput('weight', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Distance (km)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={inputs.distance}
                    onChange={(e) => updateInput('distance', parseInt(e.target.value) || 100)}
                  />
                  <div className="text-xs text-gray-600 mt-1">
                    Rate multiplier: {inputs.distance <= 50 ? '1.0x' : 
                                    inputs.distance <= 200 ? '1.2x' : 
                                    inputs.distance <= 500 ? '1.5x' : '1.8x'}
                  </div>
                </div>

                <div>
                  <Label>Service Level</Label>
                  <Select value={inputs.urgency} onValueChange={(value: any) => updateInput('urgency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (+0%)</SelectItem>
                      <SelectItem value="express">Express (+25%)</SelectItem>
                      <SelectItem value="urgent">Urgent (+50%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="options" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Service Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Service Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Fragile Item</Label>
                    <p className="text-xs text-gray-600">Extra handling charges (+15%)</p>
                  </div>
                  <Switch checked={inputs.fragile} onCheckedChange={(checked) => updateInput('fragile', checked)} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Insurance Required</Label>
                    <p className="text-xs text-gray-600">0.5% of insured value</p>
                  </div>
                  <Switch checked={inputs.insurance} onCheckedChange={(checked) => updateInput('insurance', checked)} />
                </div>

                {inputs.insurance && (
                  <div>
                    <Label>Insurance Value (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={inputs.insuranceValue}
                      onChange={(e) => updateInput('insuranceValue', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                )}

                <div>
                  <Label>Packaging Type</Label>
                  <Select value={inputs.packaging} onValueChange={(value: any) => updateInput('packaging', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic (Free)</SelectItem>
                      <SelectItem value="premium">Premium (+₹50/item)</SelectItem>
                      <SelectItem value="custom">Custom (+₹100/item)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Market Adjustments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Market Adjustments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Fuel Surcharge</Label>
                    <p className="text-xs text-gray-600">Current rate: 4% of freight</p>
                  </div>
                  <Switch checked={inputs.fuelSurcharge} onCheckedChange={(checked) => updateInput('fuelSurcharge', checked)} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Seasonal Adjustment</Label>
                    <p className="text-xs text-gray-600">Peak: +10%, Off-peak: -5%</p>
                  </div>
                  <Switch checked={inputs.seasonalAdjustment} onCheckedChange={(checked) => updateInput('seasonalAdjustment', checked)} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Bulk Discount</Label>
                    <p className="text-xs text-gray-600">10+ items: 5%, 50+ items: 10%</p>
                  </div>
                  <Switch checked={inputs.bulkDiscount} onCheckedChange={(checked) => updateInput('bulkDiscount', checked)} />
                </div>

                <div>
                  <Label>Customer Loyalty Discount (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={inputs.loyaltyDiscount}
                    onChange={(e) => updateInput('loyaltyDiscount', parseFloat(e.target.value) || 0)}
                  />
                  <div className="text-xs text-gray-600 mt-1">
                    Maximum 20% for premium customers
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="result" className="space-y-6">
          {/* Pricing Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" />
                  Detailed Pricing Breakdown
                </div>
                <Badge variant={calculation.profitMargin > 25 ? 'default' : 'destructive'}>
                  {calculation.profitMargin.toFixed(1)}% margin
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Base Charges */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Base Charges</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Freight Charges:</span>
                      <span>{formatCurrency(calculation.freightCharges)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Loading Charges:</span>
                      <span>{formatCurrency(calculation.loadingCharges)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unloading Charges:</span>
                      <span>{formatCurrency(calculation.unloadingCharges)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Additional Charges */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Additional Charges</h4>
                  <div className="space-y-2 text-sm">
                    {calculation.fuelSurcharge > 0 && (
                      <div className="flex justify-between">
                        <span>Fuel Surcharge:</span>
                        <span>{formatCurrency(calculation.fuelSurcharge)}</span>
                      </div>
                    )}
                    {calculation.insuranceCharges > 0 && (
                      <div className="flex justify-between">
                        <span>Insurance:</span>
                        <span>{formatCurrency(calculation.insuranceCharges)}</span>
                      </div>
                    )}
                    {calculation.packagingCharges > 0 && (
                      <div className="flex justify-between">
                        <span>Packaging:</span>
                        <span>{formatCurrency(calculation.packagingCharges)}</span>
                      </div>
                    )}
                    {calculation.urgencyCharges > 0 && (
                      <div className="flex justify-between">
                        <span>Urgency Charges:</span>
                        <span>{formatCurrency(calculation.urgencyCharges)}</span>
                      </div>
                    )}
                    {calculation.fragilityCharges > 0 && (
                      <div className="flex justify-between">
                        <span>Fragile Handling:</span>
                        <span>{formatCurrency(calculation.fragilityCharges)}</span>
                      </div>
                    )}
                    {calculation.seasonalAdjustment !== 0 && (
                      <div className="flex justify-between">
                        <span>Seasonal Adjustment:</span>
                        <span className={calculation.seasonalAdjustment > 0 ? 'text-red-600' : 'text-green-600'}>
                          {calculation.seasonalAdjustment > 0 ? '+' : ''}{formatCurrency(calculation.seasonalAdjustment)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Discounts */}
                {(calculation.bulkDiscount > 0 || calculation.loyaltyDiscount > 0) && (
                  <>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Discounts</h4>
                      <div className="space-y-2 text-sm">
                        {calculation.bulkDiscount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Bulk Discount:</span>
                            <span>-{formatCurrency(calculation.bulkDiscount)}</span>
                          </div>
                        )}
                        {calculation.loyaltyDiscount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Loyalty Discount:</span>
                            <span>-{formatCurrency(calculation.loyaltyDiscount)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between font-medium">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(calculation.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (18%):</span>
                    <span>{formatCurrency(calculation.taxes)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-green-600 bg-green-50 p-2 rounded">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(calculation.total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Market Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Competitive Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Market Rate (Est.):</span>
                  <span className="font-medium">{formatCurrency(calculation.competitiveAnalysis.marketRate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Your Price:</span>
                  <span className="font-bold text-blue-600">{formatCurrency(calculation.total)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Price Position:</span>
                  <Badge variant={calculation.competitiveAnalysis.pricePosition === 'competitive' ? 'default' : 
                                 calculation.competitiveAnalysis.pricePosition === 'premium' ? 'destructive' : 'secondary'}>
                    {calculation.competitiveAnalysis.pricePosition}
                  </Badge>
                </div>
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {calculation.competitiveAnalysis.recommendation}
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Profit Margin:</span>
                    <span>{calculation.profitMargin.toFixed(1)}%</span>
                  </div>
                  <Progress value={calculation.profitMargin} className="h-2" />
                  <div className="flex justify-between text-sm">
                    <span>Estimated Profit:</span>
                    <span className="font-medium text-green-600">{formatCurrency(calculation.profitAmount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {mode === 'standalone' && (
            <div className="flex justify-end space-x-3">
              <Button variant="outline">
                Save as Template
              </Button>
              <Button>
                Create Booking
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}