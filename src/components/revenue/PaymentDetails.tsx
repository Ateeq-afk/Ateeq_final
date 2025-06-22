import React from 'react';
import { CreditCard, Calendar, User, FileText, CheckCircle2, Printer, Download, ArrowLeft, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface Payment {
  id: string;
  date: string;
  amount: number;
  method: 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque';
  reference: string;
  status: 'completed' | 'pending' | 'failed';
  invoice?: {
    id: string;
    invoiceNumber: string;
  };
  customer: {
    id: string;
    name: string;
  };
  notes?: string;
}

interface Props {
  payment: Payment;
  onClose: () => void;
}

export default function PaymentDetails({ payment, onClose }: Props) {
  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
    }
  };

  const getStatusText = (status: Payment['status']) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
    }
  };

  const getMethodIcon = (method: Payment['method']) => {
    switch (method) {
      case 'Cash':
        return <Wallet className="h-6 w-6 text-green-600" />;
      case 'Bank Transfer':
        return <CreditCard className="h-6 w-6 text-blue-600" />;
      case 'UPI':
        return <CreditCard className="h-6 w-6 text-purple-600" />;
      case 'Cheque':
        return <FileText className="h-6 w-6 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
            {getMethodIcon(payment.method)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Payment #{payment.reference || payment.id.slice(0, 8)}</h2>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Calendar className="h-4 w-4" />
              <span>Received on {new Date(payment.date).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${getStatusColor(payment.status)}`}>
          <span className="font-medium">{getStatusText(payment.status)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Payment Information</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Amount</p>
              <p className="font-medium text-xl">₹{payment.amount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payment Method</p>
              <div className="flex items-center gap-2 mt-1">
                {getMethodIcon(payment.method)}
                <span className="font-medium">{payment.method}</span>
              </div>
            </div>
            {payment.reference && (
              <div>
                <p className="text-sm text-gray-600">Reference Number</p>
                <p className="font-medium">{payment.reference}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Date & Time</p>
              <p className="font-medium">{new Date(payment.date).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Customer & Invoice</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Customer</p>
              <div className="flex items-center gap-2 mt-1">
                <User className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{payment.customer.name}</span>
              </div>
            </div>
            {payment.invoice && (
              <div>
                <p className="text-sm text-gray-600">Invoice</p>
                <p className="font-medium text-blue-600 hover:underline cursor-pointer">
                  {payment.invoice.invoiceNumber}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(payment.status)}`}>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {getStatusText(payment.status)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {payment.notes && (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Notes</h3>
          <p className="text-gray-600">{payment.notes}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
        <Button variant="outline" onClick={onClose} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Print Receipt
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download
        </Button>
      </div>
    </div>
  );
}