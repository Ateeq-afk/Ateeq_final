import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import PaymentGateway from './PaymentGateway';
import { useToast } from '@/hooks/use-toast';

interface PaymentButtonProps {
  bookingId: string;
  amount: number;
  currency?: string;
  lrNumber?: string;
  isPaid?: boolean;
  paymentMode?: string;
  onPaymentSuccess?: (paymentData: any) => void;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
  disabled?: boolean;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  bookingId,
  amount,
  currency = 'INR',
  lrNumber,
  isPaid = false,
  paymentMode = 'to_pay',
  onPaymentSuccess,
  size = 'default',
  variant = 'default',
  disabled = false
}) => {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const { toast } = useToast();

  const formatAmount = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amt);
  };

  const handlePaymentSuccess = (paymentData: any) => {
    setShowPaymentDialog(false);
    toast({
      title: 'Payment Successful!',
      description: `Payment of ${formatAmount(amount)} completed for ${lrNumber || bookingId}.`,
    });
    onPaymentSuccess?.(paymentData);
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: 'Payment Failed',
      description: error,
      variant: 'destructive'
    });
  };

  const handlePaymentCancel = () => {
    setShowPaymentDialog(false);
  };

  // Don't show button if already paid or not to_pay
  if (isPaid) {
    return (
      <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
        <CheckCircle className="w-3 h-3 mr-1" />
        Paid
      </Badge>
    );
  }

  if (paymentMode !== 'to_pay' && paymentMode !== 'online') {
    return (
      <Badge variant="secondary">
        {paymentMode === 'prepaid' ? 'Prepaid' : 'Credit'}
      </Badge>
    );
  }

  if (disabled) {
    return (
      <Button variant="outline" size={size} disabled>
        <AlertCircle className="w-4 h-4 mr-2" />
        Payment Unavailable
      </Button>
    );
  }

  return (
    <>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          variant={variant}
          size={size}
          onClick={() => setShowPaymentDialog(true)}
          className="relative overflow-hidden"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Pay {formatAmount(amount)}
          
          {/* Subtle shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.6 }}
          />
        </Button>
      </motion.div>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-center">
              Complete Payment
            </DialogTitle>
            {lrNumber && (
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                LR Number: {lrNumber}
              </p>
            )}
          </DialogHeader>
          
          <div className="px-6 pb-6">
            <PaymentGateway
              bookingId={bookingId}
              amount={amount}
              currency={currency}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onCancel={handlePaymentCancel}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PaymentButton;