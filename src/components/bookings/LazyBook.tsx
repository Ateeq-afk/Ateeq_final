import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NewBookingForm from './NewBookingForm';
import BookingFormSkeleton from './BookingFormSkeleton';
import { useBookings } from '@/hooks/useBookings';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';

const LazyBook = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { createBooking } = useBookings();
  const { showSuccess, showError } = useNotificationSystem();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <BookingFormSkeleton />;

  return (
    <NewBookingForm
      onClose={() => navigate('/dashboard/bookings')}
      onSubmit={async (data) => {
        try {
          console.log("LazyBook submitting data:", data);
          const booking = await createBooking(data);
          showSuccess('Booking Created', 'Booking has been created successfully');
          return booking;
        } catch (error) {
          console.error('Error creating booking:', error);
          showError('Creation Failed', error instanceof Error ? error.message : 'Failed to create booking');
          throw error;
        }
      }}
    />
  );
};

export default LazyBook;