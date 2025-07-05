import React from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Calendar,
  Package,
  User,
  DollarSign,
  Truck,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import StatusBadge from '../ui/StatusBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import type { Booking } from '@/types';

interface BookingCardProps {
  booking: Booking;
  onClick: () => void;
  onSelect: () => void;
  isSelected: boolean;
}

const BookingCard = React.memo(function BookingCard({
  booking,
  onClick,
  onSelect,
  isSelected,
}: BookingCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in_transit':
        return <Truck className="h-4 w-4 text-brand-600" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const cardVariants = {
    rest: { scale: 1, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' },
    hover: {
      scale: 1.02,
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 10,
      },
    },
    tap: { scale: 0.98 },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      className="relative"
    >
      <Card
        className={cn(
          'cursor-pointer transition-all duration-200 overflow-hidden hover:shadow-md',
          isSelected && 'ring-2 ring-brand-500 ring-offset-2'
        )}
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => {
                  onSelect();
                }}
                onClick={(e) => e.stopPropagation()}
                className="mt-0.5"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-brand-700">
                    {booking.lr_number}
                  </h3>
                  {getStatusIcon(booking.status)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(booking.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>View Details</DropdownMenuItem>
                <DropdownMenuItem>Download LR</DropdownMenuItem>
                <DropdownMenuItem>Track Shipment</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Route */}
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {booking.from_branch_details?.name}
              </p>
              <p className="text-xs text-gray-500">to</p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {booking.to_branch_details?.name}
              </p>
            </div>
          </div>

          {/* Customer */}
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 truncate">
                From: {booking.sender?.name}
              </p>
              <p className="text-sm text-gray-600 truncate">
                To: {booking.receiver?.name}
              </p>
            </div>
          </div>

          {/* Article */}
          <div className="flex items-start gap-2">
            <Package className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 truncate">
                {booking.article?.name} ({booking.quantity} {booking.uom})
              </p>
            </div>
          </div>

          {/* Status & Amount */}
          <div className="flex items-center justify-between pt-2">
            <StatusBadge status={booking.status} />
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <span className="font-semibold text-gray-900">
                ₹{booking.total_amount.toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-gray-50 px-4 py-3">
          <div className="flex items-center justify-between w-full">
            <Badge
              variant={booking.payment_type === 'Paid' ? 'success' : 'warning'}
              className="text-xs"
            >
              {booking.payment_type}
            </Badge>
            {booking.expected_delivery_date && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                {new Date(booking.expected_delivery_date).toLocaleDateString()}
              </div>
            )}
          </div>
        </CardFooter>

        {/* Priority Indicator */}
        {booking.priority === 'Urgent' && (
          <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
            <div className="absolute transform rotate-45 bg-red-500 text-white text-xs font-bold py-1 right-[-25px] top-[10px] w-[100px] text-center">
              Urgent
            </div>
          </div>
        )}

        {/* Special Indicators */}
        <div className="absolute bottom-3 right-3 flex gap-1">
          {booking.fragile && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="p-1 bg-orange-100 rounded-full"
            >
              <AlertTriangle className="h-3 w-3 text-orange-600" />
            </motion.div>
          )}
          {booking.insurance_required && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
              className="p-1 bg-green-100 rounded-full"
            >
              <CheckCircle2 className="h-3 w-3 text-green-600" />
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for optimal performance
  return (
    prevProps.booking.id === nextProps.booking.id &&
    prevProps.booking.status === nextProps.booking.status &&
    prevProps.booking.total_amount === nextProps.booking.total_amount &&
    prevProps.isSelected === nextProps.isSelected
  );
});

export default BookingCard;