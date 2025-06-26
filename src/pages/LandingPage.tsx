import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50 text-gray-800">
      <h1 className="mb-2 text-4xl font-extrabold tracking-tight md:text-5xl">
        DesiCargo
      </h1>
      <p className="mb-6 text-center text-lg text-muted-foreground md:text-xl">
        Seamless logistics management for modern businesses
      </p>
      <Button className="px-6 py-3 text-base" onClick={() => navigate('/signin')}>
        Get Started
      </Button>
    </div>
  );
}
