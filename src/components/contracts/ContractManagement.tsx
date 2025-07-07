import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Calendar, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Plus,
  Edit3,
  Download,
  Upload,
  BarChart3,
  Target
} from 'lucide-react';
import { creditManagementService } from '@/services/creditManagement';
import { CustomerContract, Customer } from '@/types';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ContractFormData {
  contract_number: string;
  contract_type: string;
  start_date: string;
  end_date?: string;
  auto_renew: boolean;
  terms: Record<string, any>;
  sla_terms: Record<string, any>;
  special_rates: Record<string, any>;
  document_url?: string;
  status: 'Draft' | 'Active' | 'Expired' | 'Terminated';
}

interface SLAMetrics {
  delivery_performance: number;
  complaint_resolution: number;
  total_deliveries: number;
  on_time_deliveries: number;
  total_complaints: number;
  resolved_within_sla: number;
}

interface ContractManagementProps {
  customer?: Customer;
}

const ContractManagement = ({ customer }: ContractManagementProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<CustomerContract | null>(null);
  const [activeTab, setActiveTab] = useState<'contracts' | 'sla'>('contracts');
  const [formData, setFormData] = useState<ContractFormData>({
    contract_number: '',
    contract_type: 'Standard',
    start_date: new Date().toISOString().split('T')[0],
    auto_renew: false,
    terms: {},
    sla_terms: {
      delivery_hours: 48,
      complaint_hours: 24,
      performance_threshold: 95
    },
    special_rates: {},
    status: 'Draft',
  });

  const { showSuccess, showError } = useNotificationSystem();
  const queryClient = useQueryClient();

  // Fetch contracts
  const { data: contracts, isLoading: contractsLoading } = useQuery({
    queryKey: ['customer-contracts', customer?.id],
    queryFn: () => creditManagementService.getCustomerContracts(customer?.id),
    enabled: !!customer,
  });

  // Fetch SLA compliance data
  const { data: slaCompliance, isLoading: slaLoading } = useQuery({
    queryKey: ['sla-compliance', customer?.id],
    queryFn: () => customer ? creditManagementService.checkSLACompliance(customer.id) : null,
    enabled: !!customer,
  });

  // Create contract mutation
  const createContractMutation = useMutation({
    mutationFn: (data: Omit<CustomerContract, 'id' | 'created_at' | 'updated_at'>) =>
      creditManagementService.createCustomerContract(data),
    onSuccess: () => {
      showSuccess('Contract created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['customer-contracts'] });
    },
    onError: () => {
      showError('Failed to create contract');
    },
  });

  // Update contract mutation
  const updateContractMutation = useMutation({
    mutationFn: ({ contractId, updates }: { contractId: string; updates: Partial<CustomerContract> }) =>
      creditManagementService.updateCustomerContract(contractId, updates),
    onSuccess: () => {
      showSuccess('Contract updated successfully');
      setEditingContract(null);
      queryClient.invalidateQueries({ queryKey: ['customer-contracts'] });
    },
    onError: () => {
      showError('Failed to update contract');
    },
  });

  const contractRecords: CustomerContract[] = contracts?.data || [];
  const slaMetrics: SLAMetrics = slaCompliance?.data || {
    delivery_performance: 0,
    complaint_resolution: 0,
    total_deliveries: 0,
    on_time_deliveries: 0,
    total_complaints: 0,
    resolved_within_sla: 0,
  };

  const resetForm = () => {
    setFormData({
      contract_number: '',
      contract_type: 'Standard',
      start_date: new Date().toISOString().split('T')[0],
      auto_renew: false,
      terms: {},
      sla_terms: {
        delivery_hours: 48,
        complaint_hours: 24,
        performance_threshold: 95
      },
      special_rates: {},
      status: 'Draft',
    });
  };

  const handleCreateContract = () => {
    if (!customer) return;
    
    createContractMutation.mutate({
      organization_id: customer.organization_id!,
      customer_id: customer.id,
      ...formData,
    });
  };

  const getContractStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Draft': return 'bg-yellow-100 text-yellow-800';
      case 'Expired': return 'bg-red-100 text-red-800';
      case 'Terminated': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSLAStatusColor = (percentage: number) => {
    if (percentage >= 95) return 'text-green-600';
    if (percentage >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const isContractExpiringSoon = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  if (!customer) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Select a customer to manage contracts and SLAs</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contract & SLA Management</h2>
          <p className="text-gray-600 mt-1">Manage contracts and service level agreements for {customer.name}</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Contract
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Contract</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contract_number">Contract Number</Label>
                  <Input
                    id="contract_number"
                    value={formData.contract_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, contract_number: e.target.value }))}
                    placeholder="CON-2024-001"
                  />
                </div>

                <div>
                  <Label htmlFor="contract_type">Contract Type</Label>
                  <Select
                    value={formData.contract_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, contract_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Standard">Standard</SelectItem>
                      <SelectItem value="Premium">Premium</SelectItem>
                      <SelectItem value="Corporate">Corporate</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="end_date">End Date (Optional)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.auto_renew}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_renew: checked }))}
                />
                <Label>Auto-renew contract</Label>
              </div>

              <div>
                <Label>SLA Terms</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div>
                    <Label className="text-sm">Delivery Hours</Label>
                    <Input
                      type="number"
                      value={formData.sla_terms.delivery_hours || 48}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        sla_terms: { ...prev.sla_terms, delivery_hours: parseInt(e.target.value) }
                      }))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Complaint Hours</Label>
                    <Input
                      type="number"
                      value={formData.sla_terms.complaint_hours || 24}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        sla_terms: { ...prev.sla_terms, complaint_hours: parseInt(e.target.value) }
                      }))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Performance Threshold (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.sla_terms.performance_threshold || 95}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        sla_terms: { ...prev.sla_terms, performance_threshold: parseInt(e.target.value) }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateContract}
                  disabled={!formData.contract_number || createContractMutation.isPending}
                >
                  Create Contract
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'contracts' | 'sla')}>
        <TabsList>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="sla">SLA Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-6">
          {/* Contract Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Contracts</p>
                    <p className="text-2xl font-bold text-gray-900">{contractRecords.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Contracts</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {contractRecords.filter(c => c.status === 'Active').length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {contractRecords.filter(c => c.end_date && isContractExpiringSoon(c.end_date)).length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Auto-Renewals</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {contractRecords.filter(c => c.auto_renew).length}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contracts List */}
          <Card>
            <CardHeader>
              <CardTitle>Contract History</CardTitle>
            </CardHeader>
            <CardContent>
              {contractsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : contractRecords.length > 0 ? (
                <div className="space-y-4">
                  {contractRecords.map((contract) => (
                    <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium">{contract.contract_number}</span>
                          <Badge className={getContractStatusColor(contract.status)}>
                            {contract.status}
                          </Badge>
                          <Badge variant="outline">{contract.contract_type}</Badge>
                          {contract.auto_renew && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              Auto-renew
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Start: {new Date(contract.start_date).toLocaleDateString()}</span>
                          {contract.end_date && (
                            <span>End: {new Date(contract.end_date).toLocaleDateString()}</span>
                          )}
                          {contract.end_date && isContractExpiringSoon(contract.end_date) && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              Expires in {Math.ceil((new Date(contract.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No contracts found</p>
                  <p className="text-sm text-gray-400">
                    Create a contract to get started
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sla" className="space-y-6">
          {/* SLA Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Delivery Performance</p>
                    <p className={`text-3xl font-bold ${getSLAStatusColor(slaMetrics.delivery_performance)}`}>
                      {slaMetrics.delivery_performance.toFixed(1)}%
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>On-time: {slaMetrics.on_time_deliveries}</span>
                  <span>Total: {slaMetrics.total_deliveries}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      slaMetrics.delivery_performance >= 95 ? 'bg-green-500' :
                      slaMetrics.delivery_performance >= 85 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(slaMetrics.delivery_performance, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Complaint Resolution</p>
                    <p className={`text-3xl font-bold ${getSLAStatusColor(slaMetrics.complaint_resolution)}`}>
                      {slaMetrics.complaint_resolution.toFixed(1)}%
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-green-600" />
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Within SLA: {slaMetrics.resolved_within_sla}</span>
                  <span>Total: {slaMetrics.total_complaints}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      slaMetrics.complaint_resolution >= 95 ? 'bg-green-500' :
                      slaMetrics.complaint_resolution >= 85 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(slaMetrics.complaint_resolution, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SLA Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                SLA Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Current SLA Terms</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Delivery SLA</p>
                      <p className="font-medium">{customer.sla_delivery_hours || 48} hours</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Complaint Resolution SLA</p>
                      <p className="font-medium">{customer.sla_complaint_hours || 24} hours</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Performance Trends</h4>
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Performance trends will be displayed here</p>
                    <p className="text-sm text-gray-400">
                      Historical data visualization coming soon
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContractManagement;