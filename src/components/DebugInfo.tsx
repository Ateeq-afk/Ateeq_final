import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const DebugInfo: React.FC = () => {
  const { user } = useAuth();
  const { selectedBranch, userBranches } = useBranchSelection();
  
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  const selectedBranchData = sessionStorage.getItem('selectedBranch');
  
  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Debug Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold">Authentication</h3>
          <p>User Email: {user?.email || 'Not logged in'}</p>
          <p>User ID: {user?.id || 'N/A'}</p>
          <p>User Role: {user?.user_metadata?.role || user?.role || 'N/A'}</p>
          <p>Token exists: {token ? 'Yes' : 'No'}</p>
        </div>
        
        <div>
          <h3 className="font-semibold">Branch Selection</h3>
          <p>Selected Branch ID: {selectedBranch || 'None selected'}</p>
          <p>Selected Branch (Session): {selectedBranchData || 'None'}</p>
          <p>Available Branches: {userBranches.length}</p>
          {userBranches.map(branch => (
            <p key={branch.id} className="ml-4">- {branch.name} ({branch.id})</p>
          ))}
        </div>
        
        <div>
          <h3 className="font-semibold">API Configuration</h3>
          <p>API URL: {import.meta.env.VITE_API_URL || 'http://localhost:4000'}</p>
          <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL || 'Not configured'}</p>
        </div>
      </CardContent>
    </Card>
  );
};