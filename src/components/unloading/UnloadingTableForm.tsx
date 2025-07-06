import React, { useState, useEffect } from 'react';
import { 
  Package, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  Camera, 
  X, 
  Truck, 
  MapPin, 
  Calendar, 
  User, 
  FileText,
  Scale,
  IndianRupee,
  Phone,
  Building2,
  Hash,
  Printer,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { motion } from 'framer-motion';
import type { OGPL } from '@/types';

interface UnloadingTableFormProps {
  ogpl: OGPL;
  onSubmit: (ogplId: string, bookingIds: string[], conditions: any) => Promise<void>;
  onClose: () => void;
}

export default function UnloadingTableForm({ ogpl, onSubmit, onClose }: UnloadingTableFormProps) {
  const [conditions, setConditions] = useState<Record<string, { status: string; remarks?: string; photo?: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [photoUploads, setPhotoUploads] = useState<Record<string, File | null>>({});
  const { showSuccess, showError } = useNotificationSystem();

  // Initialize conditions for all bookings
  useEffect(() => {
    if (ogpl.loading_records?.length) {
      const initialConditions = {};
      ogpl.loading_records.forEach(record => {
        if (record.booking_id) {
          initialConditions[record.booking_id] = { 
            status: 'good',
            remarks: ''
          };
        }
      });
      setConditions(initialConditions);
    }
  }, [ogpl.loading_records]);

  const updateCondition = (bookingId: string, field: string, value: string) => {
    setConditions(prev => ({
      ...prev,
      [bookingId]: {
        ...prev[bookingId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      // Validate that all damaged/missing items have remarks
      const hasInvalidEntries = Object.entries(conditions).some(([bookingId, condition]) => {
        if ((condition.status === 'damaged' || condition.status === 'missing') && !condition.remarks?.trim()) {
          showError('Validation Error', 'Please provide remarks for all damaged/missing items');
          return true;
        }
        return false;
      });

      if (hasInvalidEntries) {
        return;
      }

      const bookingIds = ogpl.loading_records?.map(record => record.booking_id).filter(Boolean) || [];
      await onSubmit(ogpl.id, bookingIds, conditions);
      
      showSuccess('Unloading Complete', 'OGPL has been successfully unloaded');
      onClose();
    } catch (error) {
      console.error('Failed to unload OGPL:', error);
      showError('Unloading Failed', error instanceof Error ? error.message : 'Failed to unload OGPL');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalWeight = () => {
    return ogpl.loading_records?.reduce((total, record) => {
      return total + (record.booking?.actual_weight || 0);
    }, 0) || 0;
  };

  const getTotalValue = () => {
    return ogpl.loading_records?.reduce((total, record) => {
      return total + (record.booking?.total_amount || 0);
    }, 0) || 0;
  };

  const getStatusStats = () => {
    const stats = { good: 0, damaged: 0, missing: 0 };
    Object.values(conditions).forEach(condition => {
      stats[condition.status as keyof typeof stats]++;
    });
    return stats;
  };

  const statusStats = getStatusStats();
  const totalBookings = ogpl.loading_records?.length || 0;

  const printOGPL = () => {
    const printContent = `
      <div style="font-family: Arial, sans-serif; max-width: 210mm; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="margin: 0; color: #1a365d;">OGPL UNLOADING REPORT</h1>
          <h2 style="margin: 10px 0; color: #e53e3e;">${ogpl.ogpl_number}</h2>
          <p style="margin: 5px 0; color: #666;">Generated on: ${formatDate(new Date().toISOString())}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div style="background: #f7fafc; padding: 15px; border-radius: 8px;">
            <h3 style="margin: 0 0 10px 0; color: #2d3748;">Route Information</h3>
            <p><strong>From:</strong> ${ogpl.from_station?.name || 'N/A'}</p>
            <p><strong>To:</strong> ${ogpl.to_station?.name || 'N/A'}</p>
            <p><strong>Vehicle:</strong> ${ogpl.vehicle?.vehicle_number || 'N/A'}</p>
            <p><strong>Driver:</strong> ${ogpl.primary_driver_name || 'N/A'}</p>
          </div>
          
          <div style="background: #f7fafc; padding: 15px; border-radius: 8px;">
            <h3 style="margin: 0 0 10px 0; color: #2d3748;">Summary</h3>
            <p><strong>Total LRs:</strong> ${totalBookings}</p>
            <p><strong>Total Weight:</strong> ${getTotalWeight().toFixed(2)} kg</p>
            <p><strong>Total Value:</strong> ₹${getTotalValue().toFixed(2)}</p>
            <p><strong>Status:</strong> ${ogpl.status?.toUpperCase()}</p>
          </div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px;">
          <thead>
            <tr style="background: #edf2f7;">
              <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: left;">LR No</th>
              <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: left;">Sender</th>
              <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: left;">Receiver</th>
              <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: left;">Article</th>
              <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: center;">Qty</th>
              <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: center;">Weight</th>
              <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: right;">Amount</th>
              <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: center;">Condition</th>
              <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: left;">Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${ogpl.loading_records?.map(record => {
              const booking = record.booking;
              const condition = conditions[booking?.id || ''];
              return `
                <tr>
                  <td style="border: 1px solid #e2e8f0; padding: 8px; font-weight: bold; color: #2563eb;">${booking?.lr_number || 'N/A'}</td>
                  <td style="border: 1px solid #e2e8f0; padding: 8px;">
                    <div style="font-weight: bold;">${booking?.sender?.name || 'N/A'}</div>
                    <div style="font-size: 8px; color: #666;">${booking?.sender?.mobile || 'N/A'}</div>
                  </td>
                  <td style="border: 1px solid #e2e8f0; padding: 8px;">
                    <div style="font-weight: bold;">${booking?.receiver?.name || 'N/A'}</div>
                    <div style="font-size: 8px; color: #666;">${booking?.receiver?.mobile || 'N/A'}</div>
                  </td>
                  <td style="border: 1px solid #e2e8f0; padding: 8px;">${booking?.article?.name || 'N/A'}</td>
                  <td style="border: 1px solid #e2e8f0; padding: 8px; text-align: center;">${booking?.quantity || 0} ${booking?.uom || ''}</td>
                  <td style="border: 1px solid #e2e8f0; padding: 8px; text-align: center;">${booking?.actual_weight || 0} kg</td>
                  <td style="border: 1px solid #e2e8f0; padding: 8px; text-align: right;">₹${booking?.total_amount?.toFixed(2) || '0.00'}</td>
                  <td style="border: 1px solid #e2e8f0; padding: 8px; text-align: center;">
                    <span style="padding: 4px 8px; border-radius: 4px; font-size: 8px; font-weight: bold; color: white; background: ${condition?.status === 'good' ? '#38a169' : condition?.status === 'damaged' ? '#ed8936' : '#e53e3e'};">
                      ${condition?.status?.toUpperCase() || 'GOOD'}
                    </span>
                  </td>
                  <td style="border: 1px solid #e2e8f0; padding: 8px; font-size: 8px;">${condition?.remarks || '-'}</td>
                </tr>
              `;
            }).join('') || ''}
          </tbody>
        </table>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 30px;">
          <div style="text-align: center; border: 1px solid #e2e8f0; padding: 20px;">
            <div style="border-top: 1px solid #000; margin-bottom: 10px; height: 40px;"></div>
            <p style="font-weight: bold; margin: 0;">Unloaded By</p>
            <p style="font-size: 10px; color: #666; margin: 5px 0 0 0;">Signature & Date</p>
          </div>
          <div style="text-align: center; border: 1px solid #e2e8f0; padding: 20px;">
            <div style="border-top: 1px solid #000; margin-bottom: 10px; height: 40px;"></div>
            <p style="font-weight: bold; margin: 0;">Verified By</p>
            <p style="font-size: 10px; color: #666; margin: 5px 0 0 0;">Signature & Date</p>
          </div>
          <div style="text-align: center; border: 1px solid #e2e8f0; padding: 20px;">
            <div style="border-top: 1px solid #000; margin-bottom: 10px; height: 40px;"></div>
            <p style="font-weight: bold; margin: 0;">Authorized By</p>
            <p style="font-size: 10px; color: #666; margin: 5px 0 0 0;">Signature & Date</p>
          </div>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>OGPL Unloading Report - ${ogpl.ogpl_number}</title>
            <style>
              @media print {
                @page { size: A4; margin: 10mm; }
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Truck className="h-8 w-8" />
                <div>
                  <h1 className="text-2xl font-bold">Unload OGPL</h1>
                  <p className="text-green-100">{ogpl.ogpl_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={printOGPL}
                  className="text-white hover:bg-white/20"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Report
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
                  <X className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>

          {/* OGPL Information */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Route</p>
                      <p className="font-semibold">{ogpl.from_station?.name} → {ogpl.to_station?.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Vehicle</p>
                      <p className="font-semibold">{ogpl.vehicle?.vehicle_number || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Driver</p>
                      <p className="font-semibold">{ogpl.primary_driver_name || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">Created</p>
                      <p className="font-semibold">{formatDate(ogpl.created_at)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalBookings}</div>
                <div className="text-sm text-gray-600">Total LRs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{statusStats.good}</div>
                <div className="text-sm text-gray-600">Good</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{statusStats.damaged}</div>
                <div className="text-sm text-gray-600">Damaged</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{statusStats.missing}</div>
                <div className="text-sm text-gray-600">Missing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{getTotalWeight().toFixed(1)}</div>
                <div className="text-sm text-gray-600">Kg Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">₹{getTotalValue().toFixed(0)}</div>
                <div className="text-sm text-gray-600">Value</div>
              </div>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="text-left text-sm font-semibold text-gray-700 px-4 py-3">LR Details</th>
                    <th className="text-left text-sm font-semibold text-gray-700 px-4 py-3">Sender</th>
                    <th className="text-left text-sm font-semibold text-gray-700 px-4 py-3">Receiver</th>
                    <th className="text-left text-sm font-semibold text-gray-700 px-4 py-3">Article</th>
                    <th className="text-center text-sm font-semibold text-gray-700 px-4 py-3">Qty/Weight</th>
                    <th className="text-right text-sm font-semibold text-gray-700 px-4 py-3">Amount</th>
                    <th className="text-center text-sm font-semibold text-gray-700 px-4 py-3">Condition</th>
                    <th className="text-left text-sm font-semibold text-gray-700 px-4 py-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ogpl.loading_records?.map((record, index) => {
                    const booking = record.booking;
                    const bookingId = booking?.id || '';
                    const condition = conditions[bookingId] || { status: 'good', remarks: '' };

                    return (
                      <tr key={bookingId || index} className="hover:bg-gray-50">
                        {/* LR Details */}
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Hash className="h-4 w-4 text-blue-600" />
                              <span className="font-semibold text-blue-600">{booking?.lr_number || 'N/A'}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {booking?.payment_type && (
                                <Badge variant={booking.payment_type === 'Paid' ? 'default' : 'secondary'} className="text-xs">
                                  {booking.payment_type}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Sender */}
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900">{booking?.sender?.name || 'N/A'}</div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Phone className="h-3 w-3" />
                              {booking?.sender?.mobile || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500 truncate max-w-32">
                              {booking?.sender?.address || 'N/A'}
                            </div>
                          </div>
                        </td>

                        {/* Receiver */}
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900">{booking?.receiver?.name || 'N/A'}</div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Phone className="h-3 w-3" />
                              {booking?.receiver?.mobile || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500 truncate max-w-32">
                              {booking?.receiver?.address || 'N/A'}
                            </div>
                          </div>
                        </td>

                        {/* Article */}
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900">{booking?.article?.name || 'N/A'}</div>
                            <div className="text-xs text-gray-500">{booking?.description || '-'}</div>
                          </div>
                        </td>

                        {/* Quantity/Weight */}
                        <td className="px-4 py-4 text-center">
                          <div className="space-y-1">
                            <div className="flex items-center justify-center gap-1">
                              <Package className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{booking?.quantity || 0} {booking?.uom || ''}</span>
                            </div>
                            <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                              <Scale className="h-3 w-3" />
                              {booking?.actual_weight || 0} kg
                            </div>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <IndianRupee className="h-4 w-4 text-green-600" />
                            <span className="font-semibold text-green-600">
                              {booking?.total_amount?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                        </td>

                        {/* Condition */}
                        <td className="px-4 py-4">
                          <Select
                            value={condition.status}
                            onValueChange={(value) => updateCondition(bookingId, 'status', value)}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="good">
                                <span className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  Good
                                </span>
                              </SelectItem>
                              <SelectItem value="damaged">
                                <span className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                  Damaged
                                </span>
                              </SelectItem>
                              <SelectItem value="missing">
                                <span className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  Missing
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </td>

                        {/* Remarks */}
                        <td className="px-4 py-4">
                          <div className="space-y-2">
                            <Textarea
                              placeholder={condition.status === 'good' ? 'Optional remarks' : 'Required remarks'}
                              value={condition.remarks || ''}
                              onChange={(e) => updateCondition(bookingId, 'remarks', e.target.value)}
                              className={`min-h-16 text-xs ${
                                condition.status !== 'good' && !condition.remarks?.trim() 
                                  ? 'border-red-300 focus:border-red-500' 
                                  : ''
                              }`}
                              rows={2}
                            />
                            {condition.status !== 'good' && !condition.remarks?.trim() && (
                              <p className="text-xs text-red-500">Remarks required for {condition.status} items</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Total: <span className="font-semibold">{totalBookings} items</span>
                </div>
                <div className="text-sm text-gray-600">
                  Weight: <span className="font-semibold">{getTotalWeight().toFixed(2)} kg</span>
                </div>
                <div className="text-sm text-gray-600">
                  Value: <span className="font-semibold">₹{getTotalValue().toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={onClose} size="lg">
                  Cancel
                </Button>
                
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Unloading...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Complete Unloading
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}