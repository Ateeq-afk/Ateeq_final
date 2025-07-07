import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { User, Phone, Mail, MapPin, Copy, Check, Users } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface ContactInformationStepProps {
  form: UseFormReturn<any>;
}

export const ContactInformationStep: React.FC<ContactInformationStepProps> = ({ form }) => {
  const { register, watch, setValue, formState: { errors } } = form;
  const [copiedReceiver, setCopiedReceiver] = useState(false);
  const { toast } = useToast();

  const senderName = watch('sender_name');
  const senderMobile = watch('sender_mobile');
  const senderEmail = watch('sender_email');
  const senderAddress = watch('sender_address');
  
  const receiverName = watch('receiver_name');
  const receiverMobile = watch('receiver_mobile');
  const receiverEmail = watch('receiver_email');
  const receiverAddress = watch('receiver_address');

  const handleCopySenderToReceiver = () => {
    setValue('receiver_name', senderName);
    setValue('receiver_mobile', senderMobile);
    setValue('receiver_email', senderEmail);
    setValue('receiver_address', senderAddress);
    
    setCopiedReceiver(true);
    setTimeout(() => setCopiedReceiver(false), 2000);
    
    toast({
      title: "Details Copied",
      description: "Sender details copied to receiver section",
    });
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-5 w-5 text-purple-600" />
          <h3 className="font-medium text-purple-900">Contact Information</h3>
        </div>
        <p className="text-sm text-purple-700">
          Provide accurate contact details for both sender and receiver to ensure smooth delivery and communication.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sender Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              Sender Details
              <Badge variant="secondary" className="text-xs">Required</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="sender_name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sender_name"
                {...register('sender_name')}
                placeholder="Enter sender's full name"
                className={errors.sender_name ? 'border-red-500' : ''}
              />
              {errors.sender_name && (
                <p className="text-sm text-red-600 mt-1">{errors.sender_name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="sender_mobile">
                Mobile Number <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="sender_mobile"
                  {...register('sender_mobile')}
                  placeholder="10-digit mobile number"
                  className={`pl-10 ${errors.sender_mobile ? 'border-red-500' : ''}`}
                  maxLength={10}
                />
              </div>
              {errors.sender_mobile && (
                <p className="text-sm text-red-600 mt-1">{errors.sender_mobile.message}</p>
              )}
              {senderMobile && !validatePhone(senderMobile) && (
                <p className="text-sm text-amber-600 mt-1">Please enter a valid 10-digit mobile number</p>
              )}
            </div>

            <div>
              <Label htmlFor="sender_email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="sender_email"
                  {...register('sender_email')}
                  placeholder="sender@example.com"
                  className="pl-10"
                />
              </div>
              {senderEmail && !validateEmail(senderEmail) && (
                <p className="text-sm text-amber-600 mt-1">Please enter a valid email address</p>
              )}
            </div>

            <div>
              <Label htmlFor="sender_address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Textarea
                  id="sender_address"
                  {...register('sender_address')}
                  placeholder="Complete pickup address"
                  className="pl-10 resize-none"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receiver Information */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-green-600" />
                </div>
                Receiver Details
                <Badge variant="secondary" className="text-xs">Required</Badge>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopySenderToReceiver}
                className="text-xs"
              >
                {copiedReceiver ? (
                  <Check className="h-3 w-3 mr-1" />
                ) : (
                  <Copy className="h-3 w-3 mr-1" />
                )}
                Copy from Sender
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="receiver_name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="receiver_name"
                {...register('receiver_name')}
                placeholder="Enter receiver's full name"
                className={errors.receiver_name ? 'border-red-500' : ''}
              />
              {errors.receiver_name && (
                <p className="text-sm text-red-600 mt-1">{errors.receiver_name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="receiver_mobile">
                Mobile Number <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="receiver_mobile"
                  {...register('receiver_mobile')}
                  placeholder="10-digit mobile number"
                  className={`pl-10 ${errors.receiver_mobile ? 'border-red-500' : ''}`}
                  maxLength={10}
                />
              </div>
              {errors.receiver_mobile && (
                <p className="text-sm text-red-600 mt-1">{errors.receiver_mobile.message}</p>
              )}
              {receiverMobile && !validatePhone(receiverMobile) && (
                <p className="text-sm text-amber-600 mt-1">Please enter a valid 10-digit mobile number</p>
              )}
            </div>

            <div>
              <Label htmlFor="receiver_email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="receiver_email"
                  {...register('receiver_email')}
                  placeholder="receiver@example.com"
                  className="pl-10"
                />
              </div>
              {receiverEmail && !validateEmail(receiverEmail) && (
                <p className="text-sm text-amber-600 mt-1">Please enter a valid email address</p>
              )}
            </div>

            <div>
              <Label htmlFor="receiver_address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Textarea
                  id="receiver_address"
                  {...register('receiver_address')}
                  placeholder="Complete delivery address"
                  className="pl-10 resize-none"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Summary */}
      <Card className="bg-gray-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-700">Contact Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                Sender
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Name:</strong> {senderName || 'Not provided'}</p>
                <p><strong>Mobile:</strong> {senderMobile || 'Not provided'}</p>
                {senderEmail && <p><strong>Email:</strong> {senderEmail}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                Receiver
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Name:</strong> {receiverName || 'Not provided'}</p>
                <p><strong>Mobile:</strong> {receiverMobile || 'Not provided'}</p>
                {receiverEmail && <p><strong>Email:</strong> {receiverEmail}</p>}
              </div>
            </div>
          </div>
          
          {senderName && senderMobile && receiverName && receiverMobile && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">
                  All required contact information provided
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};