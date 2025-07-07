import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calculator, IndianRupee, TrendingUp, Zap, Plus, Minus } from 'lucide-react';

interface FreightCalculationStepProps {
  form: UseFormReturn<any>;
}

// Predefined rate slabs for quick selection
const RATE_PRESETS = [
  { label: 'Local (Same city)', rate: 50, color: 'green' },
  { label: 'Regional (100-300 km)', rate: 75, color: 'blue' },
  { label: 'Interstate (300+ km)', rate: 100, color: 'purple' },
  { label: 'Express', rate: 150, color: 'red' },
];

export const FreightCalculationStep: React.FC<FreightCalculationStepProps> = ({ form }) => {
  const { register, watch, setValue, formState: { errors } } = form;
  
  const quantity = watch('quantity') || 1;
  const chargedWeight = watch('charged_weight') || 0;
  const freightPerQty = watch('freight_per_qty') || 0;
  const totalFreight = watch('total_freight') || 0;
  const [calculationMethod, setCalculationMethod] = useState<'per_qty' | 'per_kg'>('per_qty');
  const [autoCalculate, setAutoCalculate] = useState(true);

  // Additional charges
  const loadingCharges = watch('loading_charges') || 0;
  const unloadingCharges = watch('unloading_charges') || 0;
  const gstAmount = watch('gst_amount') || 0;
  const [gstPercentage, setGstPercentage] = useState(18);

  // Auto-calculate total freight when relevant values change
  useEffect(() => {
    if (autoCalculate) {
      let calculated = 0;
      
      if (calculationMethod === 'per_qty') {
        calculated = quantity * freightPerQty;
      } else {
        calculated = chargedWeight * freightPerQty;
      }
      
      setValue('total_freight', calculated);
    }
  }, [quantity, chargedWeight, freightPerQty, calculationMethod, autoCalculate, setValue]);

  // Auto-calculate GST
  useEffect(() => {
    const baseAmount = totalFreight + loadingCharges + unloadingCharges;
    const calculatedGst = (baseAmount * gstPercentage) / 100;
    setValue('gst_amount', calculatedGst);
  }, [totalFreight, loadingCharges, unloadingCharges, gstPercentage, setValue]);

  const handleRatePreset = (rate: number) => {
    setValue('freight_per_qty', rate);
  };

  const handleChargeIncrement = (field: string, delta: number) => {
    const currentValue = watch(field) || 0;
    const newValue = Math.max(0, currentValue + delta);
    setValue(field, newValue);
  };

  const grandTotal = totalFreight + loadingCharges + unloadingCharges + gstAmount;

  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="h-5 w-5 text-red-600" />
          <h3 className="font-medium text-red-900">Freight Calculation</h3>
        </div>
        <p className="text-sm text-red-700">
          Calculate the total freight charges based on quantity, weight, and additional services. All amounts are in INR.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rate Configuration */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Rate Configuration
              <Badge variant="secondary" className="text-xs">Required</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Calculation Method */}
            <div>
              <Label className="text-sm font-medium">Calculation Method</Label>
              <div className="flex gap-3 mt-2">
                <Button
                  type="button"
                  variant={calculationMethod === 'per_qty' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCalculationMethod('per_qty')}
                  className="flex-1"
                >
                  Per Quantity
                </Button>
                <Button
                  type="button"
                  variant={calculationMethod === 'per_kg' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCalculationMethod('per_kg')}
                  className="flex-1"
                >
                  Per Kg
                </Button>
              </div>
            </div>

            {/* Rate Presets */}
            <div>
              <Label className="text-sm font-medium">Quick Rate Selection</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {RATE_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRatePreset(preset.rate)}
                    className="text-xs h-auto p-2 flex flex-col gap-1"
                  >
                    <span className="font-medium">₹{preset.rate}</span>
                    <span className="text-gray-500">{preset.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Rate Input */}
            <div>
              <Label htmlFor="freight_per_qty">
                Rate (₹ per {calculationMethod === 'per_qty' ? 'quantity' : 'kg'})
                <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="freight_per_qty"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('freight_per_qty', { valueAsNumber: true })}
                    placeholder="0.00"
                    className={`pl-10 ${errors.freight_per_qty ? 'border-red-500' : ''}`}
                  />
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleChargeIncrement('freight_per_qty', -10)}
                    className="h-8 w-8 p-0"
                  >
                    -
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleChargeIncrement('freight_per_qty', 10)}
                    className="h-8 w-8 p-0"
                  >
                    +
                  </Button>
                </div>
              </div>
              {errors.freight_per_qty && (
                <p className="text-sm text-red-600 mt-1">{errors.freight_per_qty.message}</p>
              )}
            </div>

            {/* Auto Calculate Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-calculate"
                checked={autoCalculate}
                onCheckedChange={setAutoCalculate}
              />
              <Label htmlFor="auto-calculate" className="text-sm">
                Auto-calculate total freight
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Calculation Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-5 w-5 text-green-600" />
              Freight Calculation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Calculation Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <div className="text-sm text-blue-700">Base Calculation</div>
                  <div className="font-medium text-blue-900">
                    {calculationMethod === 'per_qty' 
                      ? `${quantity} × ₹${freightPerQty}`
                      : `${chargedWeight}kg × ₹${freightPerQty}`
                    }
                  </div>
                </div>
                <div className="text-lg font-bold text-blue-900">
                  ₹{(calculationMethod === 'per_qty' ? quantity * freightPerQty : chargedWeight * freightPerQty).toFixed(2)}
                </div>
              </div>

              {/* Manual Total Override */}
              {!autoCalculate && (
                <div>
                  <Label htmlFor="total_freight">
                    Total Freight (₹) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="total_freight"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('total_freight', { valueAsNumber: true })}
                      placeholder="0.00"
                      className={`pl-10 ${errors.total_freight ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.total_freight && (
                    <p className="text-sm text-red-600 mt-1">{errors.total_freight.message}</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Charges */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-5 w-5 text-purple-600" />
            Additional Charges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="loading_charges">Loading Charges (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="loading_charges"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('loading_charges', { valueAsNumber: true })}
                  placeholder="0.00"
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="unloading_charges">Unloading Charges (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="unloading_charges"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('unloading_charges', { valueAsNumber: true })}
                  placeholder="0.00"
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="gst_percentage">GST Percentage (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="28"
                  value={gstPercentage}
                  onChange={(e) => setGstPercentage(parseFloat(e.target.value) || 0)}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Final Total */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-600" />
              Total Bill Summary
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Base Freight:</span>
                <span className="font-medium">₹{totalFreight.toFixed(2)}</span>
              </div>
              {loadingCharges > 0 && (
                <div className="flex justify-between">
                  <span>Loading Charges:</span>
                  <span className="font-medium">₹{loadingCharges.toFixed(2)}</span>
                </div>
              )}
              {unloadingCharges > 0 && (
                <div className="flex justify-between">
                  <span>Unloading Charges:</span>
                  <span className="font-medium">₹{unloadingCharges.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST ({gstPercentage}%):</span>
                <span className="font-medium">₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg font-bold text-green-700">
                <span>Grand Total:</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};