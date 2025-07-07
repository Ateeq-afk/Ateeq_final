import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Mail, 
  Phone, 
  Shield, 
  Key, 
  LogIn, 
  Settings,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { creditManagementService } from '@/services/creditManagement';
import { CustomerPortalAccess, Customer } from '@/types';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface PortalAccessFormData {
  access_email: string;
  access_phone?: string;
  is_primary: boolean;
  permissions: {
    view_bookings: boolean;
    view_invoices: boolean;
    make_payments: boolean;
  };
}

interface CustomerPortalProps {
  customer: Customer;
}

const CustomerPortal = ({ customer }: CustomerPortalProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAccess, setEditingAccess] = useState<CustomerPortalAccess | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [formData, setFormData] = useState<PortalAccessFormData>({
    access_email: '',
    access_phone: '',
    is_primary: false,
    permissions: {
      view_bookings: true,
      view_invoices: true,
      make_payments: false,
    },
  });

  const { showSuccess, showError } = useNotificationSystem();
  const queryClient = useQueryClient();

  // Fetch portal access records
  const { data: portalAccess, isLoading } = useQuery({
    queryKey: ['portal-access', customer.id],
    queryFn: () => creditManagementService.getPortalAccess(customer.id),
  });

  // Create portal access mutation
  const createAccessMutation = useMutation({
    mutationFn: (data: Omit<CustomerPortalAccess, 'id' | 'created_at' | 'updated_at' | 'login_count' | 'last_login'>) =>
      creditManagementService.createPortalAccess(data),
    onSuccess: () => {
      showSuccess('Portal access created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['portal-access', customer.id] });
    },
    onError: () => {
      showError('Failed to create portal access');
    },
  });

  // Update portal access mutation
  const updateAccessMutation = useMutation({
    mutationFn: ({ accessId, updates }: { accessId: string; updates: Partial<CustomerPortalAccess> }) =>
      creditManagementService.updatePortalAccess(accessId, updates),
    onSuccess: () => {
      showSuccess('Portal access updated successfully');
      setEditingAccess(null);
      queryClient.invalidateQueries({ queryKey: ['portal-access', customer.id] });
    },
    onError: () => {
      showError('Failed to update portal access');
    },
  });

  // Reset portal PIN mutation
  const resetPinMutation = useMutation({
    mutationFn: () => creditManagementService.resetPortalPin(customer.id),
    onSuccess: (data) => {
      showSuccess(`New PIN generated: ${data.data.pin}`);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: () => {
      showError('Failed to reset portal PIN');
    },
  });

  const accessRecords: CustomerPortalAccess[] = portalAccess?.data || [];

  const resetForm = () => {
    setFormData({
      access_email: '',
      access_phone: '',
      is_primary: false,
      permissions: {
        view_bookings: true,
        view_invoices: true,
        make_payments: false,
      },
    });
  };

  const handleCreateAccess = () => {
    createAccessMutation.mutate({
      customer_id: customer.id,
      ...formData,
    });
  };

  const handleUpdateAccess = (access: CustomerPortalAccess, updates: Partial<CustomerPortalAccess>) => {
    updateAccessMutation.mutate({ accessId: access.id, updates });
  };

  const handleToggleActive = (access: CustomerPortalAccess) => {
    handleUpdateAccess(access, { is_active: !access.is_active });
  };

  const getPermissionBadges = (permissions: CustomerPortalAccess['permissions']) => {
    const badges = [];
    if (permissions.view_bookings) badges.push('View Bookings');
    if (permissions.view_invoices) badges.push('View Invoices');
    if (permissions.make_payments) badges.push('Make Payments');
    return badges;
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Portal Access</h2>
          <p className="text-gray-600 mt-1">Manage portal access for {customer.name}</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Portal Access
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Portal Access</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="access_email">Email Address</Label>
                <Input
                  id="access_email"
                  type="email"
                  value={formData.access_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, access_email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <Label htmlFor="access_phone">Phone Number (Optional)</Label>
                <Input
                  id="access_phone"
                  value={formData.access_phone || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, access_phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_primary}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_primary: checked }))}
                />
                <Label>Primary Contact</Label>
              </div>

              <div className="space-y-3">
                <Label>Permissions</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="view_bookings"
                      checked={formData.permissions.view_bookings}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, view_bookings: e.target.checked }
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <Label htmlFor="view_bookings">View Bookings</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="view_invoices"
                      checked={formData.permissions.view_invoices}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, view_invoices: e.target.checked }
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <Label htmlFor="view_invoices">View Invoices</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="make_payments"
                      checked={formData.permissions.make_payments}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, make_payments: e.target.checked }
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <Label htmlFor="make_payments">Make Payments</Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateAccess}
                  disabled={!formData.access_email || createAccessMutation.isPending}
                >
                  Create Access
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Portal Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Portal Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Portal Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Portal Access Status</p>
              <p className="text-sm text-gray-600">
                {customer.portal_access ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <Badge className={customer.portal_access ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {customer.portal_access ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {/* Portal PIN */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Portal PIN</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-gray-600">
                  {showPin ? customer.portal_pin || 'Not set' : '••••••'}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPin(!showPin)}
                >
                  {showPin ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => resetPinMutation.mutate()}
              disabled={resetPinMutation.isPending}
            >
              <Key className="h-4 w-4 mr-2" />
              Reset PIN
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Access Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Access Records ({accessRecords.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {accessRecords.length > 0 ? (
            <div className="space-y-4">
              {accessRecords.map((access) => (
                <div key={access.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{access.access_email}</span>
                      </div>
                      {access.is_primary && (
                        <Badge className="bg-blue-100 text-blue-800">Primary</Badge>
                      )}
                      <Badge className={access.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {access.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    {access.access_phone && (
                      <div className="flex items-center gap-2 mb-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{access.access_phone}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {getPermissionBadges(access.permissions).map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Logins: {access.login_count}</span>
                      {access.last_login && (
                        <span>Last: {new Date(access.last_login).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(access)}
                    >
                      {access.is_active ? 'Deactivate' : 'Activate'}
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
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No portal access records found</p>
              <p className="text-sm text-gray-400">
                Create portal access to allow customers to view their bookings and invoices
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerPortal;