import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Package,
  ArrowLeft,
  IndianRupee,
  Loader2,
  Save,
  AlertCircle,
  Info,
  Hash,
  Percent,
  Box,
  Shield,
  CheckCircle2,
  Calculator,
  Eye,
  Plus,
  X,
  HelpCircle,
  TrendingUp,
  Clock,
  Image as ImageIcon,
  Wand2,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { useBranches } from '@/hooks/useBranches';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced validation schema
const formSchema = z.object({
  name: z.string()
    .min(1, 'Article name is required')
    .max(100, 'Name must be less than 100 characters')
    .refine(val => val.trim().length > 0, 'Name cannot be empty'),
  
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  
  base_rate: z.number()
    .min(0, 'Base rate must be positive')
    .max(999999.99, 'Base rate must be less than 1,000,000')
    .refine(val => !isNaN(val), 'Must be a valid number'),
  
  hsn_code: z.string()
    .regex(/^\d{4,8}$/, 'HSN code must be 4-8 digits')
    .or(z.string().length(0))
    .optional(),
  
  tax_rate: z.number()
    .min(0, 'Tax rate must be positive')
    .max(100, 'Tax rate cannot exceed 100%')
    .optional(),
  
  unit_of_measure: z.string()
    .min(1, 'Unit of measure is required')
    .optional(),
  
  min_quantity: z.number()
    .min(1, 'Minimum quantity must be at least 1')
    .max(9999, 'Minimum quantity must be less than 10,000')
    .int('Must be a whole number')
    .optional(),
  
  is_fragile: z.boolean().optional(),
  requires_special_handling: z.boolean().optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  
  // New fields for enhanced form
  branch_id: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  image_url: z.string().url().or(z.string().length(0)).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<FormValues> & { id?: string; created_at?: string; updated_at?: string };
}

// Common HSN codes for suggestions
const COMMON_HSN_CODES = [
  { code: '6302', description: 'Bed linen, table linen, toilet linen' },
  { code: '6309', description: 'Worn clothing and other worn articles' },
  { code: '6305', description: 'Sacks and bags for packing goods' },
  { code: '5208', description: 'Woven fabrics of cotton' },
  { code: '5407', description: 'Woven fabrics of synthetic filament yarn' },
  { code: '4819', description: 'Cartons, boxes, cases of paper' },
  { code: '3923', description: 'Articles for transport/packing of goods' },
  { code: '7310', description: 'Tanks, casks, drums, cans of iron/steel' },
];

// Unit suggestions
const UNIT_SUGGESTIONS = [
  { value: 'kg', label: 'Kilogram (kg)', icon: '⚖️' },
  { value: 'pcs', label: 'Pieces (pcs)', icon: '📦' },
  { value: 'box', label: 'Box', icon: '📦' },
  { value: 'bundle', label: 'Bundle', icon: '🎁' },
  { value: 'roll', label: 'Roll', icon: '🧻' },
  { value: 'meter', label: 'Meter (m)', icon: '📏' },
  { value: 'liter', label: 'Liter (L)', icon: '💧' },
  { value: 'ton', label: 'Ton', icon: '🏗️' },
  { value: 'dozen', label: 'Dozen', icon: '🥚' },
  { value: 'set', label: 'Set', icon: '🎯' },
];

// Category suggestions
const CATEGORIES = [
  'Textiles', 'Electronics', 'Food & Beverages', 'Hardware',
  'Chemicals', 'Machinery', 'Furniture', 'Stationery',
  'Medical Supplies', 'Construction Materials', 'Other'
];

export default function ArticleForm({ onSubmit, onCancel, initialData }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [formProgress, setFormProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [hsnOpen, setHsnOpen] = useState(false);
  const [showAiAssist, setShowAiAssist] = useState(false);

  const { showSuccess, showError, showInfo } = useNotificationSystem();
  const { branches } = useBranches();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isValid, isDirty },
    reset,
    getValues,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...initialData,
      base_rate: initialData?.base_rate ?? 0,
      tax_rate: initialData?.tax_rate ?? 0,
      min_quantity: initialData?.min_quantity ?? 1,
      is_fragile: initialData?.is_fragile ?? false,
      requires_special_handling: initialData?.requires_special_handling ?? false,
      notes: initialData?.notes ?? '',
      unit_of_measure: initialData?.unit_of_measure ?? '',
      branch_id: initialData?.branch_id ?? branches[0]?.id,
      category: initialData?.category ?? '',
      tags: initialData?.tags ?? [],
      image_url: initialData?.image_url ?? '',
    },
    mode: 'onChange',
  });

  const watchedFields = watch();

  // Calculate form completion progress
  useEffect(() => {
    const fields = [
      'name', 'description', 'base_rate', 'hsn_code',
      'tax_rate', 'unit_of_measure', 'min_quantity', 'category'
    ];
    const filledFields = fields.filter(field => {
      const value = (watchedFields as any)[field];
      return value !== undefined && value !== '' && value !== 0;
    });
    setFormProgress((filledFields.length / fields.length) * 100);
  }, [watchedFields]);

  // Auto-save functionality
  const autoSave = useCallback(() => {
    if (!autoSaveEnabled || !isDirty) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout
    autoSaveTimeoutRef.current = setTimeout(() => {
      const data = getValues();
      // Save to localStorage
      localStorage.setItem('article-form-draft', JSON.stringify(data));
      setLastSaved(new Date());
      showInfo('Auto-saved', 'Your changes have been saved locally');
    }, 2000);
  }, [autoSaveEnabled, isDirty, getValues, showInfo]);

  // Watch for changes and trigger auto-save
  useEffect(() => {
    autoSave();
  }, [watchedFields, autoSave]);

  // Load draft on mount
  useEffect(() => {
    if (!initialData) {
      const draft = localStorage.getItem('article-form-draft');
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          reset(parsed);
          showInfo('Draft Loaded', 'Previous unsaved changes have been restored');
        } catch (error) {
          console.error('Failed to load draft:', error);
        }
      }
    }
  }, [initialData, reset, showInfo]);

  // Calculate pricing preview
  const pricingPreview = React.useMemo(() => {
    const baseRate = watchedFields.base_rate || 0;
    const taxRate = watchedFields.tax_rate || 0;
    const taxAmount = (baseRate * taxRate) / 100;
    const totalPrice = baseRate + taxAmount;
    
    return {
      baseRate,
      taxRate,
      taxAmount,
      totalPrice,
      margin: baseRate > 0 ? ((totalPrice - baseRate) / baseRate) * 100 : 0,
    };
  }, [watchedFields.base_rate, watchedFields.tax_rate]);

  // Handle tag management
  const addTag = useCallback(() => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      setValue('tags', newTags);
      setTagInput('');
    }
  }, [tagInput, tags, setValue]);

  const removeTag = useCallback((tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    setValue('tags', newTags);
  }, [tags, setValue]);

  // AI-powered description generator (mock)
  const generateDescription = useCallback(() => {
    const name = watchedFields.name;
    if (!name) {
      showError('Name Required', 'Please enter a name first');
      return;
    }
    
    setShowAiAssist(true);
    // Simulate AI generation
    setTimeout(() => {
      const category = watchedFields.category || 'product';
      const description = `High-quality ${name.toLowerCase()} suitable for ${category.toLowerCase()} applications. ` +
        `This premium item ensures reliability and durability for all your needs.`;
      setValue('description', description);
      setShowAiAssist(false);
      showSuccess('Description Generated', 'AI has created a description for you');
    }, 1500);
  }, [watchedFields.name, watchedFields.category, setValue, showError, showSuccess]);

  // Handle form submission
  const submitForm = async (data: FormValues) => {
    setSubmitting(true);
    try {
      await onSubmit(data);
      // Clear draft on successful submission
      localStorage.removeItem('article-form-draft');
    } catch (error) {
      console.error('Form submission error:', error);
      showError('Submission Failed', 'Please check your data and try again');
    } finally {
      setSubmitting(false);
    }
  };

  // Clear form
  const clearForm = useCallback(() => {
    reset({
      name: '',
      description: '',
      base_rate: 0,
      hsn_code: '',
      tax_rate: 0,
      unit_of_measure: '',
      min_quantity: 1,
      is_fragile: false,
      requires_special_handling: false,
      notes: '',
      branch_id: branches[0]?.id,
      category: '',
      tags: [],
      image_url: '',
    });
    setTags([]);
    localStorage.removeItem('article-form-draft');
    showInfo('Form Cleared', 'All fields have been reset');
  }, [reset, branches, showInfo]);

  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit(submitForm)} className="max-w-5xl mx-auto">
        <Card className="shadow-xl">
          {/* Header */}
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onCancel}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div>
                  <CardTitle className="text-2xl">
                    {initialData ? 'Edit Article' : 'Create New Article'}
                  </CardTitle>
                  <CardDescription>
                    {initialData ? 'Update article information' : 'Add a new article to your catalog'}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* Form Progress */}
                <div className="flex items-center gap-2">
                  <Progress value={formProgress} className="w-24 h-2" />
                  <span className="text-sm text-gray-600">{Math.round(formProgress)}%</span>
                </div>
                
                {/* Auto-save indicator */}
                {autoSaveEnabled && lastSaved && (
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>Saved</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Last saved: {lastSaved.toLocaleTimeString()}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Auto-save toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Save className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-sm">Auto-save</p>
                  <p className="text-xs text-gray-500">Automatically save your progress</p>
                </div>
              </div>
              <Switch
                checked={autoSaveEnabled}
                onCheckedChange={setAutoSaveEnabled}
              />
            </div>

            {/* Main Form Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="pricing" className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4" />
                  Pricing
                </TabsTrigger>
                <TabsTrigger value="inventory" className="flex items-center gap-2">
                  <Box className="h-4 w-4" />
                  Inventory
                </TabsTrigger>
                <TabsTrigger value="advanced" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Advanced
                </TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Article Name */}
                  <div className="md:col-span-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      Article Name
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    </Label>
                    <div className="relative mt-1">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="name"
                        {...register('name')}
                        placeholder="Enter article name"
                        className="pl-10 text-lg"
                      />
                    </div>
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Controller
                      name="category"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Branch */}
                  <div>
                    <Label htmlFor="branch">Branch</Label>
                    <Controller
                      name="branch_id"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="branch">
                            <SelectValue placeholder="Select branch" />
                          </SelectTrigger>
                          <SelectContent>
                            {branches.map(branch => (
                              <SelectItem key={branch.id} value={branch.id}>
                                {branch.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <Label htmlFor="description" className="flex items-center justify-between">
                      Description
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={generateDescription}
                        disabled={showAiAssist}
                        className="flex items-center gap-1"
                      >
                        {showAiAssist ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Wand2 className="h-3 w-3" />
                        )}
                        AI Generate
                      </Button>
                    </Label>
                    <Textarea
                      id="description"
                      {...register('description')}
                      placeholder="Enter article description (optional)"
                      rows={4}
                      className="mt-1"
                    />
                    {errors.description && (
                      <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {watchedFields.description?.length || 0}/500 characters
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="md:col-span-2">
                    <Label>Tags</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        placeholder="Add tags..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addTag}
                        disabled={!tagInput.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {tags.map(tag => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {tag}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeTag(tag)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Image URL */}
                  <div className="md:col-span-2">
                    <Label htmlFor="image_url">Product Image URL</Label>
                    <div className="relative mt-1">
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="image_url"
                        {...register('image_url')}
                        placeholder="https://example.com/image.jpg"
                        className="pl-10"
                      />
                    </div>
                    {watchedFields.image_url && (
                      <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                        <img
                          src={watchedFields.image_url}
                          alt="Product preview"
                          className="max-h-32 rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Pricing Tab */}
              <TabsContent value="pricing" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Base Rate */}
                  <div>
                    <Label htmlFor="base_rate" className="flex items-center gap-2">
                      Base Rate (₹)
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    </Label>
                    <div className="relative mt-1">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="base_rate"
                        type="number"
                        step="0.01"
                        min="0"
                        {...register('base_rate', { valueAsNumber: true })}
                        placeholder="0.00"
                        className="pl-10"
                      />
                    </div>
                    {errors.base_rate && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.base_rate.message}
                      </p>
                    )}
                  </div>

                  {/* Tax Rate */}
                  <div>
                    <Label htmlFor="tax_rate" className="flex items-center gap-2">
                      Tax Rate (%)
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>GST or applicable tax percentage</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <div className="relative mt-1">
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="tax_rate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        {...register('tax_rate', { valueAsNumber: true })}
                        placeholder="0"
                        className="pl-10"
                      />
                    </div>
                    {errors.tax_rate && (
                      <p className="text-red-500 text-sm mt-1">{errors.tax_rate.message}</p>
                    )}
                  </div>

                  {/* HSN Code */}
                  <div>
                    <Label htmlFor="hsn_code" className="flex items-center gap-2">
                      HSN Code
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Harmonized System Nomenclature code for GST</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Popover open={hsnOpen} onOpenChange={setHsnOpen}>
                      <PopoverTrigger asChild>
                        <div className="relative mt-1">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            id="hsn_code"
                            {...register('hsn_code')}
                            placeholder="Enter HSN code"
                            className="pl-10"
                            onFocus={() => setHsnOpen(true)}
                          />
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <Command>
                          <CommandInput placeholder="Search HSN codes..." />
                          <CommandEmpty>No HSN code found.</CommandEmpty>
                          <CommandGroup>
                            {COMMON_HSN_CODES.map(hsn => (
                              <CommandItem
                                key={hsn.code}
                                onSelect={() => {
                                  setValue('hsn_code', hsn.code);
                                  setHsnOpen(false);
                                }}
                              >
                                <div>
                                  <p className="font-medium">{hsn.code}</p>
                                  <p className="text-xs text-gray-500">{hsn.description}</p>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {errors.hsn_code && (
                      <p className="text-red-500 text-sm mt-1">{errors.hsn_code.message}</p>
                    )}
                  </div>

                  {/* Pricing Preview */}
                  <Card className="md:col-span-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Pricing Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Base Rate</p>
                          <p className="text-lg font-semibold">
                            ₹{pricingPreview.baseRate.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Tax ({pricingPreview.taxRate}%)</p>
                          <p className="text-lg font-semibold">
                            ₹{pricingPreview.taxAmount.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Price</p>
                          <p className="text-lg font-semibold text-green-600">
                            ₹{pricingPreview.totalPrice.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Margin</p>
                          <p className="text-lg font-semibold flex items-center gap-1">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                            {pricingPreview.margin.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Inventory Tab */}
              <TabsContent value="inventory" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Unit of Measure */}
                  <div>
                    <Label htmlFor="unit_of_measure">Unit of Measure</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {UNIT_SUGGESTIONS.map(unit => (
                        <Button
                          key={unit.value}
                          type="button"
                          variant={watchedFields.unit_of_measure === unit.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setValue('unit_of_measure', unit.value)}
                          className="justify-start"
                        >
                          <span className="mr-2">{unit.icon}</span>
                          {unit.label}
                        </Button>
                      ))}
                    </div>
                    <Input
                      id="unit_of_measure"
                      {...register('unit_of_measure')}
                      placeholder="Or enter custom unit"
                      className="mt-2"
                    />
                  </div>

                  {/* Minimum Quantity */}
                  <div>
                    <Label htmlFor="min_quantity">Minimum Order Quantity</Label>
                    <div className="relative mt-1">
                      <Box className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="min_quantity"
                        type="number"
                        min="1"
                        step="1"
                        {...register('min_quantity', { valueAsNumber: true })}
                        placeholder="1"
                        className="pl-10"
                      />
                    </div>
                    {errors.min_quantity && (
                      <p className="text-red-500 text-sm mt-1">{errors.min_quantity.message}</p>
                    )}
                  </div>

                  {/* Special Handling */}
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Special Handling Requirements
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <p className="font-medium">Fragile Item</p>
                            <p className="text-sm text-gray-500">Requires careful handling during transport</p>
                          </div>
                        </div>
                        <Controller
                          name="is_fragile"
                          control={control}
                          render={({ field }) => (
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <Shield className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium">Special Handling</p>
                            <p className="text-sm text-gray-500">Requires specific storage or transport conditions</p>
                          </div>
                        </div>
                        <Controller
                          name="requires_special_handling"
                          control={control}
                          render={({ field }) => (
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Additional settings and notes for internal use
                  </AlertDescription>
                </Alert>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Internal Notes</Label>
                  <Textarea
                    id="notes"
                    {...register('notes')}
                    placeholder="Add any internal notes or special instructions..."
                    rows={6}
                    className="mt-1"
                  />
                  {errors.notes && (
                    <p className="text-red-500 text-sm mt-1">{errors.notes.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {watchedFields.notes?.length || 0}/1000 characters
                  </p>
                </div>

                {/* Metadata */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Article Metadata</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {initialData && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Article ID</span>
                          <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                            {initialData.id?.slice(0, 8)}...
                          </code>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Created</span>
                          <span className="text-sm">
                            {initialData.created_at ? new Date(initialData.created_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Last Updated</span>
                          <span className="text-sm">
                            {initialData.updated_at ? new Date(initialData.updated_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Error Summary */}
            {Object.keys(errors).length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">Please fix the following errors:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {Object.entries(errors).map(([field, error]) => (
                      <li key={field} className="text-sm">
                        <span className="font-medium capitalize">{field.replace(/_/g, ' ')}:</span> {error.message}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-lg border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={clearForm}
                  disabled={submitting}
                >
                  Clear Form
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !isValid}
                  className="min-w-[120px]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {initialData ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {initialData ? 'Update Article' : 'Create Article'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Preview Modal */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowPreview(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Article Preview</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPreview(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-2xl font-bold">{watchedFields.name || 'Untitled Article'}</h4>
                    <p className="text-gray-600 mt-1">{watchedFields.description || 'No description'}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {watchedFields.category && (
                      <Badge variant="secondary">{watchedFields.category}</Badge>
                    )}
                    {tags.map(tag => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Base Rate</p>
                      <p className="text-lg font-semibold">₹{pricingPreview.baseRate.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Price (incl. tax)</p>
                      <p className="text-lg font-semibold text-green-600">
                        ₹{pricingPreview.totalPrice.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Unit</p>
                      <p className="text-lg font-semibold">{watchedFields.unit_of_measure || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Min Order</p>
                      <p className="text-lg font-semibold">{watchedFields.min_quantity || 1}</p>
                    </div>
                  </div>
                  
                  {(watchedFields.is_fragile || watchedFields.requires_special_handling) && (
                    <>
                      <Separator />
                      <div className="flex gap-4">
                        {watchedFields.is_fragile && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Fragile
                          </Badge>
                        )}
                        {watchedFields.requires_special_handling && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            Special Handling
                          </Badge>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </TooltipProvider>
  );
}