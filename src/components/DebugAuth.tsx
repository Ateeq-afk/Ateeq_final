import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function DebugAuth() {
  const { user, token, loading, fetchUserProfile } = useAuth();

  const handleFetchProfile = async () => {
    console.log('Manually triggering profile fetch...');
    await fetchUserProfile();
  };

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 m-4">
      <h3 className="font-bold text-lg mb-2">Auth Debug Info</h3>
      
      <div className="mb-2">
        <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
      </div>
      
      <div className="mb-2">
        <strong>Token:</strong> {token ? `${token.substring(0, 20)}...` : 'None'}
      </div>
      
      <div className="mb-4">
        <strong>User Data:</strong>
        <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-40">
          {JSON.stringify({
            id: user?.id,
            email: user?.email,
            role: user?.role,
            organization_id: user?.organization_id,
            branch_id: user?.branch_id,
            organization_name: user?.organization_name,
            branch_name: user?.branch_name,
            user_metadata: user?.user_metadata
          }, null, 2)}
        </pre>
      </div>
      
      <button 
        onClick={handleFetchProfile}
        disabled={!token || loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Fetching...' : 'Fetch User Profile'}
      </button>
    </div>
  );
}