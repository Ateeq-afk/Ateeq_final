import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, X } from 'lucide-react';
import { driversService, Driver, CreateDriverRequest } from '@/services/drivers';
import { useToast } from '@/hooks/use-toast';

interface DriverFormProps {
  driver?: Driver | null;
  onClose: () => void;
}

export const DriverForm: React.FC<DriverFormProps> = ({ driver, onClose }) => {
  const [formData, setFormData] = useState<CreateDriverRequest>({
    employee_code: '',
    name: '',
    mobile: '',
    alternate_mobile: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    date_of_birth: '',
    blood_group: '',
    license_number: '',
    license_type: '',
    license_issue_date: '',
    license_expiry_date: '',
    joining_date: '',
    status: 'active',
    salary: 0,
    aadhar_number: '',
    pan_number: '',
    emergency_contact_name: '',
    emergency_contact_number: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (driver) {
      setFormData({
        employee_code: driver.employee_code,
        name: driver.name,
        mobile: driver.mobile,
        alternate_mobile: driver.alternate_mobile || '',
        email: driver.email || '',
        address: driver.address || '',
        city: driver.city || '',
        state: driver.state || '',
        pincode: driver.pincode || '',
        date_of_birth: driver.date_of_birth || '',
        blood_group: driver.blood_group || '',
        license_number: driver.license_number,
        license_type: driver.license_type,
        license_issue_date: driver.license_issue_date || '',
        license_expiry_date: driver.license_expiry_date || '',
        joining_date: driver.joining_date,
        status: driver.status,
        salary: driver.salary || 0,
        aadhar_number: driver.aadhar_number || '',
        pan_number: driver.pan_number || '',
        emergency_contact_name: driver.emergency_contact_name || '',
        emergency_contact_number: driver.emergency_contact_number || ''
      });
    }
  }, [driver]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (driver) {
        await driversService.update(driver.id, formData);
        toast({
          title: 'Success',
          description: 'Driver updated successfully'
        });
      } else {
        await driversService.create(formData);
        toast({
          title: 'Success',
          description: 'Driver created successfully'
        });
      }
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save driver',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateDriverRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">
          {driver ? 'Edit Driver' : 'Add New Driver'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employee_code">Employee Code *</Label>
                <Input
                  id="employee_code"
                  value={formData.employee_code}
                  onChange={(e) => handleInputChange('employee_code', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="mobile">Mobile Number *</Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="alternate_mobile">Alternate Mobile</Label>
                <Input
                  id="alternate_mobile"
                  type="tel"
                  value={formData.alternate_mobile}
                  onChange={(e) => handleInputChange('alternate_mobile', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="blood_group">Blood Group</Label>
                <select
                  id="blood_group"
                  value={formData.blood_group}
                  onChange={(e) => handleInputChange('blood_group', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* License Information */}
        <Card>
          <CardHeader>
            <CardTitle>License Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="license_number">License Number *</Label>
                <Input
                  id="license_number"
                  value={formData.license_number}
                  onChange={(e) => handleInputChange('license_number', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="license_type">License Type *</Label>
                <select
                  id="license_type"
                  value={formData.license_type}
                  onChange={(e) => handleInputChange('license_type', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  required
                >
                  <option value="">Select License Type</option>
                  <option value="LMV">LMV (Light Motor Vehicle)</option>
                  <option value="HMV">HMV (Heavy Motor Vehicle)</option>
                  <option value="MCWG">MCWG (Motorcycle with Gear)</option>
                  <option value="MCWOG">MCWOG (Motorcycle without Gear)</option>
                  <option value="PSV">PSV (Public Service Vehicle)</option>
                  <option value="HGMV">HGMV (Heavy Goods Motor Vehicle)</option>
                  <option value="HPMV">HPMV (Heavy Passenger Motor Vehicle)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="license_issue_date">License Issue Date</Label>
                <Input
                  id="license_issue_date"
                  type="date"
                  value={formData.license_issue_date}
                  onChange={(e) => handleInputChange('license_issue_date', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="license_expiry_date">License Expiry Date</Label>
                <Input
                  id="license_expiry_date"
                  type="date"
                  value={formData.license_expiry_date}
                  onChange={(e) => handleInputChange('license_expiry_date', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment Information */}
        <Card>
          <CardHeader>
            <CardTitle>Employment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="joining_date">Joining Date *</Label>
                <Input
                  id="joining_date"
                  type="date"
                  value={formData.joining_date}
                  onChange={(e) => handleInputChange('joining_date', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as any)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
              <div>
                <Label htmlFor="salary">Salary (₹)</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => handleInputChange('salary', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents & Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Documents & Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="aadhar_number">Aadhar Number</Label>
                <Input
                  id="aadhar_number"
                  value={formData.aadhar_number}
                  onChange={(e) => handleInputChange('aadhar_number', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="pan_number">PAN Number</Label>
                <Input
                  id="pan_number"
                  value={formData.pan_number}
                  onChange={(e) => handleInputChange('pan_number', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                <Input
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="emergency_contact_number">Emergency Contact Number</Label>
                <Input
                  id="emergency_contact_number"
                  type="tel"
                  value={formData.emergency_contact_number}
                  onChange={(e) => handleInputChange('emergency_contact_number', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : 'Save Driver'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};