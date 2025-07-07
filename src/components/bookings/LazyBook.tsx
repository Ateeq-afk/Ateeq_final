import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SinglePageBookingForm from './NewBookingForm';
import BookingFormSkeleton from './BookingFormSkeleton';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';

const LazyBook = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showSuccess } = useNotificationSystem();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <BookingFormSkeleton />;

  return (
    <SinglePageBookingForm
      onClose={() => navigate('/dashboard/bookings')}
      onBookingCreated={(booking) => {
        showSuccess('Booking Created', `LR ${booking.lr_number} created successfully`);
        navigate('/dashboard/bookings');
      }}
    />
  );
};

export default LazyBook;