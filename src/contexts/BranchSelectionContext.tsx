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
  const userRole = user?.user_metadata?.role || user?.role;
  const userBranchId = user?.user_metadata?.branch_id || user?.branch_id;
  const userOrganizationId = user?.user_metadata?.organization_id || user?.organization_id;
  
  // For demo: treat users with admin email as admin or if they have no branch assignment
  const effectiveRole = userRole || (user?.email?.includes('admin') ? 'admin' : 'operator');
  
  // TEMPORARY FIX: If user has no branch assigned, treat as admin for demo purposes
  const finalEffectiveRole = effectiveRole === 'authenticated' && !userBranchId ? 'admin' : effectiveRole;
  
  // Debug logging
  console.log('BranchSelection Debug:', {
    userEmail: user?.email,
    userRole,
    effectiveRole,
    finalEffectiveRole,
    userBranchId,
    userOrganizationId
  });
  
  // Admins can switch branches, others are locked to their branch
  // For demo: also allow switching if user has no branch assigned
  const canSwitchBranch = finalEffectiveRole === 'admin' || finalEffectiveRole === 'superadmin' || !userBranchId;
  
  console.log('Branch switching capability:', {
    canSwitchBranch,
    effectiveRole,
    finalEffectiveRole,
    hasUserBranchId: !!userBranchId
  });
  
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
    } else if (branches.length > 0) {
      // Fallback: if user has no branch assigned, show all branches for demo
      console.log('No user branch assigned, showing all branches for demo');
      return branches.map(branch => ({
        id: branch.id,
        name: branch.name
      }));
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
        } else if (branches.length > 0) {
          // Fallback: if user has no branch but branches are available, select first one
          console.log('User has no branch assigned, selecting first available branch for demo');
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
    
    console.log('secureSetSelectedBranch called:', {
      branchId,
      effectiveRole,
      finalEffectiveRole,
      userBranchId,
      isAdmin: finalEffectiveRole === 'admin',
      isSuperAdmin: finalEffectiveRole === 'superadmin',
      canSwitch: finalEffectiveRole === 'admin' || finalEffectiveRole === 'superadmin'
    });
    
    // Non-admins can only select their own branch
    if (finalEffectiveRole !== 'admin' && finalEffectiveRole !== 'superadmin') {
      if (branchId !== userBranchId) {
        console.warn('Access denied: User cannot select branch outside their assignment');
        console.log('Blocked branch switch:', { effectiveRole, finalEffectiveRole, userBranchId, requestedBranchId: branchId });
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
