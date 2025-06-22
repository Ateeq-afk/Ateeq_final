import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  AlertTriangle, 
  Settings, 
  MoreVertical, 
  Download, 
  Printer, 
  Share2, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  Truck, 
  X, 
  Plus, 
  RefreshCw, 
  Package 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBookings } from '@/hooks/useBookings';
import { useBranches } from '@/hooks/useBranches';
import { sendBookingSMS, sendStatusUpdateSMS } from '@/lib/sms';
import { useNavigate } from 'react-router-dom';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import BookingModification from './BookingModification';
import BookingCancellation from './BookingCancellation';
import ProofOfDelivery from './ProofOfDelivery';
import type { Booking } from '@/types';

const DEFAULT_FILTERS = {
  search: '',
  dateRange: 'all',
  status: 'all',
  paymentType: 'all',
  branch: 'all'
} as const;

export default function BookingList() {
  // Initialize all form controls with default values
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showModify, setShowModify] = useState<string | null>(null);
  const [showCancel, setShowCancel] = useState<string | null>(null);
  const [showPOD, setShowPOD] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showAllItems, setShowAllItems] = useState(false);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotificationSystem();

  const { branches, loading: branchesLoading } = useBranches();
  const { bookings, loading, error, updateBookingStatus, refresh } = useBookings();

  console.log("BookingList - Loaded bookings:", bookings?.length || 0);
  console.log("BookingList - First booking:", bookings?.[0]);

  const handleResendSMS = async (booking: Booking) => {
    try {
      await sendBookingSMS(booking);
      showSuccess('SMS Sent', 'Booking details sent successfully via SMS');
    } catch (err) {
      console.error('Failed to resend SMS:', err);
      showError('SMS Failed', 'Failed to send SMS. Please try again.');
    }
  };

  const handleViewDetails = (bookingId: string) => {
    navigate(`/dashboard/bookings/${bookingId}`);
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
      
      // Find the booking to send SMS
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        try {
          await sendStatusUpdateSMS({
            ...booking,
            status: newStatus
          });
        } catch (err) {
          console.error('Failed to send status update SMS:', err);
        }
      }
      
      showSuccess('Status Updated', `Booking status updated to ${newStatus}`);
    } catch (err) {
      console.error('Failed to update status:', err);
      showError('Update Failed', 'Failed to update booking status');
    }
  };

  const handleModifyBooking = async (bookingId: string, updates: Partial<Booking>) => {
    try {
      await updateBookingStatus(bookingId, 'booked', updates);
      showSuccess('Booking Updated', 'Booking details have been updated successfully');
    } catch (err) {
      console.error('Failed to modify booking:', err);
      showError('Update Failed', 'Failed to update booking details');
      throw err;
    }
  };

  const handleCancelBooking = async (bookingId: string, reason: string) => {
    try {
      await updateBookingStatus(bookingId, 'cancelled', { cancellation_reason: reason });
      
      // Find the booking to send SMS
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        try {
          await sendStatusUpdateSMS({
            ...booking,
            status: 'cancelled'
          });
        } catch (err) {
          console.error('Failed to send cancellation SMS:', err);
        }
      }
      
      showSuccess('Booking Cancelled', 'Booking has been cancelled successfully');
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      showError('Cancellation Failed', 'Failed to cancel booking');
      throw err;
    }
  };

  const handleSubmitPOD = async (data: any) => {
    try {
      const bookingId = data.bookingId;
      
      // Update booking status to delivered
      await updateBookingStatus(bookingId, 'delivered', {
        pod_data: data,
        delivery_date: new Date().toISOString()
      });
      
      // Find the booking to send SMS
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        try {
          await sendStatusUpdateSMS({
            ...booking,
            status: 'delivered'
          });
        } catch (err) {
          console.error('Failed to send delivery SMS:', err);
        }
      }
      
      showSuccess('Delivery Confirmed', 'Proof of delivery has been recorded successfully');
    } catch (err) {
      console.error('Failed to submit POD:', err);
      showError('Submission Failed', 'Failed to submit proof of delivery');
      throw err;
    }
  };

  // Update filter handlers
  const updateFilter = (key: keyof typeof DEFAULT_FILTERS, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to descending for new sort field
    }
  };

  // Apply filters and sorting
  const filteredBookings = React.useMemo(() => {
    if (!bookings || bookings.length === 0) {
      console.log("No bookings to filter");
      return [];
    }
    
    console.log("Filtering bookings:", bookings.length);
    
    return bookings.filter(booking => {
      // Safely access nested properties
      const senderName = booking.sender?.name || '';
      const senderMobile = booking.sender?.mobile || '';
      const receiverName = booking.receiver?.name || '';
      const receiverMobile = booking.receiver?.mobile || '';
      const fromBranchId = booking.from_branch;
      const toBranchId = booking.to_branch;

      // Search filter
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = searchLower === '' || 
        booking.lr_number.toLowerCase().includes(searchLower) ||
        senderName.toLowerCase().includes(searchLower) ||
        receiverName.toLowerCase().includes(searchLower) ||
        senderMobile.includes(searchLower) ||
        receiverMobile.includes(searchLower);

      if (!matchesSearch) return false;

      // Status filter
      if (filters.status !== 'all' && booking.status !== filters.status) return false;

      // Payment type filter
      if (filters.paymentType !== 'all' && booking.payment_type !== filters.paymentType) return false;

      // Branch filter
      if (filters.branch !== 'all' && fromBranchId !== filters.branch && toBranchId !== filters.branch) return false;

      // Date range filter
      if (filters.dateRange !== 'all') {
        const bookingDate = new Date(booking.created_at);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        switch (filters.dateRange) {
          case 'today':
            if (bookingDate.toDateString() !== today.toDateString()) return false;
            break;
          case 'yesterday':
            if (bookingDate.toDateString() !== yesterday.toDateString()) return false;
            break;
          case 'last_week':
            if (bookingDate < lastWeek) return false;
            break;
          case 'last_month':
            if (bookingDate < lastMonth) return false;
            break;
        }
      }

      return true;
    }).sort((a, b) => {
      // Sorting
      if (sortField === 'lr_number') {
        return sortDirection === 'asc' 
          ? a.lr_number.localeCompare(b.lr_number)
          : b.lr_number.localeCompare(a.lr_number);
      } else if (sortField === 'created_at') {
        return sortDirection === 'asc'
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortField === 'total_amount') {
        return sortDirection === 'asc'
          ? a.total_amount - b.total_amount
          : b.total_amount - a.total_amount;
      }
      return 0;
    });
  }, [bookings, filters, sortField, sortDirection]);

  // Toggle booking selection
  const toggleBookingSelection = (bookingId: string) => {
    setSelectedBookings(prev => 
      prev.includes(bookingId) 
        ? prev.filter(id => id !== bookingId) 
        : [...prev, bookingId]
    );
  };

  // Select/deselect all bookings
  const toggleSelectAll = () => {
    if (selectedBookings.length === filteredBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(filteredBookings.map(b => b.id));
    }
  };

  // Print all LRs
  const handlePrintAllLRs = () => {
    // Set printing mode
    setIsPrinting(true);
    
    // Add print-specific styles
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
        .lr-page {
          page-break-after: always;
          margin-bottom: 30px;
          padding: 20px;
          border: 1px solid #ddd;
          font-family: 'Lato', Arial, sans-serif;
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
          text-align: left;
        }
        th {
          background-color: #f3f4f6;
          font-weight: bold;
        }
      }
    `;
    document.head.appendChild(printStyles);
    
    // Create print container
    const printContainer = document.createElement('div');
    printContainer.className = 'print-content';
    
    // Determine which bookings to print
    const bookingsToPrint = selectedBookings.length > 0
      ? filteredBookings.filter(b => selectedBookings.includes(b.id))
      : filteredBookings;
    
    // Add each LR to the print container
    bookingsToPrint.forEach((booking, index) => {
      const lrElement = document.createElement('div');
      lrElement.className = 'lr-page';
      
      // Create LR content
      lrElement.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 24px; margin: 0; font-weight: bold;">Lorry Receipt</h2>
            <p style="margin: 0;">LR #${booking.lr_number}</p>
          </div>
          <div style="text-align: right;">
            <h3 style="margin: 0; font-weight: bold;">DesiCargo Logistics</h3>
            <p style="margin: 0;">Date: ${new Date(booking.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div style="display: flex; margin-bottom: 20px;">
          <div style="flex: 1; padding: 10px; border: 1px solid #ddd; margin-right: 10px;">
            <h4 style="margin-top: 0; font-weight: bold;">From</h4>
            <p style="margin: 0;">${booking.from_branch_details?.name || 'N/A'}</p>
            <p style="margin: 0;">${booking.from_branch_details?.city || ''}, ${booking.from_branch_details?.state || ''}</p>
          </div>
          <div style="flex: 1; padding: 10px; border: 1px solid #ddd;">
            <h4 style="margin-top: 0; font-weight: bold;">To</h4>
            <p style="margin: 0;">${booking.to_branch_details?.name || 'N/A'}</p>
            <p style="margin: 0;">${booking.to_branch_details?.city || ''}, ${booking.to_branch_details?.state || ''}</p>
          </div>
        </div>
        
        <div style="display: flex; margin-bottom: 20px;">
          <div style="flex: 1; padding: 10px; border: 1px solid #ddd; margin-right: 10px;">
            <h4 style="margin-top: 0; font-weight: bold;">Sender</h4>
            <p style="margin: 0;">${booking.sender?.name || 'N/A'}</p>
            <p style="margin: 0;">${booking.sender?.mobile || 'N/A'}</p>
          </div>
          <div style="flex: 1; padding: 10px; border: 1px solid #ddd;">
            <h4 style="margin-top: 0; font-weight: bold;">Receiver</h4>
            <p style="margin: 0;">${booking.receiver?.name || 'N/A'}</p>
            <p style="margin: 0;">${booking.receiver?.mobile || 'N/A'}</p>
          </div>
        </div>
        
        <div style="padding: 10px; border: 1px solid #ddd; margin-bottom: 20px;">
          <h4 style="margin-top: 0; font-weight: bold;">Article Details</h4>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #ddd; background-color: #f3f4f6;">
              <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Article</th>
              <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Description</th>
              <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Quantity</th>
              <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Rate</th>
              <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Amount</th>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">${booking.article?.name || 'N/A'}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${booking.description || '-'}</td>
              <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">${booking.quantity} ${booking.uom}</td>
              <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">₹${booking.freight_per_qty}</td>
              <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">₹${(booking.quantity * booking.freight_per_qty).toFixed(2)}</td>
            </tr>
            ${booking.loading_charges ? `
            <tr>
              <td colspan="4" style="text-align: right; padding: 8px; border: 1px solid #ddd;">Loading Charges:</td>
              <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">₹${booking.loading_charges.toFixed(2)}</td>
            </tr>` : ''}
            ${booking.unloading_charges ? `
            <tr>
              <td colspan="4" style="text-align: right; padding: 8px; border: 1px solid #ddd;">Unloading Charges:</td>
              <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">₹${booking.unloading_charges.toFixed(2)}</td>
            </tr>` : ''}
            <tr style="border-top: 1px solid #ddd; font-weight: bold; background-color: #f3f4f6;">
              <td colspan="4" style="text-align: right; padding: 8px; border: 1px solid #ddd;">Total:</td>
              <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">₹${booking.total_amount.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div style="flex: 1; padding: 10px; border: 1px solid #ddd; margin-right: 10px;">
            <h4 style="margin-top: 0; font-weight: bold;">Payment Details</h4>
            <p style="margin: 0;">Payment Type: ${booking.payment_type}</p>
            <p style="margin: 0;">Status: ${booking.status.replace('_', ' ')}</p>
          </div>
          <div style="flex: 1; padding: 10px; border: 1px solid #ddd;">
            <h4 style="margin-top: 0; font-weight: bold;">Additional Information</h4>
            <p style="margin: 0;">Booking Date: ${new Date(booking.created_at).toLocaleDateString()}</p>
            <p style="margin: 0;">Expected Delivery: ${booking.expected_delivery_date ? new Date(booking.expected_delivery_date).toLocaleDateString() : 'Not specified'}</p>
          </div>
        </div>
        
        <div style="margin-top: 40px; display: flex; justify-content: space-between;">
          <div style="text-align: center;">
            <p style="border-top: 1px solid #000; padding-top: 5px; margin-top: 20px;">Sender's Signature</p>
          </div>
          <div style="text-align: center;">
            <p style="border-top: 1px solid #000; padding-top: 5px; margin-top: 20px;">Receiver's Signature</p>
          </div>
          <div style="text-align: center;">
            <p style="border-top: 1px solid #000; padding-top: 5px; margin-top: 20px;">For DesiCargo Logistics</p>
          </div>
        </div>
      `;
      
      printContainer.appendChild(lrElement);
    });
    
    // Add to document, print, then remove
    document.body.appendChild(printContainer);
    window.print();
    document.body.removeChild(printContainer);
    document.head.removeChild(printStyles);
    
    // Reset printing mode
    setIsPrinting(false);
  };

  // Print OGPL
  const handlePrintOGPL = () => {
    // Set printing mode
    setIsPrinting(true);
    
    // Add print-specific styles
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
    
    // Determine which bookings to print
    const bookingsToPrint = selectedBookings.length > 0
      ? filteredBookings.filter(b => selectedBookings.includes(b.id))
      : filteredBookings;
    
    // Create OGPL content
    printContainer.innerHTML = `
      <div style="padding: 20px; font-family: 'Lato', Arial, sans-serif;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 24px; margin: 0;">Outward Gate Pass cum Loading Sheet</h2>
            <p style="margin: 0;">Date: ${new Date().toLocaleDateString()}</p>
          </div>
          <div style="text-align: right;">
            <h3 style="margin: 0;">DesiCargo Logistics</h3>
            <p style="margin: 0;">OGPL #${Date.now().toString().slice(-8)}</p>
          </div>
        </div>
        
        <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #ddd;">
          <h3 style="margin-top: 0;">Vehicle & Route Details</h3>
          <div style="display: flex;">
            <div style="flex: 1;">
              <p><strong>Vehicle Number:</strong> MH01AB1234</p>
              <p><strong>Driver Name:</strong> Rajesh Kumar</p>
              <p><strong>Driver Mobile:</strong> 9876543210</p>
            </div>
            <div style="flex: 1;">
              <p><strong>From:</strong> Mumbai HQ</p>
              <p><strong>To:</strong> Delhi Branch</p>
              <p><strong>Transit Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background-color: #f3f4f6; border-bottom: 1px solid #ddd;">
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">LR Number</th>
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Article</th>
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Sender</th>
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Receiver</th>
            <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Quantity</th>
            <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Amount</th>
          </tr>
          ${bookingsToPrint.map(booking => `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px; border: 1px solid #ddd;">${booking.lr_number}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${booking.article?.name || 'N/A'}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${booking.sender?.name || 'N/A'}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${booking.receiver?.name || 'N/A'}</td>
              <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">${booking.quantity} ${booking.uom}</td>
              <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">₹${booking.total_amount.toFixed(2)}</td>
            </tr>
          `).join('')}
          <tr style="font-weight: bold; background-color: #f3f4f6;">
            <td colspan="5" style="text-align: right; padding: 8px; border: 1px solid #ddd;">Total:</td>
            <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">₹${bookingsToPrint.reduce((sum, b) => sum + (b.total_amount || 0), 0).toFixed(2)}</td>
          </tr>
        </table>
        
        <div style="margin-top: 40px; display: flex; justify-content: space-between;">
          <div style="text-align: center;">
            <p style="border-top: 1px solid #000; padding-top: 5px; margin-top: 20px;">Prepared By</p>
          </div>
          <div style="text-align: center;">
            <p style="border-top: 1px solid #000; padding-top: 5px; margin-top: 20px;">Checked By</p>
          </div>
          <div style="text-align: center;">
            <p style="border-top: 1px solid #000; padding-top: 5px; margin-top: 20px;">Driver's Signature</p>
          </div>
        </div>
      </div>
    `;
    
    // Add to document, print, then remove
    document.body.appendChild(printContainer);
    window.print();
    document.body.removeChild(printContainer);
    document.head.removeChild(printStyles);
    
    // Reset printing mode
    setIsPrinting(false);
  };

  const handleRefresh = async () => {
    try {
      await refresh();
      showSuccess('Refreshed', 'Booking list has been refreshed');
    } catch (err) {
      showError('Refresh Failed', 'Failed to refresh booking list');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-2 text-blue-600">
          <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></div>
          <span>Loading bookings...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          <span>Failed to load bookings. Please try again.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bookings</h2>
          <p className="text-gray-600 mt-1">
            {filteredBookings.length} bookings found
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setShowAllItems(!showAllItems)} 
            className="flex items-center gap-2"
          >
            {showAllItems ? "Show Paginated" : "Show All"}
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2" 
            onClick={handlePrintAllLRs}
            disabled={isPrinting}
          >
            <Printer className="h-4 w-4" />
            Print {selectedBookings.length > 0 ? `Selected (${selectedBookings.length})` : 'All'} LRs
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2" 
            onClick={handlePrintOGPL}
            disabled={isPrinting}
          >
            <Printer className="h-4 w-4" />
            Print OGPL
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button 
            className="flex items-center gap-2"
            onClick={() => navigate('/dashboard/new-booking')}
          >
            <Plus className="h-4 w-4" />
            New Booking
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search by LR or customer..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>

          <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="last_week">Last Week</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="booked">Booked</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.paymentType} onValueChange={(value) => updateFilter('paymentType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by payment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="To Pay">To Pay</SelectItem>
              <SelectItem value="Quotation">Quotation</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.branch} onValueChange={(value) => updateFilter('branch', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedBookings.length > 0 && selectedBookings.length === filteredBookings.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">LR Number</th>
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Date</th>
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">From</th>
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">To</th>
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Sender</th>
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Receiver</th>
                <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Status</th>
                <th className="text-right text-sm font-medium text-gray-600 px-6 py-4">Amount</th>
                <th className="text-right text-sm font-medium text-gray-600 px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(showAllItems ? filteredBookings : filteredBookings.slice(0, 100)).map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedBookings.includes(booking.id)}
                      onChange={() => toggleBookingSelection(booking.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-blue-600">{booking.lr_number}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div>{new Date(booking.created_at).toLocaleDateString()}</div>
                    <div className="text-gray-500">{new Date(booking.created_at).toLocaleTimeString()}</div>
                  </td>
                  <td className="px-6 py-4">{booking.from_branch_details?.name || 'N/A'}</td>
                  <td className="px-6 py-4">{booking.to_branch_details?.name || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">{booking.sender?.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{booking.sender?.mobile || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">{booking.receiver?.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{booking.receiver?.mobile || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      booking.status === 'delivered'
                        ? 'bg-green-100 text-green-800'
                        : booking.status === 'in_transit'
                        ? 'bg-blue-100 text-blue-800'
                        : booking.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.status.replace('_', ' ').charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div>
                      <div className="font-medium">₹{booking.total_amount}</div>
                      <div className="text-xs text-gray-500">{booking.payment_type}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleViewDetails(booking.id)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* Status Update Options */}
                          {booking.status !== 'delivered' && booking.status !== 'cancelled' && (
                            <div className="flex flex-wrap gap-2">
                              {booking.status === 'booked' && (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(booking.id, 'in_transit')}>
                                  <Truck className="h-4 w-4 mr-2 text-blue-600" />
                                  Mark In Transit
                                </DropdownMenuItem>
                              )}
                              
                              {booking.status === 'in_transit' && (
                                <DropdownMenuItem onClick={() => setShowPOD(booking.id)}>
                                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                                  Mark Delivered
                                </DropdownMenuItem>
                              )}
                            </div>
                          )}
                          
                          {/* Edit/Modify Option */}
                          {(booking.status === 'booked' || booking.status === 'in_transit') && (
                            <DropdownMenuItem onClick={() => setShowModify(booking.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Modify Booking
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem onClick={() => handleResendSMS(booking)}>
                            <Share2 className="h-4 w-4 mr-2" />
                            Resend SMS
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePrintAllLRs()}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print LR
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(booking)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download LR
                          </DropdownMenuItem>
                          
                          {/* Cancel Option */}
                          {(booking.status === 'booked' || booking.status === 'in_transit') && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setShowCancel(booking.id)}
                                className="text-red-600"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancel Booking
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No bookings found</h3>
                    <p className="text-gray-500 mt-1">
                      {filters.search || filters.status !== 'all' || filters.paymentType !== 'all' || filters.branch !== 'all' || filters.dateRange !== 'all'
                        ? 'Try adjusting your filters to see more results'
                        : 'Create your first booking to get started'}
                    </p>
                    {!filters.search && filters.status === 'all' && filters.paymentType === 'all' && filters.branch === 'all' && filters.dateRange === 'all' && (
                      <Button 
                        onClick={() => navigate('/dashboard/new-booking')} 
                        className="mt-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Booking
                      </Button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination info */}
        {filteredBookings.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
            <div className="text-sm text-gray-700">
              Showing {showAllItems ? 'all' : '100'} of {filteredBookings.length} bookings
            </div>
            <div className="flex gap-2">
              {!showAllItems && filteredBookings.length > 100 && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowAllItems(true)}
                >
                  Show All Bookings
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modification Modal */}
      {showModify && (
        <BookingModification
          bookingId={showModify}
          onClose={() => setShowModify(null)}
          onSubmit={handleModifyBooking}
        />
      )}

      {/* Cancellation Modal */}
      {showCancel && (
        <BookingCancellation
          bookingId={showCancel}
          onClose={() => setShowCancel(null)}
          onSubmit={handleCancelBooking}
        />
      )}

      {/* Proof of Delivery Modal */}
      {showPOD && (
        <ProofOfDelivery
          bookingId={showPOD}
          onClose={() => setShowPOD(null)}
          onSubmit={handleSubmitPOD}
        />
      )}
    </div>
  );

  // Helper function to generate LR HTML for a booking
  function handleDownload(booking: Booking) {
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
    
    // Create LR content
    printContainer.innerHTML = `
      <div style="padding: 20px; font-family: 'Lato', Arial, sans-serif;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 24px; margin: 0; font-weight: bold;">Lorry Receipt</h2>
            <p style="margin: 0;">LR #${booking.lr_number}</p>
          </div>
          <div style="text-align: right;">
            <h3 style="margin: 0; font-weight: bold;">DesiCargo Logistics</h3>
            <p style="margin: 0;">Date: ${new Date(booking.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div style="display: flex; margin-bottom: 20px;">
          <div style="flex: 1; padding: 10px; border: 1px solid #ddd; margin-right: 10px;">
            <h4 style="margin-top: 0; font-weight: bold;">From</h4>
            <p style="margin: 0;">${booking.from_branch_details?.name || 'N/A'}</p>
            <p style="margin: 0;">${booking.from_branch_details?.city || ''}, ${booking.from_branch_details?.state || ''}</p>
          </div>
          <div style="flex: 1; padding: 10px; border: 1px solid #ddd;">
            <h4 style="margin-top: 0; font-weight: bold;">To</h4>
            <p style="margin: 0;">${booking.to_branch_details?.name || 'N/A'}</p>
            <p style="margin: 0;">${booking.to_branch_details?.city || ''}, ${booking.to_branch_details?.state || ''}</p>
          </div>
        </div>
        
        <div style="display: flex; margin-bottom: 20px;">
          <div style="flex: 1; padding: 10px; border: 1px solid #ddd; margin-right: 10px;">
            <h4 style="margin-top: 0; font-weight: bold;">Sender</h4>
            <p style="margin: 0;">${booking.sender?.name || 'N/A'}</p>
            <p style="margin: 0;">${booking.sender?.mobile || 'N/A'}</p>
          </div>
          <div style="flex: 1; padding: 10px; border: 1px solid #ddd;">
            <h4 style="margin-top: 0; font-weight: bold;">Receiver</h4>
            <p style="margin: 0;">${booking.receiver?.name || 'N/A'}</p>
            <p style="margin: 0;">${booking.receiver?.mobile || 'N/A'}</p>
          </div>
        </div>
        
        <div style="padding: 10px; border: 1px solid #ddd; margin-bottom: 20px;">
          <h4 style="margin-top: 0; font-weight: bold;">Article Details</h4>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #ddd; background-color: #f3f4f6;">
              <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Article</th>
              <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Description</th>
              <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Quantity</th>
              <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Rate</th>
              <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Amount</th>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">${booking.article?.name || 'N/A'}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${booking.description || '-'}</td>
              <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">${booking.quantity} ${booking.uom}</td>
              <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">₹${booking.freight_per_qty}</td>
              <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">₹${(booking.quantity * booking.freight_per_qty).toFixed(2)}</td>
            </tr>
            ${booking.loading_charges ? `
            <tr>
              <td colspan="4" style="text-align: right; padding: 8px; border: 1px solid #ddd;">Loading Charges:</td>
              <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">₹${booking.loading_charges.toFixed(2)}</td>
            </tr>` : ''}
            ${booking.unloading_charges ? `
            <tr>
              <td colspan="4" style="text-align: right; padding: 8px; border: 1px solid #ddd;">Unloading Charges:</td>
              <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">₹${booking.unloading_charges.toFixed(2)}</td>
            </tr>` : ''}
            <tr style="border-top: 1px solid #ddd; font-weight: bold; background-color: #f3f4f6;">
              <td colspan="4" style="text-align: right; padding: 8px; border: 1px solid #ddd;">Total:</td>
              <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">₹${booking.total_amount.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div style="flex: 1; padding: 10px; border: 1px solid #ddd; margin-right: 10px;">
            <h4 style="margin-top: 0; font-weight: bold;">Payment Details</h4>
            <p style="margin: 0;">Payment Type: ${booking.payment_type}</p>
            <p style="margin: 0;">Status: ${booking.status.replace('_', ' ')}</p>
          </div>
          <div style="flex: 1; padding: 10px; border: 1px solid #ddd;">
            <h4 style="margin-top: 0; font-weight: bold;">Additional Information</h4>
            <p style="margin: 0;">Booking Date: ${new Date(booking.created_at).toLocaleDateString()}</p>
            <p style="margin: 0;">Expected Delivery: ${booking.expected_delivery_date ? new Date(booking.expected_delivery_date).toLocaleDateString() : 'Not specified'}</p>
          </div>
        </div>
        
        <div style="margin-top: 40px; display: flex; justify-content: space-between;">
          <div style="text-align: center;">
            <p style="border-top: 1px solid #000; padding-top: 5px; margin-top: 20px;">Sender's Signature</p>
          </div>
          <div style="text-align: center;">
            <p style="border-top: 1px solid #000; padding-top: 5px; margin-top: 20px;">Receiver's Signature</p>
          </div>
          <div style="text-align: center;">
            <p style="border-top: 1px solid #000; padding-top: 5px; margin-top: 20px;">For DesiCargo Logistics</p>
          </div>
        </div>
      </div>
    `;
    
    // Add to document, print, then remove
    document.body.appendChild(printContainer);
    window.print();
    document.body.removeChild(printContainer);
    document.head.removeChild(printStyles);
    
    showSuccess('Download Started', 'Your LR is being downloaded');
  }
}