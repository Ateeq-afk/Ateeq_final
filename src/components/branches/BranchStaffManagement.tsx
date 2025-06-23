import React, { useState, useEffect } from 'react';
import { 
  Users, 
  User, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash, 
  Shield, 
  Mail, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useBranches } from '@/hooks/useBranches';
import { useBranchUsers } from '@/hooks/useBranchUsers';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { motion } from 'framer-motion';

interface BranchStaffManagementProps {
  branchId?: string;
}

export default function BranchStaffManagement({ branchId }: BranchStaffManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { users, loading: usersLoading, addUser, updateUser, removeUser } = useBranchUsers(branchId);
  const { showSuccess, showError } = useNotificationSystem();
  
  // Filter users based on search
  const filteredUsers = React.useMemo(() => {
    if (!users) return [];
    
    return users.filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery)
    );
  }, [users, searchQuery]);
  
  // Handle add staff
  const handleAddStaff = async (data: any) => {
    try {
      setLoading(true);
      
      if (!branchId) {
        throw new Error('Branch ID is required');
      }
      
      await addUser({
        branch_id: branchId,
        user_id: 'new-user-id', // This would be handled by the backend
        role: data.role,
        name: data.name,
        email: data.email,
        phone: data.phone
      });
      
      showSuccess('Staff Added', 'Staff member has been added successfully');
      setShowAddStaff(false);
    } catch (err) {
      console.error('Failed to add staff:', err);
      showError('Add Failed', 'Failed to add staff member');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle edit staff
  const handleEditStaff = async (data: any) => {
    try {
      setLoading(true);
      
      if (!editingStaff) return;
      
      await updateUser(editingStaff.id, {
        role: data.role,
        name: data.name,
        email: data.email,
        phone: data.phone
      });
      
      showSuccess('Staff Updated', 'Staff member has been updated successfully');
      setEditingStaff(null);
    } catch (err) {
      console.error('Failed to update staff:', err);
      showError('Update Failed', 'Failed to update staff member');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle delete staff
  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;
    
    try {
      setLoading(true);
      
      await removeUser(staffToDelete);
      
      showSuccess('Staff Removed', 'Staff member has been removed successfully');
      setStaffToDelete(null);
    } catch (err) {
      console.error('Failed to delete staff:', err);
      showError('Delete Failed', 'Failed to remove staff member');
    } finally {
      setLoading(false);
    }
  };
  
  if (!branchId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Select a Branch</h3>
          <p className="text-gray-600 mt-1">Please select a branch to manage its staff</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Branch Staff</h2>
          <p className="text-gray-600 mt-1">Manage branch staff members</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setShowAddStaff(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Staff
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search staff by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {filteredUsers.length} Staff Members
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {usersLoading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role === 'admin' ? (
                              <Shield className="h-3 w-3 mr-1" />
                            ) : null}
                            {user.role}
                          </span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingStaff(user)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setStaffToDelete(user.id)}
                          className="text-red-600"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{user.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No Staff Found</h3>
              <p className="text-gray-500 mt-1">
                {searchQuery 
                  ? 'No staff members match your search criteria' 
                  : 'No staff members have been added to this branch yet'}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => setShowAddStaff(true)}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Add Staff Dialog */}
      <Dialog open={showAddStaff} onOpenChange={setShowAddStaff}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
            <DialogDescription>
              Add a new staff member to this branch
            </DialogDescription>
          </DialogHeader>
          
          <StaffForm 
            onSubmit={handleAddStaff}
            onCancel={() => setShowAddStaff(false)}
            loading={loading}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Staff Dialog */}
      <Dialog 
        open={!!editingStaff} 
        onOpenChange={(open) => {
          if (!open) setEditingStaff(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update staff member details
            </DialogDescription>
          </DialogHeader>
          
          {editingStaff && (
            <StaffForm 
              initialData={editingStaff}
              onSubmit={handleEditStaff}
              onCancel={() => setEditingStaff(null)}
              loading={loading}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={!!staffToDelete} 
        onOpenChange={(open) => {
          if (!open) setStaffToDelete(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Staff Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this staff member?
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end gap-3 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setStaffToDelete(null)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteStaff}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash className="h-4 w-4" />
                  Remove
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface StaffFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

function StaffForm({ initialData, onSubmit, onCancel, loading = false }: StaffFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    role: initialData?.role || 'operator',
    status: initialData?.status || 'active'
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter full name"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter email address"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Enter phone number"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="role">Role</Label>
        <Select
          value={formData.role}
          onValueChange={(value) => handleSelectChange('role', value)}
        >
          <SelectTrigger id="role">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="operator">Operator</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => handleSelectChange('status', value)}
        >
          <SelectTrigger id="status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end gap-3 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {initialData ? 'Updating...' : 'Adding...'}
            </>
          ) : (
            <>
              {initialData ? 'Update Staff' : 'Add Staff'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
