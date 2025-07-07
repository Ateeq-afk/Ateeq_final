import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  CheckCircle, 
  XCircle, 
  Clock,
  ArrowLeft,
  Shield,
  Zap,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface PaymentGatewayProps {
  bookingId: string;
  amount: number;
  currency?: string;
  onSuccess?: (paymentData: any) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  available: boolean;
  fee: string;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

const PaymentGateway: React.FC<PaymentGatewayProps> = ({
  bookingId,
  amount,
  currency = 'INR',
  onSuccess,
  onError,
  onCancel
}) => {
  const [step, setStep] = useState<'methods' | 'details' | 'processing' | 'success' | 'error'>('methods');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: ''
  });
  const [paymentOrder, setPaymentOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const { toast } = useToast();

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'razorpay_card',
      name: 'Credit/Debit Card',
      icon: <CreditCard className="h-6 w-6" />,
      description: 'Visa, Mastercard, RuPay',
      available: true,
      fee: '2.5%'
    },
    {
      id: 'razorpay_upi',
      name: 'UPI',
      icon: <Smartphone className="h-6 w-6" />,
      description: 'Google Pay, PhonePe, Paytm',
      available: true,
      fee: 'Free'
    },
    {
      id: 'razorpay_netbanking',
      name: 'Net Banking',
      icon: <Building2 className="h-6 w-6" />,
      description: 'All major banks',
      available: true,
      fee: '1.9%'
    }
  ];

  const formatAmount = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amt);
  };

  const validateCustomerInfo = (): boolean => {
    if (!customerInfo.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!customerInfo.email.trim() || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(customerInfo.email)) {
      setError('Valid email is required');
      return false;
    }
    if (!customerInfo.phone.trim() || !/^[6-9]\\d{9}$/.test(customerInfo.phone)) {
      setError('Valid 10-digit mobile number is required');
      return false;
    }
    return true;
  };

  const createPaymentOrder = async () => {
    if (!validateCustomerInfo()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/payment-gateway/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          bookingId,
          amount,
          currency,
          provider: 'razorpay',
          customerInfo,
          description: `Payment for booking ${bookingId}`
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create payment order');
      }

      setPaymentOrder(data.data);
      initiatePayment(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment initiation failed');
      setStep('error');
      onError?.(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = (orderData: any) => {
    setStep('processing');

    if (orderData.provider === 'razorpay') {
      // Initialize Razorpay payment
      const options = {
        key: orderData.gatewayConfig?.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: orderData.gatewayConfig?.name || 'DesiCargo',
        description: orderData.gatewayConfig?.description,
        image: orderData.gatewayConfig?.image,
        order_id: orderData.gatewayOrderId,
        prefill: orderData.gatewayConfig?.prefill,
        theme: orderData.gatewayConfig?.theme,
        handler: (response: any) => {
          verifyPayment(response);
        },
        modal: {
          ondismiss: () => {
            setStep('methods');
            onCancel?.();
          }
        }
      };

      // In a real implementation, load Razorpay script dynamically
      // For demo purposes, we'll simulate the payment flow
      setTimeout(() => {
        const mockResponse = {
          razorpay_payment_id: `pay_${Date.now()}`,
          razorpay_order_id: orderData.gatewayOrderId,
          razorpay_signature: 'mock_signature'
        };
        verifyPayment(mockResponse);
      }, 2000);
    }
  };

  const verifyPayment = async (gatewayResponse: any) => {
    try {
      const response = await fetch('/api/payment-gateway/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          orderId: paymentOrder.orderId,
          gatewayOrderId: gatewayResponse.razorpay_order_id,
          gatewayPaymentId: gatewayResponse.razorpay_payment_id,
          signature: gatewayResponse.razorpay_signature,
          status: 'captured',
          provider: 'razorpay'
        })
      });

      const data = await response.json();

      if (data.success && data.data.verified) {
        setStep('success');
        toast({
          title: 'Payment Successful!',
          description: `Payment of ${formatAmount(amount)} completed successfully.`,
        });
        onSuccess?.(data.data);
      } else {
        throw new Error(data.error || 'Payment verification failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment verification failed');
      setStep('error');
      onError?.(err instanceof Error ? err.message : 'Payment verification failed');
    }
  };

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setStep('details');
  };

  const handleBack = () => {
    if (step === 'details') {
      setStep('methods');
    } else if (step === 'error') {
      setStep('methods');
      setError('');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {step === 'methods' && (
          <motion.div
            key="methods"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Complete Payment
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Choose your preferred payment method
                </CardDescription>
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {formatAmount(amount)}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Booking ID: {bookingId}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {paymentMethods.map((method) => (
                  <motion.div
                    key={method.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="outline"
                      className="w-full h-auto p-4 justify-start hover:bg-blue-50 dark:hover:bg-blue-900/20 border-gray-200 dark:border-gray-700"
                      onClick={() => handleMethodSelect(method.id)}
                      disabled={!method.available}
                    >
                      <div className="flex items-center space-x-4 w-full">
                        <div className="flex-shrink-0 text-blue-600 dark:text-blue-400">
                          {method.icon}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {method.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {method.description}
                          </div>
                        </div>
                        <Badge 
                          variant={method.fee === 'Free' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {method.fee}
                        </Badge>
                      </div>
                    </Button>
                  </motion.div>
                ))}
                
                <Separator className="my-4" />
                
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Shield className="h-4 w-4" />
                  <span>Secured by 256-bit SSL encryption</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'details' && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      Payment Details
                    </CardTitle>
                    <CardDescription>
                      {formatAmount(amount)} • {paymentMethods.find(m => m.id === selectedMethod)?.name}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Mobile Number</Label>
                    <Input
                      id="phone"
                      placeholder="Enter 10-digit mobile number"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <Info className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={createPaymentOrder} 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Pay {formatAmount(amount)}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="mx-auto w-12 h-12 text-blue-600 dark:text-blue-400"
                  >
                    <Clock className="w-full h-full" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Processing Payment
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Please wait while we process your payment...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mx-auto w-16 h-16 text-green-500"
                  >
                    <CheckCircle className="w-full h-full" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Payment Successful!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Your payment of {formatAmount(amount)} has been processed successfully.
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      You will receive a confirmation SMS shortly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 text-red-500">
                    <XCircle className="w-full h-full" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Payment Failed
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {error || 'Something went wrong with your payment.'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Button onClick={handleBack} className="w-full">
                      Try Again
                    </Button>
                    <Button variant="outline" onClick={onCancel} className="w-full">
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentGateway;