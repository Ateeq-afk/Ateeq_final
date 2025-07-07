import { useState, useEffect, useCallback, useRef } from 'react';
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
  Sparkles,
  FileText,
  Zap,
  BarChart3,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  Target,
  Layers,
  Send,
  RefreshCw,
  Upload,
  Building2,
  Calendar,
} from 'lucide-react';

// Enterprise UI Components
import { Button, IconButton, ButtonGroup } from '@/components/ui/button-enterprise';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card-enterprise';
import { StatsCard, MiniStats } from '@/components/ui/stats-card';
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
import { cn } from '@/lib/utils';
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
  { code: '6302', description: 'Bed linen, table linen, toilet linen', category: 'Textiles' },
  { code: '6309', description: 'Worn clothing and other worn articles', category: 'Textiles' },
  { code: '6305', description: 'Sacks and bags for packing goods', category: 'Packaging' },
  { code: '5208', description: 'Woven fabrics of cotton', category: 'Textiles' },
  { code: '5407', description: 'Woven fabrics of synthetic filament yarn', category: 'Textiles' },
  { code: '4819', description: 'Cartons, boxes, cases of paper', category: 'Packaging' },
  { code: '3923', description: 'Articles for transport/packing of goods', category: 'Packaging' },
  { code: '7310', description: 'Tanks, casks, drums, cans of iron/steel', category: 'Industrial' },
];

// Unit suggestions with categories
const UNIT_SUGGESTIONS = [
  { value: 'kg', label: 'Kilogram', symbol: 'kg', category: 'Weight' },
  { value: 'pcs', label: 'Pieces', symbol: 'pcs', category: 'Count' },
  { value: 'box', label: 'Box', symbol: 'box', category: 'Container' },
  { value: 'bundle', label: 'Bundle', symbol: 'bdl', category: 'Container' },
  { value: 'roll', label: 'Roll', symbol: 'roll', category: 'Container' },
  { value: 'meter', label: 'Meter', symbol: 'm', category: 'Length' },
  { value: 'liter', label: 'Liter', symbol: 'L', category: 'Volume' },
  { value: 'ton', label: 'Ton', symbol: 't', category: 'Weight' },
  { value: 'dozen', label: 'Dozen', symbol: 'dz', category: 'Count' },
  { value: 'set', label: 'Set', symbol: 'set', category: 'Count' },
];

// Category suggestions with icons
const CATEGORIES = [
  { value: 'Textiles', icon: '🧵', color: 'bg-blue-100 text-blue-700' },
  { value: 'Electronics', icon: '📱', color: 'bg-purple-100 text-purple-700' },
  { value: 'Food & Beverages', icon: '🍽️', color: 'bg-green-100 text-green-700' },
  { value: 'Hardware', icon: '🔧', color: 'bg-gray-100 text-gray-700' },
  { value: 'Chemicals', icon: '🧪', color: 'bg-red-100 text-red-700' },
  { value: 'Machinery', icon: '⚙️', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'Furniture', icon: '🪑', color: 'bg-brown-100 text-brown-700' },
  { value: 'Stationery', icon: '✏️', color: 'bg-pink-100 text-pink-700' },
  { value: 'Medical Supplies', icon: '🏥', color: 'bg-teal-100 text-teal-700' },
  { value: 'Construction Materials', icon: '🏗️', color: 'bg-orange-100 text-orange-700' },
  { value: 'Other', icon: '📦', color: 'bg-neutral-100 text-neutral-700' },
];

export default function ArticleFormEnterprise({ onSubmit, onCancel, initialData }: Props) {
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
  const [unitCategory, setUnitCategory] = useState<string>('all');

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

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      const data = getValues();
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
    setTimeout(() => {
      const category = watchedFields.category || 'product';
      const description = `Premium quality ${name.toLowerCase()} designed for ${category.toLowerCase()} applications. ` +
        `This high-grade item ensures exceptional reliability, durability, and performance. ` +
        `Manufactured to meet industry standards with meticulous attention to detail.`;
      setValue('description', description);
      setShowAiAssist(false);
      showSuccess('Description Generated', 'AI has created a professional description');
    }, 1500);
  }, [watchedFields.name, watchedFields.category, setValue, showError, showSuccess]);

  // Smart HSN code suggestion
  const suggestHSNCode = useCallback(() => {
    const category = watchedFields.category;
    if (category) {
      const relevantCodes = COMMON_HSN_CODES.filter(hsn => 
        hsn.category.toLowerCase().includes(category.toLowerCase())
      );
      if (relevantCodes.length > 0) {
        setValue('hsn_code', relevantCodes[0].code);
        showInfo('HSN Suggested', `Suggested HSN code ${relevantCodes[0].code} based on category`);
      }
    }
  }, [watchedFields.category, setValue, showInfo]);

  // Handle form submission
  const submitForm = async (data: FormValues) => {
    setSubmitting(true);
    try {
      await onSubmit(data);
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

  // Filter units by category
  const filteredUnits = unitCategory === 'all' 
    ? UNIT_SUGGESTIONS 
    : UNIT_SUGGESTIONS.filter(unit => unit.category === unitCategory);

  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit(submitForm)} className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-950 dark:to-secondary-950 -mx-6 px-6 py-8 mb-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
                  <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl shadow-md">
                    <Package className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  {initialData ? 'Edit Article' : 'Create New Article'}
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                  {initialData ? 'Update article information and pricing' : 'Add a new article to your catalog'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Form Progress */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Progress</p>
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {Math.round(formProgress)}%
                  </p>
                </div>
                <div className="w-32">
                  <Progress value={formProgress} className="h-2" />
                </div>
              </div>
              
              {/* Auto-save indicator */}
              {autoSaveEnabled && lastSaved && (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-green-700 dark:text-green-300">
                    Saved {lastSaved.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats (for edit mode) */}
        {initialData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <MiniStats
              title="Current Price"
              value={`₹${initialData.base_rate?.toFixed(2)}`}
              icon={<DollarSign className="h-4 w-4 text-green-600" />}
            />
            <MiniStats
              title="Tax Rate"
              value={`${initialData.tax_rate || 0}%`}
              icon={<Percent className="h-4 w-4 text-blue-600" />}
            />
            <MiniStats
              title="Min Order"
              value={`${initialData.min_quantity || 1} ${initialData.unit_of_measure || 'units'}`}
              icon={<Box className="h-4 w-4 text-purple-600" />}
            />
            <MiniStats
              title="Created"
              value={initialData.created_at ? new Date(initialData.created_at).toLocaleDateString() : 'N/A'}
              icon={<Calendar className="h-4 w-4 text-neutral-600" />}
            />
          </div>
        )}

        <Card variant="elevated" className="shadow-xl">
          <CardContent className="p-6 space-y-6">
            {/* Auto-save toggle */}
            <Card variant="outlined" className="bg-neutral-50 dark:bg-neutral-900">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg">
                      <Save className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                    </div>
                    <div>
                      <p className="font-medium">Auto-save Enabled</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Your progress is automatically saved every few seconds
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={autoSaveEnabled}
                    onCheckedChange={setAutoSaveEnabled}
                  />
                </div>
              </CardContent>
            </Card>

            {/* AI Assistant Banner */}
            <Alert className="border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-950">
              <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <AlertDescription className="text-primary-700 dark:text-primary-300">
                <strong>AI Assistant Available:</strong> Use AI to generate descriptions, suggest HSN codes, and optimize pricing based on your input.
              </AlertDescription>
            </Alert>

            {/* Main Form Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid grid-cols-5 w-full">
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
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Article Name */}
                  <div className="md:col-span-2">
                    <Label htmlFor="name" className="flex items-center gap-2 text-base font-semibold">
                      Article Name
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    </Label>
                    <div className="relative mt-2">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                      <Input
                        id="name"
                        {...register('name')}
                        placeholder="Enter a descriptive article name"
                        className="pl-10 text-lg h-12"
                      />
                    </div>
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Category Selection */}
                  <div className="md:col-span-2">
                    <Label htmlFor="category" className="text-base font-semibold">Category</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                      {CATEGORIES.map(cat => (
                        <Button
                          key={cat.value}
                          type="button"
                          variant={watchedFields.category === cat.value ? 'default' : 'outline'}
                          onClick={() => {
                            setValue('category', cat.value);
                            suggestHSNCode();
                          }}
                          className={cn(
                            "justify-start h-auto py-3",
                            watchedFields.category === cat.value && "ring-2 ring-primary-500"
                          )}
                        >
                          <span className="text-xl mr-2">{cat.icon}</span>
                          <span className="font-medium">{cat.value}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Branch Selection */}
                  <div>
                    <Label htmlFor="branch" className="text-base font-semibold">Branch</Label>
                    <Controller
                      name="branch_id"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="branch" className="h-12 mt-2">
                            <SelectValue placeholder="Select branch" />
                          </SelectTrigger>
                          <SelectContent>
                            {branches.map(branch => (
                              <SelectItem key={branch.id} value={branch.id}>
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-neutral-500" />
                                  {branch.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* HSN Code */}
                  <div>
                    <Label htmlFor="hsn_code" className="flex items-center gap-2 text-base font-semibold">
                      HSN Code
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-neutral-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Harmonized System Nomenclature code for GST classification</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Popover open={hsnOpen} onOpenChange={setHsnOpen}>
                      <PopoverTrigger asChild>
                        <div className="relative mt-2">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                          <Input
                            id="hsn_code"
                            {...register('hsn_code')}
                            placeholder="Search or enter HSN code"
                            className="pl-10 h-12"
                            onFocus={() => setHsnOpen(true)}
                          />
                          {watchedFields.category && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 -translate-y-1/2"
                              onClick={suggestHSNCode}
                            >
                              <Lightbulb className="h-4 w-4 mr-1" />
                              Suggest
                            </Button>
                          )}
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
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
                                className="flex items-center justify-between"
                              >
                                <div>
                                  <p className="font-semibold">{hsn.code}</p>
                                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    {hsn.description}
                                  </p>
                                </div>
                                <Badge variant="outline">{hsn.category}</Badge>
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

                  {/* Description */}
                  <div className="md:col-span-2">
                    <Label htmlFor="description" className="flex items-center justify-between text-base font-semibold">
                      <span>Description</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateDescription}
                        disabled={showAiAssist}
                        leftIcon={showAiAssist ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                      >
                        AI Generate
                      </Button>
                    </Label>
                    <Textarea
                      id="description"
                      {...register('description')}
                      placeholder="Enter a detailed description of the article..."
                      rows={4}
                      className="mt-2 resize-none"
                    />
                    {errors.description && (
                      <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                    )}
                    <div className="flex justify-between mt-2">
                      <p className="text-xs text-neutral-500">
                        {watchedFields.description?.length || 0}/500 characters
                      </p>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          <Target className="h-3 w-3 mr-1" />
                          SEO Optimized
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          Professional Tone
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="md:col-span-2">
                    <Label className="text-base font-semibold">Tags</Label>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                      Add tags to improve searchability and categorization
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Type a tag and press Enter..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        className="flex-1"
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
                        <AnimatePresence>
                          {tags.map(tag => (
                            <motion.div
                              key={tag}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Badge
                                variant="secondary"
                                className="flex items-center gap-1 pl-3 pr-1 py-1"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => removeTag(tag)}
                                  className="ml-1 p-0.5 hover:bg-neutral-300 dark:hover:bg-neutral-700 rounded"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  {/* Image Upload */}
                  <div className="md:col-span-2">
                    <Label htmlFor="image_url" className="text-base font-semibold">Product Image</Label>
                    <div className="mt-2 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-6 text-center hover:border-primary-400 dark:hover:border-primary-600 transition-colors">
                      <Upload className="h-10 w-10 text-neutral-400 mx-auto mb-3" />
                      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Drop an image here or click to upload
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        PNG, JPG up to 10MB
                      </p>
                      <Input
                        id="image_url"
                        {...register('image_url')}
                        placeholder="Or paste image URL..."
                        className="mt-4"
                      />
                    </div>
                    {watchedFields.image_url && (
                      <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                        <img
                          src={watchedFields.image_url}
                          alt="Product preview"
                          className="max-h-48 rounded mx-auto"
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    {/* Base Rate */}
                    <div>
                      <Label htmlFor="base_rate" className="flex items-center gap-2 text-base font-semibold">
                        Base Rate (₹)
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      </Label>
                      <div className="relative mt-2">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                        <Input
                          id="base_rate"
                          type="number"
                          step="0.01"
                          min="0"
                          {...register('base_rate', { valueAsNumber: true })}
                          placeholder="0.00"
                          className="pl-10 h-12 text-lg font-semibold"
                        />
                      </div>
                      {errors.base_rate && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.base_rate.message}
                        </p>
                      )}
                      
                      {/* Price Suggestions */}
                      <div className="mt-3 p-3 bg-primary-50 dark:bg-primary-950 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                          <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                            AI Price Suggestions
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setValue('base_rate', 99)}
                            className="justify-center"
                          >
                            ₹99
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setValue('base_rate', 499)}
                            className="justify-center"
                          >
                            ₹499
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setValue('base_rate', 999)}
                            className="justify-center"
                          >
                            ₹999
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Tax Rate */}
                    <div>
                      <Label htmlFor="tax_rate" className="flex items-center gap-2 text-base font-semibold">
                        Tax Rate (%)
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-neutral-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>GST or applicable tax percentage</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <div className="relative mt-2">
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                        <Input
                          id="tax_rate"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          {...register('tax_rate', { valueAsNumber: true })}
                          placeholder="0"
                          className="pl-10 h-12"
                        />
                      </div>
                      {errors.tax_rate && (
                        <p className="text-red-500 text-sm mt-1">{errors.tax_rate.message}</p>
                      )}
                      
                      {/* Common Tax Rates */}
                      <div className="mt-3 flex gap-2">
                        <Badge 
                          variant="outline" 
                          className="cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          onClick={() => setValue('tax_rate', 5)}
                        >
                          5% GST
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className="cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          onClick={() => setValue('tax_rate', 12)}
                        >
                          12% GST
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className="cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          onClick={() => setValue('tax_rate', 18)}
                        >
                          18% GST
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className="cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          onClick={() => setValue('tax_rate', 28)}
                        >
                          28% GST
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Live Pricing Preview */}
                  <Card variant="elevated" className="h-fit">
                    <CardHeader>
                      <CardTitle size="sm" className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Live Pricing Calculator
                      </CardTitle>
                      <CardDescription>
                        See how your pricing looks in real-time
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-2">
                          <span className="text-neutral-600 dark:text-neutral-400">Base Rate</span>
                          <span className="font-semibold text-lg">
                            ₹{pricingPreview.baseRate.toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between py-2 border-t">
                          <span className="text-neutral-600 dark:text-neutral-400">
                            Tax ({pricingPreview.taxRate}%)
                          </span>
                          <span className="font-medium">
                            +₹{pricingPreview.taxAmount.toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between py-3 border-t border-b bg-primary-50 dark:bg-primary-950 -mx-4 px-4 rounded">
                          <span className="font-semibold text-primary-700 dark:text-primary-300">
                            Total Price
                          </span>
                          <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                            ₹{pricingPreview.totalPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Profit Margin Indicator */}
                      <div className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Profit Margin</span>
                          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                            {pricingPreview.margin.toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(pricingPreview.margin, 100)} 
                          className="h-2"
                        />
                      </div>
                      
                      {/* Pricing Insights */}
                      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                        <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <AlertDescription className="text-blue-700 dark:text-blue-300">
                          {pricingPreview.totalPrice > 1000 
                            ? 'Premium pricing strategy detected. Consider volume discounts.'
                            : 'Competitive pricing for mass market appeal.'}
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Inventory Tab */}
              <TabsContent value="inventory" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Unit of Measure */}
                  <div className="lg:col-span-2">
                    <Label htmlFor="unit_of_measure" className="text-base font-semibold">
                      Unit of Measure
                    </Label>
                    
                    {/* Unit Category Filter */}
                    <div className="flex gap-2 mt-2 mb-4">
                      <Badge 
                        variant={unitCategory === 'all' ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setUnitCategory('all')}
                      >
                        All Units
                      </Badge>
                      {['Weight', 'Count', 'Length', 'Volume', 'Container'].map(cat => (
                        <Badge
                          key={cat}
                          variant={unitCategory === cat ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => setUnitCategory(cat)}
                        >
                          {cat}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {filteredUnits.map(unit => (
                        <Card
                          key={unit.value}
                          variant={watchedFields.unit_of_measure === unit.value ? 'elevated' : 'outlined'}
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-md",
                            watchedFields.unit_of_measure === unit.value && "ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-950"
                          )}
                          onClick={() => setValue('unit_of_measure', unit.value)}
                        >
                          <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-neutral-700 dark:text-neutral-300">
                              {unit.symbol}
                            </p>
                            <p className="text-sm font-medium mt-1">{unit.label}</p>
                            <Badge variant="outline" className="text-xs mt-2">
                              {unit.category}
                            </Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    <div className="mt-4">
                      <Input
                        id="unit_of_measure"
                        {...register('unit_of_measure')}
                        placeholder="Or type a custom unit..."
                        className="max-w-md"
                      />
                    </div>
                  </div>

                  {/* Minimum Quantity */}
                  <div>
                    <Label htmlFor="min_quantity" className="text-base font-semibold">
                      Minimum Order Quantity
                    </Label>
                    <div className="relative mt-2">
                      <Box className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                      <Input
                        id="min_quantity"
                        type="number"
                        min="1"
                        step="1"
                        {...register('min_quantity', { valueAsNumber: true })}
                        placeholder="1"
                        className="pl-10 h-12"
                      />
                    </div>
                    {errors.min_quantity && (
                      <p className="text-red-500 text-sm mt-1">{errors.min_quantity.message}</p>
                    )}
                    
                    {/* Quick Set Options */}
                    <div className="mt-3 flex gap-2">
                      {[1, 10, 50, 100, 500].map(qty => (
                        <Button
                          key={qty}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setValue('min_quantity', qty)}
                        >
                          {qty}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Stock Alert Settings */}
                  <Card variant="outlined">
                    <CardHeader>
                      <CardTitle size="sm">Stock Management</CardTitle>
                      <CardDescription>Configure inventory alerts</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="low_stock_alert" className="cursor-pointer">
                          Low Stock Alert
                        </Label>
                        <Switch id="low_stock_alert" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="out_of_stock_alert" className="cursor-pointer">
                          Out of Stock Alert
                        </Label>
                        <Switch id="out_of_stock_alert" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Special Handling Requirements */}
                <Card variant="elevated">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Special Handling Requirements
                    </CardTitle>
                    <CardDescription>
                      Configure special care instructions for this article
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start space-x-4 p-4 rounded-lg border-2 border-neutral-200 dark:border-neutral-800 hover:border-red-200 dark:hover:border-red-800 transition-colors">
                        <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">Fragile Item</p>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                                Requires careful handling and protective packaging
                              </p>
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
                        </div>
                      </div>

                      <div className="flex items-start space-x-4 p-4 rounded-lg border-2 border-neutral-200 dark:border-neutral-800 hover:border-amber-200 dark:hover:border-amber-800 transition-colors">
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                          <ShieldCheck className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">Special Handling</p>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                                Requires specific storage or transport conditions
                              </p>
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
                        </div>
                      </div>
                    </div>

                    {(watchedFields.is_fragile || watchedFields.requires_special_handling) && (
                      <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <AlertDescription className="text-amber-700 dark:text-amber-300">
                          Special handling requirements will be displayed prominently on all orders and shipping labels.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Advanced settings for power users and special configurations
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Internal Notes */}
                  <Card variant="outlined" className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle size="sm">Internal Notes</CardTitle>
                      <CardDescription>
                        Add private notes visible only to your team
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        id="notes"
                        {...register('notes')}
                        placeholder="Add any internal notes, special instructions, or reminders..."
                        rows={6}
                        className="resize-none"
                      />
                      {errors.notes && (
                        <p className="text-red-500 text-sm mt-1">{errors.notes.message}</p>
                      )}
                      <div className="flex justify-between mt-2">
                        <p className="text-xs text-neutral-500">
                          {watchedFields.notes?.length || 0}/1000 characters
                        </p>
                        <Badge variant="outline" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Private & Secure
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Metadata */}
                  {initialData && (
                    <Card variant="outlined">
                      <CardHeader>
                        <CardTitle size="sm">Article Metadata</CardTitle>
                        <CardDescription>System information</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">Article ID</span>
                          <code className="text-sm font-mono bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded">
                            {initialData.id?.slice(0, 8)}...
                          </code>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">Created</span>
                          <span className="text-sm font-medium">
                            {initialData.created_at ? new Date(initialData.created_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">Last Updated</span>
                          <span className="text-sm font-medium">
                            {initialData.updated_at ? new Date(initialData.updated_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* API Settings */}
                  <Card variant="outlined">
                    <CardHeader>
                      <CardTitle size="sm">Integration Settings</CardTitle>
                      <CardDescription>Configure API and webhooks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="api_sync" className="cursor-pointer">
                          Enable API Sync
                        </Label>
                        <Switch id="api_sync" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="webhook_notify" className="cursor-pointer">
                          Webhook Notifications
                        </Label>
                        <Switch id="webhook_notify" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Preview Tab */}
              <TabsContent value="preview" className="space-y-6">
                <Card variant="elevated">
                  <CardHeader>
                    <CardTitle>Article Preview</CardTitle>
                    <CardDescription>
                      See how your article will appear to customers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-w-3xl mx-auto space-y-6">
                      {/* Preview Header */}
                      <div className="flex items-start gap-6">
                        {watchedFields.image_url ? (
                          <img
                            src={watchedFields.image_url}
                            alt={watchedFields.name || 'Product'}
                            className="w-32 h-32 object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-32 h-32 bg-neutral-100 dark:bg-neutral-900 rounded-lg flex items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-neutral-400" />
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                            {watchedFields.name || 'Untitled Article'}
                          </h2>
                          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
                            {watchedFields.description || 'No description provided'}
                          </p>
                          
                          <div className="flex flex-wrap gap-2 mt-4">
                            {watchedFields.category && (
                              <Badge variant="secondary" className="text-sm">
                                {watchedFields.category}
                              </Badge>
                            )}
                            {tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-sm">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Pricing Display */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-6 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">Base Price</p>
                          <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                            ₹{pricingPreview.baseRate.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-center p-6 bg-primary-50 dark:bg-primary-950 rounded-lg">
                          <p className="text-sm text-primary-700 dark:text-primary-300">Total Price</p>
                          <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                            ₹{pricingPreview.totalPrice.toFixed(2)}
                          </p>
                          <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                            (incl. {pricingPreview.taxRate}% tax)
                          </p>
                        </div>
                        <div className="text-center p-6 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">Min Order</p>
                          <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                            {watchedFields.min_quantity || 1}
                          </p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {watchedFields.unit_of_measure || 'units'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Special Attributes */}
                      {(watchedFields.is_fragile || watchedFields.requires_special_handling) && (
                        <>
                          <Separator />
                          <div className="flex flex-wrap gap-4">
                            {watchedFields.is_fragile && (
                              <Alert className="flex-1 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                <AlertDescription className="text-red-700 dark:text-red-300">
                                  <strong>Fragile Item:</strong> Requires careful handling
                                </AlertDescription>
                              </Alert>
                            )}
                            {watchedFields.requires_special_handling && (
                              <Alert className="flex-1 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                                <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                <AlertDescription className="text-amber-700 dark:text-amber-300">
                                  <strong>Special Handling:</strong> See instructions
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </>
                      )}
                      
                      {/* Additional Info */}
                      {watchedFields.hsn_code && (
                        <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">HSN Code</span>
                          <code className="font-mono font-semibold">{watchedFields.hsn_code}</code>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Error Summary */}
            {Object.keys(errors).length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">Please fix the following errors:</p>
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
          <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-900 rounded-b-lg border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={clearForm}
                  disabled={submitting}
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                >
                  Clear Form
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
                  variant="gradient"
                  disabled={submitting || !isValid}
                  className="min-w-[160px]"
                  leftIcon={submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                >
                  {submitting 
                    ? (initialData ? 'Updating...' : 'Creating...') 
                    : (initialData ? 'Update Article' : 'Create Article')
                  }
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </form>
    </TooltipProvider>
  );
}