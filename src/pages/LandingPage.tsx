import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
      <h1 className="mb-4 text-3xl font-bold">Welcome to DesiCargo</h1>
      <Button onClick={() => navigate('/signin')}>Sign In</Button>
    </div>
  );
}
