import React from 'react';
import { 
  Package, 
  User, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Printer, 
  Download, 
  ArrowLeft, 
  FileSignature as Signature, 
  Camera, 
  X 
} from 'lucide-react';
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
            .pod-container {
              max-width: 800px;
              margin: 0 auto;
              border: 1px solid #ddd;
              padding: 20px;
              border-radius: 8px;
            }
            .pod-header {
              display: flex;
              justify-content: space-between;
              border-bottom: 1px solid #eee;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .pod-title {
              font-size: 24px;
              font-weight: bold;
              margin: 0;
            }
            .pod-subtitle {
              color: #666;
              margin: 5px 0 0 0;
            }
            .pod-section {
              margin-bottom: 20px;
            }
            .pod-section h3 {
              font-size: 18px;
              margin-bottom: 10px;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
            }
            .pod-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            .pod-field {
              margin-bottom: 10px;
            }
            .pod-label {
              font-size: 12px;
              color: #666;
              margin-bottom: 3px;
            }
            .pod-value {
              font-size: 14px;
              font-weight: 500;
            }
            .pod-signature {
              margin-top: 30px;
              display: flex;
              justify-content: space-between;
            }
            .signature-box {
              width: 30%;
              text-align: center;
            }
            .signature-image {
              max-width: 100%;
              height: 80px;
              object-fit: contain;
              margin-bottom: 10px;
              border: 1px solid #eee;
              padding: 5px;
            }
            .signature-line {
              border-top: 1px solid #000;
              padding-top: 5px;
            }
            .pod-evidence {
              margin-top: 20px;
              text-align: center;
            }
            .evidence-image {
              max-width: 100%;
              max-height: 200px;
              object-fit: contain;
              border: 1px solid #eee;
              padding: 5px;
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
          <div class="pod-container">
            <div class="pod-header">
              <div>
                <h1 class="pod-title">Proof of Delivery</h1>
                <p class="pod-subtitle">LR #${pod.booking?.lr_number || 'N/A'}</p>
              </div>
              <div>
                <p class="pod-subtitle">Date: ${new Date(pod.delivered_at).toLocaleDateString()}</p>
                <p class="pod-subtitle">Time: ${new Date(pod.delivered_at).toLocaleTimeString()}</p>
              </div>
            </div>
            
            <div class="pod-section">
              <h3>Booking Details</h3>
              <div class="pod-grid">
                <div>
                  <div class="pod-field">
                    <div class="pod-label">LR Number</div>
                    <div class="pod-value">${pod.booking?.lr_number || 'N/A'}</div>
                  </div>
                  <div class="pod-field">
                    <div class="pod-label">Booking Date</div>
                    <div class="pod-value">${pod.booking ? new Date(pod.booking.created_at).toLocaleDateString() : 'N/A'}</div>
                  </div>
                  <div class="pod-field">
                    <div class="pod-label">Article</div>
                    <div class="pod-value">${pod.booking?.article?.name || 'N/A'}</div>
                  </div>
                </div>
                <div>
                  <div class="pod-field">
                    <div class="pod-label">From</div>
                    <div class="pod-value">${pod.booking?.from_branch_details?.name || 'N/A'}</div>
                  </div>
                  <div class="pod-field">
                    <div class="pod-label">To</div>
                    <div class="pod-value">${pod.booking?.to_branch_details?.name || 'N/A'}</div>
                  </div>
                  <div class="pod-field">
                    <div class="pod-label">Quantity</div>
                    <div class="pod-value">${pod.booking?.quantity || '0'} ${pod.booking?.uom || ''}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="pod-section">
              <h3>Delivery Information</h3>
              <div class="pod-grid">
                <div>
                  <div class="pod-field">
                    <div class="pod-label">Delivered By</div>
                    <div class="pod-value">${pod.delivered_by || 'N/A'}</div>
                  </div>
                  <div class="pod-field">
                    <div class="pod-label">Delivered On</div>
                    <div class="pod-value">${new Date(pod.delivered_at).toLocaleString()}</div>
                  </div>
                </div>
                <div>
                  <div class="pod-field">
                    <div class="pod-label">Receiver Name</div>
                    <div class="pod-value">${pod.receiver_name || 'N/A'}</div>
                  </div>
                  <div class="pod-field">
                    <div class="pod-label">Receiver Phone</div>
                    <div class="pod-value">${pod.receiver_phone || 'N/A'}</div>
                  </div>
                  ${pod.receiver_designation ? `
                  <div class="pod-field">
                    <div class="pod-label">Designation</div>
                    <div class="pod-value">${pod.receiver_designation}</div>
                  </div>
                  ` : ''}
                </div>
              </div>
              
              ${pod.remarks ? `
              <div class="pod-field" style="margin-top: 15px;">
                <div class="pod-label">Remarks</div>
                <div class="pod-value">${pod.remarks}</div>
              </div>
              ` : ''}
            </div>
            
            <div class="pod-signature">
              <div class="signature-box">
                <p>Delivered By</p>
                <p class="signature-line">${pod.delivered_by || 'N/A'}</p>
              </div>
              
              <div class="signature-box">
                <p>Receiver's Signature</p>
                ${pod.signature_image_url ? `
                <img src="${pod.signature_image_url}" class="signature-image" alt="Signature" />
                <p>${pod.receiver_name}</p>
                ` : `
                <p class="signature-line">No signature available</p>
                `}
              </div>
              
              <div class="signature-box">
                <p>For DesiCargo Logistics</p>
                <p class="signature-line"></p>
              </div>
            </div>
            
            ${pod.photo_evidence_url ? `
            <div class="pod-evidence">
              <h3>Photo Evidence</h3>
              <img src="${pod.photo_evidence_url}" class="evidence-image" alt="Delivery Evidence" />
            </div>
            ` : ''}
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