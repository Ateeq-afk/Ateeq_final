import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Package, 
  Upload, 
  Download, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Trash2,
  RotateCcw,
  Save,
  Eye,
  Edit,
  ArrowRight,
  Loader2,
  Plus,
  Minus,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { articleTrackingService, type ArticleTrackingData, type ScanArticleData } from '@/services/articleTracking';
import { warehouseService } from '@/services/warehouses';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface BulkOperation {
  id: string;
  type: 'bulk_scan' | 'bulk_transfer' | 'bulk_status_update' | 'bulk_export';
  name: string;
  description: string;
  items: BulkOperationItem[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  created_at: Date;
  completed_at?: Date;
  error_message?: string;
}

interface BulkOperationItem {
  id: string;
  barcode: string;
  article?: ArticleTrackingData;
  operation_data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
}

interface BulkScanData {
  barcodes: string[];
  scan_type: 'check_in' | 'check_out' | 'transfer' | 'delivery' | 'return' | 'inventory';
  warehouse_location_id?: string;
  notes?: string;
  condition_at_scan?: 'good' | 'damaged' | 'wet' | 'torn' | 'missing_parts';
}

export function BulkOperationsInterface() {
  const [selectedTab, setSelectedTab] = useState('scan');
  const [bulkScanInput, setBulkScanInput] = useState('');
  const [scanType, setScanType] = useState<'check_in' | 'check_out' | 'transfer' | 'delivery' | 'return' | 'inventory'>('check_in');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [condition, setCondition] = useState<'good' | 'damaged' | 'wet' | 'torn' | 'missing_parts'>('good');
  const [notes, setNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [operations, setOperations] = useState<BulkOperation[]>([]);
  const [currentOperation, setCurrentOperation] = useState<BulkOperation | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [parsedBarcodes, setParsedBarcodes] = useState<string[]>([]);
  
  const { selectedBranch } = useBranchSelection();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch warehouse locations
  const { data: locations = [] } = useQuery({
    queryKey: ['warehouse-locations'],
    queryFn: () => warehouseService.getWarehouseLocations(),
    enabled: !!selectedBranch
  });

  // Fetch articles for bulk operations
  const { data: articles = [], isLoading: articlesLoading } = useQuery({
    queryKey: ['warehouse-articles', selectedBranch?.id],
    queryFn: () => articleTrackingService.getCurrentLocations({ 
      warehouse_id: selectedBranch?.id 
    }),
    enabled: !!selectedBranch
  });

  // Parse barcodes from input
  const parseBarcodes = (input: string): string[] => {
    return input
      .split(/[\n,;\t\s]+/)
      .map(code => code.trim())
      .filter(code => code.length > 0);
  };

  // Handle barcode input change
  const handleBarcodeInputChange = (value: string) => {
    setBulkScanInput(value);
    const barcodes = parseBarcodes(value);
    setParsedBarcodes(barcodes);
  };

  // Handle file upload for barcodes
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setBulkScanInput(content);
      handleBarcodeInputChange(content);
    };
    reader.readAsText(file);
  };

  // Bulk scan mutation
  const bulkScanMutation = useMutation({
    mutationFn: async (data: BulkScanData) => {
      const operation: BulkOperation = {
        id: `bulk_${Date.now()}`,
        type: 'bulk_scan',
        name: `Bulk ${data.scan_type.replace('_', ' ')} - ${data.barcodes.length} items`,
        description: `Processing ${data.barcodes.length} barcodes for ${data.scan_type}`,
        items: data.barcodes.map(barcode => ({
          id: `item_${barcode}_${Date.now()}`,
          barcode,
          operation_data: data,
          status: 'pending' as const
        })),
        status: 'in_progress',
        progress: 0,
        created_at: new Date()
      };

      setCurrentOperation(operation);
      setOperations(prev => [operation, ...prev]);

      // Process items one by one
      const results: BulkOperationItem[] = [];
      
      for (let i = 0; i < operation.items.length; i++) {
        const item = operation.items[i];
        
        try {
          // Update progress
          setCurrentOperation(prev => prev ? {
            ...prev,
            progress: Math.round(((i + 1) / operation.items.length) * 100)
          } : null);

          // Search for article
          const article = await articleTrackingService.searchByCode(item.barcode);
          if (!article) {
            throw new Error('Article not found');
          }

          // Process scan
          const scanData: ScanArticleData = {
            booking_id: article.booking_id,
            scan_type: data.scan_type,
            warehouse_location_id: data.warehouse_location_id,
            notes: data.notes,
            condition_at_scan: data.condition_at_scan
          };

          await articleTrackingService.scanArticle(scanData);

          // Mark as completed
          const completedItem: BulkOperationItem = {
            ...item,
            article,
            status: 'completed'
          };
          results.push(completedItem);

        } catch (error: any) {
          // Mark as failed
          const failedItem: BulkOperationItem = {
            ...item,
            status: 'failed',
            error_message: error.message
          };
          results.push(failedItem);
        }
      }

      // Finalize operation
      const finalOperation: BulkOperation = {
        ...operation,
        items: results,
        status: results.every(item => item.status === 'completed') ? 'completed' : 'failed',
        progress: 100,
        completed_at: new Date()
      };

      setCurrentOperation(finalOperation);
      setOperations(prev => prev.map(op => op.id === finalOperation.id ? finalOperation : op));

      return finalOperation;
    },
    onSuccess: (operation) => {
      const successCount = operation.items.filter(item => item.status === 'completed').length;
      const failCount = operation.items.filter(item => item.status === 'failed').length;
      
      toast.success(`Bulk operation completed: ${successCount} successful, ${failCount} failed`);
      
      // Clear form
      setBulkScanInput('');
      setParsedBarcodes([]);
      setNotes('');
      setCurrentOperation(null);
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['article-locations'] });
    },
    onError: (error: any) => {
      toast.error(`Bulk operation failed: ${error.message}`);
      setCurrentOperation(null);
    }
  });

  const handleBulkScan = () => {
    if (parsedBarcodes.length === 0) {
      toast.error('Please enter some barcodes');
      return;
    }

    const bulkData: BulkScanData = {
      barcodes: parsedBarcodes,
      scan_type: scanType,
      warehouse_location_id: selectedLocation || undefined,
      notes: notes || undefined,
      condition_at_scan: condition
    };

    bulkScanMutation.mutate(bulkData);
  };

  // Handle item selection
  const handleItemSelection = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(articles.map(article => article.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Bulk Operations</h1>
        <p className="text-muted-foreground mt-1">
          Perform bulk operations on articles and warehouse items
        </p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="scan">Bulk Scan</TabsTrigger>
          <TabsTrigger value="transfer">Bulk Transfer</TabsTrigger>
          <TabsTrigger value="status">Status Update</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Bulk Scan Tab */}
        <TabsContent value="scan" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scan Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Barcode Input
                </CardTitle>
                <CardDescription>
                  Enter barcodes manually or upload from file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Scan Type</Label>
                  <Select value={scanType} onValueChange={(value: any) => setScanType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="check_in">Check In</SelectItem>
                      <SelectItem value="check_out">Check Out</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                      <SelectItem value="return">Return</SelectItem>
                      <SelectItem value="inventory">Inventory Count</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(scanType === 'check_in' || scanType === 'transfer') && (
                  <div className="space-y-2">
                    <Label>Warehouse Location</Label>
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name} ({location.location_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Barcodes</Label>
                  <Textarea
                    value={bulkScanInput}
                    onChange={(e) => handleBarcodeInputChange(e.target.value)}
                    placeholder="Enter barcodes (one per line, comma-separated, or space-separated)..."
                    rows={8}
                    className="font-mono"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Upload File
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {parsedBarcodes.length} barcodes detected
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select value={condition} onValueChange={(value: any) => setCondition(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="damaged">Damaged</SelectItem>
                      <SelectItem value="wet">Wet</SelectItem>
                      <SelectItem value="torn">Torn</SelectItem>
                      <SelectItem value="missing_parts">Missing Parts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes..."
                    rows={2}
                  />
                </div>

                <Button
                  onClick={handleBulkScan}
                  className="w-full"
                  disabled={parsedBarcodes.length === 0 || bulkScanMutation.isPending}
                >
                  {bulkScanMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4 mr-2" />
                      Process {parsedBarcodes.length} Items
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Preview
                </CardTitle>
                <CardDescription>
                  Preview of barcodes to be processed
                </CardDescription>
              </CardHeader>
              <CardContent>
                {parsedBarcodes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No barcodes to preview</p>
                    <p className="text-xs">Enter barcodes to see preview</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {parsedBarcodes.slice(0, 50).map((barcode, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded border text-sm"
                      >
                        <span className="font-mono">{barcode}</span>
                        <Badge variant="outline">{index + 1}</Badge>
                      </div>
                    ))}
                    {parsedBarcodes.length > 50 && (
                      <div className="text-center text-xs text-muted-foreground py-2">
                        ... and {parsedBarcodes.length - 50} more
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Current Operation Progress */}
          {currentOperation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing Operation
                </CardTitle>
                <CardDescription>
                  {currentOperation.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Progress</span>
                    <span>{currentOperation.progress}%</span>
                  </div>
                  <Progress value={currentOperation.progress} />
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {currentOperation.items.filter(item => item.status === 'completed').length}
                      </div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-600">
                        {currentOperation.items.filter(item => item.status === 'failed').length}
                      </div>
                      <div className="text-xs text-muted-foreground">Failed</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">
                        {currentOperation.items.filter(item => item.status === 'pending' || item.status === 'processing').length}
                      </div>
                      <div className="text-xs text-muted-foreground">Pending</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Bulk Transfer Tab */}
        <TabsContent value="transfer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Transfer</CardTitle>
              <CardDescription>
                Transfer multiple articles between warehouse locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <ArrowRight className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Bulk transfer functionality</p>
                <p className="text-xs">Coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status Update Tab */}
        <TabsContent value="status" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Status Update</CardTitle>
              <CardDescription>
                Update status of multiple articles at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Edit className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Bulk status update functionality</p>
                <p className="text-xs">Coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Operation History
              </CardTitle>
              <CardDescription>
                View previous bulk operations and their results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {operations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No operations yet</p>
                  <p className="text-xs">Bulk operations will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {operations.map((operation) => (
                    <div
                      key={operation.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{operation.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(operation.created_at, 'dd/MM/yyyy HH:mm')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {operation.items.length} items • {operation.items.filter(i => i.status === 'completed').length} successful
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={operation.status === 'completed' ? 'default' : 
                                   operation.status === 'failed' ? 'destructive' : 'secondary'}
                        >
                          {operation.status}
                        </Badge>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}