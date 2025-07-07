import React, { useRef } from 'react';
import { format } from 'date-fns';
import { Printer, Download, Mail } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Payment } from '../../services/payments';
import { useBranchSelection } from '../../contexts/BranchSelectionContext';

interface PaymentReceiptProps {
  payment: Payment;
  onPrint?: () => void;
  onDownload?: () => void;
  onEmail?: () => void;
}

export const PaymentReceipt: React.FC<PaymentReceiptProps> = ({
  payment,
  onPrint,
  onDownload,
  onEmail,
}) => {
  const { selectedBranch } = useBranchSelection();
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (receiptRef.current) {
      const printContent = receiptRef.current.innerHTML;
      const originalContent = document.body.innerHTML;
      
      document.body.innerHTML = `
        <html>
          <head>
            <title>Payment Receipt - ${payment.payment_number}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .receipt-container { max-width: 800px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 30px; }
              .company-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
              .receipt-title { font-size: 20px; font-weight: bold; margin-bottom: 20px; }
              .receipt-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
              .payment-details { margin-bottom: 20px; }
              .amount-section { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .amount-in-words { font-style: italic; margin-top: 10px; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
              table { width: 100%; border-collapse: collapse; margin: 15px 0; }
              th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #ddd; }
              th { background-color: #f5f5f5; font-weight: bold; }
              .no-print { display: none; }
            </style>
          </head>
          <body>
            <div class="receipt-container">
              ${printContent}
            </div>
          </body>
        </html>
      `;
      
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
    }
    onPrint?.();
  };

  const handleDownload = () => {
    // In a real implementation, this would generate a PDF
    console.log('Download receipt as PDF');
    onDownload?.();
  };

  const handleEmail = () => {
    // In a real implementation, this would send email
    console.log('Email receipt');
    onEmail?.();
  };

  const convertAmountToWords = (amount: number): string => {
    // Basic implementation for Indian numbering system
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertLessThanThousand = (num: number): string => {
      if (num === 0) return '';
      
      let result = '';
      
      if (num >= 100) {
        result += ones[Math.floor(num / 100)] + ' Hundred ';
        num %= 100;
      }
      
      if (num >= 20) {
        result += tens[Math.floor(num / 10)] + ' ';
        num %= 10;
      }
      
      if (num >= 10) {
        result += teens[num - 10] + ' ';
        return result;
      }
      
      if (num > 0) {
        result += ones[num] + ' ';
      }
      
      return result;
    };

    if (amount === 0) return 'Zero Rupees Only';

    const rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);

    let result = '';

    if (rupees >= 10000000) { // Crores
      result += convertLessThanThousand(Math.floor(rupees / 10000000)) + 'Crore ';
      rupees %= 10000000;
    }

    if (rupees >= 100000) { // Lakhs
      result += convertLessThanThousand(Math.floor(rupees / 100000)) + 'Lakh ';
      rupees %= 100000;
    }

    if (rupees >= 1000) { // Thousands
      result += convertLessThanThousand(Math.floor(rupees / 1000)) + 'Thousand ';
      rupees %= 1000;
    }

    if (rupees > 0) {
      result += convertLessThanThousand(rupees);
    }

    result += 'Rupees';

    if (paise > 0) {
      result += ' and ' + convertLessThanThousand(paise) + 'Paise';
    }

    return result + ' Only';
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="no-print">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Payment Receipt</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleEmail}>
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div ref={receiptRef} className="receipt-content">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {selectedBranch?.organization_name || 'DesiCargo Logistics'}
            </h1>
            <p className="text-gray-600">
              {selectedBranch?.address || 'Logistics Management System'}
            </p>
            {selectedBranch?.contact_phone && (
              <p className="text-gray-600">Phone: {selectedBranch.contact_phone}</p>
            )}
            {selectedBranch?.email && (
              <p className="text-gray-600">Email: {selectedBranch.email}</p>
            )}
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-blue-600">PAYMENT RECEIPT</h2>
          </div>

          <Separator className="mb-6" />

          {/* Receipt Information */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-2">Receipt Information</h3>
              <div className="space-y-1">
                <p><span className="font-medium">Receipt No:</span> {payment.receipt_number || payment.payment_number}</p>
                <p><span className="font-medium">Payment No:</span> {payment.payment_number}</p>
                <p><span className="font-medium">Date:</span> {format(new Date(payment.payment_date), 'dd/MM/yyyy')}</p>
                <p><span className="font-medium">Status:</span> 
                  <Badge variant={payment.status === 'cleared' ? 'default' : 'secondary'} className="ml-2">
                    {payment.status.toUpperCase()}
                  </Badge>
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Received From</h3>
              <div className="space-y-1">
                <p><span className="font-medium">Name:</span> {payment.payer_name}</p>
                <p><span className="font-medium">Type:</span> {payment.payer_type.charAt(0).toUpperCase() + payment.payer_type.slice(1)}</p>
                {payment.purpose && (
                  <p><span className="font-medium">Purpose:</span> {payment.purpose.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                )}
              </div>
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Payment Details */}
          <div className="mb-6">
            <h3 className="font-semibold mb-4">Payment Details</h3>
            <table className="w-full">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Payment Mode</th>
                  <th>Reference</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{payment.description || 'Payment received'}</td>
                  <td>{payment.payment_mode || 'N/A'}</td>
                  <td>{payment.payment_reference || '-'}</td>
                  <td className="text-right font-medium">
                    ₹{payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bank Details (if applicable) */}
          {payment.bank_name && (
            <>
              <Separator className="mb-6" />
              <div className="mb-6">
                <h3 className="font-semibold mb-4">Bank Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  {payment.bank_name && (
                    <p><span className="font-medium">Bank:</span> {payment.bank_name}</p>
                  )}
                  {payment.bank_branch && (
                    <p><span className="font-medium">Branch:</span> {payment.bank_branch}</p>
                  )}
                  {payment.account_number && (
                    <p><span className="font-medium">Account:</span> {payment.account_number}</p>
                  )}
                  {payment.ifsc_code && (
                    <p><span className="font-medium">IFSC:</span> {payment.ifsc_code}</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Amount Summary */}
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">Total Amount Received:</span>
              <span className="text-2xl font-bold text-green-600">
                ₹{payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            
            <div className="text-sm text-gray-600 italic">
              <span className="font-medium">Amount in Words:</span> {convertAmountToWords(payment.amount)}
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Terms and Conditions */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Terms & Conditions</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• This is a computer generated receipt and does not require signature.</li>
              <li>• All disputes are subject to local jurisdiction.</li>
              <li>• Payment once made will not be refunded unless specifically agreed upon.</li>
              <li>• This receipt is valid for all legal purposes.</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 mt-8">
            <p>Thank you for your payment!</p>
            <p className="mt-2">
              Generated on {format(new Date(), 'dd/MM/yyyy HH:mm:ss')} | 
              System: DesiCargo Logistics Management
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};