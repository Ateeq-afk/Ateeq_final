import React, { useState, useRef, useEffect } from 'react';
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
  RefreshCw,
  Plus,
  Minus,
  MoreVertical,
  Zap,
  Target,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import { articleTrackingService, type ArticleTrackingData, type ScanArticleData } from '@/services/articleTracking';
import { warehouseService } from '@/services/warehouses';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface QuickScanItem {
  code: string;
  scanType: string;
  location?: string;
  timestamp: Date;
  success: boolean;
  article?: ArticleTrackingData;
}

interface ScanSession {
  id: string;
  startTime: Date;
  scannedItems: QuickScanItem[];
  currentLocation: string;
  userId: string;
}

export function MobileScanningInterface() {
  const [scanInput, setScanInput] = useState('');
  const [quickScanMode, setQuickScanMode] = useState(true);
  const [scanType, setScanType] = useState<'check_in' | 'check_out' | 'transfer' | 'delivery' | 'return' | 'inventory'>('check_in');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [condition, setCondition] = useState<'good' | 'damaged' | 'wet' | 'torn' | 'missing_parts'>('good');
  const [scanSession, setScanSession] = useState<ScanSession | null>(null);
  const [recentScans, setRecentScans] = useState<QuickScanItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [continuousMode, setContinuousMode] = useState(true);
  
  const { selectedBranch } = useBranchSelection();
  const queryClient = useQueryClient();
  const scanInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Initialize scan session
  useEffect(() => {
    if (!scanSession) {
      const session: ScanSession = {
        id: `session_${Date.now()}`,
        startTime: new Date(),
        scannedItems: [],
        currentLocation: selectedLocation,
        userId: 'current_user' // Replace with actual user ID
      };
      setScanSession(session);
    }
  }, [selectedLocation, scanSession]);

  // Auto-focus scan input
  useEffect(() => {
    if (scanInputRef.current && quickScanMode) {
      scanInputRef.current.focus();
    }
  }, [quickScanMode, recentScans]);

  // Fetch warehouses and locations
  const { data: locations = [] } = useQuery({
    queryKey: ['warehouse-locations'],
    queryFn: () => warehouseService.getWarehouseLocations(),
    enabled: !!selectedBranch
  });

  // Search and scan mutation
  const quickScanMutation = useMutation({
    mutationFn: async ({ code, scanType, location }: { code: string; scanType: string; location?: string }) => {
      setIsProcessing(true);
      
      // First, search for the article
      const article = await articleTrackingService.searchByCode(code);
      if (!article) {
        throw new Error('Article not found');
      }

      // Then process the scan
      const scanData: ScanArticleData = {
        booking_id: article.booking_id,
        scan_type: scanType as any,
        warehouse_location_id: location,
        condition_at_scan: condition
      };

      await articleTrackingService.scanArticle(scanData);
      return { article, success: true };
    },
    onSuccess: (data, variables) => {
      const scanItem: QuickScanItem = {
        code: variables.code,
        scanType: variables.scanType,
        location: variables.location,
        timestamp: new Date(),
        success: true,
        article: data.article
      };

      setRecentScans(prev => [scanItem, ...prev.slice(0, 19)]); // Keep last 20 scans
      
      if (scanSession) {
        setScanSession({
          ...scanSession,
          scannedItems: [scanItem, ...scanSession.scannedItems]
        });
      }

      // Audio feedback
      if (soundEnabled) {
        playSuccessSound();
      }

      // Haptic feedback
      if (vibrationEnabled && 'vibrate' in navigator) {
        navigator.vibrate(100);
      }

      toast.success(`✅ ${variables.scanType.replace('_', ' ')} successful`);
      
      // Clear input for next scan in continuous mode
      if (continuousMode) {
        setScanInput('');
        if (scanInputRef.current) {
          scanInputRef.current.focus();
        }
      }

      queryClient.invalidateQueries({ queryKey: ['article-locations'] });
    },
    onError: (error: any, variables) => {
      const scanItem: QuickScanItem = {
        code: variables.code,
        scanType: variables.scanType,
        timestamp: new Date(),
        success: false
      };

      setRecentScans(prev => [scanItem, ...prev.slice(0, 19)]);

      // Error audio feedback
      if (soundEnabled) {
        playErrorSound();
      }

      // Error haptic feedback
      if (vibrationEnabled && 'vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }

      toast.error(`❌ ${error.message || 'Scan failed'}`);
    },
    onSettled: () => {
      setIsProcessing(false);
    }
  });

  // Audio feedback functions
  const playSuccessSound = () => {
    // Create success beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const playErrorSound = () => {
    // Create error buzz sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 200;
    oscillator.type = 'sawtooth';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const handleQuickScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim() || isProcessing) return;
    
    quickScanMutation.mutate({
      code: scanInput.trim(),
      scanType,
      location: selectedLocation || undefined
    });
  };

  const getScanTypeIcon = (type: string) => {
    const iconClass = "h-5 w-5";
    switch (type) {
      case 'check_in': return <Upload className={iconClass} />;
      case 'check_out': return <Download className={iconClass} />;
      case 'transfer': return <RefreshCw className={iconClass} />;
      case 'delivery': return <Truck className={iconClass} />;
      case 'return': return <RefreshCw className={iconClass} />;
      case 'inventory': return <Package className={iconClass} />;
      default: return <Scan className={iconClass} />;
    }
  };

  const getScanTypeColor = (type: string) => {
    switch (type) {
      case 'check_in': return 'bg-green-500 text-white';
      case 'check_out': return 'bg-blue-500 text-white';
      case 'transfer': return 'bg-orange-500 text-white';
      case 'delivery': return 'bg-purple-500 text-white';
      case 'return': return 'bg-red-500 text-white';
      case 'inventory': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="text-center py-2">
        <h1 className="text-2xl font-bold">Mobile Scanner</h1>
        <p className="text-sm text-muted-foreground">
          Quick barcode scanning for warehouse operations
        </p>
      </div>

      {/* Scan Type Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              { type: 'check_in', label: 'In', description: 'Check In' },
              { type: 'check_out', label: 'Out', description: 'Check Out' },
              { type: 'transfer', label: 'Move', description: 'Transfer' },
              { type: 'delivery', label: 'Ship', description: 'Delivery' },
              { type: 'return', label: 'Back', description: 'Return' },
              { type: 'inventory', label: 'Count', description: 'Inventory' }
            ].map((action) => (
              <Button
                key={action.type}
                variant={scanType === action.type ? 'default' : 'outline'}
                onClick={() => setScanType(action.type as any)}
                className={cn(
                  "h-16 flex-col p-2 text-xs",
                  scanType === action.type && getScanTypeColor(action.type)
                )}
              >
                {getScanTypeIcon(action.type)}
                <span className="mt-1 font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Location Selection */}
      {(scanType === 'check_in' || scanType === 'transfer') && (
        <Card>
          <CardContent className="p-4">
            <Label className="text-sm font-medium">Warehouse Location</Label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="mt-2">
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
          </CardContent>
        </Card>
      )}

      {/* Quick Scan Interface */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleQuickScan} className="space-y-4">
            <div className="relative">
              <Input
                ref={scanInputRef}
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Scan barcode here..."
                className="text-lg font-mono h-14 pr-12"
                disabled={isProcessing}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-1 top-1 h-12 w-12"
                disabled={!scanInput.trim() || isProcessing}
              >
                {isProcessing ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Scan className="h-5 w-5" />
                )}
              </Button>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setScanInput('')}
                disabled={isProcessing}
              >
                Clear
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  // Simulate camera scan (placeholder)
                  toast.info('Camera scanning coming soon!');
                }}
                disabled={isProcessing}
              >
                <Camera className="h-4 w-4 mr-1" />
                Camera
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Session Stats */}
      {scanSession && recentScans.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {recentScans.filter(s => s.success).length}
                </div>
                <div className="text-xs text-muted-foreground">Success</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {recentScans.filter(s => !s.success).length}
                </div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Math.floor((Date.now() - scanSession.startTime.getTime()) / 60000)}m
                </div>
                <div className="text-xs text-muted-foreground">Session</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Scans */}
      {recentScans.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-4 w-4" />
              Recent Scans
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <AnimatePresence>
                {recentScans.slice(0, 10).map((scan, index) => (
                  <motion.div
                    key={`${scan.code}-${scan.timestamp.getTime()}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg border",
                      scan.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                    )}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0",
                        scan.success ? "bg-green-500" : "bg-red-500"
                      )}>
                        {scan.success ? (
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-sm truncate">{scan.code}</div>
                        {scan.article && (
                          <div className="text-xs text-muted-foreground truncate">
                            {scan.article.booking.article?.name} - {scan.article.booking.customer.name}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(scan.timestamp, 'HH:mm')}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="sound" className="text-sm">Sound feedback</Label>
            <Switch
              id="sound"
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="vibration" className="text-sm">Vibration</Label>
            <Switch
              id="vibration"
              checked={vibrationEnabled}
              onCheckedChange={setVibrationEnabled}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="continuous" className="text-sm">Continuous mode</Label>
            <Switch
              id="continuous"
              checked={continuousMode}
              onCheckedChange={setContinuousMode}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}