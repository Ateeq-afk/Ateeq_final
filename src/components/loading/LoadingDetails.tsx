import React, { useState } from 'react';
import { 
  Truck, 
  Package, 
  Calendar, 
  MapPin, 
  User, 
  Clock, 
  CheckCircle2, 
  Printer, 
  Download, 
  ArrowLeft,
  Edit,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import EditOGPLModal from './EditOGPLModal';
import ManageOGPLBookings from './ManageOGPLBookings';
import { useVehicles } from '@/hooks/useVehicles';
import { useBranches } from '@/hooks/useBranches';

interface LoadingDetailsProps {
  session: any;
  onClose: () => void;
}

export default function LoadingDetails({ session, onClose }: LoadingDetailsProps) {
  const [showEditOGPL, setShowEditOGPL] = useState(false);
  const [showManageBookings, setShowManageBookings] = useState(false);
  const { vehicles } = useVehicles();
  const { branches } = useBranches();
  // Function to handle printing
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Loading Sheet - ${session.ogpl?.ogpl_number || 'N/A'}</title>
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
            th:first-child {
              background-color: #e5e7eb;
              color: #1f2937;
            }
            td:first-child {
              background-color: #f9fafb;
              font-weight: bold;
              color: #111827;
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
                <h2>Loading Sheet</h2>
                <p>OGPL #${session.ogpl?.ogpl_number || 'N/A'}</p>
              </div>
              <div style="text-align: right;">
                <h3>DesiCargo Logistics</h3>
                <p>Date: ${new Date(session.loaded_at).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div class="section flex-row">
              <div class="flex-col border-box">
                <h4>Vehicle Details</h4>
                <p>Vehicle Number: ${session.vehicle?.vehicle_number || 'N/A'}</p>
                <p>Type: ${session.vehicle?.type || 'N/A'}</p>
                <p>Driver: ${session.ogpl?.primary_driver_name || 'N/A'}</p>
                <p>Mobile: ${session.ogpl?.primary_driver_mobile || 'N/A'}</p>
              </div>
              <div class="flex-col border-box">
                <h4>Route Information</h4>
                <p>From: ${session.from_branch?.name || 'N/A'}</p>
                <p>To: ${session.to_branch?.name || 'N/A'}</p>
                <p>Transit Date: ${session.ogpl?.transit_date ? new Date(session.ogpl.transit_date).toLocaleDateString() : 'N/A'}</p>
                <p>Loaded By: ${session.loaded_by || 'N/A'}</p>
              </div>
            </div>
            
            <div class="section">
              <h4>Loaded Items</h4>
              <table>
                <tr>
                  <th>LR Number</th>
                  <th>Quantity</th>
                  <th>Private Mark</th>
                  <th>Sender</th>
                  <th>Receiver</th>
                  <th>Article</th>
                  <th>Amount</th>
                </tr>
                ${session.ogpl?.loading_records?.map(record => {
                  const booking = record.booking;
                  if (!booking) return '';
                  return `
                    <tr>
                      <td style="font-weight: bold;">${booking.lr_number || 'N/A'}</td>
                      <td>${booking.quantity || '0'} ${booking.uom || ''}</td>
                      <td>${booking.private_mark_number || '-'}</td>
                      <td>${booking.sender?.name || 'N/A'}</td>
                      <td>${booking.receiver?.name || 'N/A'}</td>
                      <td>${booking.article?.name || 'N/A'}</td>
                      <td>₹${booking.total_amount?.toFixed(2) || '0.00'}</td>
                    </tr>
                  `;
                }).join('') || '<tr><td colspan="7">No items loaded</td></tr>'}
              </table>
            </div>
            
            <div class="signature-row">
              <div class="signature-box">
                <p class="signature-line">Prepared By</p>
              </div>
              <div class="signature-box">
                <p class="signature-line">Checked By</p>
              </div>
              <div class="signature-box">
                <p class="signature-line">Driver's Signature</p>
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
          <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Truck className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Loading Details</h2>
            <p className="text-gray-600">OGPL #{session.ogpl?.ogpl_number || 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {session.ogpl && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowEditOGPL(true)} 
                className="flex items-center gap-1"
              >
                <Edit className="h-4 w-4" />
                Edit OGPL
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowManageBookings(true)} 
                className="flex items-center gap-1"
              >
                <Settings className="h-4 w-4" />
                Manage Bookings
              </Button>
            </>
          )}
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
        {/* Vehicle Information */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900">Vehicle Information</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Vehicle Number</p>
              <div className="flex items-center gap-2 mt-1">
                <Truck className="h-4 w-4 text-gray-400" />
                <p className="font-medium text-gray-900">{session.vehicle?.vehicle_number || 'N/A'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Vehicle Type</p>
              <p className="font-medium text-gray-900 capitalize">{session.vehicle?.type || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Driver Name</p>
              <div className="flex items-center gap-2 mt-1">
                <User className="h-4 w-4 text-gray-400" />
                <p className="font-medium text-gray-900">{session.ogpl?.primary_driver_name || 'N/A'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Driver Mobile</p>
              <p className="font-medium text-gray-900">{session.ogpl?.primary_driver_mobile || 'N/A'}</p>
            </div>
          </div>
        </motion.div>
        
        {/* Route Information */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <MapPin className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="font-medium text-gray-900">Route Information</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">From</p>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="h-4 w-4 text-gray-400" />
                <p className="font-medium text-gray-900">{session.from_branch?.name || 'N/A'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">To</p>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="h-4 w-4 text-gray-400" />
                <p className="font-medium text-gray-900">{session.to_branch?.name || 'N/A'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Transit Date</p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-gray-400" />
                <p className="font-medium text-gray-900">
                  {session.ogpl?.transit_date 
                    ? new Date(session.ogpl.transit_date).toLocaleDateString() 
                    : 'N/A'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Loaded On</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4 text-gray-400" />
                <p className="font-medium text-gray-900">{new Date(session.loaded_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          {session.notes && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">Notes</p>
              <p className="text-sm text-gray-600 mt-1">{session.notes}</p>
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Loaded Items */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Package className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Loaded Items</h3>
            <p className="text-sm text-gray-500">
              {session.total_items || session.ogpl?.loading_records?.length || 0} items loaded
            </p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">LR Number</th>
                <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Sender</th>
                <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Receiver</th>
                <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Article</th>
                <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Quantity</th>
                <th className="text-right text-sm font-medium text-gray-600 px-4 py-3">Amount</th>
                <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {session.ogpl?.loading_records?.map((record) => {
                const booking = record.booking;
                if (!booking) return null;
                
                return (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-blue-600">{booking.lr_number}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{booking.sender?.name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{booking.sender?.mobile || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{booking.receiver?.name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{booking.receiver?.mobile || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">{booking.article?.name || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">{booking.quantity || '0'} {booking.uom || ''}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">₹{booking.total_amount?.toFixed(2) || '0.00'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <CheckCircle2 className="h-3 w-3" />
                        Loaded
                      </span>
                    </td>
                  </tr>
                );
              })}
              
              {(!session.ogpl?.loading_records || session.ogpl.loading_records.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No items loaded</h3>
                    <p className="text-gray-500 mt-1">This loading sheet has no items</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
      
      {/* Footer */}
      <div className="flex justify-end">
        <Button onClick={onClose} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      
      {/* Edit OGPL Modal */}
      {showEditOGPL && session.ogpl && (
        <EditOGPLModal
          isOpen={showEditOGPL}
          onClose={() => setShowEditOGPL(false)}
          ogpl={session.ogpl}
          vehicles={vehicles}
          branches={branches}
          onSuccess={() => {
            setShowEditOGPL(false);
            // Optionally refresh the session data
          }}
        />
      )}
      
      {/* Manage Bookings Modal */}
      {showManageBookings && session.ogpl && (
        <ManageOGPLBookings
          isOpen={showManageBookings}
          onClose={() => setShowManageBookings(false)}
          ogpl={session.ogpl}
          onSuccess={() => {
            setShowManageBookings(false);
            // Optionally refresh the session data
          }}
        />
      )}
    </div>
  );
}