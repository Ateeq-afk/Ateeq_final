import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Building2, 
  Package, 
  ArrowRight, 
  Calendar, 
  Truck, 
  User, 
  Search, 
  Plus, 
  Trash, 
  Loader2, 
  ArrowLeft 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBranches } from '@/hooks/useBranches';
import { useArticles } from '@/hooks/useArticles';
import { useBookings } from '@/hooks/useBookings';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { motion } from 'framer-motion';

const transferSchema = z.object({
  fromBranchId: z.string().min(1, 'Source branch is required'),
  toBranchId: z.string().min(1, 'Destination branch is required'),
  transferDate: z.string().min(1, 'Transit date is required'),
  transferType: z.enum(['stock', 'equipment', 'other']),
  vehicleType: z.enum(['own', 'hired', 'attached']),
  vehicleNumber: z.string().min(1, 'Vehicle number is required'),
  driverName: z.string().min(1, 'Driver name is required'),
  driverMobile: z.string().min(10, 'Valid mobile number required'),
  remarks: z.string().optional(),
  items: z.array(
    z.object({
      articleId: z.string().min(1, 'Article is required'),
      quantity: z.number().min(1, 'Quantity must be at least 1'),
      description: z.string().optional()
    })
  ).min(1, 'At least one item is required')
});

type FormValues = z.infer<typeof transferSchema>;

export default function BranchTransferForm() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [articleSearch, setArticleSearch] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  
  const { branches, loading: branchesLoading } = useBranches();
  const { articles, loading: articlesLoading } = useArticles(selectedBranchId);
  const { createBooking } = useBookings();
  const { showSuccess, showError } = useNotificationSystem();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    control
  } = useForm<FormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      transferDate: new Date().toISOString().split('T')[0],
      transferType: 'stock',
      vehicleType: 'own',
      items: [{ articleId: '', quantity: 1, description: '' }]
    }
  });
  
  // Set the first branch as the default when branches are loaded
  useEffect(() => {
    if (branches.length > 0 && !watch('fromBranchId')) {
      setValue('fromBranchId', branches[0].id);
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, setValue, watch]);
  
  const watchFromBranch = watch('fromBranchId');
  const watchItems = watch('items');
  
  // Update selectedBranchId when fromBranchId changes
  useEffect(() => {
    if (watchFromBranch) {
      setSelectedBranchId(watchFromBranch);
    }
  }, [watchFromBranch]);
  
  // Filter branches for destination (exclude source branch)
  const destinationBranches = branches.filter(branch => branch.id !== watchFromBranch);
  
  // Filter articles based on search
  const filteredArticles = React.useMemo(() => {
    return articles.filter(article => 
      article.name.toLowerCase().includes(articleSearch.toLowerCase()) ||
      (article.description && article.description.toLowerCase().includes(articleSearch.toLowerCase()))
    );
  }, [articles, articleSearch]);
  
  const addItem = () => {
    setValue('items', [...watchItems, { articleId: '', quantity: 1, description: '' }]);
  };
  
  const removeItem = (index: number) => {
    if (watchItems.length > 1) {
      setValue('items', watchItems.filter((_, i) => i !== index));
    }
  };
  
  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...watchItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setValue('items', updatedItems);
  };
  
  const nextStep = () => {
    setStep(prev => prev + 1);
  };
  
  const prevStep = () => {
    setStep(prev => prev - 1);
  };
  
  const onSubmit = async (data: FormValues) => {
    try {
      setSubmitting(true);
      
      // In a real app, this would create a branch transfer record
      // For demo purposes, we'll simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Branch transfer data:', data);
      
      setSuccess(true);
      showSuccess('Transfer Created', 'Branch transfer has been created successfully');
      
      // Reset form after success
      setTimeout(() => {
        setSuccess(false);
        setStep(1);
        setValue('items', [{ articleId: '', quantity: 1, description: '' }]);
      }, 3000);
    } catch (err) {
      console.error('Failed to create transfer:', err);
      showError('Transfer Failed', 'Failed to create branch transfer');
    } finally {
      setSubmitting(false);
    }
  };
  
  const isLoading = branchesLoading || articlesLoading;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }
  
  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center"
      >
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Transfer Created Successfully</h2>
        <p className="text-gray-600 mb-8">
          Your branch transfer has been created and is now being processed.
        </p>
        <Button onClick={() => setSuccess(false)}>
          Create Another Transfer
        </Button>
      </motion.div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Branch Transfer</h2>
          <p className="text-gray-600 mt-1">
            Transfer stock or equipment between branches
          </p>
        </div>
      </div>
      
      {/* Progress Steps */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1 flex items-center">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className={`flex-1 h-1 ${
              step > 1 ? 'bg-blue-600' : 'bg-gray-200'
            }`}></div>
          </div>
          <div className="flex-1 flex items-center">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <div className={`flex-1 h-1 ${
              step > 2 ? 'bg-blue-600' : 'bg-gray-200'
            }`}></div>
          </div>
          <div className="flex-1 flex items-center">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
              step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
          </div>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Branch Details</span>
          <span>Transfer Items</span>
          <span>Review & Submit</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Branch Details */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-6">Branch & Transport Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>From Branch</Label>
                <Select
                  value={watchFromBranch}
                  onValueChange={(value) => setValue('fromBranchId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name} - {branch.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.fromBranchId && (
                  <p className="text-sm text-red-500 mt-1">{errors.fromBranchId.message}</p>
                )}
              </div>
              
              <div>
                <Label>To Branch</Label>
                <Select
                  value={watch('toBranchId')}
                  onValueChange={(value) => setValue('toBranchId', value)}
                  disabled={!watchFromBranch}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinationBranches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name} - {branch.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.toBranchId && (
                  <p className="text-sm text-red-500 mt-1">{errors.toBranchId.message}</p>
                )}
              </div>
              
              <div>
                <Label>Transfer Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="date"
                    {...register('transferDate')}
                    className="pl-10"
                  />
                </div>
                {errors.transferDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.transferDate.message}</p>
                )}
              </div>
              
              <div>
                <Label>Transfer Type</Label>
                <Select
                  value={watch('transferType')}
                  onValueChange={(value: 'stock' | 'equipment' | 'other') => setValue('transferType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select transfer type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock">Stock Transfer</SelectItem>
                    <SelectItem value="equipment">Equipment Transfer</SelectItem>
                    <SelectItem value="other">Other Transfer</SelectItem>
                  </SelectContent>
                </Select>
                {errors.transferType && (
                  <p className="text-sm text-red-500 mt-1">{errors.transferType.message}</p>
                )}
              </div>
              
              <div>
                <Label>Vehicle Type</Label>
                <Select
                  value={watch('vehicleType')}
                  onValueChange={(value: 'own' | 'hired' | 'attached') => setValue('vehicleType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="own">Own Vehicle</SelectItem>
                    <SelectItem value="hired">Hired Vehicle</SelectItem>
                    <SelectItem value="attached">Attached Vehicle</SelectItem>
                  </SelectContent>
                </Select>
                {errors.vehicleType && (
                  <p className="text-sm text-red-500 mt-1">{errors.vehicleType.message}</p>
                )}
              </div>
              
              <div>
                <Label>Vehicle Number</Label>
                <div className="relative">
                  <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    {...register('vehicleNumber')}
                    placeholder="Enter vehicle number"
                    className="pl-10"
                  />
                </div>
                {errors.vehicleNumber && (
                  <p className="text-sm text-red-500 mt-1">{errors.vehicleNumber.message}</p>
                )}
              </div>
              
              <div>
                <Label>Driver Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    {...register('driverName')}
                    placeholder="Enter driver name"
                    className="pl-10"
                  />
                </div>
                {errors.driverName && (
                  <p className="text-sm text-red-500 mt-1">{errors.driverName.message}</p>
                )}
              </div>
              
              <div>
                <Label>Driver Mobile</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    {...register('driverMobile')}
                    placeholder="Enter driver mobile"
                    className="pl-10"
                  />
                </div>
                {errors.driverMobile && (
                  <p className="text-sm text-red-500 mt-1">{errors.driverMobile.message}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <Label>Remarks (Optional)</Label>
                <Input
                  {...register('remarks')}
                  placeholder="Enter any additional remarks"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button type="button" onClick={nextStep}>
                Next: Add Items
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
        
        {/* Step 2: Transfer Items */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-6">Transfer Items</h3>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    className="pl-10"
                    placeholder="Search articles..."
                    value={articleSearch}
                    onChange={(e) => setArticleSearch(e.target.value)}
                  />
                </div>
                <Button 
                  type="button" 
                  onClick={addItem}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </div>
              
              <div className="space-y-4">
                {watchItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <Label>Article</Label>
                          <Select
                            value={item.articleId}
                            onValueChange={(value) => updateItem(index, 'articleId', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select article" />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredArticles.map((article) => (
                                <SelectItem key={article.id} value={article.id}>
                                  {article.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.items?.[index]?.articleId && (
                            <p className="text-sm text-red-500 mt-1">
                              {errors.items[index]?.articleId?.message}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            placeholder="Qty"
                          />
                          {errors.items?.[index]?.quantity && (
                            <p className="text-sm text-red-500 mt-1">
                              {errors.items[index]?.quantity?.message}
                            </p>
                          )}
                        </div>
                        
                        <div className="md:col-span-3">
                          <Label>Description (Optional)</Label>
                          <Input
                            value={item.description || ''}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            placeholder="Enter description or notes"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={watchItems.length === 1}
                      className="h-8 w-8 text-red-500"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              {errors.items && !Array.isArray(errors.items) && (
                <p className="text-sm text-red-500 mt-4">{errors.items.message}</p>
              )}
            </div>
            
            <div className="flex justify-between mt-6">
              <Button type="button" variant="outline" onClick={prevStep}>
                Back
              </Button>
              <Button type="button" onClick={nextStep}>
                Next: Review
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
        
        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-6">Review & Submit</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Branch Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">From Branch:</span>
                      <span className="font-medium">
                        {branches.find(b => b.id === watchFromBranch)?.name || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">To Branch:</span>
                      <span className="font-medium">
                        {branches.find(b => b.id === watch('toBranchId'))?.name || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transfer Date:</span>
                      <span className="font-medium">{watch('transferDate')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transfer Type:</span>
                      <span className="font-medium capitalize">{watch('transferType')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Transport Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vehicle Type:</span>
                      <span className="font-medium capitalize">{watch('vehicleType')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vehicle Number:</span>
                      <span className="font-medium">{watch('vehicleNumber')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Driver:</span>
                      <span className="font-medium">{watch('driverName')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Driver Mobile:</span>
                      <span className="font-medium">{watch('driverMobile')}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Transfer Items</h4>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Article</th>
                        <th className="text-left text-sm font-medium text-gray-600 px-4 py-3">Description</th>
                        <th className="text-right text-sm font-medium text-gray-600 px-4 py-3">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {watchItems.map((item, index) => {
                        const article = articles.find(a => a.id === item.articleId);
                        return (
                          <tr key={index}>
                            <td className="px-4 py-3 font-medium">{article?.name || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{item.description || '-'}</td>
                            <td className="px-4 py-3 text-right font-medium">{item.quantity}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {watch('remarks') && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Remarks</h4>
                  <p className="text-gray-600">{watch('remarks')}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-between mt-6">
              <Button type="button" variant="outline" onClick={prevStep}>
                Back
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Submit Transfer'
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </form>
    </div>
  );
}