import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArticleSelect } from '@/components/articles/ArticleSelect';
import { ratesService, RateSlab } from '@/services/rates';
import { toast } from 'sonner';

interface RateSlabsManagerProps {
  contractId: string;
  isEditable?: boolean;
}

type EditingRateSlab = Omit<RateSlab, 'id' | 'rate_contract_id' | 'created_at' | 'updated_at'>;

export function RateSlabsManager({ contractId, isEditable = true }: RateSlabsManagerProps) {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSlabId, setEditingSlabId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EditingRateSlab>({
    from_location: '',
    to_location: '',
    article_id: undefined,
    article_category: undefined,
    weight_from: 0,
    weight_to: 0,
    rate_per_kg: undefined,
    rate_per_unit: undefined,
    minimum_charge: 0,
    charge_basis: 'weight',
    is_active: true,
  });

  const { data: slabs, isLoading } = useQuery({
    queryKey: ['rate-slabs', contractId],
    queryFn: async () => {
      const response = await ratesService.getContractSlabs(contractId);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });

  const createSlabsMutation = useMutation({
    mutationFn: async (slabs: EditingRateSlab[]) => {
      const response = await ratesService.createSlabs(contractId, slabs);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-slabs', contractId] });
      toast.success('Rate slab added successfully');
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add rate slab');
    },
  });

  const updateSlabMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RateSlab> }) => {
      const response = await ratesService.updateSlab(id, data);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-slabs', contractId] });
      toast.success('Rate slab updated successfully');
      setEditingSlabId(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update rate slab');
    },
  });

  const deleteSlabMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await ratesService.deleteSlab(id);
      if (!response.success) throw new Error(response.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-slabs', contractId] });
      toast.success('Rate slab deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete rate slab');
    },
  });

  const resetForm = () => {
    setFormData({
      from_location: '',
      to_location: '',
      article_id: undefined,
      article_category: undefined,
      weight_from: 0,
      weight_to: 0,
      rate_per_kg: undefined,
      rate_per_unit: undefined,
      minimum_charge: 0,
      charge_basis: 'weight',
      is_active: true,
    });
  };

  const handleEdit = (slab: RateSlab) => {
    setEditingSlabId(slab.id);
    setFormData({
      from_location: slab.from_location,
      to_location: slab.to_location,
      article_id: slab.article_id,
      article_category: slab.article_category,
      weight_from: slab.weight_from,
      weight_to: slab.weight_to,
      rate_per_kg: slab.rate_per_kg,
      rate_per_unit: slab.rate_per_unit,
      minimum_charge: slab.minimum_charge,
      charge_basis: slab.charge_basis,
      is_active: slab.is_active,
    });
  };

  const handleSave = () => {
    if (editingSlabId) {
      updateSlabMutation.mutate({ id: editingSlabId, data: formData });
    } else {
      createSlabsMutation.mutate([formData]);
    }
  };

  const handleCancel = () => {
    setEditingSlabId(null);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const groupedSlabs = slabs?.reduce((acc, slab) => {
    const key = `${slab.from_location}-${slab.to_location}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(slab);
    return acc;
  }, {} as Record<string, RateSlab[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Rate Slabs</CardTitle>
            <CardDescription>
              Define weight-based pricing for different routes and articles
            </CardDescription>
          </div>
          {isEditable && (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Rate Slab
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading rate slabs...</div>
        ) : !slabs || slabs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No rate slabs defined yet
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSlabs || {}).map(([route, routeSlabs]) => {
              const [from, to] = route.split('-');
              return (
                <div key={route} className="space-y-2">
                  <h3 className="font-semibold text-lg">
                    {from} → {to}
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Article</TableHead>
                        <TableHead>Weight Range (kg)</TableHead>
                        <TableHead>Rate/kg</TableHead>
                        <TableHead>Rate/unit</TableHead>
                        <TableHead>Min Charge</TableHead>
                        <TableHead>Charge Basis</TableHead>
                        <TableHead>Status</TableHead>
                        {isEditable && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {routeSlabs.map((slab) => (
                        <TableRow key={slab.id}>
                          {editingSlabId === slab.id ? (
                            <>
                              <TableCell colSpan={8}>
                                <div className="grid grid-cols-4 gap-4 p-2">
                                  <div>
                                    <Label>Article</Label>
                                    <ArticleSelect
                                      value={formData.article_id || ''}
                                      onChange={(value) => setFormData({ ...formData, article_id: value })}
                                    />
                                  </div>
                                  <div>
                                    <Label>Weight From</Label>
                                    <Input
                                      type="number"
                                      value={formData.weight_from}
                                      onChange={(e) => setFormData({ ...formData, weight_from: parseFloat(e.target.value) })}
                                    />
                                  </div>
                                  <div>
                                    <Label>Weight To</Label>
                                    <Input
                                      type="number"
                                      value={formData.weight_to}
                                      onChange={(e) => setFormData({ ...formData, weight_to: parseFloat(e.target.value) })}
                                    />
                                  </div>
                                  <div>
                                    <Label>Charge Basis</Label>
                                    <Select
                                      value={formData.charge_basis}
                                      onValueChange={(value: any) => setFormData({ ...formData, charge_basis: value })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="weight">Per Weight</SelectItem>
                                        <SelectItem value="unit">Per Unit</SelectItem>
                                        <SelectItem value="fixed">Fixed</SelectItem>
                                        <SelectItem value="whichever_higher">Whichever Higher</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>Rate per kg</Label>
                                    <Input
                                      type="number"
                                      value={formData.rate_per_kg || ''}
                                      onChange={(e) => setFormData({ ...formData, rate_per_kg: parseFloat(e.target.value) || undefined })}
                                    />
                                  </div>
                                  <div>
                                    <Label>Rate per unit</Label>
                                    <Input
                                      type="number"
                                      value={formData.rate_per_unit || ''}
                                      onChange={(e) => setFormData({ ...formData, rate_per_unit: parseFloat(e.target.value) || undefined })}
                                    />
                                  </div>
                                  <div>
                                    <Label>Minimum Charge</Label>
                                    <Input
                                      type="number"
                                      value={formData.minimum_charge || ''}
                                      onChange={(e) => setFormData({ ...formData, minimum_charge: parseFloat(e.target.value) || 0 })}
                                    />
                                  </div>
                                  <div className="flex items-end gap-2">
                                    <Button size="sm" onClick={handleSave}>
                                      <Save className="w-4 h-4 mr-1" />
                                      Save
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={handleCancel}>
                                      <X className="w-4 h-4 mr-1" />
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell>
                                {slab.article ? (
                                  <div>
                                    <div className="font-medium">{slab.article.name}</div>
                                    {slab.article.hsn_code && (
                                      <div className="text-sm text-muted-foreground">
                                        HSN: {slab.article.hsn_code}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">All Articles</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {slab.weight_from} - {slab.weight_to}
                              </TableCell>
                              <TableCell>
                                {slab.rate_per_kg ? `₹${slab.rate_per_kg}` : '-'}
                              </TableCell>
                              <TableCell>
                                {slab.rate_per_unit ? `₹${slab.rate_per_unit}` : '-'}
                              </TableCell>
                              <TableCell>
                                {slab.minimum_charge ? `₹${slab.minimum_charge}` : '-'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {slab.charge_basis.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={slab.is_active ? 'success' : 'secondary'}>
                                  {slab.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              {isEditable && (
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEdit(slab)}
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => deleteSlabMutation.mutate(slab.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              )}
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Rate Slab</DialogTitle>
            <DialogDescription>
              Define pricing for a specific route and weight range
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label>From Location</Label>
              <Input
                value={formData.from_location}
                onChange={(e) => setFormData({ ...formData, from_location: e.target.value })}
                placeholder="e.g., Mumbai"
              />
            </div>
            <div>
              <Label>To Location</Label>
              <Input
                value={formData.to_location}
                onChange={(e) => setFormData({ ...formData, to_location: e.target.value })}
                placeholder="e.g., Delhi"
              />
            </div>
            <div>
              <Label>Article (Optional)</Label>
              <ArticleSelect
                value={formData.article_id || ''}
                onChange={(value) => setFormData({ ...formData, article_id: value })}
              />
            </div>
            <div>
              <Label>Article Category (Optional)</Label>
              <Input
                value={formData.article_category || ''}
                onChange={(e) => setFormData({ ...formData, article_category: e.target.value })}
                placeholder="e.g., Electronics"
              />
            </div>
            <div>
              <Label>Weight From (kg)</Label>
              <Input
                type="number"
                value={formData.weight_from}
                onChange={(e) => setFormData({ ...formData, weight_from: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <Label>Weight To (kg)</Label>
              <Input
                type="number"
                value={formData.weight_to}
                onChange={(e) => setFormData({ ...formData, weight_to: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <Label>Charge Basis</Label>
              <Select
                value={formData.charge_basis}
                onValueChange={(value: any) => setFormData({ ...formData, charge_basis: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight">Per Weight</SelectItem>
                  <SelectItem value="unit">Per Unit</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="whichever_higher">Whichever Higher</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Minimum Charge</Label>
              <Input
                type="number"
                value={formData.minimum_charge || ''}
                onChange={(e) => setFormData({ ...formData, minimum_charge: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Rate per kg</Label>
              <Input
                type="number"
                value={formData.rate_per_kg || ''}
                onChange={(e) => setFormData({ ...formData, rate_per_kg: parseFloat(e.target.value) || undefined })}
                disabled={formData.charge_basis === 'unit' || formData.charge_basis === 'fixed'}
              />
            </div>
            <div>
              <Label>Rate per unit</Label>
              <Input
                type="number"
                value={formData.rate_per_unit || ''}
                onChange={(e) => setFormData({ ...formData, rate_per_unit: parseFloat(e.target.value) || undefined })}
                disabled={formData.charge_basis === 'weight'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Add Rate Slab
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}