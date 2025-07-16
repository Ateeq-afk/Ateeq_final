import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calculator, Zap, TrendingUp, DollarSign, Truck, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CustomerSelect } from '@/components/customers/CustomerSelect';
import { ArticleSelect } from '@/components/articles/ArticleSelect';
import { ratesService, PriceCalculationResponse } from '@/services/rates';
import { customersService } from '@/services/customers';
import { toast } from 'sonner';

interface PricingFormData {
  customer_id: string;
  from_location: string;
  to_location: string;
  article_id: string;
  weight: number;
  quantity: number;
  booking_date: string;
}

export function DynamicPricingCalculator() {
  const [formData, setFormData] = useState<PricingFormData>({
    customer_id: '',
    from_location: '',
    to_location: '',
    article_id: '',
    weight: 0,
    quantity: 1,
    booking_date: new Date().toISOString().split('T')[0],
  });

  const [calculation, setCalculation] = useState<PriceCalculationResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [applicableRate, setApplicableRate] = useState<any>(null);

  // Check for applicable rate contract when customer/route changes
  useEffect(() => {
    if (formData.customer_id && formData.from_location && formData.to_location && formData.weight > 0) {
      checkApplicableRate();
    }
  }, [formData.customer_id, formData.from_location, formData.to_location, formData.weight]);

  const checkApplicableRate = async () => {
    try {
      const response = await ratesService.getApplicableRate({
        customer_id: formData.customer_id,
        from_location: formData.from_location,
        to_location: formData.to_location,
        article_id: formData.article_id || undefined,
        weight: formData.weight,
        booking_date: formData.booking_date,
      });

      if (response.success) {
        setApplicableRate(response.data);
      }
    } catch (error) {
      console.error('Error checking applicable rate:', error);
    }
  };

  const calculatePrice = async () => {
    if (!formData.customer_id || !formData.from_location || !formData.to_location || formData.weight <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsCalculating(true);

      if (applicableRate?.hasRate && applicableRate.rate_contract) {
        // Use rate contract for calculation
        const response = await ratesService.calculatePrice({
          rate_contract_id: applicableRate.rate_contract.id,
          from_location: formData.from_location,
          to_location: formData.to_location,
          article_id: formData.article_id || undefined,
          weight: formData.weight,
          quantity: formData.quantity,
          booking_date: formData.booking_date,
        });

        if (response.success) {
          if (response.data) {
            setCalculation(response.data);
          } else {
            setCalculation(null);
            toast.error('No calculation data returned');
          }
        } else {
          toast.error(response.error || 'Failed to calculate price');
        }
      } else {
        // Manual calculation without rate contract
        const baseRate = 50; // Default rate per kg
        const baseAmount = formData.weight * baseRate;
        
        setCalculation({
          base_amount: baseAmount,
          surcharges: [
            { type: 'fuel', amount: baseAmount * 0.04, calculation_method: 'percentage', value: 4 },
          ],
          discounts: [],
          total_amount: baseAmount * 1.04,
        });
      }
    } catch (error) {
      toast.error('Failed to calculate price');
    } finally {
      setIsCalculating(false);
    }
  };

  const updateFormData = (field: keyof PricingFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Dynamic Pricing Calculator
          </CardTitle>
          <CardDescription>
            Calculate freight charges with dynamic pricing rules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Customer</Label>
            <CustomerSelect
              value={formData.customer_id}
              onChange={(value: string) => updateFormData('customer_id', value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From Location</Label>
              <Input
                value={formData.from_location}
                onChange={(e) => updateFormData('from_location', e.target.value)}
                placeholder="e.g., Mumbai"
              />
            </div>
            <div className="space-y-2">
              <Label>To Location</Label>
              <Input
                value={formData.to_location}
                onChange={(e) => updateFormData('to_location', e.target.value)}
                placeholder="e.g., Delhi"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Article (Optional)</Label>
            <ArticleSelect
              value={formData.article_id}
              onChange={(value: string) => updateFormData('article_id', value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Weight (kg)</Label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={formData.weight}
                onChange={(e) => updateFormData('weight', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => updateFormData('quantity', parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Booking Date</Label>
            <Input
              type="date"
              value={formData.booking_date}
              onChange={(e) => updateFormData('booking_date', e.target.value)}
            />
          </div>

          {/* Rate Contract Status */}
          {applicableRate && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4" />
                <span className="font-medium">Rate Contract Status</span>
              </div>
              {applicableRate.hasContract ? (
                applicableRate.hasRate ? (
                  <div className="text-sm">
                    <Badge variant="success" className="mb-2">
                      Contract Rate Available
                    </Badge>
                    <div>Contract: {applicableRate.rate_contract?.contract_number}</div>
                  </div>
                ) : (
                  <div className="text-sm">
                    <Badge variant="warning" className="mb-2">
                      No Rate Defined
                    </Badge>
                    <div>{applicableRate.message}</div>
                  </div>
                )
              ) : (
                <div className="text-sm">
                  <Badge variant="secondary" className="mb-2">
                    Standard Pricing
                  </Badge>
                  <div>No rate contract found for this customer</div>
                </div>
              )}
            </div>
          )}

          <Button 
            onClick={calculatePrice} 
            disabled={isCalculating}
            className="w-full"
          >
            {isCalculating ? 'Calculating...' : 'Calculate Price'}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Pricing Breakdown
          </CardTitle>
          <CardDescription>
            Detailed calculation with all charges and discounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {calculation ? (
            <div className="space-y-4">
              {/* Base Amount */}
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  <span className="font-medium">Base Freight</span>
                </div>
                <span className="font-semibold">₹{calculation.base_amount.toFixed(2)}</span>
              </div>

              {/* Surcharges */}
              {calculation.surcharges && calculation.surcharges.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <TrendingUp className="w-4 h-4" />
                    Surcharges
                  </div>
                  {calculation.surcharges.map((surcharge, index) => (
                    <div key={index} className="flex justify-between items-center text-sm pl-6">
                      <div className="capitalize">
                        {surcharge.type.replace('_', ' ')}
                        {surcharge.calculation_method === 'percentage' && (
                          <span className="text-muted-foreground ml-1">
                            ({surcharge.value}%)
                          </span>
                        )}
                      </div>
                      <span className="text-orange-600">+₹{surcharge.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Discounts */}
              {calculation.discounts && calculation.discounts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="w-4 h-4" />
                    Discounts
                  </div>
                  {calculation.discounts.map((discount, index) => (
                    <div key={index} className="flex justify-between items-center text-sm pl-6">
                      <div className="capitalize">
                        {discount.type.replace('_', ' ')}
                        {discount.percentage && (
                          <span className="text-muted-foreground ml-1">
                            ({discount.percentage}%)
                          </span>
                        )}
                      </div>
                      <span className="text-green-600">-₹{discount.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              {/* Total */}
              <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
                <span className="text-lg font-semibold">Total Amount</span>
                <span className="text-2xl font-bold text-primary">
                  ₹{calculation.total_amount.toFixed(2)}
                </span>
              </div>

              {/* Effective Rate */}
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <div>Rate per kg</div>
                  <div className="font-medium">
                    ₹{(calculation.total_amount / formData.weight).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div>Rate per unit</div>
                  <div className="font-medium">
                    ₹{(calculation.total_amount / formData.quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Enter details and click "Calculate Price" to see the breakdown
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}