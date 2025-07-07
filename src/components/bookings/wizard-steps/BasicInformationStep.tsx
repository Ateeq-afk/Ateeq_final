import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Truck, Info } from 'lucide-react';

interface BasicInformationStepProps {
  form: UseFormReturn<any>;
}

export const BasicInformationStep: React.FC<BasicInformationStepProps> = ({ form }) => {
  const { watch, setValue, formState: { errors } } = form;
  
  const bookingType = watch('booking_type');
  const paymentMode = watch('payment_mode');

  const bookingTypeOptions = [
    { value: 'paid', label: 'Paid', description: 'Freight paid by sender', icon: '💰' },
    { value: 'tbb', label: 'To Be Billed', description: 'Bill to customer later', icon: '📋' },
    { value: 'fob', label: 'FOB', description: 'Free on board', icon: '🚛' }
  ];

  const paymentModeOptions = [
    { value: 'cash', label: 'Cash', description: 'Immediate cash payment', icon: '💵' },
    { value: 'credit', label: 'Credit', description: 'Credit terms apply', icon: '💳' },
    { value: 'advance', label: 'Advance', description: 'Advanced payment', icon: '⚡' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-blue-900">Booking Setup</h3>
        </div>
        <p className="text-sm text-blue-700">
          Configure the basic booking parameters. This determines how the shipment will be handled and billed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Booking Type */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              Booking Type
              <Badge variant="secondary" className="text-xs">Required</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bookingTypeOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => setValue('booking_type', option.value)}
                className={`p-3 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-300 ${
                  bookingType === option.value 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{option.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                  {bookingType === option.value && (
                    <div className="h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="h-2 w-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {errors.booking_type && (
              <p className="text-sm text-red-600">{errors.booking_type.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Payment Mode */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              Payment Mode
              <Badge variant="secondary" className="text-xs">Required</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentModeOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => setValue('payment_mode', option.value)}
                className={`p-3 border-2 rounded-lg cursor-pointer transition-all hover:border-green-300 ${
                  paymentMode === option.value 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{option.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                  {paymentMode === option.value && (
                    <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center">
                      <div className="h-2 w-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {errors.payment_mode && (
              <p className="text-sm text-red-600">{errors.payment_mode.message}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Summary */}
      <Card className="bg-gray-50">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Configuration Summary</h3>
              <p className="text-sm text-gray-600 mt-1">
                Type: <span className="font-medium">{bookingTypeOptions.find(opt => opt.value === bookingType)?.label || 'Not selected'}</span>
                {' • '}
                Payment: <span className="font-medium">{paymentModeOptions.find(opt => opt.value === paymentMode)?.label || 'Not selected'}</span>
              </p>
            </div>
            {bookingType && paymentMode && (
              <Badge variant="default" className="bg-green-600">
                Ready to proceed
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};