import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Zap } from 'lucide-react';
import { BookingFormWizard } from './BookingFormWizard';
import { motion, AnimatePresence } from 'framer-motion';

interface NewBookingButtonProps {
  onBookingCreated?: (booking: any) => void;
  variant?: 'default' | 'wizard';
  className?: string;
}

export const NewBookingButton: React.FC<NewBookingButtonProps> = ({
  onBookingCreated,
  variant = 'wizard',
  className = ''
}) => {
  const [showWizard, setShowWizard] = useState(false);

  const handleBookingCreated = (booking: any) => {
    setShowWizard(false);
    onBookingCreated?.(booking);
  };

  return (
    <>
      <Button
        onClick={() => setShowWizard(true)}
        className={`${className}`}
        size="default"
      >
        {variant === 'wizard' ? (
          <>
            <Zap className="h-4 w-4 mr-2" />
            New Booking (Wizard)
          </>
        ) : (
          <>
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </>
        )}
      </Button>

      <AnimatePresence>
        {showWizard && (
          <BookingFormWizard
            onClose={() => setShowWizard(false)}
            onBookingCreated={handleBookingCreated}
          />
        )}
      </AnimatePresence>
    </>
  );
};