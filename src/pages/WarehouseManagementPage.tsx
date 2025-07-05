import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Warehouse as WarehouseIcon, MapPin, Package, TrendingUp, AlertCircle, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { warehouseService, type Warehouse, type WarehouseLocation, type CreateWarehouseData, type CreateLocationData } from '@/services/warehouses';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import { ArticleTrackingView } from '@/components/warehouse/ArticleTrackingView';

export default function WarehouseManagementPage() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [isCreateWarehouseOpen, setIsCreateWarehouseOpen] = useState(false);
  const [isCreateLocationOpen, setIsCreateLocationOpen] = useState(false);
  const [isEditWarehouseOpen, setIsEditWarehouseOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedBranch } = useBranchSelection();

  // Queries
  const { data: warehouses = [], isLoading: warehousesLoading, error: warehousesError } = useQuery({
    queryKey: ['warehouses', selectedBranch],
    queryFn: () => warehouseService.getWarehouses({ branch_id: selectedBranch || undefined }),
    enabled: !!selectedBranch,
  });

  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ['warehouse-locations', selectedWarehouse?.id],
    queryFn: () => selectedWarehouse ? warehouseService.getLocationsByWarehouse(selectedWarehouse.id) : Promise.resolve([]),
    enabled: !!selectedWarehouse,
  });

  // Mutations
  const createWarehouseMutation = useMutation({
    mutationFn: (data: CreateWarehouseData) => warehouseService.createWarehouse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setIsCreateWarehouseOpen(false);
      toast({ title: 'Success', description: 'Warehouse created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to create warehouse', variant: 'destructive' });
    },
  });

  const updateWarehouseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateWarehouseData> }) => warehouseService.updateWarehouse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setIsEditWarehouseOpen(false);
      setEditingWarehouse(null);
      toast({ title: 'Success', description: 'Warehouse updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update warehouse', variant: 'destructive' });
    },
  });

  const deleteWarehouseMutation = useMutation({
    mutationFn: (id: string) => warehouseService.deleteWarehouse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      if (selectedWarehouse?.id === undefined) {
        setSelectedWarehouse(null);
      }
      toast({ title: 'Success', description: 'Warehouse deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to delete warehouse', variant: 'destructive' });
    },
  });

  const createLocationMutation = useMutation({
    mutationFn: (data: CreateLocationData) => warehouseService.createLocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-locations'] });
      setIsCreateLocationOpen(false);
      toast({ title: 'Success', description: 'Location created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to create location', variant: 'destructive' });
    },
  });

  const handleCreateWarehouse = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: CreateWarehouseData = {
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      status: formData.get('status') as string || 'active',
      organization_id: user?.organization_id,
      branch_id: selectedBranch || user?.branch_id,
    };
    createWarehouseMutation.mutate(data);
  };

  const handleEditWarehouse = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingWarehouse) return;
    
    const formData = new FormData(e.currentTarget);
    const data: Partial<CreateWarehouseData> = {
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      status: formData.get('status') as string,
    };
    updateWarehouseMutation.mutate({ id: editingWarehouse.id, data });
  };

  const handleCreateLocation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedWarehouse) return;
    
    const formData = new FormData(e.currentTarget);
    const capacity = formData.get('capacity') as string;
    const data: CreateLocationData = {
      warehouse_id: selectedWarehouse.id,
      location_code: formData.get('location_code') as string,
      name: formData.get('name') as string,
      location_type: formData.get('type') as string || 'bin',
      capacity_units: capacity ? parseInt(capacity) : undefined,
    };
    createLocationMutation.mutate(data);
  };

  const openEditWarehouse = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setIsEditWarehouseOpen(true);
  };

  const handleDeleteWarehouse = (warehouse: Warehouse) => {
    if (confirm(`Are you sure you want to delete warehouse "${warehouse.name}"?`)) {
      deleteWarehouseMutation.mutate(warehouse.id);
    }
  };

  if (!selectedBranch) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Warehouse Management</h1>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a branch to view warehouses.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (warehousesError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Warehouse Management</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load warehouses. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Warehouse Management</h1>
          <p className="text-muted-foreground mt-1">Manage warehouses, locations, and inventory</p>
          {selectedBranch && (
            <>
              <p className="text-sm text-muted-foreground mt-1">
                Viewing warehouses for branch: <span className="font-medium">{selectedBranch}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Each branch automatically gets a main warehouse with default storage locations.
              </p>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateWarehouseOpen} onOpenChange={setIsCreateWarehouseOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Warehouse
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Warehouse</DialogTitle>
                <DialogDescription>
                  Add a new warehouse to your logistics network.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateWarehouse}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Warehouse Name</Label>
                    <Input id="name" name="name" placeholder="Main Warehouse" required />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" name="address" placeholder="123 Storage Street" />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" placeholder="Mumbai" />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue="active">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsCreateWarehouseOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createWarehouseMutation.isPending}>
                    {createWarehouseMutation.isPending ? 'Creating...' : 'Create Warehouse'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Warehouses List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <WarehouseIcon className="h-5 w-5" />
                Warehouses
              </CardTitle>
              <CardDescription>
                {warehouses.length} warehouse{warehouses.length !== 1 ? 's' : ''} registered
              </CardDescription>
            </CardHeader>
            <CardContent>
              {warehousesLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : warehouses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <WarehouseIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No warehouses found for this branch</p>
                  <p className="text-sm">A default warehouse should be created automatically.</p>
                  <p className="text-sm mt-2">If not, click "Add Warehouse" to create one.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {warehouses.map((warehouse) => (
                    <div
                      key={warehouse.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedWarehouse?.id === warehouse.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedWarehouse(warehouse)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{warehouse.name}</h3>
                            {warehouse.warehouse_type === 'main' && (
                              <Badge variant="secondary" className="text-xs">Main</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{warehouse.city}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge 
                            variant={warehouse.status === 'active' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {warehouse.status || 'active'}
                          </Badge>
                          <div className="flex gap-1 ml-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditWarehouse(warehouse);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteWarehouse(warehouse);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Warehouse Details */}
        <div className="lg:col-span-2">
          {selectedWarehouse ? (
            <Tabs defaultValue="locations" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{selectedWarehouse.name}</h2>
                  <p className="text-muted-foreground">{selectedWarehouse.address}, {selectedWarehouse.city}</p>
                </div>
                <TabsList>
                  <TabsTrigger value="locations">Locations</TabsTrigger>
                  <TabsTrigger value="tracking">Article Tracking</TabsTrigger>
                  <TabsTrigger value="inventory">Inventory</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="locations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          Storage Locations
                        </CardTitle>
                        <CardDescription>
                          Manage storage locations within this warehouse
                        </CardDescription>
                      </div>
                      <Dialog open={isCreateLocationOpen} onOpenChange={setIsCreateLocationOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Location
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New Location</DialogTitle>
                            <DialogDescription>
                              Add a new storage location to {selectedWarehouse.name}.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleCreateLocation}>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="location-code">Location Code</Label>
                                <Input id="location-code" name="location_code" placeholder="A-1-001" required />
                              </div>
                              <div>
                                <Label htmlFor="location-name">Location Name</Label>
                                <Input id="location-name" name="name" placeholder="Storage Bin A-1-001" required />
                              </div>
                              <div>
                                <Label htmlFor="location-type">Type</Label>
                                <Select name="type" defaultValue="bin">
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="bin">Bin</SelectItem>
                                    <SelectItem value="rack">Rack</SelectItem>
                                    <SelectItem value="shelf">Shelf</SelectItem>
                                    <SelectItem value="floor">Floor Space</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="capacity">Capacity (optional)</Label>
                                <Input id="capacity" name="capacity" type="number" placeholder="100" />
                              </div>
                            </div>
                            <DialogFooter className="mt-6">
                              <Button type="button" variant="outline" onClick={() => setIsCreateLocationOpen(false)}>
                                Cancel
                              </Button>
                              <Button type="submit" disabled={createLocationMutation.isPending}>
                                {createLocationMutation.isPending ? 'Creating...' : 'Create Location'}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {locationsLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
                        ))}
                      </div>
                    ) : locations.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No locations configured</p>
                        <p className="text-sm">Add storage locations to organize your inventory</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {locations.map((location) => (
                          <div key={location.id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h3 className="font-medium">{location.name}</h3>
                                <p className="text-xs text-muted-foreground">{location.location_code}</p>
                              </div>
                              <Badge variant="outline">{location.location_type || 'bin'}</Badge>
                            </div>
                            {location.capacity_units && (
                              <p className="text-sm text-muted-foreground">
                                Capacity: {location.capacity_units} units
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tracking">
                <ArticleTrackingView 
                  warehouseId={selectedWarehouse.id} 
                  warehouseName={selectedWarehouse.name}
                />
              </TabsContent>

              <TabsContent value="inventory">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Inventory Overview
                    </CardTitle>
                    <CardDescription>
                      Current inventory levels and movements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Inventory management coming soon</p>
                      <p className="text-sm">This feature will show detailed inventory data</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Analytics & Reports
                    </CardTitle>
                    <CardDescription>
                      Warehouse performance metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Analytics dashboard coming soon</p>
                      <p className="text-sm">This feature will show warehouse performance metrics</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Select a Warehouse</h3>
                  <p>Choose a warehouse from the list to view details, locations, and inventory</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Warehouse Dialog */}
      <Dialog open={isEditWarehouseOpen} onOpenChange={setIsEditWarehouseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Warehouse</DialogTitle>
            <DialogDescription>
              Update warehouse information.
            </DialogDescription>
          </DialogHeader>
          {editingWarehouse && (
            <form onSubmit={handleEditWarehouse}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Warehouse Name</Label>
                  <Input 
                    id="edit-name" 
                    name="name" 
                    defaultValue={editingWarehouse.name}
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="edit-address">Address</Label>
                  <Input 
                    id="edit-address" 
                    name="address" 
                    defaultValue={editingWarehouse.address || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-city">City</Label>
                  <Input 
                    id="edit-city" 
                    name="city" 
                    defaultValue={editingWarehouse.city || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select name="status" defaultValue={editingWarehouse.status || 'active'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditWarehouseOpen(false);
                    setEditingWarehouse(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateWarehouseMutation.isPending}>
                  {updateWarehouseMutation.isPending ? 'Updating...' : 'Update Warehouse'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 
