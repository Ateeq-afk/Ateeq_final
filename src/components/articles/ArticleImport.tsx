import React, { useState, useCallback, useMemo } from 'react';
import {
  Upload,
  AlertTriangle,
  CheckCircle2,
  X,
  Download,
  FileText,
  Loader2,
  FileSpreadsheet,
  AlertCircle,
  Info,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  Zap,
  Shield,
  Package,
  Hash,
  IndianRupee,
  Box,
  TrendingUp,
  CheckCheck,
  XCircle,
  Search,
  Sparkles,
  Database,
  Copy,
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useArticles } from '@/hooks/useArticles';
import { useBranches } from '@/hooks/useBranches';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { cn } from '@/lib/utils';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

type ImportStep = 'upload' | 'mapping' | 'validation' | 'preview' | 'importing' | 'complete';
type FileType = 'csv' | 'excel';

interface ImportConfig {
  skipDuplicates: boolean;
  updateExisting: boolean;
  validateData: boolean;
  autoMapping: boolean;
  defaultBranchId?: string;
  defaultTaxRate?: number;
  defaultMinQuantity?: number;
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  transform?: 'none' | 'uppercase' | 'lowercase' | 'number' | 'boolean' | 'date';
}

interface ValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
}

interface ImportStats {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
  warnings: number;
}

interface ParsedData {
  headers: string[];
  rows: any[];
  fileType: FileType;
  fileName: string;
}

const TARGET_FIELDS = [
  { value: 'name', label: 'Article Name', required: true, icon: <Package className="h-4 w-4" /> },
  { value: 'description', label: 'Description', required: false, icon: <FileText className="h-4 w-4" /> },
  { value: 'base_rate', label: 'Base Rate', required: true, icon: <IndianRupee className="h-4 w-4" /> },
  { value: 'hsn_code', label: 'HSN Code', required: false, icon: <Hash className="h-4 w-4" /> },
  { value: 'tax_rate', label: 'Tax Rate (%)', required: false, icon: <TrendingUp className="h-4 w-4" /> },
  { value: 'unit_of_measure', label: 'Unit', required: false, icon: <Box className="h-4 w-4" /> },
  { value: 'min_quantity', label: 'Min Quantity', required: false, icon: <Package className="h-4 w-4" /> },
  { value: 'is_fragile', label: 'Fragile', required: false, icon: <AlertTriangle className="h-4 w-4" /> },
  { value: 'requires_special_handling', label: 'Special Handling', required: false, icon: <Shield className="h-4 w-4" /> },
  { value: 'notes', label: 'Notes', required: false, icon: <FileText className="h-4 w-4" /> },
];

const SAMPLE_DATA = [
  {
    'Article Name': 'Premium Cotton Fabric',
    'Description': 'High-quality cotton fabric for textile manufacturing',
    'Base Rate': '450.00',
    'HSN Code': '5208',
    'Tax Rate': '12',
    'Unit': 'meter',
    'Min Quantity': '50',
    'Fragile': 'No',
    'Special Handling': 'No',
    'Notes': 'Store in dry place'
  },
  {
    'Article Name': 'Silk Saree Bundle',
    'Description': 'Traditional silk sarees in assorted colors',
    'Base Rate': '2500.00',
    'HSN Code': '5007',
    'Tax Rate': '5',
    'Unit': 'bundle',
    'Min Quantity': '10',
    'Fragile': 'Yes',
    'Special Handling': 'Yes',
    'Notes': 'Handle with care, avoid moisture'
  },
];

export default function ArticleImport({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [config, setConfig] = useState<ImportConfig>({
    skipDuplicates: true,
    updateExisting: false,
    validateData: true,
    autoMapping: true,
    defaultMinQuantity: 1,
  });
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterErrors, setFilterErrors] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const { createArticle, articles } = useArticles();
  const { branches } = useBranches();
  const { showSuccess, showError, showInfo } = useNotificationSystem();

  // Calculate statistics
  const stats = useMemo<ImportStats>(() => {
    if (!parsedData) {
      return { total: 0, valid: 0, invalid: 0, duplicates: 0, warnings: 0 };
    }

    const errors = validationErrors.filter(e => e.severity === 'error');
    const warnings = validationErrors.filter(e => e.severity === 'warning');
    const errorRows = new Set(errors.map(e => e.row));
    const duplicateErrors = validationErrors.filter(e => e.message.includes('duplicate'));

    return {
      total: parsedData.rows.length,
      valid: parsedData.rows.length - errorRows.size,
      invalid: errorRows.size,
      duplicates: duplicateErrors.length,
      warnings: warnings.length,
    };
  }, [parsedData, validationErrors]);

  // Auto-map fields based on similarity
  const autoMapFields = useCallback((headers: string[]) => {
    const newMappings: FieldMapping[] = [];

    headers.forEach(header => {
      const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Try to find matching target field
      let matchedField = '';
      let transform: FieldMapping['transform'] = 'none';

      if (normalizedHeader.includes('name') || normalizedHeader.includes('article')) {
        matchedField = 'name';
      } else if (normalizedHeader.includes('desc')) {
        matchedField = 'description';
      } else if (normalizedHeader.includes('rate') || normalizedHeader.includes('price')) {
        matchedField = 'base_rate';
        transform = 'number';
      } else if (normalizedHeader.includes('hsn')) {
        matchedField = 'hsn_code';
      } else if (normalizedHeader.includes('tax') || normalizedHeader.includes('gst')) {
        matchedField = 'tax_rate';
        transform = 'number';
      } else if (normalizedHeader.includes('unit') || normalizedHeader.includes('uom')) {
        matchedField = 'unit_of_measure';
      } else if (normalizedHeader.includes('min') || normalizedHeader.includes('quantity')) {
        matchedField = 'min_quantity';
        transform = 'number';
      } else if (normalizedHeader.includes('fragile')) {
        matchedField = 'is_fragile';
        transform = 'boolean';
      } else if (normalizedHeader.includes('special') || normalizedHeader.includes('handling')) {
        matchedField = 'requires_special_handling';
        transform = 'boolean';
      } else if (normalizedHeader.includes('note') || normalizedHeader.includes('remark')) {
        matchedField = 'notes';
      }

      if (matchedField) {
        newMappings.push({
          sourceField: header,
          targetField: matchedField,
          transform,
        });
      }
    });

    setMappings(newMappings);
    showInfo('Auto-mapping complete', `Mapped ${newMappings.length} fields automatically`);
  }, [showInfo]);

  // Handle file upload
  const handleFileUpload = useCallback((uploadedFile: File) => {
    if (!uploadedFile) return;

    const fileExtension = uploadedFile.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
      showError('Invalid File', 'Please upload a CSV or Excel file');
      return;
    }

    setFile(uploadedFile);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let headers: string[] = [];
        let rows: any[] = [];
        let fileType: FileType = 'csv';

        if (fileExtension === 'csv') {
          const csv = event.target?.result as string;
          const result = Papa.parse(csv, { 
            header: true, 
            skipEmptyLines: true,
            dynamicTyping: true,
            delimitersToGuess: [',', ';', '\t', '|'],
          });
          headers = result.meta.fields || [];
          rows = result.data;
          fileType = 'csv';
        } else {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
          
          if (jsonData.length > 0) {
            headers = jsonData[0].map(h => String(h || ''));
            rows = jsonData.slice(1).map(row => {
              const obj: any = {};
              headers.forEach((header, index) => {
                obj[header] = row[index];
              });
              return obj;
            });
          }
          fileType = 'excel';
        }

        if (headers.length === 0 || rows.length === 0) {
          showError('Empty File', 'The file appears to be empty or invalid');
          return;
        }

        setParsedData({
          headers,
          rows,
          fileType,
          fileName: uploadedFile.name,
        });

        // Auto-map if enabled
        if (config.autoMapping) {
          autoMapFields(headers);
        }

        setStep('mapping');
        showSuccess('File Uploaded', `Successfully parsed ${rows.length} rows`);
      } catch (error) {
        console.error('Parse error:', error);
        showError('Parse Failed', 'Failed to parse the file. Please check the format.');
      }
    };

    if (fileExtension === 'csv') {
      reader.readAsText(uploadedFile);
    } else {
      reader.readAsArrayBuffer(uploadedFile);
    }
  }, [config.autoMapping, autoMapFields, showSuccess, showError]);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileUpload(droppedFile);
    }
  }, [handleFileUpload]);

  // Update mapping
  const updateMapping = useCallback((sourceField: string, targetField: string, transform?: FieldMapping['transform']) => {
    setMappings(prev => {
      const existing = prev.findIndex(m => m.sourceField === sourceField);
      const newMapping = { sourceField, targetField, transform: transform || 'none' };
      
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newMapping;
        return updated;
      } else {
        return [...prev, newMapping];
      }
    });
  }, []);

  // Remove mapping
  const removeMapping = useCallback((sourceField: string) => {
    setMappings(prev => prev.filter(m => m.sourceField !== sourceField));
  }, []);

  // Transform value based on mapping
  const transformValue = useCallback((value: any, transform: FieldMapping['transform']) => {
    if (value === null || value === undefined || value === '') return null;

    switch (transform) {
      case 'uppercase':
        return String(value).toUpperCase();
      case 'lowercase':
        return String(value).toLowerCase();
      case 'number':
        const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
        return isNaN(num) ? null : num;
      case 'boolean':
        const str = String(value).toLowerCase();
        return str === 'yes' || str === 'true' || str === '1';
      case 'date':
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date.toISOString();
      default:
        return value;
    }
  }, []);

  // Validate data
  const validateData = useCallback(() => {
    if (!parsedData) return;

    const errors: ValidationError[] = [];
    const existingNames = new Set(articles.map(a => a.name.toLowerCase()));

    parsedData.rows.forEach((row, index) => {
      const mappedRow: any = {};
      
      // Apply mappings
      mappings.forEach(mapping => {
        const value = row[mapping.sourceField];
        mappedRow[mapping.targetField] = transformValue(value, mapping.transform);
      });

      // Validate required fields
      if (!mappedRow.name || String(mappedRow.name).trim() === '') {
        errors.push({
          row: index,
          field: 'name',
          value: mappedRow.name,
          message: 'Article name is required',
          severity: 'error',
        });
      } else if (existingNames.has(String(mappedRow.name).toLowerCase()) && !config.updateExisting) {
        errors.push({
          row: index,
          field: 'name',
          value: mappedRow.name,
          message: `Article "${mappedRow.name}" already exists (duplicate)`,
          severity: config.skipDuplicates ? 'warning' : 'error',
        });
      }

      if (mappedRow.base_rate === null || mappedRow.base_rate === undefined) {
        errors.push({
          row: index,
          field: 'base_rate',
          value: mappedRow.base_rate,
          message: 'Base rate is required',
          severity: 'error',
        });
      } else if (mappedRow.base_rate < 0) {
        errors.push({
          row: index,
          field: 'base_rate',
          value: mappedRow.base_rate,
          message: 'Base rate cannot be negative',
          severity: 'error',
        });
      }

      // Validate optional fields
      if (mappedRow.hsn_code && !/^\d{4,8}$/.test(String(mappedRow.hsn_code))) {
        errors.push({
          row: index,
          field: 'hsn_code',
          value: mappedRow.hsn_code,
          message: 'HSN code must be 4-8 digits',
          severity: 'warning',
        });
      }

      if (mappedRow.tax_rate !== null && mappedRow.tax_rate !== undefined) {
        if (mappedRow.tax_rate < 0 || mappedRow.tax_rate > 100) {
          errors.push({
            row: index,
            field: 'tax_rate',
            value: mappedRow.tax_rate,
            message: 'Tax rate must be between 0 and 100',
            severity: 'error',
          });
        }
      }

      if (mappedRow.min_quantity !== null && mappedRow.min_quantity !== undefined) {
        if (mappedRow.min_quantity < 1 || !Number.isInteger(mappedRow.min_quantity)) {
          errors.push({
            row: index,
            field: 'min_quantity',
            value: mappedRow.min_quantity,
            message: 'Min quantity must be a positive integer',
            severity: 'warning',
          });
        }
      }
    });

    setValidationErrors(errors);
    setStep('validation');
  }, [parsedData, mappings, articles, config, transformValue]);

  // Process import
  const processImport = useCallback(async () => {
    if (!parsedData || !config.defaultBranchId) {
      showError('Configuration Error', 'Please select a branch');
      return;
    }

    setStep('importing');
    setImportProgress(0);
    setImportedCount(0);

    const rowsToImport = filterErrors 
      ? parsedData.rows.filter((_, index) => 
          !validationErrors.some(e => e.row === index && e.severity === 'error')
        )
      : selectedRows.length > 0 
        ? parsedData.rows.filter((_, index) => selectedRows.includes(index))
        : parsedData.rows;

    const totalRows = rowsToImport.length;
    let successCount = 0;
    const failedRows: number[] = [];

    for (let i = 0; i < totalRows; i++) {
      const row = rowsToImport[i];
      const mappedData: any = {
        branch_id: config.defaultBranchId,
      };

      // Apply mappings
      mappings.forEach(mapping => {
        const value = row[mapping.sourceField];
        const transformed = transformValue(value, mapping.transform);
        if (transformed !== null) {
          mappedData[mapping.targetField] = transformed;
        }
      });

      // Apply defaults
      if (!mappedData.tax_rate && config.defaultTaxRate !== undefined) {
        mappedData.tax_rate = config.defaultTaxRate;
      }
      if (!mappedData.min_quantity && config.defaultMinQuantity !== undefined) {
        mappedData.min_quantity = config.defaultMinQuantity;
      }

      // Skip duplicates if configured
      if (config.skipDuplicates) {
        const isDuplicate = articles.some(
          a => a.name.toLowerCase() === String(mappedData.name).toLowerCase()
        );
        if (isDuplicate) {
          setImportProgress(((i + 1) / totalRows) * 100);
          continue;
        }
      }

      try {
        await createArticle(mappedData);
        successCount++;
        setImportedCount(successCount);
      } catch (error) {
        console.error(`Failed to import row ${i}:`, error);
        failedRows.push(i);
      }

      setImportProgress(((i + 1) / totalRows) * 100);
    }

    if (failedRows.length > 0) {
      showInfo(
        'Partial Import',
        `Imported ${successCount} articles. ${failedRows.length} failed.`
      );
    } else {
      showSuccess(
        'Import Complete',
        `Successfully imported ${successCount} articles`
      );
    }

    setStep('complete');
    setTimeout(onSuccess, 2000);
  }, [parsedData, config, mappings, articles, filterErrors, selectedRows, validationErrors, createArticle, transformValue, showSuccess, showWarning, showError, onSuccess]);

  // Download template
  const downloadTemplate = useCallback(() => {
    const headers = TARGET_FIELDS.map(f => f.label);
    const csv = Papa.unparse({
      fields: headers,
      data: SAMPLE_DATA.map(row => headers.map(h => row[h] || '')),
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'article-import-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSuccess('Template Downloaded', 'Use this template to prepare your import data');
  }, [showSuccess]);

  // Copy sample data
  const copySampleData = useCallback(() => {
    const csv = Papa.unparse(SAMPLE_DATA);
    navigator.clipboard.writeText(csv);
    showSuccess('Copied!', 'Sample data copied to clipboard');
  }, [showSuccess]);

  // Get filtered rows based on search and error filter
  const filteredRows = useMemo(() => {
    if (!parsedData) return [];

    let rows = parsedData.rows.map((row, index) => ({ ...row, _index: index }));

    if (searchQuery) {
      rows = rows.filter(row => 
        Object.values(row).some(value => 
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    if (filterErrors) {
      const errorRowIndices = new Set(
        validationErrors
          .filter(e => e.severity === 'error')
          .map(e => e.row)
      );
      rows = rows.filter(row => !errorRowIndices.has(row._index));
    }

    return rows;
  }, [parsedData, searchQuery, filterErrors, validationErrors]);

  return (
    <TooltipProvider>
      <div className="space-y-6 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Import Articles</h2>
            <p className="text-gray-600 mt-1">
              Upload and map your article data for bulk import
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4 flex-shrink-0">
          {['upload', 'mapping', 'validation', 'preview', 'importing', 'complete'].map((s, index) => {
            const isActive = s === step;
            const isPassed = ['upload', 'mapping', 'validation', 'preview', 'importing', 'complete'].indexOf(step) > index;
            
            return (
              <React.Fragment key={s}>
                <div className="flex items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    isActive && "bg-blue-500 text-white scale-110 shadow-lg",
                    isPassed && !isActive && "bg-green-500 text-white",
                    !isActive && !isPassed && "bg-gray-200 text-gray-600"
                  )}>
                    {isPassed ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                  </div>
                  <span className={cn(
                    "ml-2 text-sm capitalize hidden sm:inline",
                    isActive ? "text-gray-900 font-medium" : "text-gray-500"
                  )}>
                    {s}
                  </span>
                </div>
                {index < 5 && (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Step: Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              <Tabs defaultValue="upload" className="space-y-6">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="upload">Upload File</TabsTrigger>
                  <TabsTrigger value="template">Download Template</TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-6">
                  <Card>
                    <CardContent className="p-0">
                      <div
                        className={cn(
                          "border-2 border-dashed rounded-lg p-12 text-center transition-all",
                          dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300",
                          "hover:border-gray-400"
                        )}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                      >
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Drop your file here, or click to browse
                        </h3>
                        <p className="text-gray-500 mb-4">
                          Support for CSV and Excel files (.csv, .xlsx, .xls)
                        </p>
                        <Input
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={(e) => {
                            const selectedFile = e.target.files?.[0];
                            if (selectedFile) handleFileUpload(selectedFile);
                          }}
                          className="max-w-xs mx-auto"
                        />
                        {file && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg inline-flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium">{file.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFile(null);
                                setParsedData(null);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Import Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Auto-mapping</p>
                          <p className="text-sm text-gray-500">Automatically map similar field names</p>
                        </div>
                        <Switch
                          checked={config.autoMapping}
                          onCheckedChange={(checked) => 
                            setConfig(prev => ({ ...prev, autoMapping: checked }))
                          }
                        />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Validate Data</p>
                          <p className="text-sm text-gray-500">Check for errors before importing</p>
                        </div>
                        <Switch
                          checked={config.validateData}
                          onCheckedChange={(checked) => 
                            setConfig(prev => ({ ...prev, validateData: checked }))
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="template" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Download Import Template</CardTitle>
                      <CardDescription>
                        Use our template to ensure your data is formatted correctly
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-3">
                        <Button onClick={downloadTemplate} className="flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          Download CSV Template
                        </Button>
                        <Button
                          variant="outline"
                          onClick={copySampleData}
                          className="flex items-center gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          Copy Sample Data
                        </Button>
                      </div>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Template includes:</AlertTitle>
                        <AlertDescription>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>All supported fields with proper headers</li>
                            <li>Sample data showing correct formatting</li>
                            <li>Required fields are marked in the template</li>
                          </ul>
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Required Fields:</h4>
                        <div className="flex flex-wrap gap-2">
                          {TARGET_FIELDS.filter(f => f.required).map(field => (
                            <Badge key={field.value} variant="destructive">
                              {field.label}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Optional Fields:</h4>
                        <div className="flex flex-wrap gap-2">
                          {TARGET_FIELDS.filter(f => !f.required).map(field => (
                            <Badge key={field.value} variant="secondary">
                              {field.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Sample Data Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {Object.keys(SAMPLE_DATA[0]).map(key => (
                                <TableHead key={key}>{key}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {SAMPLE_DATA.map((row, index) => (
                              <TableRow key={index}>
                                {Object.values(row).map((value, i) => (
                                  <TableCell key={i} className="font-mono text-sm">
                                    {value}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Step: Mapping */}
          {step === 'mapping' && parsedData && (
            <div className="space-y-6">
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  Map your file columns to article fields. Required fields must be mapped.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Field Mapping</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => autoMapFields(parsedData.headers)}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Auto-map
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {parsedData.headers.map(header => {
                      const mapping = mappings.find(m => m.sourceField === header);
                      return (
                        <div key={header} className="flex items-center gap-4">
                          <div className="flex-1">
                            <Label className="text-sm font-medium">{header}</Label>
                            <p className="text-xs text-gray-500">
                              Sample: {parsedData.rows[0]?.[header] || 'N/A'}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                          <Select
                            value={mapping?.targetField || ''}
                            onValueChange={(value) => updateMapping(header, value)}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Select field..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {TARGET_FIELDS.map(field => (
                                <SelectItem key={field.value} value={field.value}>
                                  <div className="flex items-center gap-2">
                                    {field.icon}
                                    <span>{field.label}</span>
                                    {field.required && (
                                      <Badge variant="destructive" className="text-xs ml-1">
                                        Required
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {mapping && (
                            <Select
                              value={mapping.transform}
                              onValueChange={(value) => 
                                updateMapping(header, mapping.targetField, value as FieldMapping['transform'])
                              }
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No transform</SelectItem>
                                <SelectItem value="uppercase">Uppercase</SelectItem>
                                <SelectItem value="lowercase">Lowercase</SelectItem>
                                <SelectItem value="number">To Number</SelectItem>
                                <SelectItem value="boolean">To Boolean</SelectItem>
                                <SelectItem value="date">To Date</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          {mapping && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeMapping(header)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Default Values</CardTitle>
                  <CardDescription>
                    Set default values for unmapped fields
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="branch">Default Branch</Label>
                    <Select
                      value={config.defaultBranchId}
                      onValueChange={(value) => 
                        setConfig(prev => ({ ...prev, defaultBranchId: value }))
                      }
                    >
                      <SelectTrigger id="branch">
                        <SelectValue placeholder="Select branch..." />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map(branch => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        min="0"
                        max="100"
                        value={config.defaultTaxRate || ''}
                        onChange={(e) => 
                          setConfig(prev => ({ 
                            ...prev, 
                            defaultTaxRate: e.target.value ? parseFloat(e.target.value) : undefined 
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="minQty">Default Min Quantity</Label>
                      <Input
                        id="minQty"
                        type="number"
                        min="1"
                        value={config.defaultMinQuantity || ''}
                        onChange={(e) => 
                          setConfig(prev => ({ 
                            ...prev, 
                            defaultMinQuantity: e.target.value ? parseInt(e.target.value) : undefined 
                          }))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step: Validation */}
          {step === 'validation' && parsedData && (
            <div className="space-y-6">
              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Rows</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Valid Rows</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">{stats.valid}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Errors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-red-600">{stats.invalid}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Warnings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-yellow-600">{stats.warnings}</p>
                  </CardContent>
                </Card>
              </div>

              {validationErrors.length > 0 ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Validation Results</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowErrorDetails(!showErrorDetails)}
                      >
                        {showErrorDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {showErrorDetails ? 'Hide' : 'Show'} Details
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {showErrorDetails ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {validationErrors.map((error, index) => (
                          <div
                            key={index}
                            className={cn(
                              "p-3 rounded-lg flex items-start gap-3",
                              error.severity === 'error' ? "bg-red-50" : "bg-yellow-50"
                            )}
                          >
                            {error.severity === 'error' ? (
                              <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                Row {error.row + 1}, {error.field}
                              </p>
                              <p className="text-sm text-gray-600">{error.message}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Value: {String(error.value || 'empty')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Found {stats.invalid} errors and {stats.warnings} warnings in your data.
                            Click "Show Details" to review.
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium">Validation Passed!</h3>
                      <p className="text-gray-600 mt-1">All rows are valid and ready to import</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Import Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Skip Duplicates</p>
                      <p className="text-sm text-gray-500">Skip articles that already exist</p>
                    </div>
                    <Switch
                      checked={config.skipDuplicates}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, skipDuplicates: checked }))
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Update Existing</p>
                      <p className="text-sm text-gray-500">Update articles if they already exist</p>
                    </div>
                    <Switch
                      checked={config.updateExisting}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, updateExisting: checked }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && parsedData && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Input
                    placeholder="Search rows..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                    prefix={<Search className="h-4 w-4 text-gray-400" />}
                  />
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="filterErrors"
                      checked={filterErrors}
                      onCheckedChange={(checked) => setFilterErrors(!!checked)}
                    />
                    <Label htmlFor="filterErrors" className="text-sm">
                      Hide rows with errors
                    </Label>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Showing {filteredRows.length} of {parsedData.rows.length} rows
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Preview Import Data</CardTitle>
                  <CardDescription>
                    Review the data that will be imported. Select specific rows if needed.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedRows.length === filteredRows.length && filteredRows.length > 0}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedRows(filteredRows.map(r => r._index));
                                } else {
                                  setSelectedRows([]);
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead className="w-16">#</TableHead>
                          {TARGET_FIELDS.filter(f => 
                            mappings.some(m => m.targetField === f.value)
                          ).map(field => (
                            <TableHead key={field.value}>
                              <div className="flex items-center gap-1">
                                {field.icon}
                                {field.label}
                              </div>
                            </TableHead>
                          ))}
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRows.map((row) => {
                          const rowErrors = validationErrors.filter(e => e.row === row._index);
                          const hasError = rowErrors.some(e => e.severity === 'error');
                          const mappedRow: any = {};
                          
                          mappings.forEach(mapping => {
                            mappedRow[mapping.targetField] = transformValue(
                              row[mapping.sourceField],
                              mapping.transform
                            );
                          });

                          return (
                            <TableRow key={row._index} className={hasError ? 'bg-red-50' : ''}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedRows.includes(row._index)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedRows(prev => [...prev, row._index]);
                                    } else {
                                      setSelectedRows(prev => prev.filter(i => i !== row._index));
                                    }
                                  }}
                                />
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {row._index + 1}
                              </TableCell>
                              {TARGET_FIELDS.filter(f => 
                                mappings.some(m => m.targetField === f.value)
                              ).map(field => (
                                <TableCell key={field.value}>
                                  {mappedRow[field.value] || '-'}
                                </TableCell>
                              ))}
                              <TableCell>
                                {hasError ? (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge variant="destructive" className="flex items-center gap-1">
                                        <XCircle className="h-3 w-3" />
                                        Error
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="space-y-1">
                                        {rowErrors.map((error, i) => (
                                          <p key={i} className="text-xs">
                                            {error.field}: {error.message}
                                          </p>
                                        ))}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Valid
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step: Importing */}
          {step === 'importing' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                  <Database className="h-12 w-12 text-blue-600 animate-pulse" />
                </div>
                <div className="absolute inset-0 rounded-full bg-blue-500 opacity-20 animate-ping" />
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">Importing Articles</h3>
                <p className="text-gray-500">
                  Processing {importedCount} of {stats.valid} articles...
                </p>
              </div>
              
              <div className="w-full max-w-xs space-y-2">
                <Progress value={importProgress} className="h-3" />
                <p className="text-center text-sm text-gray-600">{Math.round(importProgress)}%</p>
              </div>
            </div>
          )}

          {/* Step: Complete */}
          {step === 'complete' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCheck className="h-10 w-10 text-green-600" />
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-gray-900">Import Complete!</h3>
                <p className="text-gray-600">
                  Successfully imported {importedCount} articles
                </p>
              </div>
              
              <Card className="w-full max-w-md">
                <CardContent className="py-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-3xl font-bold text-green-600">{importedCount}</p>
                      <p className="text-sm text-gray-600">Imported</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-gray-400">
                        {stats.duplicates}
                      </p>
                      <p className="text-sm text-gray-600">Skipped</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer Actions - Fixed */}
        <div className="flex justify-between gap-3 pt-6 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          
          <div className="flex gap-3">
            {step === 'mapping' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setStep('upload')}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => {
                    if (config.validateData) {
                      validateData();
                    } else {
                      setStep('preview');
                    }
                  }}
                  disabled={!mappings.some(m => m.targetField === 'name' || m.targetField === 'base_rate')}
                >
                  {config.validateData ? 'Validate' : 'Preview'}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </>
            )}
            
            {step === 'validation' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setStep('mapping')}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep('preview')}
                  disabled={stats.invalid > 0 && !config.skipDuplicates}
                >
                  Continue to Preview
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </>
            )}
            
            {step === 'preview' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setStep(config.validateData ? 'validation' : 'mapping')}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={processImport}
                  disabled={!config.defaultBranchId || (selectedRows.length === 0 && !filterErrors)}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Import {selectedRows.length > 0 ? selectedRows.length : stats.valid} Articles
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}