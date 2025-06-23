import React from 'react';
import LoadingDashboard from '@/components/loading/LoadingDashboard';
import { BranchSelectionProvider } from '@/contexts/BranchSelectionContext';

export default function LoadingManagementPage() {
  return (
    <BranchSelectionProvider>
      <LoadingDashboard />
    </BranchSelectionProvider>
  );
}
