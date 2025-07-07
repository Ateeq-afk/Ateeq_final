import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useBranches } from '@/hooks/useBranches';

interface BranchSelectionContextType {
  selectedBranch: string | null;
  setSelectedBranch: React.Dispatch<React.SetStateAction<string | null>>;
  userBranches: Array<{ id: string; name: string }>;
  canSwitchBranch: boolean;
  userAssignedBranch: { id: string } | null;
}

const BranchSelectionContext = createContext<BranchSelectionContextType | undefined>(undefined);

export function BranchSelectionProvider({ children }: { children: React.ReactNode }) {
  const { user, getCurrentUserBranch } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState<string | null>(() => {
    // Initialize from sessionStorage if available
    try {
      return sessionStorage.getItem('selectedBranch') || null;
    } catch {
      return null;
    }
  });
  const { branches, loading: branchesLoading, error: branchesError } = useBranches();
  
  // Get user's assigned branch from AuthContext
  const userAssignedBranch = getCurrentUserBranch();
  
  // Determine user's role and available branches
  const userRole = user?.user_metadata?.role || user?.role;
  const userBranchId = userAssignedBranch?.id || user?.user_metadata?.branch_id || user?.branch_id;
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
    userAssignedBranch,
    userBranchId,
    userOrganizationId,
    branchesLoading,
    branchesCount: branches.length,
    branchesError: branchesError?.message
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
    } else if (userAssignedBranch && userBranchId) {
      // Regular users only see their assigned branch
      const assignedBranchFromData = branches.find(b => b.id === userBranchId);
      return [{
        id: userBranchId,
        name: assignedBranchFromData?.name || user?.user_metadata?.branch_name || 'Assigned Branch'
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
  }, [canSwitchBranch, branches, userAssignedBranch, userBranchId, user]);
  
  // Sync selectedBranch with user's branch when user changes
  useEffect(() => {
    if (user && !branchesLoading) {
      console.log('BranchSelection: Syncing branch selection...', {
        user: user.email,
        selectedBranch,
        userBranchId,
        canSwitchBranch,
        branchesCount: branches.length,
        firstBranch: branches[0]?.id
      });
      
      if (!selectedBranch) {
        // No branch selected, auto-select user's assigned branch first
        if (userAssignedBranch && userBranchId) {
          console.log('BranchSelection: Auto-selecting user assigned branch:', userBranchId);
          setSelectedBranch(userBranchId);
          sessionStorage.setItem('selectedBranch', userBranchId);
        } else if (canSwitchBranch && branches.length > 0) {
          // Admin without assigned branch: select first available
          console.log('BranchSelection: Auto-selecting first available branch for admin:', branches[0].id);
          setSelectedBranch(branches[0].id);
          sessionStorage.setItem('selectedBranch', branches[0].id);
        } else if (branches.length > 0) {
          // Fallback: if user has no branch but branches are available, select first one
          console.log('BranchSelection: Auto-selecting first available branch for demo:', branches[0].id);
          setSelectedBranch(branches[0].id);
          sessionStorage.setItem('selectedBranch', branches[0].id);
        } else {
          console.warn('BranchSelection: No branches available for selection');
        }
      } else if (!canSwitchBranch && userAssignedBranch && selectedBranch !== userBranchId) {
        // Non-admin user with different branch selected: reset to their assigned branch
        console.log('BranchSelection: Resetting to user assigned branch for non-admin');
        setSelectedBranch(userBranchId);
        if (userBranchId) {
          sessionStorage.setItem('selectedBranch', userBranchId);
        }
      }
    } else if (!user) {
      // Clear selection when user logs out
      setSelectedBranch(null);
      sessionStorage.removeItem('selectedBranch');
    }
  }, [user, userAssignedBranch, userBranchId, canSwitchBranch, branches, selectedBranch, branchesLoading]);
  
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
    
    // Non-admins can only select their own assigned branch
    if (finalEffectiveRole !== 'admin' && finalEffectiveRole !== 'superadmin' && userAssignedBranch) {
      if (branchId !== userBranchId) {
        console.warn('Access denied: User cannot select branch outside their assignment');
        console.log('Blocked branch switch:', { effectiveRole, finalEffectiveRole, userAssignedBranch, userBranchId, requestedBranchId: branchId });
        return;
      }
    }
    
    // Allow selection if user has no branch assigned (demo mode) or is admin
    console.log('Branch selection allowed:', { branchId, finalEffectiveRole, userBranchId });
    setSelectedBranch(branchId);
    // Persist to sessionStorage for API interceptor
    sessionStorage.setItem('selectedBranch', branchId);
  };
  
  return (
    <BranchSelectionContext.Provider value={{ 
      selectedBranch, 
      setSelectedBranch: secureSetSelectedBranch,
      userBranches,
      canSwitchBranch,
      userAssignedBranch
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
