import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Printer, 
  FileCheck, 
  Truck, 
  MapPin, 
  User, 
  Package,
  Download,
  ClipboardList,
  Phone
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Booking } from '@/types';

interface DeliveryActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onStartDelivery: () => Promise<void>;
  onStartPOD: () => void;
  onPrintDeliveryDocs: () => void;
}

export default function DeliveryActionModal({
  isOpen,
  onClose,
  booking,
  onStartDelivery,
  onStartPOD,
  onPrintDeliveryDocs,
}: DeliveryActionModalProps) {
  const [isStartingDelivery, setIsStartingDelivery] = useState(false);

  const handleStartDelivery = async () => {
    try {
      setIsStartingDelivery(true);
      await onStartDelivery();
      onClose();
    } catch (error) {
      console.error('Failed to start delivery:', error);
    } finally {
      setIsStartingDelivery(false);
    }
  };

  const handlePrintAndStartDelivery = async () => {
    // Print documents first
    onPrintDeliveryDocs();
    // Then start delivery
    await handleStartDelivery();
  };

  const handleStartPODProcess = () => {
    onStartPOD();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Truck className="h-5 w-5 text-orange-600" />
            </div>
            Start Delivery Process
          </DialogTitle>
          <DialogDescription>
            Choose how you want to proceed with the delivery for LR #{booking.lr_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking Summary */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Delivery Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Delivery From</p>
                      <p className="font-medium">{booking.to_branch_details?.name}</p>
                      <p className="text-sm text-gray-500">
                        {booking.to_branch_details?.city}, {booking.to_branch_details?.state}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Deliver To</p>
                      <p className="font-medium">{booking.receiver?.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <p className="text-sm text-gray-500">{booking.receiver?.mobile}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Articles</p>
                    <p className="font-medium">
                      {booking.booking_articles?.length || 0} item{(booking.booking_articles?.length || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Type</p>
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
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-bold text-lg text-blue-600">₹{booking.total_amount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option 1: Print Documents and Start Delivery */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="cursor-pointer border-2 border-transparent hover:border-blue-200 hover:bg-blue-50/50 transition-all">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                      <Printer className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">Print & Start Delivery</h3>
                      <p className="text-sm text-gray-600 mt-2">
                        Print delivery documents and immediately mark for delivery
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                        <ClipboardList className="h-4 w-4" />
                        <span>Delivery Challan</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                        <FileCheck className="h-4 w-4" />
                        <span>POD Form</span>
                      </div>
                    </div>
                    <Button 
                      onClick={handlePrintAndStartDelivery}
                      disabled={isStartingDelivery}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {isStartingDelivery ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Starting...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Printer className="h-4 w-4" />
                          Print & Start
                        </div>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Option 2: Complete Delivery with POD */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="cursor-pointer border-2 border-transparent hover:border-green-200 hover:bg-green-50/50 transition-all">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <FileCheck className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">Complete Delivery</h3>
                      <p className="text-sm text-gray-600 mt-2">
                        Mark as delivered and complete POD process immediately
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                        <FileCheck className="h-4 w-4" />
                        <span>Proof of Delivery</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                        <User className="h-4 w-4" />
                        <span>Receiver Signature</span>
                      </div>
                    </div>
                    <Button 
                      onClick={handleStartPODProcess}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4" />
                        Complete Delivery
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Alternative Actions */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-3">Other Actions:</p>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={onPrintDeliveryDocs}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Print Documents Only
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleStartDelivery}
                disabled={isStartingDelivery}
                className="flex items-center gap-2"
              >
                <Truck className="h-4 w-4" />
                Start Delivery Only
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}