import React from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Upload, 
  Download, 
  CheckCircle2, 
  Truck, 
  Users, 
  FileText, 
  BarChart3 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  DashboardCard, 
  DashboardCardIcon, 
  DashboardCardTitle, 
  DashboardCardDescription 
} from '@/components/ui/dashboard-card';

export default function QuickActionCards() {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      <DashboardCard 
        variant="soft" 
        color="blue" 
        animationDelay={0.1}
        onClick={() => handleNavigate('/dashboard/new-booking')}
      >
        <DashboardCardIcon color="blue" size="lg">
          <Package className="h-8 w-8" />
        </DashboardCardIcon>
        <DashboardCardTitle>New Booking</DashboardCardTitle>
        <DashboardCardDescription>Create a new LR</DashboardCardDescription>
      </DashboardCard>
      
      <DashboardCard 
        variant="soft" 
        color="green" 
        animationDelay={0.2}
        onClick={() => handleNavigate('/dashboard/loading')}
      >
        <DashboardCardIcon color="green" size="lg">
          <Upload className="h-8 w-8" />
        </DashboardCardIcon>
        <DashboardCardTitle>Load</DashboardCardTitle>
        <DashboardCardDescription>Create loading sheet</DashboardCardDescription>
      </DashboardCard>
      
      <DashboardCard 
        variant="soft" 
        color="amber" 
        animationDelay={0.3}
        onClick={() => handleNavigate('/dashboard/unloading')}
      >
        <DashboardCardIcon color="amber" size="lg">
          <Download className="h-8 w-8" />
        </DashboardCardIcon>
        <DashboardCardTitle>Unload</DashboardCardTitle>
        <DashboardCardDescription>Process unloading</DashboardCardDescription>
      </DashboardCard>
      
      <DashboardCard 
        variant="soft" 
        color="purple" 
        animationDelay={0.4}
        onClick={() => handleNavigate('/dashboard/bookings')}
      >
        <DashboardCardIcon color="purple" size="lg">
          <CheckCircle2 className="h-8 w-8" />
        </DashboardCardIcon>
        <DashboardCardTitle>Deliver</DashboardCardTitle>
        <DashboardCardDescription>Mark as delivered</DashboardCardDescription>
      </DashboardCard>
    </div>
  );
}

export function ExpandedQuickActionCards() {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      <DashboardCard 
        variant="soft" 
        color="blue" 
        animationDelay={0.1}
        onClick={() => handleNavigate('/dashboard/new-booking')}
      >
        <DashboardCardIcon color="blue" size="lg">
          <Package className="h-8 w-8" />
        </DashboardCardIcon>
        <DashboardCardTitle>New Booking</DashboardCardTitle>
        <DashboardCardDescription>Create a new LR</DashboardCardDescription>
      </DashboardCard>
      
      <DashboardCard 
        variant="soft" 
        color="green" 
        animationDelay={0.2}
        onClick={() => handleNavigate('/dashboard/loading')}
      >
        <DashboardCardIcon color="green" size="lg">
          <Upload className="h-8 w-8" />
        </DashboardCardIcon>
        <DashboardCardTitle>Load</DashboardCardTitle>
        <DashboardCardDescription>Create loading sheet</DashboardCardDescription>
      </DashboardCard>
      
      <DashboardCard 
        variant="soft" 
        color="amber" 
        animationDelay={0.3}
        onClick={() => handleNavigate('/dashboard/unloading')}
      >
        <DashboardCardIcon color="amber" size="lg">
          <Download className="h-8 w-8" />
        </DashboardCardIcon>
        <DashboardCardTitle>Unload</DashboardCardTitle>
        <DashboardCardDescription>Process unloading</DashboardCardDescription>
      </DashboardCard>
      
      <DashboardCard 
        variant="soft" 
        color="purple" 
        animationDelay={0.4}
        onClick={() => handleNavigate('/dashboard/bookings')}
      >
        <DashboardCardIcon color="purple" size="lg">
          <CheckCircle2 className="h-8 w-8" />
        </DashboardCardIcon>
        <DashboardCardTitle>Deliver</DashboardCardTitle>
        <DashboardCardDescription>Mark as delivered</DashboardCardDescription>
      </DashboardCard>
      
      <DashboardCard 
        variant="soft" 
        color="indigo" 
        animationDelay={0.5}
        onClick={() => handleNavigate('/dashboard/vehicles')}
      >
        <DashboardCardIcon color="indigo" size="lg">
          <Truck className="h-8 w-8" />
        </DashboardCardIcon>
        <DashboardCardTitle>Vehicles</DashboardCardTitle>
        <DashboardCardDescription>Manage fleet</DashboardCardDescription>
      </DashboardCard>
      
      <DashboardCard 
        variant="soft" 
        color="rose" 
        animationDelay={0.6}
        onClick={() => handleNavigate('/dashboard/customers')}
      >
        <DashboardCardIcon color="rose" size="lg">
          <Users className="h-8 w-8" />
        </DashboardCardIcon>
        <DashboardCardTitle>Customers</DashboardCardTitle>
        <DashboardCardDescription>Manage customers</DashboardCardDescription>
      </DashboardCard>
      
      <DashboardCard 
        variant="soft" 
        color="gray" 
        animationDelay={0.7}
        onClick={() => handleNavigate('/dashboard/reports')}
      >
        <DashboardCardIcon color="gray" size="lg">
          <FileText className="h-8 w-8" />
        </DashboardCardIcon>
        <DashboardCardTitle>Reports</DashboardCardTitle>
        <DashboardCardDescription>View reports</DashboardCardDescription>
      </DashboardCard>
      
      <DashboardCard 
        variant="soft" 
        color="blue" 
        animationDelay={0.8}
        onClick={() => handleNavigate('/dashboard/analytics')}
      >
        <DashboardCardIcon color="blue" size="lg">
          <BarChart3 className="h-8 w-8" />
        </DashboardCardIcon>
        <DashboardCardTitle>Analytics</DashboardCardTitle>
        <DashboardCardDescription>View analytics</DashboardCardDescription>
      </DashboardCard>
    </div>
  );
}