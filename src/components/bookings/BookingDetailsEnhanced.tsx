import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Edit,
  MoreVertical,
  Receipt,
  Navigation,
  Activity,
  Bell,
  MessageSquare,
  FileText,
  DollarSign,
  Sparkles,
  Map,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBookings } from '@/hooks/useBookings';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { generateLRHtml } from '@/utils/printUtils';
import { QRCodeSVG } from 'qrcode.react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Booking } from '@/types';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
    },
  },
};

export default function BookingDetailsEnhanced() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { bookings, loading, error, updateBookingStatus } = useBookings();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [showRealTimeTracking, setShowRealTimeTracking] = useState(false);
  const { showSuccess, showError } = useNotificationSystem();

  useEffect(() => {
    if (bookings.length > 0 && id) {
      const foundBooking = bookings.find((b) => b.id === id);
      if (foundBooking) {
        setBooking(foundBooking);
      }
    }
  }, [bookings, id]);

  // Simulate real-time updates
  useEffect(() => {
    if (booking?.status === 'in_transit') {
      const interval = setInterval(() => {
        // Simulate location update
        console.log('Real-time tracking update');
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [booking]);

  const handleBack = () => navigate(-1);

  const handlePrint = () => {
    if (!booking) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const lrHtml = generateLRHtml(booking);
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lorry Receipt - ${booking.lr_number}</title>
          <style>
            body { font-family: 'Lato', Arial, sans-serif; margin: 0; padding: 20px; }
            @media print { @page { size: A5 landscape; margin: 5mm; } }
          </style>
        </head>
        <body>${lrHtml}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
    showSuccess('Print Started', 'Your LR is being printed');
  };

  const handleShare = () => {
    if (!booking) return;
    if (navigator.share) {
      navigator.share({
        title: `Booking LR ${booking.lr_number}`,
        text: `Track your shipment with LR number ${booking.lr_number}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
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
      setBooking((prev) => (prev ? { ...prev, status: newStatus } : null));
      showSuccess('Status Updated', `Booking status updated to ${newStatus}`);
    } catch (err) {
      console.error('Failed to update status:', err);
      showError('Update Failed', err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="h-12 w-12 border-4 border-brand-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            {error ? 'Error loading booking' : 'Booking not found'}
          </h2>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bookings
          </Button>
        </motion.div>
      </div>
    );
  }

  const getStatusProgress = () => {
    const statuses = ['booked', 'in_transit', 'unloaded', 'out_for_delivery', 'delivered'];
    const currentIndex = statuses.indexOf(booking.status);
    return ((currentIndex + 1) / statuses.length) * 100;
  };

  return (
    <TooltipProvider>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6"
      >
        <div className="max-w-7xl mx-auto">
          {/* Premium Header */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={handleBack} className="-ml-3">
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back
                </Button>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
                  <Badge variant="secondary" className="bg-brand-100 text-brand-700">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Premium View
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handlePrint}>
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Print LR</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleShare}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share Booking</TooltipContent>
                </Tooltip>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/dashboard/bookings/edit/${booking.id}`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleCopyLRNumber}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy LR Number
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="h-4 w-4 mr-2" />
                      Download Invoice
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send SMS Update
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Report Issue
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </motion.div>

          {/* Hero Card with LR Info */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-r from-brand-600 to-purple-600 text-white mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-brand-100 text-sm mb-1">LR Number</p>
                      <div className="flex items-center gap-2">
                        <h2 className="text-3xl font-bold">{booking.lr_number}</h2>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyLRNumber}
                          className="text-white hover:bg-white/20"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-brand-100 text-sm mb-1">Created On</p>
                      <p className="font-medium">
                        {new Date(booking.created_at).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-brand-100 text-sm mb-1">Route</p>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium">{booking.from_branch_details?.name}</span>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="font-medium">{booking.to_branch_details?.name}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-brand-100 text-sm mb-1">Customer</p>
                      <p className="font-medium">{booking.sender?.name}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-brand-100 text-sm mb-1">Status</p>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
                          {booking.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {booking.status === 'in_transit' && (
                          <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="h-2 w-2 bg-green-400 rounded-full"
                          />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-brand-100 text-sm mb-1">Progress</p>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${getStatusProgress()}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="bg-white h-full rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                {booking.status !== 'delivered' && booking.status !== 'cancelled' && (
                  <div className="mt-6 pt-6 border-t border-white/20 flex flex-wrap gap-2">
                    {booking.status === 'booked' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate('in_transit')}
                        disabled={statusUpdating}
                        className="bg-white text-brand-700 hover:bg-gray-100"
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Start Transit
                      </Button>
                    )}
                    {booking.status === 'in_transit' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => setShowRealTimeTracking(true)}
                          className="bg-white text-brand-700 hover:bg-gray-100"
                        >
                          <Navigation className="h-4 w-4 mr-2" />
                          Track Live
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate('unloaded')}
                          disabled={statusUpdating}
                          className="bg-white/20 text-white hover:bg-white/30"
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Mark Unloaded
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Send Update
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Details */}
            <div className="lg:col-span-2">
              <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-brand-600" />
                      Shipment Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid grid-cols-4 mb-6">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="tracking">Tracking</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                        <TabsTrigger value="activity">Activity</TabsTrigger>
                      </TabsList>

                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeTab}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <TabsContent value="details" className="space-y-6 mt-6">
                            {/* Article Information */}
                            <div>
                              <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                <Package className="h-4 w-4 text-gray-500" />
                                Article Details
                              </h4>
                              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                <div>
                                  <p className="text-sm text-gray-600">Article Type</p>
                                  <p className="font-medium text-gray-900">
                                    {booking.article?.name || 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Quantity</p>
                                  <p className="font-medium text-gray-900">
                                    {booking.quantity} {booking.uom}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Actual Weight</p>
                                  <p className="font-medium text-gray-900">{booking.actual_weight} kg</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Description</p>
                                  <p className="font-medium text-gray-900">
                                    {booking.description || 'Not specified'}
                                  </p>
                                </div>
                              </div>

                              {(booking.fragile || booking.insurance_required) && (
                                <div className="flex gap-3 mt-3">
                                  {booking.fragile && (
                                    <Badge variant="warning" className="gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      Fragile
                                    </Badge>
                                  )}
                                  {booking.insurance_required && (
                                    <Badge variant="success" className="gap-1">
                                      <Shield className="h-3 w-3" />
                                      Insured
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Payment Information */}
                            <div>
                              <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-gray-500" />
                                Payment Details
                              </h4>
                              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Freight Charges</span>
                                    <span className="font-medium">
                                      ₹{(booking.quantity * booking.freight_per_qty).toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Loading Charges</span>
                                    <span className="font-medium">
                                      ₹{booking.loading_charges.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Unloading Charges</span>
                                    <span className="font-medium">
                                      ₹{booking.unloading_charges.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between pt-2 border-t border-green-200">
                                    <span className="font-medium text-gray-900">Total Amount</span>
                                    <span className="font-bold text-lg text-green-600">
                                      ₹{booking.total_amount.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="tracking" className="space-y-6 mt-6">
                            <div className="relative">
                              {/* Timeline */}
                              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                              {/* Tracking Events */}
                              <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="space-y-6"
                              >
                                {[
                                  {
                                    status: 'booked',
                                    title: 'Booking Created',
                                    description: `Booking created at ${booking.from_branch_details?.name}`,
                                    time: booking.created_at,
                                    completed: true,
                                  },
                                  {
                                    status: 'in_transit',
                                    title: 'In Transit',
                                    description: 'Shipment loaded and in transit',
                                    time: booking.updated_at,
                                    completed: ['in_transit', 'unloaded', 'out_for_delivery', 'delivered'].includes(
                                      booking.status
                                    ),
                                  },
                                  {
                                    status: 'unloaded',
                                    title: 'Arrived at Destination',
                                    description: `Shipment arrived at ${booking.to_branch_details?.name}`,
                                    time: booking.updated_at,
                                    completed: ['unloaded', 'out_for_delivery', 'delivered'].includes(
                                      booking.status
                                    ),
                                  },
                                  {
                                    status: 'delivered',
                                    title: 'Delivered',
                                    description: 'Shipment delivered successfully',
                                    time: booking.updated_at,
                                    completed: booking.status === 'delivered',
                                  },
                                ].map((event, index) => (
                                  <motion.div
                                    key={event.status}
                                    variants={itemVariants}
                                    custom={index}
                                    className="relative flex items-start gap-4"
                                  >
                                    <div
                                      className={cn(
                                        'h-8 w-8 rounded-full flex items-center justify-center z-10',
                                        event.completed
                                          ? 'bg-green-100'
                                          : 'bg-gray-100'
                                      )}
                                    >
                                      {event.completed ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <Clock className="h-4 w-4 text-gray-400" />
                                      )}
                                    </div>
                                    <div className="flex-1 pt-1">
                                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                                      <p className="text-sm text-gray-500">{event.description}</p>
                                      {event.completed && event.time && (
                                        <p className="text-xs text-gray-400 mt-1">
                                          {new Date(event.time).toLocaleString()}
                                        </p>
                                      )}
                                    </div>
                                  </motion.div>
                                ))}
                              </motion.div>

                              {/* Real-time Tracking Button */}
                              {booking.status === 'in_transit' && (
                                <motion.div
                                  variants={itemVariants}
                                  className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center"
                                      >
                                        <Navigation className="h-5 w-5 text-blue-600" />
                                      </motion.div>
                                      <div>
                                        <p className="font-medium text-blue-900">
                                          Real-time Tracking Available
                                        </p>
                                        <p className="text-sm text-blue-700">
                                          Track your shipment live on map
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => setShowRealTimeTracking(true)}
                                      className="bg-blue-600 hover:bg-blue-700"
                                    >
                                      <Map className="h-4 w-4 mr-2" />
                                      Track Now
                                    </Button>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          </TabsContent>

                          <TabsContent value="documents" className="space-y-4 mt-6">
                            <div className="grid gap-4">
                              {/* LR Document */}
                              <motion.div
                                variants={itemVariants}
                                whileHover={{ scale: 1.02 }}
                                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                                onClick={handlePrint}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-brand-100 rounded-lg flex items-center justify-center">
                                      <FileText className="h-5 w-5 text-brand-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">Lorry Receipt</p>
                                      <p className="text-sm text-gray-500">
                                        #{booking.lr_number}
                                      </p>
                                    </div>
                                  </div>
                                  <Download className="h-5 w-5 text-gray-400" />
                                </div>
                              </motion.div>

                              {/* Invoice if available */}
                              {booking.has_invoice && (
                                <motion.div
                                  variants={itemVariants}
                                  whileHover={{ scale: 1.02 }}
                                  className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <Receipt className="h-5 w-5 text-purple-600" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-gray-900">Invoice</p>
                                        <p className="text-sm text-gray-500">
                                          #{booking.invoice_number}
                                        </p>
                                      </div>
                                    </div>
                                    <Download className="h-5 w-5 text-gray-400" />
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          </TabsContent>

                          <TabsContent value="activity" className="space-y-4 mt-6">
                            <div className="space-y-3">
                              {/* Sample activity items */}
                              {[
                                {
                                  icon: Activity,
                                  title: 'Booking created',
                                  time: booking.created_at,
                                  user: 'System',
                                },
                                {
                                  icon: Truck,
                                  title: 'Status changed to In Transit',
                                  time: booking.updated_at,
                                  user: 'Driver: Raj Kumar',
                                },
                                {
                                  icon: MessageSquare,
                                  title: 'SMS sent to customer',
                                  time: new Date().toISOString(),
                                  user: 'System',
                                },
                              ].map((activity, index) => (
                                <motion.div
                                  key={index}
                                  variants={itemVariants}
                                  custom={index}
                                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50"
                                >
                                  <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                                    <activity.icon className="h-4 w-4 text-gray-600" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      {activity.title}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(activity.time).toLocaleString()} • {activity.user}
                                    </p>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </TabsContent>
                        </motion.div>
                      </AnimatePresence>
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right Column - Summary Cards */}
            <div className="space-y-6">
              {/* QR Code Card */}
              <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <QrCode className="h-5 w-5 text-purple-600" />
                      Quick Share
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="p-4 bg-white rounded-xl shadow-sm border border-gray-200"
                      >
                        <QRCodeSVG
                          value={`${window.location.origin}/track/${booking.lr_number}`}
                          size={180}
                          level="H"
                          includeMargin={true}
                        />
                      </motion.div>
                      <p className="text-sm text-gray-600 mt-4 text-center">
                        Scan to track shipment
                      </p>
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={handleShare}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Tracking Link
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Customer Info Card */}
              <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-600" />
                      Customer Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Sender</p>
                      <p className="font-medium text-gray-900">{booking.sender?.name}</p>
                      <p className="text-sm text-gray-600">{booking.sender?.mobile}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Receiver</p>
                      <p className="font-medium text-gray-900">{booking.receiver?.name}</p>
                      <p className="text-sm text-gray-600">{booking.receiver?.mobile}</p>
                    </div>
                    <Button variant="outline" className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Update
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* AI Insights Card */}
              <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      AI Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full mt-1.5" />
                        <p className="text-sm text-gray-700">
                          On-time delivery probability: <span className="font-medium">92%</span>
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="h-2 w-2 bg-blue-500 rounded-full mt-1.5" />
                        <p className="text-sm text-gray-700">
                          Estimated delivery: <span className="font-medium">Tomorrow, 3:00 PM</span>
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="h-2 w-2 bg-purple-500 rounded-full mt-1.5" />
                        <p className="text-sm text-gray-700">
                          Optimal route: <span className="font-medium">Via NH44</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Real-time Tracking Modal */}
        <AnimatePresence>
          {showRealTimeTracking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowRealTimeTracking(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">Real-time Tracking</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowRealTimeTracking(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Map integration would go here</p>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Current Speed</p>
                      <p className="text-2xl font-bold text-gray-900">45 km/h</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Distance Covered</p>
                      <p className="text-2xl font-bold text-gray-900">120 km</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">ETA</p>
                      <p className="text-2xl font-bold text-gray-900">3:45 PM</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </TooltipProvider>
  );
}