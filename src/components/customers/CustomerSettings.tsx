import React, { useState } from 'react';
import { Settings2, Building2, MapPin, Phone, Mail, FileText, IndianRupee, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBranches } from '@/hooks/useBranches';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import type { Customer } from '@/types';

interface Props {
  customer: Customer;
  onClose: () => void;
  onUpdate: (data: Partial<Customer>) => Promise<void>;
}

export default function CustomerSettings({ customer, onClose, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { branches } = useBranches(customer.organization_id);
  const { showSuccess, showError } = useNotificationSystem();
  const [formData, setFormData] = useState({
    name: customer.name,
    mobile: customer.mobile,
    gst: customer.gst || '',
    type: customer.type,
    branch_id: customer.branch_id || '',
    email: customer.email || '',
    address: customer.address || '',
    city: customer.city || '',
    state: customer.state || '',
    pincode: customer.pincode || '',
    credit_limit: customer.credit_limit || 0,
    payment_terms: customer.payment_terms || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      setLoading(true);
      await onUpdate(formData);
      showSuccess('Settings Updated', 'Customer settings have been updated successfully');
      onClose();
    } catch (err) {
      console.error('Failed to update customer:', err);
      setError(err instanceof Error ? err.message : 'Failed to update customer settings');
      showError('Update Failed', 'Failed to update customer settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Customer Settings</h3>
          <p className="text-sm text-gray-500">Update customer details and preferences</p>
        </div>
        <Settings2 className="h-5 w-5 text-gray-400" />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Update Error</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Customer Name</Label>
          <div className="relative">
            {formData.type === 'individual' ? (
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            ) : (
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            )}
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="pl-10"
              placeholder="Enter customer name"
            />
          </div>
        </div>

        <div>
          <Label>Mobile Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              className="pl-10"
              placeholder="Enter mobile number"
            />
          </div>
        </div>

        <div>
          <Label>Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="pl-10"
              placeholder="Enter email address"
            />
          </div>
        </div>

        <div>
          <Label>GST Number</Label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              name="gst"
              value={formData.gst}
              onChange={handleChange}
              className="pl-10"
              placeholder="Enter GST number"
            />
          </div>
        </div>

        <div>
          <Label>Customer Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value: 'individual' | 'company') => handleSelectChange('type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="company">Company</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Assigned Branch</Label>
          <Select
            value={formData.branch_id}
            onValueChange={(value) => handleSelectChange('branch_id', value)}
          >
            <SelectTrigger>
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

        <div>
          <Label>Address</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="pl-10"
              placeholder="Enter address"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>City</Label>
            <Input
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Enter city"
            />
          </div>
          <div>
            <Label>State</Label>
            <Input
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="Enter state"
            />
          </div>
        </div>

        <div>
          <Label>Pincode</Label>
          <Input
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            placeholder="Enter pincode"
          />
        </div>

        <div>
          <Label>Credit Limit</Label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              name="credit_limit"
              type="number"
              min="0"
              step="100"
              value={formData.credit_limit}
              onChange={handleChange}
              className="pl-10"
              placeholder="Enter credit limit"
            />
          </div>
        </div>

        <div>
          <Label>Payment Terms</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Select
              value={formData.payment_terms}
              onValueChange={(value) => handleSelectChange('payment_terms', value)}
            >
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Select payment terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="net15">Net 15 Days</SelectItem>
                <SelectItem value="net30">Net 30 Days</SelectItem>
                <SelectItem value="net45">Net 45 Days</SelectItem>
                <SelectItem value="net60">Net 60 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  );
}

// Helper component for User icon
function User(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}