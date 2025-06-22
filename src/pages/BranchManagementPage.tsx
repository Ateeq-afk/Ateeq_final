import React, { useState, useEffect } from 'react';
import { Building2, ArrowLeft, Users, Truck, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import BranchDashboard from '@/components/branches/BranchDashboard';
import BranchOperations from '@/components/branches/BranchOperations';
import BranchTransferForm from '@/components/branches/BranchTransferForm';
import BranchStaffManagement from '@/components/branches/BranchStaffManagement';
import { useAuth } from '@/contexts/AuthContext';
import { useBranches } from '@/hooks/useBranches';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function BranchManagementPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const navigate = useNavigate();
  const { getCurrentUserBranch } = useAuth();
  const { branches, loading: branchesLoading } = useBranches();
  const userBranch = getCurrentUserBranch();
  
  // Set user's branch as default selected branch
  useEffect(() => {
    if (userBranch && !selectedBranch) {
      setSelectedBranch(userBranch.id);
    } else if (branches.length > 0 && !selectedBranch) {
      setSelectedBranch(branches[0].id);
    }
  }, [userBranch, branches, selectedBranch]);
  
  const handleBack = () => {
    navigate('/dashboard');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="-ml-4 mb-2 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Branch Management</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedBranch || ''} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name} - {branch.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-1">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="operations" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                <span className="hidden sm:inline">Operations</span>
              </TabsTrigger>
              <TabsTrigger value="transfers" className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                <span className="hidden sm:inline">Transfers</span>
              </TabsTrigger>
              <TabsTrigger value="staff" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Staff</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>
        
        <TabsContent value="dashboard" className="mt-0">
          <BranchDashboard />
        </TabsContent>
        
        <TabsContent value="operations" className="mt-0">
          <BranchOperations />
        </TabsContent>
        
        <TabsContent value="transfers" className="mt-0">
          <BranchTransferForm />
        </TabsContent>
        
        <TabsContent value="staff" className="mt-0">
          <BranchStaffManagement branchId={selectedBranch} />
        </TabsContent>
      </Tabs>
    </div>
  );
}