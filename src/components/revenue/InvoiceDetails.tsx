import React from 'react';
import { FileText, Calendar, User, CheckCircle2, Printer, Download, Send, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  customer: {
    id: string;
    name: string;
    email?: string;
  };
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  notes?: string;
  terms?: string;
}

interface Props {
  invoice: Invoice;
  onClose: () => void;
  onSend?: () => void;
  onMarkAsPaid?: () => void;
}

export default function InvoiceDetails({ invoice, onClose, onSend, onMarkAsPaid }: Props) {
  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Invoice['status']) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'sent':
        return 'Sent';
      case 'paid':
        return 'Paid';
      case 'overdue':
        return 'Overdue';
      case 'cancelled':
        return 'Cancelled';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Invoice #{invoice.invoiceNumber}</h2>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Calendar className="h-4 w-4" />
              <span>Created on {new Date(invoice.date).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${getStatusColor(invoice.status)}`}>
          <span className="font-medium">{getStatusText(invoice.status)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Customer Information</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{invoice.customer.name}</span>
            </div>
            {invoice.customer.email && (
              <div className="text-gray-600">
                Email: {invoice.customer.email}
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Invoice Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Invoice Number</p>
              <p className="font-medium">{invoice.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Invoice Date</p>
              <p className="font-medium">{new Date(invoice.date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Due Date</p>
              <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Amount</p>
              <p className="font-medium">₹{invoice.amount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">Invoice Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-3">Description</th>
                <th className="text-right text-sm font-medium text-gray-600 px-6 py-3">Quantity</th>
                <th className="text-right text-sm font-medium text-gray-600 px-6 py-3">Rate</th>
                <th className="text-right text-sm font-medium text-gray-600 px-6 py-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoice.items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-medium">{item.description}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 text-right">
                    ₹{item.rate.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    ₹{item.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td colSpan={3} className="px-6 py-4 text-right font-medium">Total:</td>
                <td className="px-6 py-4 text-right font-bold">₹{invoice.amount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {(invoice.notes || invoice.terms) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {invoice.notes && (
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Notes</h3>
              <p className="text-gray-600">{invoice.notes}</p>
            </div>
          )}
          {invoice.terms && (
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Terms & Conditions</h3>
              <p className="text-gray-600">{invoice.terms}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
        <Button variant="outline" onClick={onClose} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Print
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download
        </Button>
        {invoice.status === 'draft' && onSend && (
          <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700" onClick={onSend}>
            <Send className="h-4 w-4" />
            Send Invoice
          </Button>
        )}
        {invoice.status === 'sent' && onMarkAsPaid && (
          <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700" onClick={onMarkAsPaid}>
            <CheckCircle2 className="h-4 w-4" />
            Mark as Paid
          </Button>
        )}
      </div>
    </div>
  );
}