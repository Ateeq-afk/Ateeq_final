import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Share2, 
  Package, 
  MapPin, 
  User, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  Shield, 
  Truck, 
  CheckCircle2, 
  QrCode,
  Copy,
  MessageSquare,
  Edit,
  MoreVertical,
  Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBookings } from '@/hooks/useBookings';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { sendStatusUpdateSMS } from '@/lib/sms';
import { generateLRHtml } from '@/utils/printUtils';
import { QRCodeSVG } from 'qrcode.react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { motion } from 'framer-motion';
import type { Booking } from '@/types';

export default function BookingDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { bookings, loading, error, updateBookingStatus } = useBookings();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const { showSuccess, showError } = useNotificationSystem();
  const [printMode, setPrintMode] = useState(false);

  useEffect(() => {
    if (bookings.length > 0 && id) {
      const foundBooking = bookings.find(b => b.id === id);
      if (foundBooking) {
        setBooking(foundBooking);
      }
    }
  }, [bookings, id]);

  const handleBack = () => {
    navigate(-1);
  };

  const handlePrint = () => {
    // Create a printable version of the LR
    const printWindow = window.open('', '_blank');
    if (!printWindow || !booking) return;
    
    const lrHtml = generateLRHtml(booking);
    
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
            ${lrHtml}
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
    
    showSuccess('Print Started', 'Your LR is being printed');
  };

  const handleDownload = () => {
    if (!booking) return;
    
    // Create a printable version of the LR
    const printStyles = document.createElement('style');
    printStyles.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        .print-content, .print-content * {
          visibility: visible;
        }
        .print-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .print-hide {
          display: none !important;
        }
        @page {
          size: A4;
          margin: 10mm;
        }
        table {
          border-collapse: collapse;
          width: 100%;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
        }
        th {
          background-color: #f3f4f6;
          font-weight: bold;
        }
        h2, h3 {
          margin-top: 0;
          font-weight: bold;
        }
        body {
          font-family: 'Lato', Arial, sans-serif;
        }
      }
    `;
    document.head.appendChild(printStyles);
    
    // Create print container
    const printContainer = document.createElement('div');
    printContainer.className = 'print-content';
    
    printContainer.innerHTML = generateLRHtml(booking);
    
    // Add to document, print, then remove
    document.body.appendChild(printContainer);
    window.print();
    document.body.removeChild(printContainer);
    document.head.removeChild(printStyles);
    
    showSuccess('Download Started', 'Your LR is being downloaded');
  };


  const handleShare = () => {
    if (navigator.share && booking) {
      navigator.share({
        title: `Booking LR ${booking.lr_number}`,
        text: `Track your shipment with LR number ${booking.lr_number}`,
        url: window.location.href,
      }).catch(err => {
        console.error('Error sharing:', err);
      });
    } else {
      // Fallback for browsers that don't support the Web Share API
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showSuccess('Link Copied', 'Booking link copied to clipboard');
  };

  const handleCopyLRNumber = () => {
    if (booking) {
      navigator.clipboard.writeText(booking.lr_number);
      showSuccess('LR Number Copied', 'LR number copied to clipboard');
    }
  };

  const handleStatusUpdate = async (newStatus: Booking['status']) => {
    if (!booking) return;
    
    try {
      setStatusUpdating(true);
      await updateBookingStatus(booking.id, newStatus);
      
      // Update local state
      setBooking(prev => prev ? { ...prev, status: newStatus } : null);
      
      // Send SMS notification
      if (booking.sender?.mobile && booking.receiver?.mobile) {
        await sendStatusUpdateSMS({
          ...booking,
          status: newStatus
        });
      }
      
      showSuccess('Status Updated', `Booking status updated to ${newStatus}`);
    } catch (err) {
      console.error('Failed to update status:', err);
      showError('Update Failed', err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleSendSMS = async () => {
    if (!booking) return;
    
    try {
      await sendStatusUpdateSMS(booking);
      showSuccess('SMS Sent', 'Status update SMS sent successfully');
    } catch (err) {
      console.error('Failed to send SMS:', err);
      showError('SMS Failed', err instanceof Error ? err.message : 'Failed to send SMS');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-2 text-blue-600">
          <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></div>
          <span>Loading booking details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          <span>Failed to load booking details. Please try again.</span>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-gray-600">
          <Package className="h-12 w-12 text-gray-400 mb-2" />
          <span className="text-lg font-medium">Booking not found</span>
          <Button onClick={handleBack} variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bookings
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      case 'warehouse':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'in_transit':
        return <Truck className="h-4 w-4" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 ${printMode ? 'print:bg-white print:p-0' : ''}`}>
      <div className="max-w-7xl mx-auto print-content">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 print:hidden">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleBack} className="-ml-3">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button variant="outline" onClick={handleDownload} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>
            <Button variant="outline" onClick={handleShare} className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/dashboard/bookings/edit/${booking.id}`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Booking
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSendSMS}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send SMS Update
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLRNumber}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy LR Number
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Print Header - Only visible when printing */}
        <div className="hidden print:block print:mb-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Lorry Receipt</h1>
                <p className="text-gray-600">#{booking.lr_number}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">DesiCargo Logistics</p>
              <p className="text-sm text-gray-600">Date: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* LR Number and Status Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">LR #{booking.lr_number}</h2>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleCopyLRNumber} 
                    className="h-6 w-6 rounded-full print:hidden"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(booking.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${getStatusColor(booking.status)}`}>
                {getStatusIcon(booking.status)}
                <span className="font-medium capitalize">
                  {booking.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2 print:hidden">
                {booking.status !== 'delivered' && booking.status !== 'cancelled' && (
                  <div className="flex flex-wrap gap-2">
                    {booking.status === 'booked' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleStatusUpdate('in_transit')}
                        disabled={statusUpdating}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Mark In Transit
                      </Button>
                    )}
                    
                    {booking.status === 'in_transit' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleStatusUpdate('delivered')}
                        disabled={statusUpdating}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark Delivered
                      </Button>
                    )}
                    
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleStatusUpdate('cancelled')}
                      disabled={statusUpdating}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details Tabs */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="details" className="w-full print:hidden">
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="details">Booking Details</TabsTrigger>
                <TabsTrigger value="tracking">Tracking</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-6">
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
                      <p className="font-medium text-gray-900">{booking.from_branch_details?.name || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{booking.from_branch_details?.city}, {booking.from_branch_details?.state}</p>
                    </div>
                    <div className="text-gray-400">→</div>
                    <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">To</p>
                      <p className="font-medium text-gray-900">{booking.to_branch_details?.name || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{booking.to_branch_details?.city}, {booking.to_branch_details?.state}</p>
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
                        <p className="font-medium text-gray-900">{booking.article?.name || 'N/A'}</p>
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
                    
                    {booking.special_instructions && (
                      <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                        <p className="text-sm text-yellow-800 font-medium">Special Instructions</p>
                        <p className="text-sm text-yellow-700 mt-1">{booking.special_instructions}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Payment Details */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 bg-green-50 rounded-lg flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-green-600"
                      >
                        <path d="M6 3h12" />
                        <path d="M6 8h12" />
                        <path d="m6 13 8.5 8" />
                        <path d="M6 13h3" />
                        <path d="M9 13c6.667 0 6.667-10 0-10" />
                      </svg>
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
                      <p className="text-gray-600">Loading Charges</p>
                      <p className="font-medium">₹{booking.loading_charges.toFixed(2)}</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-gray-600">Unloading Charges</p>
                      <p className="font-medium">₹{booking.unloading_charges.toFixed(2)}</p>
                    </div>
                    
                    {booking.insurance_charge > 0 && (
                      <div className="flex items-center justify-between">
                        <p className="text-gray-600">Insurance Charges</p>
                        <p className="font-medium">₹{booking.insurance_charge.toFixed(2)}</p>
                      </div>
                    )}
                    
                    {booking.packaging_charge > 0 && (
                      <div className="flex items-center justify-between">
                        <p className="text-gray-600">Packaging Charges</p>
                        <p className="font-medium">₹{booking.packaging_charge.toFixed(2)}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <p className="font-medium text-gray-900">Total Amount</p>
                      <p className="font-bold text-lg text-blue-600">₹{booking.total_amount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="tracking" className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Truck className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-medium text-gray-900">Shipment Tracking</h3>
                  </div>
                  
                  <div className="relative pb-12">
                    {/* Timeline */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    
                    {/* Booked Status */}
                    <div className="relative flex items-start gap-4 mb-8">
                      <div className="absolute left-4 w-0.5 h-full bg-gray-200"></div>
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center z-10">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1 pt-1">
                        <h4 className="font-medium text-gray-900">Booking Created</h4>
                        <p className="text-sm text-gray-500">{new Date(booking.created_at).toLocaleString()}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Booking created at {booking.from_branch_details?.name}
                        </p>
                      </div>
                    </div>
                    
                    {/* In Transit Status */}
                    <div className="relative flex items-start gap-4 mb-8">
                      <div className={`h-8 w-8 rounded-full ${
                        booking.status === 'in_transit' || booking.status === 'delivered'
                          ? 'bg-green-100'
                          : booking.status === 'cancelled'
                          ? 'bg-red-100'
                          : 'bg-gray-100'
                      } flex items-center justify-center z-10`}>
                        {booking.status === 'in_transit' || booking.status === 'delivered' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : booking.status === 'cancelled' ? (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <h4 className="font-medium text-gray-900">In Transit</h4>
                        {booking.status === 'in_transit' || booking.status === 'delivered' ? (
                          <>
                            <p className="text-sm text-gray-500">
                              {new Date(booking.updated_at).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              Shipment in transit from {booking.from_branch_details?.name} to {booking.to_branch_details?.name}
                            </p>
                          </>
                        ) : booking.status === 'cancelled' ? (
                          <p className="text-sm text-red-500">Booking was cancelled</p>
                        ) : (
                          <p className="text-sm text-gray-500">Pending</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Delivered Status */}
                    <div className="relative flex items-start gap-4">
                      <div className={`h-8 w-8 rounded-full ${
                        booking.status === 'delivered'
                          ? 'bg-green-100'
                          : booking.status === 'cancelled'
                          ? 'bg-red-100'
                          : 'bg-gray-100'
                      } flex items-center justify-center z-10`}>
                        {booking.status === 'delivered' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : booking.status === 'cancelled' ? (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <h4 className="font-medium text-gray-900">Delivered</h4>
                        {booking.status === 'delivered' ? (
                          <>
                            <p className="text-sm text-gray-500">
                              {new Date(booking.updated_at).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              Shipment delivered at {booking.to_branch_details?.name}
                            </p>
                          </>
                        ) : booking.status === 'cancelled' ? (
                          <p className="text-sm text-red-500">Booking was cancelled</p>
                        ) : (
                          <p className="text-sm text-gray-500">Pending</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Expected Delivery */}
                {booking.expected_delivery_date && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 bg-purple-50 rounded-lg flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Expected Delivery</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(booking.expected_delivery_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="documents" className="space-y-6">
                {/* Invoice Details */}
                {booking.has_invoice && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-blue-600" />
                      </div>
                      <h3 className="font-medium text-gray-900">Invoice Details</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Invoice Number</p>
                        <p className="font-medium text-gray-900">{booking.invoice_number || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Invoice Date</p>
                        <p className="font-medium text-gray-900">{booking.invoice_date || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Invoice Amount</p>
                        <p className="font-medium text-gray-900">₹{booking.invoice_amount?.toFixed(2) || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">E-Way Bill Number</p>
                        <p className="font-medium text-gray-900">{booking.eway_bill_number || '-'}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <Button variant="outline" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Download Invoice
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Other Documents */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 bg-amber-50 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-amber-600" />
                    </div>
                    <h3 className="font-medium text-gray-900">Shipping Documents</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">Lorry Receipt (LR)</p>
                          <p className="text-sm text-gray-500">#{booking.lr_number}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                    
                    {booking.eway_bill_number && (
                      <div className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Receipt className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">E-Way Bill</p>
                            <p className="text-sm text-gray-500">#{booking.eway_bill_number}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    )}
                    
                    {booking.reference_number && (
                      <div className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Receipt className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">Reference Document</p>
                            <p className="text-sm text-gray-500">#{booking.reference_number}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right Column - Customer Info and QR Code */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="font-medium text-gray-900">Customer Information</h3>
              </div>
              
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Sender</p>
                  <p className="font-medium text-gray-900">{booking.sender?.name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{booking.sender?.mobile || 'N/A'}</p>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Receiver</p>
                  <p className="font-medium text-gray-900">{booking.receiver?.name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{booking.receiver?.mobile || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            {/* QR Code */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <QrCode className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="font-medium text-gray-900">Tracking QR Code</h3>
              </div>
              
              <div className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-lg">
                <QRCodeSVG 
                  value={`${window.location.origin}/track/${booking.lr_number}`}
                  size={180}
                  level="H"
                  includeMargin={true}
                  className="mb-4"
                />
                <p className="text-sm text-gray-600 text-center">
                  Scan to track this shipment
                </p>
              </div>
              
              <div className="mt-4 print:hidden">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                  Share Tracking Link
                </Button>
              </div>
            </div>
            
            {/* Additional Information */}
            {(booking.remarks || booking.private_mark_number) && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="font-medium text-gray-900 mb-4">Additional Information</h3>
                
                <div className="space-y-4">
                  {booking.private_mark_number && (
                    <div>
                      <p className="text-sm text-gray-600">Private Mark Number</p>
                      <p className="font-medium text-gray-900">{booking.private_mark_number}</p>
                    </div>
                  )}
                  
                  {booking.remarks && (
                    <div>
                      <p className="text-sm text-gray-600">Remarks</p>
                      <p className="font-medium text-gray-900">{booking.remarks}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}