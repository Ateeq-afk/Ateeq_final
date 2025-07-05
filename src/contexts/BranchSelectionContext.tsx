import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useBranches } from '@/hooks/useBranches';

interface BranchSelectionContextType {
  selectedBranch: string | null;
  setSelectedBranch: React.Dispatch<React.SetStateAction<string | null>>;
  userBranches: Array<{ id: string; name: string }>;
  canSwitchBranch: boolean;
}

const BranchSelectionContext = createContext<BranchSelectionContextType | undefined>(undefined);

export function BranchSelectionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState<string | null>(() => {
    // Initialize from sessionStorage if available
    try {
      return sessionStorage.getItem('selectedBranch') || null;
    } catch {
      return null;
    }
  });
  const { branches } = useBranches();
  
  // Determine user's role and available branches
  const userRole = user?.user_metadata?.role;
  const userBranchId = user?.user_metadata?.branch_id;
  const userOrganizationId = user?.user_metadata?.organization_id;
  
  // Admins can switch branches, others are locked to their branch
  const canSwitchBranch = userRole === 'admin' || userRole === 'superadmin';
  
  // Determine available branches based on user role
  const userBranches = useMemo(() => {
    if (canSwitchBranch && branches.length > 0) {
      // Admins can see all branches (filtered by organization if needed)
      return branches.map(branch => ({
        id: branch.id,
        name: branch.name
      }));
    } else if (userBranchId) {
      // Regular users only see their assigned branch
      return [{
        id: userBranchId,
        name: user?.user_metadata?.branch_name || 'Main Branch'
      }];
    }
    return [];
  }, [canSwitchBranch, branches, userBranchId, user]);
  
  // Sync selectedBranch with user's branch when user changes
  useEffect(() => {
    if (user) {
      if (!selectedBranch) {
        // No branch selected, auto-select user's branch or first available for admins
        if (userBranchId) {
          setSelectedBranch(userBranchId);
          sessionStorage.setItem('selectedBranch', userBranchId);
        } else if (canSwitchBranch && branches.length > 0) {
          // Admin without assigned branch: select first available
          setSelectedBranch(branches[0].id);
          sessionStorage.setItem('selectedBranch', branches[0].id);
        }
      } else if (!canSwitchBranch && selectedBranch !== userBranchId) {
        // Non-admin user with different branch selected: reset to their branch
        setSelectedBranch(userBranchId);
        if (userBranchId) {
          sessionStorage.setItem('selectedBranch', userBranchId);
        }
      }
    } else {
      // Clear selection when user logs out
      setSelectedBranch(null);
      sessionStorage.removeItem('selectedBranch');
    }
  }, [user, userBranchId, canSwitchBranch, branches, selectedBranch]);
  
  // Security check: prevent non-admins from selecting branches outside their org
  const secureSetSelectedBranch = (branchId: string | null) => {
    if (!branchId) {
      setSelectedBranch(null);
      sessionStorage.removeItem('selectedBranch');
      return;
    }
    
    // Non-admins can only select their own branch
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      if (branchId !== userBranchId) {
        console.warn('Access denied: User cannot select branch outside their assignment');
        return;
      }
    }
    
    setSelectedBranch(branchId);
    // Persist to sessionStorage for API interceptor
    sessionStorage.setItem('selectedBranch', branchId);
  };
  
  return (
    <BranchSelectionContext.Provider value={{ 
      selectedBranch, 
      setSelectedBranch: secureSetSelectedBranch,
      userBranches,
      canSwitchBranch
    }}>
      {children}
    </BranchSelectionContext.Provider>
  );
}

export function useBranchSelection() {
  const context = useContext(BranchSelectionContext);
  if (!context) {
    throw new Error('useBranchSelection must be used within a BranchSelectionProvider');
  }
  return context;
}
