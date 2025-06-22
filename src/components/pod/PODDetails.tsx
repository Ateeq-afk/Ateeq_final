import React from 'react';
import { Package, User, Calendar, MapPin, CheckCircle2, Printer, Download, ArrowLeft, FileSignature as Signature, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface PODDetailsProps {
  pod: any;
  onClose: () => void;
}

export default function PODDetails({ pod, onClose }: PODDetailsProps) {
  // Function to handle printing
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Proof of Delivery - ${pod.booking?.lr_number || 'N/A'}</title>
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
            .signature-image {
              max-width: 200px;
              max-height: 100px;
              margin: 0 auto;
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
                <h2>Proof of Delivery</h2>
                <p>LR #${pod.booking?.lr_number || 'N/A'}</p>
              </div>
              <div style="text-align: right;">
                <h3>DesiCargo Logistics</h3>
                <p>Date: ${new Date(pod.delivered_at).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div class="section flex-row">
              <div class="flex-col border-box">
                <h4>Booking Details</h4>
                <p>LR Number: ${pod.booking?.lr_number || 'N/A'}</p>
                <p>Booking Date: ${pod.booking ? new Date(pod.booking.created_at).toLocaleDateString() : 'N/A'}</p>
                <p>Article: ${pod.booking?.article?.name || 'N/A'}</p>
                <p>Quantity: ${pod.booking?.quantity || '0'} ${pod.booking?.uom || ''}</p>
              </div>
              <div class="flex-col border-box">
                <h4>Delivery Information</h4>
                <p>Delivered On: ${new Date(pod.delivered_at).toLocaleString()}</p>
                <p>Delivered By: ${pod.delivered_by || 'N/A'}</p>
                <p>Receiver: ${pod.receiver_name || 'N/A'}</p>
                <p>Receiver Phone: ${pod.receiver_phone || 'N/A'}</p>
                ${pod.receiver_designation ? `<p>Designation: ${pod.receiver_designation}</p>` : ''}
              </div>
            </div>
            
            <div class="section flex-row">
              <div class="flex-col border-box">
                <h4>Sender</h4>
                <p>${pod.booking?.sender?.name || 'N/A'}</p>
                <p>${pod.booking?.sender?.mobile || 'N/A'}</p>
                <p>${pod.booking?.from_branch_details?.name || 'N/A'}</p>
              </div>
              <div class="flex-col border-box">
                <h4>Receiver</h4>
                <p>${pod.booking?.receiver?.name || 'N/A'}</p>
                <p>${pod.booking?.receiver?.mobile || 'N/A'}</p>
                <p>${pod.booking?.to_branch_details?.name || 'N/A'}</p>
              </div>
            </div>
            
            ${pod.remarks ? `
            <div class="section">
              <h4>Remarks</h4>
              <div class="border-box">
                <p>${pod.remarks}</p>
              </div>
            </div>
            ` : ''}
            
            <div class="signature-row">
              <div class="signature-box">
                <p>Delivered By</p>
                <p>${pod.delivered_by || 'N/A'}</p>
              </div>
              <div class="signature-box">
                <p>Receiver's Signature</p>
                ${pod.signature_image_url ? `<img src="${pod.signature_image_url}" class="signature-image" alt="Signature" />` : '<p class="signature-line">No signature available</p>'}
              </div>
              <div class="signature-box">
                <p>For DesiCargo Logistics</p>
                <p class="signature-line"></p>
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
    }, 500);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Proof of Delivery</h2>
            <p className="text-gray-600">LR #{pod.booking?.lr_number || 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-1">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Booking Information */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900">Booking Information</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">LR Number</p>
              <p className="font-medium text-gray-900">{pod.booking?.lr_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Booking Date</p>
              <p className="font-medium text-gray-900">
                {pod.booking ? new Date(pod.booking.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">From</p>
              <p className="font-medium text-gray-900">{pod.booking?.from_branch_details?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">To</p>
              <p className="font-medium text-gray-900">{pod.booking?.to_branch_details?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Article</p>
              <p className="font-medium text-gray-900">{pod.booking?.article?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Quantity</p>
              <p className="font-medium text-gray-900">{pod.booking?.quantity || '0'} {pod.booking?.uom || ''}</p>
            </div>
          </div>
        </motion.div>
        
        {/* Delivery Information */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-medium text-gray-900">Delivery Information</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Delivered On</p>
              <p className="font-medium text-gray-900">{new Date(pod.delivered_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Delivered By</p>
              <p className="font-medium text-gray-900">{pod.delivered_by || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Receiver Name</p>
              <p className="font-medium text-gray-900">{pod.receiver_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Receiver Phone</p>
              <p className="font-medium text-gray-900">{pod.receiver_phone}</p>
            </div>
            {pod.receiver_designation && (
              <div>
                <p className="text-sm text-gray-600">Designation</p>
                <p className="font-medium text-gray-900">{pod.receiver_designation}</p>
              </div>
            )}
          </div>
          
          {pod.remarks && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">Remarks</p>
              <p className="text-sm text-gray-600 mt-1">{pod.remarks}</p>
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Signature and Photo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Signature */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Signature className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900">Receiver's Signature</h3>
          </div>
          
          {pod.signature_image_url ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white p-4">
              <img 
                src={pod.signature_image_url} 
                alt="Receiver signature" 
                className="w-full h-auto max-h-[200px] object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-center">
                <X className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No signature available</p>
              </div>
            </div>
          )}
        </motion.div>
        
        {/* Photo Evidence */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Camera className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="font-medium text-gray-900">Photo Evidence</h3>
          </div>
          
          {pod.photo_evidence_url ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white p-4">
              <img 
                src={pod.photo_evidence_url} 
                alt="Delivery evidence" 
                className="w-full h-auto max-h-[200px] object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-center">
                <X className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No photo evidence available</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Footer */}
      <div className="flex justify-end">
        <Button onClick={onClose} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}