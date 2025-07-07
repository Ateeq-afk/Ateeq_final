import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Receipt, Shield, Bell, FileText, Settings, Star, AlertCircle } from 'lucide-react';

interface ServicesInvoiceStepProps {
  form: UseFormReturn<any>;
}

// Additional services options
const ADDITIONAL_SERVICES = [
  { 
    id: 'insurance', 
    label: 'Insurance Coverage', 
    description: 'Protect your shipment against damage or loss',
    icon: Shield,
    cost: 50,
    popular: true
  },
  { 
    id: 'sms_notifications', 
    label: 'SMS Notifications', 
    description: 'Real-time updates via SMS',
    icon: Bell,
    cost: 10,
    popular: true
  },
  { 
    id: 'priority_delivery', 
    label: 'Priority Delivery', 
    description: 'Express delivery with priority handling',
    icon: Star,
    cost: 100,
    popular: false
  },
  { 
    id: 'door_pickup', 
    label: 'Door Pickup', 
    description: 'Pick up from sender location',
    icon: Settings,
    cost: 30,
    popular: true
  },
  { 
    id: 'door_delivery', 
    label: 'Door Delivery', 
    description: 'Deliver to receiver location',
    icon: Settings,
    cost: 30,
    popular: true
  },
];

export const ServicesInvoiceStep: React.FC<ServicesInvoiceStepProps> = ({ form }) => {
  const { register, watch, setValue, formState: { errors } } = form;
  
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const podRequired = watch('pod_required') ?? true;
  const invoiceNo = watch('invoice_no');
  const invoiceDate = watch('invoice_date');
  const remarks = watch('remarks');
  const paymentTerms = watch('payment_terms');

  const handleServiceToggle = (serviceId: string, cost: number) => {
    const newSelected = new Set(selectedServices);
    
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
    } else {
      newSelected.add(serviceId);
    }
    
    setSelectedServices(newSelected);
    setValue(`service_${serviceId}`, newSelected.has(serviceId));
    
    // Update total additional charges
    const totalServiceCost = Array.from(newSelected).reduce((sum, id) => {
      const service = ADDITIONAL_SERVICES.find(s => s.id === id);
      return sum + (service?.cost || 0);
    }, 0);
    
    setValue('additional_services_cost', totalServiceCost);
  };

  const totalServiceCost = Array.from(selectedServices).reduce((sum, id) => {
    const service = ADDITIONAL_SERVICES.find(s => s.id === id);
    return sum + (service?.cost || 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Receipt className="h-5 w-5 text-indigo-600" />
          <h3 className="font-medium text-indigo-900">Additional Services & Invoice</h3>
        </div>
        <p className="text-sm text-indigo-700">
          Configure additional services and invoice details. These are optional but enhance the shipping experience.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Additional Services */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-5 w-5 text-purple-600" />
              Additional Services
              <Badge variant="outline" className="text-xs">Optional</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ADDITIONAL_SERVICES.map((service) => {
              const Icon = service.icon;
              const isSelected = selectedServices.has(service.id);
              
              return (
                <div
                  key={service.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handleServiceToggle(service.id, service.cost)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{service.label}</h4>
                        {service.popular && (
                          <Badge variant="secondary" className="text-xs">Popular</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-medium text-green-600">
                          +₹{service.cost}
                        </span>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => {}} // Handled by parent div onClick
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {totalServiceCost > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-900">
                    Total Additional Services:
                  </span>
                  <span className="text-lg font-bold text-green-700">
                    ₹{totalServiceCost}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery Options */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Delivery Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* POD Requirement */}
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <Switch
                id="pod_required"
                checked={podRequired}
                onCheckedChange={(checked) => setValue('pod_required', checked)}
              />
              <div className="flex-1">
                <Label htmlFor="pod_required" className="font-medium">
                  Proof of Delivery (POD) Required
                </Label>
                <p className="text-sm text-gray-600">
                  Require signature and proof before marking as delivered
                </p>
              </div>
            </div>

            {/* Payment Terms */}
            <div>
              <Label htmlFor="payment_terms">Payment Terms</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {['Cash on Delivery', 'Credit - 7 days', 'Credit - 15 days', 'Credit - 30 days'].map((term) => (
                  <Button
                    key={term}
                    type="button"
                    variant={paymentTerms === term ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setValue('payment_terms', term)}
                    className="text-xs h-auto p-2"
                  >
                    {term}
                  </Button>
                ))}
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <Label htmlFor="special_instructions">Special Instructions</Label>
              <Textarea
                id="special_instructions"
                {...register('special_instructions')}
                placeholder="Any special handling instructions..."
                className="resize-none"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-600" />
            Invoice Information
            <Badge variant="outline" className="text-xs">Optional</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoice_no">Invoice Number</Label>
              <Input
                id="invoice_no"
                {...register('invoice_no')}
                placeholder="INV-2024-001"
              />
              <p className="text-xs text-gray-500 mt-1">
                Reference invoice number for this shipment
              </p>
            </div>
            
            <div>
              <Label htmlFor="invoice_date">Invoice Date</Label>
              <Input
                id="invoice_date"
                type="date"
                {...register('invoice_date')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Remarks & Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Remarks & Notes
            <Badge variant="outline" className="text-xs">Optional</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="remarks">Internal Remarks</Label>
            <Textarea
              id="remarks"
              {...register('remarks')}
              placeholder="Any internal notes or special requirements for this booking..."
              className="resize-none"
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              These remarks are for internal use and won't be visible to customers
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Final Configuration Summary */}
      <Card className="bg-gray-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-700">Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">POD Required:</span>
              <Badge variant={podRequired ? 'default' : 'secondary'}>
                {podRequired ? 'Yes' : 'No'}
              </Badge>
            </div>
            
            {selectedServices.size > 0 && (
              <div>
                <span className="text-sm text-gray-600">Additional Services:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Array.from(selectedServices).map((serviceId) => {
                    const service = ADDITIONAL_SERVICES.find(s => s.id === serviceId);
                    return service ? (
                      <Badge key={serviceId} variant="outline" className="text-xs">
                        {service.label} (+₹{service.cost})
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}
            
            {paymentTerms && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Payment Terms:</span>
                <span className="text-sm font-medium">{paymentTerms}</span>
              </div>
            )}
            
            {invoiceNo && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Invoice Reference:</span>
                <span className="text-sm font-medium">{invoiceNo}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};