import React, { useState, useMemo, useCallback } from 'react';
import {
  Download,
  X,
  FileText,
  CheckCircle2,
  Loader2,
  FileSpreadsheet,
  FileJson,
  FileType,
  Package,
  Calendar,
  DollarSign,
  Hash,
  Info,
  ChevronRight,
  Sparkles,
  Zap,
  Shield,
  Check,
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  TooltipProvider,
} from '@/components/ui/tooltip';
import type { Article } from '@/types';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';

interface Props {
  articles: Article[];
  onClose: () => void;
  onSuccess: () => void;
}

type ExportFormat = 'csv' | 'excel' | 'json' | 'xml';
type ExportStep = 'config' | 'preview' | 'exporting' | 'complete';

interface ExportConfig {
  format: ExportFormat;
  fields: Record<string, boolean>;
  includeHeaders: boolean;
  includeMetadata: boolean;
  dateFormat: string;
  currencyFormat: string;
  encoding: string;
  delimiter: string;
  customFileName: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  filterEmptyValues: boolean;
  includeCalculatedFields: boolean;
}

interface FieldGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  fields: string[];
}

interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  config: Partial<ExportConfig>;
  badge?: string;
}

const FIELD_GROUPS: FieldGroup[] = [
  {
    id: 'basic',
    label: 'Basic Information',
    icon: <Package className="h-4 w-4" />,
    fields: ['name', 'description', 'base_rate'],
  },
  {
    id: 'identification',
    label: 'Identification',
    icon: <Hash className="h-4 w-4" />,
    fields: ['id', 'hsn_code', 'branch_name'],
  },
  {
    id: 'financial',
    label: 'Financial',
    icon: <DollarSign className="h-4 w-4" />,
    fields: ['base_rate', 'tax_rate'],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: <FileSpreadsheet className="h-4 w-4" />,
    fields: ['unit_of_measure', 'min_quantity'],
  },
  {
    id: 'attributes',
    label: 'Special Attributes',
    icon: <Shield className="h-4 w-4" />,
    fields: ['is_fragile', 'requires_special_handling', 'notes'],
  },
  {
    id: 'metadata',
    label: 'Metadata',
    icon: <Calendar className="h-4 w-4" />,
    fields: ['created_at', 'updated_at'],
  },
];

const EXPORT_TEMPLATES: ExportTemplate[] = [
  {
    id: 'quick',
    name: 'Quick Export',
    description: 'Essential fields only',
    icon: <Zap className="h-4 w-4" />,
    badge: 'Popular',
    config: {
      fields: {
        name: true,
        description: true,
        base_rate: true,
        hsn_code: true,
        tax_rate: true,
      },
    },
  },
  {
    id: 'inventory',
    name: 'Inventory Report',
    description: 'For stock management',
    icon: <Package className="h-4 w-4" />,
    config: {
      fields: {
        name: true,
        hsn_code: true,
        unit_of_measure: true,
        min_quantity: true,
        base_rate: true,
      },
    },
  },
  {
    id: 'financial',
    name: 'Financial Report',
    description: 'Pricing and tax details',
    icon: <DollarSign className="h-4 w-4" />,
    badge: 'Pro',
    config: {
      fields: {
        name: true,
        base_rate: true,
        tax_rate: true,
        hsn_code: true,
      },
      includeCalculatedFields: true,
    },
  },
  {
    id: 'complete',
    name: 'Complete Export',
    description: 'All available fields',
    icon: <Sparkles className="h-4 w-4" />,
    config: {
      fields: Object.fromEntries(
        FIELD_GROUPS.flatMap(g => g.fields).map(f => [f, true])
      ),
      includeMetadata: true,
      includeCalculatedFields: true,
    },
  },
];

const FIELD_LABELS: Record<string, string> = {
  id: 'Article ID',
  name: 'Article Name',
  description: 'Description',
  base_rate: 'Base Rate',
  branch_name: 'Branch',
  hsn_code: 'HSN Code',
  tax_rate: 'Tax Rate (%)',
  unit_of_measure: 'Unit',
  min_quantity: 'Min Quantity',
  is_fragile: 'Fragile',
  requires_special_handling: 'Special Handling',
  notes: 'Notes',
  created_at: 'Created Date',
  updated_at: 'Last Updated',
};

export default function ArticleExport({ articles, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<ExportStep>('config');
  const [config, setConfig] = useState<ExportConfig>({
    format: 'excel',
    fields: {
      name: true,
      description: true,
      base_rate: true,
      hsn_code: true,
      tax_rate: true,
    },
    includeHeaders: true,
    includeMetadata: false,
    dateFormat: 'dd/mm/yyyy',
    currencyFormat: 'INR',
    encoding: 'UTF-8',
    delimiter: ',',
    customFileName: '',
    sortBy: 'name',
    sortOrder: 'asc',
    filterEmptyValues: false,
    includeCalculatedFields: false,
  });
  const [activeTab, setActiveTab] = useState('templates');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [exportProgress, setExportProgress] = useState(0);

  const { showSuccess, showError, showInfo } = useNotificationSystem();

  // Calculate statistics
  const stats = useMemo(() => {
    const selectedFieldCount = Object.values(config.fields).filter(Boolean).length;
    const totalFieldCount = Object.keys(FIELD_LABELS).length;
    const estimatedFileSize = articles.length * selectedFieldCount * 50; // Rough estimate in bytes
    
    return {
      selectedFieldCount,
      totalFieldCount,
      recordCount: articles.length,
      estimatedFileSize,
    };
  }, [config.fields, articles.length]);

  // Format helpers
  const formatDate = useCallback((date: string) => {
    const d = new Date(date);
    switch (config.dateFormat) {
      case 'dd/mm/yyyy':
        return d.toLocaleDateString('en-GB');
      case 'mm/dd/yyyy':
        return d.toLocaleDateString('en-US');
      case 'yyyy-mm-dd':
        return d.toISOString().split('T')[0];
      default:
        return d.toLocaleDateString();
    }
  }, [config.dateFormat]);

  const formatCurrency = useCallback((amount: number) => {
    if (config.currencyFormat === 'INR') {
      return `₹${amount.toFixed(2)}`;
    }
    return amount.toFixed(2);
  }, [config.currencyFormat]);

  const formatBoolean = useCallback((value: boolean) => {
    return value ? 'Yes' : 'No';
  }, []);

  // Update config
  const updateConfig = useCallback((updates: Partial<ExportConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Toggle field
  const toggleField = useCallback((field: string) => {
    setConfig(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [field]: !prev.fields[field],
      },
    }));
  }, []);

  // Toggle field group
  const toggleFieldGroup = useCallback((groupId: string) => {
    const group = FIELD_GROUPS.find(g => g.id === groupId);
    if (!group) return;

    const allSelected = group.fields.every(f => config.fields[f]);
    const newFields = { ...config.fields };
    
    group.fields.forEach(field => {
      newFields[field] = !allSelected;
    });
    
    updateConfig({ fields: newFields });
  }, [config.fields, updateConfig]);

  // Apply template
  const applyTemplate = useCallback((template: ExportTemplate) => {
    updateConfig(template.config);
    showInfo('Template Applied', `${template.name} settings have been applied`);
  }, [updateConfig, showInfo]);

  // Build preview data
  const buildPreview = useCallback(() => {
    let processedData = [...articles];

    // Sort data
    if (config.sortBy) {
      processedData.sort((a, b) => {
        const aVal = (a as any)[config.sortBy] || '';
        const bVal = (b as any)[config.sortBy] || '';
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return config.sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    // Process each record
    const preview = processedData.slice(0, 5).map(article => {
      const row: Record<string, any> = {};
      
      Object.entries(config.fields).forEach(([field, include]) => {
        if (!include) return;

        let value = (article as any)[field];

        // Format based on field type
        if (field === 'created_at' || field === 'updated_at') {
          value = formatDate(value);
        } else if (field === 'base_rate') {
          value = config.currencyFormat === 'INR' ? formatCurrency(value) : value;
        } else if (field === 'is_fragile' || field === 'requires_special_handling') {
          value = formatBoolean(value);
        } else if (config.filterEmptyValues && !value) {
          return; // Skip empty values
        }

        row[FIELD_LABELS[field] || field] = value || '';
      });

      // Add calculated fields
      if (config.includeCalculatedFields) {
        if (config.fields.base_rate && config.fields.tax_rate) {
          const taxAmount = (article.base_rate * (article.tax_rate || 0)) / 100;
          row['Tax Amount'] = config.currencyFormat === 'INR' ? formatCurrency(taxAmount) : taxAmount.toFixed(2);
          row['Total Price'] = config.currencyFormat === 'INR' 
            ? formatCurrency(article.base_rate + taxAmount)
            : (article.base_rate + taxAmount).toFixed(2);
        }
      }

      return row;
    });

    setPreviewData(preview);
  }, [articles, config, formatDate, formatCurrency, formatBoolean]);

  // Generate filename
  const generateFileName = useCallback(() => {
    const base = config.customFileName || 'articles-export';
    const date = new Date().toISOString().split('T')[0];
    const extension = config.format === 'excel' ? 'xlsx' : config.format;
    return `${base}-${date}.${extension}`;
  }, [config.customFileName, config.format]);

  // Export data
  const handleExport = useCallback(async () => {
    try {
      setStep('exporting');
      setExportProgress(0);

      // Prepare data
      let processedData = [...articles];
      
      // Sort
      if (config.sortBy) {
        processedData.sort((a, b) => {
          const aVal = a[config.sortBy] || '';
          const bVal = b[config.sortBy] || '';
          const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          return config.sortOrder === 'asc' ? comparison : -comparison;
        });
      }

      setExportProgress(20);

      // Process records
      const rows = processedData.map((article, index) => {
        // Update progress
        if (index % 10 === 0) {
          setExportProgress(20 + (index / processedData.length) * 60);
        }

        const row: Record<string, any> = {};
        
        Object.entries(config.fields).forEach(([field, include]) => {
          if (!include) return;

          let value = (article as any)[field];

          // Format values
          if (field === 'created_at' || field === 'updated_at') {
            value = formatDate(value);
          } else if (field === 'base_rate') {
            value = config.currencyFormat === 'INR' ? formatCurrency(value) : value;
          } else if (field === 'is_fragile' || field === 'requires_special_handling') {
            value = formatBoolean(value);
          } else if (config.filterEmptyValues && !value) {
            return;
          }

          const label = config.includeHeaders ? FIELD_LABELS[field] || field : field;
          row[label] = value || '';
        });

        // Calculated fields
        if (config.includeCalculatedFields) {
          if (config.fields.base_rate && config.fields.tax_rate) {
            const taxAmount = (article.base_rate * (article.tax_rate || 0)) / 100;
            row['Tax Amount'] = config.currencyFormat === 'INR' ? formatCurrency(taxAmount) : taxAmount.toFixed(2);
            row['Total Price'] = config.currencyFormat === 'INR' 
              ? formatCurrency(article.base_rate + taxAmount)
              : (article.base_rate + taxAmount).toFixed(2);
          }
        }

        return row;
      });

      setExportProgress(80);

      // Add metadata if requested
      let finalData = rows;
      if (config.includeMetadata) {
        const metadata = {
          'Export Date': formatDate(new Date().toISOString()),
          'Total Records': articles.length,
          'Exported Records': rows.length,
          'Format': config.format.toUpperCase(),
        };
        finalData = [metadata, {}, ...rows]; // Add empty row as separator
      }

      // Export based on format
      let blob: Blob;
      
      switch (config.format) {
        case 'csv': {
          const csv = Papa.unparse(finalData, {
            delimiter: config.delimiter,
          });
          blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          break;
        }
        
        case 'excel': {
          const ws = XLSX.utils.json_to_sheet(finalData);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Articles');
          
          // Auto-size columns
          const maxWidth = 50;
          const cols = Object.keys(rows[0] || {}).map(key => ({
            wch: Math.min(
              maxWidth,
              Math.max(
                key.length,
                ...rows.map(r => String(r[key] || '').length)
              )
            ),
          }));
          ws['!cols'] = cols;
          
          const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          break;
        }
        
        case 'json': {
          const json = JSON.stringify(finalData, null, 2);
          blob = new Blob([json], { type: 'application/json' });
          break;
        }
        
        case 'xml': {
          let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<articles>\n';
          rows.forEach(row => {
            xml += '  <article>\n';
            Object.entries(row).forEach(([key, value]) => {
              const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
              xml += `    <${safeKey}>${value}</${safeKey}>\n`;
            });
            xml += '  </article>\n';
          });
          xml += '</articles>';
          blob = new Blob([xml], { type: 'application/xml' });
          break;
        }
        
        default:
          throw new Error('Unsupported format');
      }

      setExportProgress(95);

      // Download file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = generateFileName();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportProgress(100);
      
      // Show success
      await new Promise(resolve => setTimeout(resolve, 500));
      setStep('complete');
      showSuccess('Export Complete', `Successfully exported ${rows.length} articles`);
      
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error('Export failed:', error);
      showError('Export Failed', 'There was an error exporting the data');
      setStep('config');
    }
  }, [articles, config, formatDate, formatCurrency, formatBoolean, generateFileName, showSuccess, showError, onSuccess]);

  // Initialize preview
  React.useEffect(() => {
    if (step === 'preview') {
      buildPreview();
    }
  }, [step, buildPreview]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Export Articles</h2>
            <p className="text-gray-600 mt-1">
              Configure and export your article data in multiple formats
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Progress Steps */}
        {step !== 'complete' && (
          <div className="flex items-center justify-center space-x-4">
            {['config', 'preview', 'exporting'].map((s, index) => (
              <React.Fragment key={s}>
                <div className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${step === s ? 'bg-blue-500 text-white' : 
                      ['config', 'preview', 'exporting'].indexOf(step) > index ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}
                  `}>
                    {['config', 'preview', 'exporting'].indexOf(step) > index ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={`ml-2 text-sm ${step === s ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </span>
                </div>
                {index < 2 && (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Step: Configuration */}
        {step === 'config' && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="fields">Fields</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EXPORT_TEMPLATES.map(template => (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => applyTemplate(template)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            {template.icon}
                          </div>
                          <div>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <CardDescription className="text-sm">
                              {template.description}
                            </CardDescription>
                          </div>
                        </div>
                        {template.badge && (
                          <Badge variant="secondary">{template.badge}</Badge>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Fields Tab */}
            <TabsContent value="fields" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  Select {stats.selectedFieldCount} of {stats.totalFieldCount} fields
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateConfig({ fields: Object.fromEntries(Object.keys(FIELD_LABELS).map(f => [f, true])) })}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateConfig({ fields: {} })}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              <Accordion type="multiple" className="space-y-2">
                {FIELD_GROUPS.map(group => {
                  const selectedCount = group.fields.filter(f => config.fields[f]).length;
                  const allSelected = selectedCount === group.fields.length;
                  
                  return (
                    <AccordionItem key={group.id} value={group.id} className="border rounded-lg">
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            {group.icon}
                            <span className="font-medium">{group.label}</span>
                          </div>
                          <div className="flex items-center gap-2 mr-2">
                            <Badge variant="secondary" className="text-xs">
                              {selectedCount}/{group.fields.length}
                            </Badge>
                            <Checkbox
                              checked={allSelected}
                              onCheckedChange={() => toggleFieldGroup(group.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-2">
                          {group.fields.map(field => (
                            <div key={field} className="flex items-center justify-between py-2">
                              <Label
                                htmlFor={`field-${field}`}
                                className="text-sm font-normal cursor-pointer flex-1"
                              >
                                {FIELD_LABELS[field] || field}
                              </Label>
                              <Checkbox
                                id={`field-${field}`}
                                checked={config.fields[field] || false}
                                onCheckedChange={() => toggleField(field)}
                              />
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>

              {/* Calculated Fields */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Calculated Fields</CardTitle>
                  <CardDescription>
                    Include additional computed values in the export
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Tax Amount & Total Price</p>
                      <p className="text-xs text-gray-500">
                        Calculate tax amount and total price including tax
                      </p>
                    </div>
                    <Switch
                      checked={config.includeCalculatedFields}
                      onCheckedChange={(checked) => updateConfig({ includeCalculatedFields: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              {/* Export Format */}
              <div className="space-y-3">
                <Label>Export Format</Label>
                <RadioGroup value={config.format} onValueChange={(v) => updateConfig({ format: v as ExportFormat })}>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: 'excel', label: 'Excel (.xlsx)', icon: <FileSpreadsheet />, desc: 'Best for spreadsheets' },
                      { value: 'csv', label: 'CSV', icon: <FileText />, desc: 'Universal format' },
                      { value: 'json', label: 'JSON', icon: <FileJson />, desc: 'For developers' },
                      { value: 'xml', label: 'XML', icon: <FileType />, desc: 'Structured data' },
                    ].map(format => (
                      <Label
                        key={format.value}
                        htmlFor={format.value}
                        className={`
                          flex items-center gap-3 p-4 rounded-lg border cursor-pointer
                          ${config.format === format.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                        `}
                      >
                        <RadioGroupItem value={format.value} id={format.value} className="sr-only" />
                        <div className="text-gray-600">{format.icon}</div>
                        <div className="flex-1">
                          <p className="font-medium">{format.label}</p>
                          <p className="text-xs text-gray-500">{format.desc}</p>
                        </div>
                      </Label>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Format-specific settings */}
              {config.format === 'csv' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">CSV Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="delimiter">Delimiter</Label>
                      <Select value={config.delimiter} onValueChange={(v) => updateConfig({ delimiter: v })}>
                        <SelectTrigger id="delimiter">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value=",">Comma (,)</SelectItem>
                          <SelectItem value=";">Semicolon (;)</SelectItem>
                          <SelectItem value="\t">Tab</SelectItem>
                          <SelectItem value="|">Pipe (|)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* General Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">General Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select value={config.dateFormat} onValueChange={(v) => updateConfig({ dateFormat: v })}>
                        <SelectTrigger id="dateFormat">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                          <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                          <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="sortBy">Sort By</Label>
                      <Select value={config.sortBy} onValueChange={(v) => updateConfig({ sortBy: v })}>
                        <SelectTrigger id="sortBy">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="base_rate">Base Rate</SelectItem>
                          <SelectItem value="created_at">Created Date</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Include Headers</p>
                        <p className="text-xs text-gray-500">Add column headers to the export</p>
                      </div>
                      <Switch
                        checked={config.includeHeaders}
                        onCheckedChange={(checked) => updateConfig({ includeHeaders: checked })}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Include Metadata</p>
                        <p className="text-xs text-gray-500">Add export info and statistics</p>
                      </div>
                      <Switch
                        checked={config.includeMetadata}
                        onCheckedChange={(checked) => updateConfig({ includeMetadata: checked })}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Filter Empty Values</p>
                        <p className="text-xs text-gray-500">Exclude fields with no data</p>
                      </div>
                      <Switch
                        checked={config.filterEmptyValues}
                        onCheckedChange={(checked) => updateConfig({ filterEmptyValues: checked })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="fileName">Custom File Name (Optional)</Label>
                    <Input
                      id="fileName"
                      placeholder="articles-export"
                      value={config.customFileName}
                      onChange={(e) => updateConfig({ customFileName: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty for default: articles-export-{new Date().toISOString().split('T')[0]}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Step: Preview */}
        {step === 'preview' && (
          <div className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Preview shows first 5 records. The actual export will include all {articles.length} articles.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Export Preview</CardTitle>
                    <CardDescription>
                      {stats.selectedFieldCount} fields × {articles.length} records
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="font-mono">
                    ~{(stats.estimatedFileSize / 1024).toFixed(1)} KB
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        {Object.keys(previewData[0] || {}).map(key => (
                          <th key={key} className="px-4 py-2 text-left font-medium text-gray-700">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {previewData.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {Object.values(row).map((value, i) => (
                            <td key={i} className="px-4 py-2">
                              {String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step: Exporting */}
        {step === 'exporting' && (
          <div className="py-12 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              </div>
              <div className="absolute inset-0 rounded-full bg-blue-500 opacity-20 animate-ping" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Exporting Articles</h3>
              <p className="text-gray-500">Please wait while we prepare your file...</p>
            </div>
            
            <div className="w-full max-w-xs space-y-2">
              <Progress value={exportProgress} className="h-2" />
              <p className="text-center text-sm text-gray-600">{Math.round(exportProgress)}%</p>
            </div>
          </div>
        )}

        {/* Step: Complete */}
        {step === 'complete' && (
          <div className="py-12 flex flex-col items-center justify-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-gray-900">Export Complete!</h3>
              <p className="text-gray-600">
                Successfully exported {stats.selectedFieldCount} fields for {articles.length} articles
              </p>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{generateFileName()}</span>
              </div>
              <span>•</span>
              <span>{(stats.estimatedFileSize / 1024).toFixed(1)} KB</span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        {step !== 'complete' && (
          <div className="flex justify-between gap-3 pt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            
            <div className="flex gap-3">
              {step === 'preview' && (
                <Button
                  variant="outline"
                  onClick={() => setStep('config')}
                >
                  Back
                </Button>
              )}
              
              {step === 'config' && (
                <Button
                  onClick={() => setStep('preview')}
                  disabled={stats.selectedFieldCount === 0}
                >
                  Preview Export
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              
              {step === 'preview' && (
                <Button
                  onClick={handleExport}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export {articles.length} Articles
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}