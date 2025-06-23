import React, { createContext, useContext, useState } from 'react';

interface BranchSelectionContextType {
  selectedBranch: string | null;
  setSelectedBranch: React.Dispatch<React.SetStateAction<string | null>>;
}

const BranchSelectionContext = createContext<BranchSelectionContextType | undefined>(undefined);

export function BranchSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  return (
    <BranchSelectionContext.Provider value={{ selectedBranch, setSelectedBranch }}>
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
