import React from 'react';
import { CheckCircle2, Printer, Download, Copy, Share2, X, Receipt, ArrowRight, Calendar, Package, MapPin, User, Clock, AlertTriangle, Shield } from 'lucide-react';
import { IndianRupee } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import type { Booking } from '@/types';

interface Props {
  booking: Booking;
  onClose: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
}

export default function BookingSuccess({ booking, onClose, onPrint, onDownload }: Props) {
  const handleCopyLRNumber = () => {
    navigator.clipboard.writeText(booking.lr_number);
  };

  // Early return if booking data is not available
  if (!booking) {
    return null;
  }

  // Safely access nested properties
  const fromBranch = booking.from_branch_details?.name || 'N/A';
  const toBranch = booking.to_branch_details?.name || 'N/A';
  const senderName = booking.sender?.name || 'N/A';
  const senderMobile = booking.sender?.mobile || 'N/A';
  const receiverName = booking.receiver?.name || 'N/A';
  const receiverMobile = booking.receiver?.mobile || 'N/A';
  const articleName = booking.article?.name || 'N/A';

  // Function to handle printing
  const handlePrintLR = () => {
    // Create a printable version of the LR
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lorry Receipt - ${booking.lr_number}</title>
          <style>
            body {
              font-family: 'Lato', Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f3f4f6;
              font-weight: bold;
            }
            h2, h3, h4 {
              margin-top: 0;
              font-weight: bold;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            .section {
              margin-bottom: 20px;
            }
            .flex-row {
              display: flex;
              gap: 10px;
            }
            .flex-col {
              flex: 1;
            }
            .border-box {
              border: 1px solid #ddd;
              padding: 10px;
            }
            .signature-row {
              display: flex;
              justify-content: space-between;
              margin-top: 40px;
            }
            .signature-box {
              text-align: center;
              width: 30%;
            }
            .signature-line {
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 20px;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div>
                <h2>Lorry Receipt</h2>
                <p>LR #${booking.lr_number}</p>
              </div>
              <div style="text-align: right;">
                <h3>DesiCargo Logistics</h3>
                <p>Date: ${new Date(booking.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div class="section flex-row">
              <div class="flex-col border-box">
                <h4>From</h4>
                <p>${fromBranch}</p>
                <p>${booking.from_branch_details?.city || ''}, ${booking.from_branch_details?.state || ''}</p>
              </div>
              <div class="flex-col border-box">
                <h4>To</h4>
                <p>${toBranch}</p>
                <p>${booking.to_branch_details?.city || ''}, ${booking.to_branch_details?.state || ''}</p>
              </div>
            </div>
            
            <div class="section flex-row">
              <div class="flex-col border-box">
                <h4>Sender</h4>
                <p>${senderName}</p>
                <p>${senderMobile}</p>
              </div>
              <div class="flex-col border-box">
                <h4>Receiver</h4>
                <p>${receiverName}</p>
                <p>${receiverMobile}</p>
              </div>
            </div>
            
            <div class="section">
              <h4>Article Details</h4>
              <table>
                <tr>
                  <th>Article</th>
                  <th>Description</th>
                  <th style="text-align: right;">Quantity</th>
                  <th style="text-align: right;">Rate</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
                <tr>
                  <td>${articleName}</td>
                  <td>${booking.description || '-'}</td>
                  <td style="text-align: right;">${booking.quantity} ${booking.uom}</td>
                  <td style="text-align: right;">₹${booking.freight_per_qty}</td>
                  <td style="text-align: right;">₹${(booking.quantity * booking.freight_per_qty).toFixed(2)}</td>
                </tr>
                ${booking.loading_charges ? `
                <tr>
                  <td colspan="4" style="text-align: right;">Loading Charges:</td>
                  <td style="text-align: right;">₹${booking.loading_charges.toFixed(2)}</td>
                </tr>` : ''}
                ${booking.unloading_charges ? `
                <tr>
                  <td colspan="4" style="text-align: right;">Unloading Charges:</td>
                  <td style="text-align: right;">₹${booking.unloading_charges.toFixed(2)}</td>
                </tr>` : ''}
                <tr>
                  <td colspan="4" style="text-align: right; font-weight: bold;">Total:</td>
                  <td style="text-align: right; font-weight: bold;">₹${booking.total_amount.toFixed(2)}</td>
                </tr>
              </table>
            </div>
            
            <div class="section flex-row">
              <div class="flex-col border-box">
                <h4>Payment Details</h4>
                <p>Payment Type: ${booking.payment_type}</p>
                <p>Status: ${booking.status.replace('_', ' ')}</p>
              </div>
              <div class="flex-col border-box">
                <h4>Additional Information</h4>
                <p>Booking Date: ${new Date(booking.created_at).toLocaleDateString()}</p>
                <p>Expected Delivery: ${booking.expected_delivery_date ? new Date(booking.expected_delivery_date).toLocaleDateString() : 'Not specified'}</p>
              </div>
            </div>
            
            <div class="signature-row">
              <div class="signature-box">
                <p class="signature-line">Sender's Signature</p>
              </div>
              <div class="signature-box">
                <p class="signature-line">Receiver's Signature</p>
              </div>
              <div class="signature-box">
                <p class="signature-line">For DesiCargo Logistics</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Print after content is loaded
    setTimeout(() => {
      printWindow.print();
      // Don't close the window to allow the user to see the print preview
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl max-w-4xl w-full mx-4 p-8 shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="absolute top-4 right-4">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="flex justify-center mb-4"
          >
            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900">Booking Created Successfully!</h2>
          <div className="mt-4 inline-flex items-center justify-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
            <span className="text-gray-600">LR Number:</span>
            <code className="bg-white px-3 py-1 rounded-lg font-mono text-blue-600 border border-blue-100">
              {booking.lr_number}
            </code>
            <Button variant="ghost" size="icon" onClick={handleCopyLRNumber} title="Copy LR Number" className="h-7 w-7 rounded-full">
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Booking Status Card */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900">Booking Status</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Booked
                  </span>
                  <span className="text-sm text-blue-700">
                    {new Date(booking.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 bg-blue-50">
                <MapPin className="h-4 w-4 mr-1" />
                Track Shipment
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Route Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900">Route Information</h3>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">From</p>
                <p className="font-medium text-gray-900">{fromBranch}</p>
              </div>
              <div className="text-gray-400">→</div>
              <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">To</p>
                <p className="font-medium text-gray-900">{toBranch}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Expected Delivery</p>
                <p className="font-medium text-gray-900">{booking.expected_delivery_date || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Priority</p>
                <p className="font-medium text-gray-900">{booking.priority || 'Normal'}</p>
              </div>
            </div>
          </div>
          
          {/* Customer Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-green-50 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900">Customer Information</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Sender</p>
                <p className="font-medium text-gray-900">{senderName}</p>
                <p className="text-sm text-gray-600">{senderMobile}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Receiver</p>
                <p className="font-medium text-gray-900">{receiverName}</p>
                <p className="text-sm text-gray-600">{receiverMobile}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Article Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900">Article Details</h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Article Type</p>
                  <p className="font-medium text-gray-900">{articleName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quantity</p>
                  <p className="font-medium text-gray-900">{booking.quantity} {booking.uom}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Actual Weight</p>
                  <p className="font-medium text-gray-900">{booking.actual_weight} kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="font-medium text-gray-900">{booking.description || 'Not specified'}</p>
                </div>
              </div>
              
              {(booking.fragile || booking.insurance_required) && (
                <div className="grid grid-cols-2 gap-4">
                  {booking.fragile && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium text-orange-700">Fragile Item</span>
                    </div>
                  )}
                  {booking.insurance_required && (
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-green-700">Insured</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Payment Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-green-50 rounded-lg flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900">Payment Details</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-600">Payment Type</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  booking.payment_type === 'Paid' 
                    ? 'bg-green-100 text-green-800' 
                    : booking.payment_type === 'To Pay'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {booking.payment_type}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-gray-600">Freight Charges</p>
                <p className="font-medium">₹{(booking.quantity * booking.freight_per_qty).toFixed(2)}</p>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-gray-600">Additional Charges</p>
                <p className="font-medium">₹{(booking.loading_charges + booking.unloading_charges).toFixed(2)}</p>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <p className="font-medium text-gray-900">Total Amount</p>
                <p className="font-bold text-lg text-blue-600">₹{booking.total_amount}</p>
              </div>
            </div>
          </div>
        </div>

        {booking.has_invoice && (
          <div className="bg-blue-50 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Invoice Details</h3>
                <p className="text-sm text-gray-600">Invoice information for this booking</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">E-Way Bill Number</p>
                <p className="font-medium">{booking.eway_bill_number || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Invoice Number</p>
                <p className="font-medium">{booking.invoice_number || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Invoice Amount</p>
                <p className="font-medium">₹{booking.invoice_amount?.toFixed(2) || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Invoice Date</p>
                <p className="font-medium">{booking.invoice_date || '-'}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-4">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handlePrintLR}
            >
              <Printer className="h-5 w-5" />
              Print LR
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={onDownload}
            >
              <Download className="h-5 w-5" />
              Download LR
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <Share2 className="h-5 w-5" />
              Share LR
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              onClick={onClose} 
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              <ArrowRight className="h-5 w-5" />
              Create Another Booking
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}