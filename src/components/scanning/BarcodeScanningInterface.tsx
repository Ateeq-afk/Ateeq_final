import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Scan, 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Camera,
  Upload,
  Download,
  Truck,
  Search,
  History,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { articleTrackingService, type ArticleTrackingData, type ScanArticleData } from '@/services/articleTracking';
import { warehouseService } from '@/services/warehouses';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function BarcodeScanningInterface() {
  const [scanInput, setScanInput] = useState('');
  const [scanMode, setScanMode] = useState<'manual' | 'camera'>('manual');
  const [scanType, setScanType] = useState<'check_in' | 'check_out' | 'transfer' | 'delivery' | 'return' | 'inventory'>('check_in');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [condition, setCondition] = useState<'good' | 'damaged' | 'wet' | 'torn' | 'missing_parts'>('good');
  const [scannedArticle, setScannedArticle] = useState<ArticleTrackingData | null>(null);
  const [scanHistory, setScanHistory] = useState<Array<{ code: string; timestamp: Date; success: boolean }>>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { selectedBranch } = useBranchSelection();
  const queryClient = useQueryClient();
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus scan input
  useEffect(() => {
    if (scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, []);

  // Fetch warehouses and locations
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses', selectedBranch?.id],
    queryFn: () => warehouseService.getWarehouses({ branch_id: selectedBranch?.id }),
    enabled: !!selectedBranch
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['warehouse-locations'],
    queryFn: () => warehouseService.getWarehouseLocations(),
    enabled: !!selectedBranch
  });

  // Search article mutation
  const searchArticleMutation = useMutation({
    mutationFn: (code: string) => articleTrackingService.searchByCode(code),
    onSuccess: (data, code) => {
      if (data) {
        setScannedArticle(data);
        setScanHistory(prev => [...prev, { code, timestamp: new Date(), success: true }]);
        toast.success('Article found successfully!');
      } else {
        setScanHistory(prev => [...prev, { code, timestamp: new Date(), success: false }]);
        toast.error('Article not found. Please check the barcode/QR code.');
      }
    },
    onError: (error) => {
      toast.error('Error searching for article. Please try again.');
      console.error('Search error:', error);
    }
  });

  // Scan article mutation
  const scanArticleMutation = useMutation({
    mutationFn: (data: ScanArticleData) => articleTrackingService.scanArticle(data),
    onSuccess: () => {
      toast.success('Article scanned successfully!');
      // Reset form
      setScanInput('');
      setScannedArticle(null);
      setNotes('');
      setCondition('good');
      setIsDialogOpen(false);
      
      // Refetch tracking data
      queryClient.invalidateQueries({ queryKey: ['article-locations'] });
      
      // Focus back to scan input
      if (scanInputRef.current) {
        scanInputRef.current.focus();
      }
    },
    onError: (error) => {
      toast.error('Error scanning article. Please try again.');
      console.error('Scan error:', error);
    }
  });

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    
    searchArticleMutation.mutate(scanInput.trim());
  };

  const handleProcessScan = () => {
    if (!scannedArticle) return;

    const scanData: ScanArticleData = {
      booking_id: scannedArticle.booking_id,
      scan_type: scanType,
      warehouse_location_id: selectedLocation || undefined,
      notes: notes || undefined,
      condition_at_scan: condition
    };

    scanArticleMutation.mutate(scanData);
  };

  const getScanTypeIcon = (type: string) => {
    switch (type) {
      case 'check_in': return <Upload className="h-4 w-4" />;
      case 'check_out': return <Download className="h-4 w-4" />;
      case 'transfer': return <RefreshCw className="h-4 w-4" />;
      case 'delivery': return <Truck className="h-4 w-4" />;
      case 'return': return <RefreshCw className="h-4 w-4" />;
      case 'inventory': return <Package className="h-4 w-4" />;
      default: return <Scan className="h-4 w-4" />;
    }
  };

  const getScanTypeColor = (type: string) => {
    switch (type) {
      case 'check_in': return 'bg-green-100 text-green-800';
      case 'check_out': return 'bg-blue-100 text-blue-800';
      case 'transfer': return 'bg-orange-100 text-orange-800';
      case 'delivery': return 'bg-purple-100 text-purple-800';
      case 'return': return 'bg-red-100 text-red-800';
      case 'inventory': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Barcode Scanning</h1>
        <p className="text-muted-foreground mt-1">
          Scan barcodes/QR codes to track article movements in real-time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanning Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              Scan Article
            </CardTitle>
            <CardDescription>
              Enter barcode manually or use camera to scan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Scan Mode Selection */}
            <div className="flex gap-2">
              <Button
                variant={scanMode === 'manual' ? 'default' : 'outline'}
                onClick={() => setScanMode('manual')}
                className="flex-1"
              >
                <Search className="h-4 w-4 mr-2" />
                Manual Entry
              </Button>
              <Button
                variant={scanMode === 'camera' ? 'default' : 'outline'}
                onClick={() => setScanMode('camera')}
                className="flex-1"
                disabled
              >
                <Camera className="h-4 w-4 mr-2" />
                Camera (Coming Soon)
              </Button>
            </div>

            {/* Scan Input */}
            <form onSubmit={handleScanSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scan-input">Barcode/QR Code</Label>
                <Input
                  id="scan-input"
                  ref={scanInputRef}
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Scan or enter barcode/QR code..."
                  className="text-lg font-mono"
                  disabled={searchArticleMutation.isPending}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={!scanInput.trim() || searchArticleMutation.isPending}
              >
                {searchArticleMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search Article
                  </>
                )}
              </Button>
            </form>

            {/* Scanned Article Display */}
            <AnimatePresence>
              {scannedArticle && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="font-medium">Article Found!</div>
                        <div className="text-sm space-y-1">
                          <div><strong>LR:</strong> {scannedArticle.booking.lr_number}</div>
                          <div><strong>Article:</strong> {scannedArticle.booking.article?.name || 'Unknown'}</div>
                          <div><strong>Customer:</strong> {scannedArticle.booking.customer.name}</div>
                          <div><strong>Current Location:</strong> {scannedArticle.warehouse?.name || scannedArticle.current_location_type}</div>
                        </div>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" className="mt-2">
                              Process Scan
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Process Article Scan</DialogTitle>
                              <DialogDescription>
                                Update the article's location and status
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              {/* Scan Type */}
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

                              {/* Location */}
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

                              {/* Condition */}
                              <div className="space-y-2">
                                <Label>Article Condition</Label>
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

                              {/* Notes */}
                              <div className="space-y-2">
                                <Label>Notes (Optional)</Label>
                                <Textarea
                                  value={notes}
                                  onChange={(e) => setNotes(e.target.value)}
                                  placeholder="Any additional notes..."
                                  rows={3}
                                />
                              </div>

                              <Button 
                                onClick={handleProcessScan}
                                className="w-full"
                                disabled={scanArticleMutation.isPending}
                              >
                                {scanArticleMutation.isPending ? (
                                  <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    {getScanTypeIcon(scanType)}
                                    <span className="ml-2">Process {scanType.replace('_', ' ')}</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Scan History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Scans
            </CardTitle>
            <CardDescription>
              History of scanned items in this session
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scanHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Scan className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No scans yet</p>
                <p className="text-xs">Start scanning to see history</p>
              </div>
            ) : (
              <div className="space-y-2">
                {scanHistory.slice(-10).reverse().map((scan, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-2 rounded border"
                  >
                    <div className="flex items-center gap-2">
                      {scan.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-mono text-sm">{scan.code}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(scan.timestamp, 'HH:mm:ss')}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Scan Types */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common scanning operations for warehouse staff
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { type: 'check_in', label: 'Check In', description: 'Receive at warehouse' },
              { type: 'check_out', label: 'Check Out', description: 'Load for delivery' },
              { type: 'transfer', label: 'Transfer', description: 'Move between locations' },
              { type: 'delivery', label: 'Delivery', description: 'Deliver to customer' },
              { type: 'return', label: 'Return', description: 'Return to warehouse' },
              { type: 'inventory', label: 'Inventory', description: 'Stock counting' }
            ].map((action) => (
              <Button
                key={action.type}
                variant={scanType === action.type ? 'default' : 'outline'}
                onClick={() => setScanType(action.type as any)}
                className="h-auto flex-col p-3 text-center"
              >
                <Badge className={`mb-1 ${getScanTypeColor(action.type)}`}>
                  {getScanTypeIcon(action.type)}
                </Badge>
                <span className="text-xs font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}