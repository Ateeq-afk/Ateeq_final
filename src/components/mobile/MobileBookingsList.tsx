import React, { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  Package,
  MapPin,
  Calendar,
  ChevronRight,
  Phone,
  MessageSquare,
  MoreVertical,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface Booking {
  id: string;
  lr_number: string;
  from_location: string;
  to_location: string;
  status: 'booked' | 'in-transit' | 'delivered' | 'cancelled';
  created_at: string;
  customer_name: string;
  customer_phone: string;
  amount: number;
  priority?: 'urgent' | 'normal';
}

interface SwipeableBookingCardProps {
  booking: Booking;
  onCall: () => void;
  onMessage: () => void;
  onView: () => void;
}

const SwipeableBookingCard: React.FC<SwipeableBookingCardProps> = ({
  booking,
  onCall,
  onMessage,
  onView
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    
    if (info.offset.x < -threshold) {
      setSwipeOffset(-160);
      setIsOpen(true);
    } else {
      setSwipeOffset(0);
      setIsOpen(false);
    }
  };

  const getStatusIcon = () => {
    switch (booking.status) {
      case 'booked':
        return <Clock className="h-4 w-4" />;
      case 'in-transit':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (booking.status) {
      case 'booked':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'in-transit':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'delivered':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Action buttons */}
      <div className="absolute right-0 top-0 bottom-0 flex">
        <button
          onClick={onMessage}
          className="w-20 bg-blue-500 flex items-center justify-center"
        >
          <MessageSquare className="h-5 w-5 text-white" />
        </button>
        <button
          onClick={onCall}
          className="w-20 bg-green-500 flex items-center justify-center"
        >
          <Phone className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Main card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -160, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={{ x: swipeOffset }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={() => !isOpen && onView()}
        className="relative"
      >
        <Card className="p-4 border-0 shadow-sm bg-white dark:bg-gray-800">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-sm">{booking.lr_number}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {format(new Date(booking.created_at), 'MMM d, h:mm a')}
              </p>
            </div>
            <Badge 
              variant="secondary" 
              className={cn("gap-1", getStatusColor())}
            >
              {getStatusIcon()}
              <span className="capitalize">{booking.status.replace('-', ' ')}</span>
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-medium">{booking.from_location}</p>
                <p className="text-gray-500 dark:text-gray-400">to</p>
                <p className="font-medium">{booking.to_location}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <p className="text-sm font-medium">{booking.customer_name}</p>
                <p className="text-xs text-gray-500">{booking.customer_phone}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">₹{booking.amount.toLocaleString()}</p>
                {booking.priority === 'urgent' && (
                  <Badge variant="destructive" className="text-xs">Urgent</Badge>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default function MobileBookingsList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Mock data
  const bookings: Booking[] = [
    {
      id: '1',
      lr_number: 'BK001234',
      from_location: 'Mumbai',
      to_location: 'Delhi',
      status: 'in-transit',
      created_at: '2024-01-10T10:00:00',
      customer_name: 'Rajesh Kumar',
      customer_phone: '+91 98765 43210',
      amount: 12500,
      priority: 'urgent'
    },
    {
      id: '2',
      lr_number: 'BK001235',
      from_location: 'Bangalore',
      to_location: 'Chennai',
      status: 'booked',
      created_at: '2024-01-10T11:30:00',
      customer_name: 'Priya Sharma',
      customer_phone: '+91 87654 32109',
      amount: 8200
    },
    {
      id: '3',
      lr_number: 'BK001236',
      from_location: 'Delhi',
      to_location: 'Kolkata',
      status: 'delivered',
      created_at: '2024-01-09T14:00:00',
      customer_name: 'Amit Patel',
      customer_phone: '+91 76543 21098',
      amount: 15800
    }
  ];

  const filters = [
    { id: 'all', label: 'All', count: bookings.length },
    { id: 'in-transit', label: 'In Transit', count: 1 },
    { id: 'booked', label: 'Booked', count: 1 },
    { id: 'delivered', label: 'Delivered', count: 1 },
    { id: 'urgent', label: 'Urgent', count: 1 }
  ];

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.lr_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         booking.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!selectedFilter || selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'urgent') return matchesSearch && booking.priority === 'urgent';
    return matchesSearch && booking.status === selectedFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold">Bookings</h1>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-10"
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t overflow-hidden"
            >
              <div className="px-4 py-3">
                <div className="flex gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
                  {filters.map((filter) => (
                    <Button
                      key={filter.id}
                      size="sm"
                      variant={selectedFilter === filter.id ? 'default' : 'outline'}
                      onClick={() => setSelectedFilter(filter.id)}
                      className="flex-shrink-0"
                    >
                      {filter.label}
                      {filter.count > 0 && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1">
                          {filter.count}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bookings List */}
      <div className="px-4 py-4 space-y-3">
        <AnimatePresence>
          {filteredBookings.map((booking, index) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.05 }}
            >
              <SwipeableBookingCard
                booking={booking}
                onCall={() => window.location.href = `tel:${booking.customer_phone}`}
                onMessage={() => navigate(`/dashboard/chat/${booking.customer_name}`)}
                onView={() => navigate(`/dashboard/bookings/${booking.id}`)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredBookings.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No bookings found</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/dashboard/new-booking')}
        className="fixed bottom-24 right-4 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center"
      >
        <Package className="h-6 w-6" />
      </motion.button>
    </div>
  );
}