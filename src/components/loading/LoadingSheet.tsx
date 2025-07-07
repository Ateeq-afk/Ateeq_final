import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Printer, 
  Download,
  Truck,
  Package,
  MapPin,
  User,
  Calendar,
  Clock,
  Hash,
  Shield,
  Camera,
  CheckSquare,
  Weight,
  DollarSign,
  AlertTriangle,
  Route,
  Phone,
  Mail,
  Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { loadingService } from '@/services/loading';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { format } from 'date-fns';

interface LoadingSheetProps {
  ogpl: any;
  onClose?: () => void;
  onUpdate?: () => void;
}

export default function LoadingSheet({ ogpl, onClose, onUpdate }: LoadingSheetProps) {
  const [sealNumber, setSealNumber] = useState(ogpl.seal_number || '');
  const [loadingNotes, setLoadingNotes] = useState(ogpl.loading_notes || '');
  const [checklist, setChecklist] = useState({
    vehicleInspected: false,
    documentsVerified: false,
    goodsSecured: false,
    sealApplied: false,
    photoCaptured: false,
    driverBriefed: false
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useNotificationSystem();

  // Calculate loading statistics
  const loadingStats = {
    totalBookings: ogpl.loading_records?.length || 0,
    totalWeight: ogpl.loading_records?.reduce((sum: number, record: any) => 
      sum + (record.booking?.actual_weight || 0), 0) || 0,
    totalValue: ogpl.loading_records?.reduce((sum: number, record: any) => 
      sum + (record.booking?.total_amount || 0), 0) || 0,
    totalArticles: ogpl.loading_records?.reduce((sum: number, record: any) => 
      sum + (record.booking?.quantity || 0), 0) || 0
  };

  // Group bookings by destination
  const bookingsByDestination = ogpl.loading_records?.reduce((acc: any, record: any) => {
    const destination = record.booking?.to_branch_details?.name || 'Unknown';
    if (!acc[destination]) {
      acc[destination] = [];
    }
    acc[destination].push(record.booking);
    return acc;
  }, {}) || {};

  // Handle photo capture
  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newPhotos: string[] = [];
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newPhotos.push(e.target.result as string);
            if (newPhotos.length === files.length) {
              setPhotos(prev => [...prev, ...newPhotos]);
              setChecklist(prev => ({ ...prev, photoCaptured: true }));
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Update OGPL with seal number and notes
      await loadingService.updateOGPL(ogpl.id, {
        remarks: `${ogpl.remarks || ''}\nSeal: ${sealNumber}\nLoading Notes: ${loadingNotes}`.trim()
      });

      // Update OGPL status if all checklist items are complete
      const allChecked = Object.values(checklist).every(v => v);
      if (allChecked && ogpl.status === 'created') {
        await loadingService.updateOGPLStatus(ogpl.id, 'in_transit');
      }

      showSuccess('Loading Sheet Updated', 'Loading details saved successfully');
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to save loading sheet:', err);
      showError('Save Failed', 'Failed to save loading sheet details');
    } finally {
      setSaving(false);
    }
  };

  // Handle print
  const handlePrint = () => {
    const printContent = generatePrintHTML();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  // Generate print HTML
  const generatePrintHTML = () => {
    const formatDate = (date: string) => format(new Date(date), 'dd MMM yyyy');
    const formatTime = (date: string) => format(new Date(date), 'hh:mm a');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Loading Sheet - ${ogpl.ogpl_number}</title>
        <style>
          @page { size: A4; margin: 10mm; }
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 100%; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { margin: 0; color: #1a365d; font-size: 24px; }
          .header h2 { margin: 5px 0; color: #e53e3e; font-size: 18px; }
          .header p { margin: 5px 0; color: #666; }
          
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .info-section { border: 1px solid #e2e8f0; padding: 15px; border-radius: 5px; }
          .info-section h3 { margin: 0 0 10px 0; color: #2d3748; font-size: 14px; text-transform: uppercase; }
          .info-row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; }
          .info-label { color: #666; }
          .info-value { font-weight: bold; color: #1a365d; }
          
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
          .stat-box { border: 1px solid #e2e8f0; padding: 10px; text-align: center; border-radius: 5px; }
          .stat-value { font-size: 20px; font-weight: bold; color: #1a365d; }
          .stat-label { font-size: 10px; color: #666; margin-top: 5px; }
          
          .bookings-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .bookings-table th, .bookings-table td { border: 1px solid #e2e8f0; padding: 8px; font-size: 11px; }
          .bookings-table th { background: #f7fafc; font-weight: bold; text-align: left; }
          .bookings-table tr:nth-child(even) { background: #f8f9fa; }
          
          .checklist { margin-bottom: 20px; }
          .checklist h3 { margin: 0 0 10px 0; color: #2d3748; font-size: 14px; }
          .checklist-item { margin: 5px 0; font-size: 12px; }
          .checkbox { display: inline-block; width: 15px; height: 15px; border: 1px solid #333; margin-right: 10px; vertical-align: middle; }
          .checkbox.checked::after { content: "✓"; display: block; text-align: center; line-height: 15px; }
          
          .signature-section { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 40px; }
          .signature-box { text-align: center; }
          .signature-line { border-top: 1px solid #333; margin: 40px 0 5px 0; }
          .signature-label { font-size: 11px; color: #666; }
          
          .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #999; }
          
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>LOADING SHEET</h1>
            <h2>${ogpl.ogpl_number}</h2>
            <p>Generated on ${formatDate(new Date().toISOString())} at ${formatTime(new Date().toISOString())}</p>
          </div>
          
          <div class="info-grid">
            <div class="info-section">
              <h3>Vehicle Details</h3>
              <div class="info-row">
                <span class="info-label">Vehicle Number:</span>
                <span class="info-value">${ogpl.vehicle?.vehicle_number || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Vehicle Type:</span>
                <span class="info-value">${ogpl.vehicle?.type || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Transit Date:</span>
                <span class="info-value">${formatDate(ogpl.transit_date)}</span>
              </div>
              ${sealNumber ? `
              <div class="info-row">
                <span class="info-label">Seal Number:</span>
                <span class="info-value">${sealNumber}</span>
              </div>
              ` : ''}
            </div>
            
            <div class="info-section">
              <h3>Driver Details</h3>
              <div class="info-row">
                <span class="info-label">Primary Driver:</span>
                <span class="info-value">${ogpl.primary_driver_name}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Mobile:</span>
                <span class="info-value">${ogpl.primary_driver_mobile}</span>
              </div>
              ${ogpl.secondary_driver_name ? `
              <div class="info-row">
                <span class="info-label">Secondary Driver:</span>
                <span class="info-value">${ogpl.secondary_driver_name}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Mobile:</span>
                <span class="info-value">${ogpl.secondary_driver_mobile}</span>
              </div>
              ` : ''}
            </div>
          </div>
          
          <div class="info-grid">
            <div class="info-section">
              <h3>Route Information</h3>
              <div class="info-row">
                <span class="info-label">From:</span>
                <span class="info-value">${ogpl.from_station?.name || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">To:</span>
                <span class="info-value">${ogpl.to_station?.name || 'N/A'}</span>
              </div>
            </div>
            
            <div class="info-section">
              <h3>Loading Summary</h3>
              <div class="info-row">
                <span class="info-label">Total Bookings:</span>
                <span class="info-value">${loadingStats.totalBookings}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Total Weight:</span>
                <span class="info-value">${loadingStats.totalWeight.toFixed(2)} kg</span>
              </div>
              <div class="info-row">
                <span class="info-label">Total Value:</span>
                <span class="info-value">₹${loadingStats.totalValue.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-value">${loadingStats.totalBookings}</div>
              <div class="stat-label">TOTAL LRs</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${loadingStats.totalArticles}</div>
              <div class="stat-label">TOTAL ARTICLES</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${loadingStats.totalWeight.toFixed(1)}</div>
              <div class="stat-label">WEIGHT (KG)</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">₹${(loadingStats.totalValue / 1000).toFixed(1)}K</div>
              <div class="stat-label">TOTAL VALUE</div>
            </div>
          </div>
          
          <h3 style="margin: 20px 0 10px 0; color: #2d3748; font-size: 14px;">BOOKING DETAILS</h3>
          <table class="bookings-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>LR Number</th>
                <th>Sender</th>
                <th>Receiver</th>
                <th>Destination</th>
                <th>Article</th>
                <th>Qty</th>
                <th>Weight</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${ogpl.loading_records?.map((record: any, index: number) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${record.booking?.lr_number || 'N/A'}</td>
                  <td>${record.booking?.sender?.name || 'N/A'}</td>
                  <td>${record.booking?.receiver?.name || 'N/A'}</td>
                  <td>${record.booking?.to_branch_details?.city || 'N/A'}</td>
                  <td>${record.booking?.article?.name || 'N/A'}</td>
                  <td>${record.booking?.quantity || 0} ${record.booking?.uom || ''}</td>
                  <td>${record.booking?.actual_weight || 0} kg</td>
                  <td>₹${record.booking?.total_amount?.toFixed(2) || '0.00'}</td>
                </tr>
              `).join('') || '<tr><td colspan="9" style="text-align: center;">No bookings loaded</td></tr>'}
            </tbody>
          </table>
          
          <div class="checklist">
            <h3>Loading Checklist</h3>
            <div class="checklist-item">
              <span class="checkbox ${checklist.vehicleInspected ? 'checked' : ''}"></span>
              Vehicle Inspected
            </div>
            <div class="checklist-item">
              <span class="checkbox ${checklist.documentsVerified ? 'checked' : ''}"></span>
              Documents Verified
            </div>
            <div class="checklist-item">
              <span class="checkbox ${checklist.goodsSecured ? 'checked' : ''}"></span>
              Goods Properly Secured
            </div>
            <div class="checklist-item">
              <span class="checkbox ${checklist.sealApplied ? 'checked' : ''}"></span>
              Seal Applied & Verified
            </div>
            <div class="checklist-item">
              <span class="checkbox ${checklist.photoCaptured ? 'checked' : ''}"></span>
              Loading Photos Captured
            </div>
            <div class="checklist-item">
              <span class="checkbox ${checklist.driverBriefed ? 'checked' : ''}"></span>
              Driver Briefed
            </div>
          </div>
          
          ${loadingNotes ? `
          <div style="margin: 20px 0; padding: 10px; border: 1px solid #e2e8f0; border-radius: 5px;">
            <h3 style="margin: 0 0 10px 0; color: #2d3748; font-size: 14px;">LOADING NOTES</h3>
            <p style="margin: 0; font-size: 12px; white-space: pre-wrap;">${loadingNotes}</p>
          </div>
          ` : ''}
          
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">Loading Supervisor</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">Driver Signature</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">Branch Manager</div>
            </div>
          </div>
          
          <div class="footer">
            <p>This is a computer generated document</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Loading Sheet</h2>
            <p className="text-gray-600">OGPL: {ogpl.ogpl_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Vehicle & Route Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Vehicle Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Vehicle Number:</span>
                <span className="font-medium">{ogpl.vehicle?.vehicle_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vehicle Type:</span>
                <span className="font-medium capitalize">{ogpl.vehicle?.type || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transit Date:</span>
                <span className="font-medium">{format(new Date(ogpl.transit_date), 'dd MMM yyyy')}</span>
              </div>
              <Separator />
              <div>
                <Label htmlFor="seal-number">Seal Number</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <Input
                    id="seal-number"
                    value={sealNumber}
                    onChange={(e) => setSealNumber(e.target.value)}
                    placeholder="Enter seal number"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Driver Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Primary Driver</p>
                <p className="font-medium">{ogpl.primary_driver_name}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <Phone className="h-3 w-3" />
                  {ogpl.primary_driver_mobile}
                </p>
              </div>
              {ogpl.secondary_driver_name && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-600">Secondary Driver</p>
                    <p className="font-medium">{ogpl.secondary_driver_name}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3" />
                      {ogpl.secondary_driver_mobile}
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Route Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Route Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <MapPin className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="font-medium text-lg">{ogpl.from_station?.name || 'N/A'}</p>
              <p className="text-sm text-gray-500">{ogpl.from_station?.city || 'N/A'}</p>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="h-0.5 bg-gray-300 flex-1"></div>
              <Truck className="h-6 w-6 text-gray-400 mx-4" />
              <div className="h-0.5 bg-gray-300 flex-1"></div>
            </div>
            <div className="text-center">
              <MapPin className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="font-medium text-lg">{ogpl.to_station?.name || 'N/A'}</p>
              <p className="text-sm text-gray-500">{ogpl.to_station?.city || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total LRs</p>
                <p className="text-2xl font-bold">{loadingStats.totalBookings}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Articles</p>
                <p className="text-2xl font-bold">{loadingStats.totalArticles}</p>
              </div>
              <Hash className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Weight</p>
                <p className="text-2xl font-bold">{loadingStats.totalWeight.toFixed(1)} kg</p>
              </div>
              <Weight className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">₹{(loadingStats.totalValue / 1000).toFixed(1)}K</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings by Destination */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings by Destination</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(bookingsByDestination).map(([destination, bookings]: [string, any]) => (
            <div key={destination} className="mb-4 last:mb-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {destination}
                </h4>
                <Badge variant="secondary">{bookings.length} LRs</Badge>
              </div>
              <div className="space-y-1">
                {bookings.map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                    <span className="font-medium text-blue-600">{booking.lr_number}</span>
                    <span>{booking.sender?.name || 'N/A'} → {booking.receiver?.name || 'N/A'}</span>
                    <span className="text-gray-500">{booking.quantity} {booking.uom}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Loading Supervision Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Loading Supervision Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <Checkbox
                checked={checklist.vehicleInspected}
                onCheckedChange={(checked) => 
                  setChecklist(prev => ({ ...prev, vehicleInspected: checked as boolean }))}
              />
              <span className="text-sm font-medium">Vehicle Inspected (Cleanliness, Damage, Capacity)</span>
            </label>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <Checkbox
                checked={checklist.documentsVerified}
                onCheckedChange={(checked) => 
                  setChecklist(prev => ({ ...prev, documentsVerified: checked as boolean }))}
              />
              <span className="text-sm font-medium">All Documents Verified (LRs, Invoices, E-way Bills)</span>
            </label>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <Checkbox
                checked={checklist.goodsSecured}
                onCheckedChange={(checked) => 
                  setChecklist(prev => ({ ...prev, goodsSecured: checked as boolean }))}
              />
              <span className="text-sm font-medium">Goods Properly Secured & Arranged</span>
            </label>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <Checkbox
                checked={checklist.sealApplied}
                onCheckedChange={(checked) => 
                  setChecklist(prev => ({ ...prev, sealApplied: checked as boolean }))}
              />
              <span className="text-sm font-medium">Seal Applied & Number Recorded</span>
            </label>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <Checkbox
                checked={checklist.photoCaptured}
                onCheckedChange={(checked) => 
                  setChecklist(prev => ({ ...prev, photoCaptured: checked as boolean }))}
              />
              <span className="text-sm font-medium">Loading Photos Captured</span>
            </label>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <Checkbox
                checked={checklist.driverBriefed}
                onCheckedChange={(checked) => 
                  setChecklist(prev => ({ ...prev, driverBriefed: checked as boolean }))}
              />
              <span className="text-sm font-medium">Driver Briefed on Route & Safety</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Photo Capture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Loading Photos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                onChange={handlePhotoCapture}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Camera className="h-4 w-4 mr-2" />
                Capture/Upload Photos
              </Button>
            </div>
            
            {photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Loading photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => setPhotos(prev => prev.filter((_, i) => i !== index))}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Loading Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={loadingNotes}
            onChange={(e) => setLoadingNotes(e.target.value)}
            placeholder="Add any special instructions, observations, or issues..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Loading Sheet'}
        </Button>
      </div>
    </div>
  );
}