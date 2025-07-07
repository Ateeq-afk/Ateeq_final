import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Package,
  MapPin,
  Calendar,
  Clock,
  Truck,
  User,
  Phone,
  Mail,
  Download,
  Share2,
  Star,
  ArrowRight,
  Copy,
  Eye,
  FileText,
  Sparkles,
  Shield,
  Zap,
  Heart,
  Gift,
  Send,
  Home,
  Building2,
  Route,
  DollarSign,
  Weight,
  Ruler,
  Hash,
  QrCode,
  Bell,
  MessageSquare,
  RefreshCw,
  BookOpen,
  Target,
  Trophy,
  Award,
  Medal,
  Gem,
  Crown,
  Rocket,
  Flame,
  ThumbsUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// Types
interface BookingDetails {
  id: string;
  bookingNumber: string;
  from: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    contact: {
      name: string;
      phone: string;
      email: string;
    };
  };
  to: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    contact: {
      name: string;
      phone: string;
      email: string;
    };
  };
  articles: Array<{
    id: string;
    name: string;
    quantity: number;
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    value: number;
    rate: number;
  }>;
  pricing: {
    subtotal: number;
    tax: number;
    insurance: number;
    total: number;
    currency: string;
  };
  timeline: {
    estimatedPickup: string;
    estimatedDelivery: string;
    transitDays: number;
  };
  services: string[];
  status: 'confirmed' | 'pending' | 'processing';
  createdAt: string;
}

interface BookingConfirmationProps {
  booking: BookingDetails;
  onClose?: () => void;
  onDownloadPDF?: () => void;
  onShare?: () => void;
  onTrackBooking?: () => void;
  onCreateNewBooking?: () => void;
}

// Success Animation Component
const SuccessAnimation: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(1), 500);
    const timer2 = setTimeout(() => setStep(2), 1000);
    const timer3 = setTimeout(() => setStep(3), 1500);
    const timer4 = setTimeout(() => {
      setStep(4);
      onComplete?.();
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Success Icon */}
        <motion.div
          className="relative mx-auto mb-8"
          initial={{ scale: 0 }}
          animate={{ scale: step >= 1 ? 1 : 0 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
        >
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-[0_20px_50px_0_rgba(34,197,94,0.3)]">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: step >= 2 ? 1 : 0, rotate: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <CheckCircle2 className="h-16 w-16 text-white" strokeWidth={2.5} />
            </motion.div>
          </div>
          
          {/* Sparkles */}
          <AnimatePresence>
            {step >= 2 && (
              <>
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                    initial={{ 
                      scale: 0, 
                      x: 0, 
                      y: 0,
                      rotate: 0
                    }}
                    animate={{
                      scale: [0, 1, 0],
                      x: Math.cos((i * Math.PI) / 4) * 80,
                      y: Math.sin((i * Math.PI) / 4) * 80,
                      rotate: 360
                    }}
                    transition={{
                      duration: 1.5,
                      delay: 0.3 + i * 0.1,
                      repeat: 2
                    }}
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Success Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: step >= 3 ? 1 : 0, y: step >= 3 ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <h2 className="text-4xl font-bold text-green-600 dark:text-green-400 mb-4 tracking-tight">
            Booking Confirmed!
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 font-medium">
            Your shipment is ready for pickup
          </p>
        </motion.div>

        {/* Celebration Icons */}
        <motion.div
          className="flex justify-center gap-4 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: step >= 4 ? 1 : 0, y: step >= 4 ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        >
          {[Trophy, Star, Gift].map((Icon, i) => (
            <motion.div
              key={i}
              className="p-3 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30"
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

// Summary Card Component
const SummaryCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ title, icon, children, className, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(className)}
    >
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.12)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-3xl hover:shadow-[0_16px_64px_0_rgba(31,38,135,0.15)] dark:hover:shadow-[0_16px_64px_0_rgba(0,0,0,0.4)] transition-all duration-500">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/50 dark:border-blue-800/30">
              {icon}
            </div>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Main Component
export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  booking,
  onClose,
  onDownloadPDF,
  onShare,
  onTrackBooking,
  onCreateNewBooking
}) => {
  const [showAnimation, setShowAnimation] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopyBookingNumber = async () => {
    try {
      await navigator.clipboard.writeText(booking.bookingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy booking number:', err);
    }
  };

  if (showAnimation) {
    return (
      <SuccessAnimation onComplete={() => setShowAnimation(false)} />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/30">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <motion.div
          className="text-center space-y-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-center">
            <motion.div
              className="p-4 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200/60 dark:border-green-800/40"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </motion.div>
          </div>
          
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 tracking-tight">
              Booking Confirmed
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Your shipment request has been successfully submitted and is ready for pickup
            </p>
          </div>

          {/* Booking Number */}
          <motion.div
            className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-full border border-gray-200/60 dark:border-gray-700/60 shadow-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Hash className="h-5 w-5 text-gray-500" />
            <span className="font-mono text-lg font-semibold text-gray-900 dark:text-gray-100">
              {booking.bookingNumber}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyBookingNumber}
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </motion.div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-wrap justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Button
            onClick={onTrackBooking}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all px-8"
            size="lg"
          >
            <Eye className="h-5 w-5 mr-2" />
            Track Shipment
          </Button>
          
          <Button
            onClick={onDownloadPDF}
            variant="outline"
            size="lg"
            className="px-8 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Download className="h-5 w-5 mr-2" />
            Download PDF
          </Button>
          
          <Button
            onClick={onShare}
            variant="outline"
            size="lg"
            className="px-8 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Share2 className="h-5 w-5 mr-2" />
            Share
          </Button>
        </motion.div>

        {/* Summary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Route Information */}
          <SummaryCard
            title="Route Details"
            icon={<Route className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
            delay={0.1}
          >
            <div className="space-y-6">
              {/* From */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-green-600 dark:bg-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">PICKUP FROM</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{booking.from.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {booking.from.address}, {booking.from.city}, {booking.from.state} {booking.from.pincode}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {booking.from.contact.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {booking.from.contact.phone}
                    </div>
                  </div>
                </div>
              </div>

              {/* Route Line */}
              <div className="flex items-center gap-2 pl-5">
                <div className="flex-1 border-t-2 border-dashed border-gray-300 dark:border-gray-600" />
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Truck className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex-1 border-t-2 border-dashed border-gray-300 dark:border-gray-600" />
              </div>

              {/* To */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-red-600 dark:bg-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">DELIVER TO</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{booking.to.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {booking.to.address}, {booking.to.city}, {booking.to.state} {booking.to.pincode}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {booking.to.contact.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {booking.to.contact.phone}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SummaryCard>

          {/* Timeline */}
          <SummaryCard
            title="Delivery Timeline"
            icon={<Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
            delay={0.2}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/30">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">PICKUP</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {new Date(booking.timeline.estimatedPickup).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(booking.timeline.estimatedPickup).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
                
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/40 dark:to-green-900/30">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">DELIVERY</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {new Date(booking.timeline.estimatedDelivery).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Est. {booking.timeline.transitDays} days
                  </p>
                </div>
              </div>

              {/* Services */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Services Included</p>
                <div className="flex flex-wrap gap-2">
                  {booking.services.map((service, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/40"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </SummaryCard>

          {/* Articles Summary */}
          <SummaryCard
            title="Shipment Details"
            icon={<Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
            delay={0.3}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/40 dark:to-red-950/40">
                  <Package className="h-5 w-5 text-orange-600 dark:text-orange-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {booking.articles.reduce((sum, article) => sum + article.quantity, 0)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Items</p>
                </div>
                
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40">
                  <Weight className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {booking.articles.reduce((sum, article) => sum + article.weight, 0)} kg
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Weight</p>
                </div>
                
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    ₹{booking.articles.reduce((sum, article) => sum + article.value, 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Value</p>
                </div>
              </div>

              {/* Articles List */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Items in this shipment</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {booking.articles.map((article, index) => (
                    <div
                      key={article.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
                          <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{article.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Qty: {article.quantity} • {article.weight} kg
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">₹{article.rate}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {article.dimensions.length}×{article.dimensions.width}×{article.dimensions.height} cm
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SummaryCard>

          {/* Pricing Summary */}
          <SummaryCard
            title="Payment Summary"
            icon={<DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />}
            delay={0.4}
          >
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Freight Charges</span>
                  <span className="font-medium">₹{booking.pricing.subtotal.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Tax & GST</span>
                  <span className="font-medium">₹{booking.pricing.tax.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Insurance</span>
                  <span className="font-medium">₹{booking.pricing.insurance.toLocaleString()}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Total Amount</span>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">
                    ₹{booking.pricing.total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment Status */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 border border-green-200/60 dark:border-green-800/40">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">Payment Confirmed</p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Paid on {new Date(booking.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SummaryCard>
        </div>

        {/* Additional Actions */}
        <motion.div
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                What's Next?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We'll notify you when your shipment is picked up and provide real-time tracking updates.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={onCreateNewBooking}
                variant="outline"
                className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Booking
              </Button>
              
              <Button
                variant="outline"
                className="hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
              
              <Button
                variant="outline"
                className="hover:bg-purple-50 dark:hover:bg-purple-900/20"
              >
                <Star className="h-4 w-4 mr-2" />
                Rate Experience
              </Button>
            </div>
          </div>
        </motion.div>

        {/* QR Code & Reference */}
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400">
            <QrCode className="h-4 w-4" />
            Show this confirmation at pickup
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Reference: {booking.id} • Created on {new Date(booking.createdAt).toLocaleDateString()}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default BookingConfirmation;