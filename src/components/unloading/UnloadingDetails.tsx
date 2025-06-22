import React, { useState } from 'react';
import { Package, Truck, User, Calendar, MapPin, CheckCircle2, AlertCircle, Download, Printer, ArrowLeft, BarChart3, Camera, ExternalLink, ChevronDown, ChevronUp, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { OGPL } from '@/types';

interface Props {
  ogpl: OGPL;
  unloadingData: {
    unloadedAt: string;
    unloadedBy: string;
    conditions: Record<string, { 
      status: string; 
      remarks?: string; 
      photo?: string;
    }>;
  };
  onClose: () => void;
  onPrint?: () => void;
}

export default function UnloadingDetails({ ogpl, unloadingData, onClose, onPrint }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800';
      case 'damaged':
        return 'bg-red-100 text-red-800';
      case 'missing':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'damaged':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'missing':
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      default:
        return null;
    }
  };

  // Count items by status
  const statusCounts = Object.values(unloadingData.conditions).reduce((acc, condition) => {
    acc[condition.status] = (acc[condition.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Prepare data for pie chart
  const pieData = [
    { name: 'Good', value: statusCounts.good || 0, color: '#22c55e' },
    { name: 'Damaged', value: statusCounts.damaged || 0, color: '#ef4444' },
    { name: 'Missing', value: statusCounts.missing || 0, color: '#f59e0b' }
  ].filter(item => item.value > 0);

  // Calculate total items and percentages
  const totalItems = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
  const goodPercentage = Math.round(((statusCounts.good || 0) / totalItems) * 100);
  const damagedPercentage = Math.round(((statusCounts.damaged || 0) / totalItems) * 100);
  const missingPercentage = Math.round(((statusCounts.missing || 0) / totalItems) * 100);

  // Filter and sort records based on search and filter
  const filteredRecords = React.useMemo(() => {
    if (!ogpl.loading_records) return [];
    
    return ogpl.loading_records.filter(record => {
      const booking = record.booking;
      if (!booking) return false;
      
      const condition = unloadingData.conditions[booking.id] || { status: 'good' };
      
      // Apply status filter
      if (statusFilter !== 'all' && condition.status !== statusFilter) return false;
      
      // Apply search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          booking.lr_number.toLowerCase().includes(searchLower) ||
          booking.article?.name?.toLowerCase().includes(searchLower) ||
          booking.sender?.name?.toLowerCase().includes(searchLower) ||
          booking.receiver?.name?.toLowerCase().includes(searchLower) ||
          (condition.remarks && condition.remarks.toLowerCase().includes(searchLower))
        );
      }
      
      return true;
    });
  }, [ogpl.loading_records, unloadingData.conditions, statusFilter, searchQuery]);

  const toggleItemExpansion = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header - Glass effect */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border border-gray-200 rounded-xl p-6 shadow-md flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
            <Truck className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Unloading Report</h2>
            <p className="text-gray-600">OGPL #{ogpl.ogpl_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onPrint} className="flex items-center gap-1">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </motion.div>

      {/* KPI Summary Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Items</h3>
            <Package className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
            <div className="text-xs text-gray-500">
              {new Date(unloadingData.unloadedAt).toLocaleDateString()}
            </div>
          </div>
          <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Good Condition</h3>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-green-600">{statusCounts.good || 0}</p>
            <div className="text-xs text-gray-500">{goodPercentage}% of total</div>
          </div>
          <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${goodPercentage}%` }}></div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Damaged</h3>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-red-600">{statusCounts.damaged || 0}</p>
            <div className="text-xs text-gray-500">{damagedPercentage}% of total</div>
          </div>
          <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full" style={{ width: `${damagedPercentage}%` }}></div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Missing</h3>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-amber-600">{statusCounts.missing || 0}</p>
            <div className="text-xs text-gray-500">{missingPercentage}% of total</div>
          </div>
          <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${missingPercentage}%` }}></div>
          </div>
        </div>
      </motion.div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OGPL Information */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            OGPL Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Vehicle Number</p>
              <div className="flex items-center gap-2 mt-1">
                <Truck className="h-4 w-4 text-gray-400" />
                <p className="font-medium text-gray-900">{ogpl.vehicle?.vehicle_number}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Driver</p>
              <div className="flex items-center gap-2 mt-1">
                <User className="h-4 w-4 text-gray-400" />
                <p className="font-medium text-gray-900">{ogpl.primary_driver_name}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">From</p>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="h-4 w-4 text-gray-400" />
                <p className="font-medium text-gray-900">{ogpl.from_station?.name}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">To</p>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="h-4 w-4 text-gray-400" />
                <p className="font-medium text-gray-900">{ogpl.to_station?.name}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Transit Date</p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-gray-400" />
                <p className="font-medium text-gray-900">{new Date(ogpl.transit_date).toLocaleDateString()}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Unloaded On</p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-gray-400" />
                <p className="font-medium text-gray-900">{new Date(unloadingData.unloadedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="font-medium text-blue-800 mb-2">Transit Timeline</h4>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-200"></div>
              
              <div className="relative flex items-start gap-4 mb-4 pl-4">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center z-10">
                  <Truck className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="font-medium text-gray-900">Departed</h4>
                  <p className="text-sm text-gray-500">{ogpl.departure_time}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    From {ogpl.from_station?.name}
                  </p>
                </div>
              </div>
              
              <div className="relative flex items-start gap-4 mb-4 pl-4">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center z-10">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="font-medium text-gray-900">Arrived</h4>
                  <p className="text-sm text-gray-500">{ogpl.arrival_time}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    At {ogpl.to_station?.name}
                  </p>
                </div>
              </div>
              
              <div className="relative flex items-start gap-4 pl-4">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center z-10">
                  <Package className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="font-medium text-gray-900">Unloaded</h4>
                  <p className="text-sm text-gray-500">{new Date(unloadingData.unloadedAt).toLocaleTimeString()}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    By {unloadingData.unloadedBy}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Unloading Summary with Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Unloading Summary
          </h3>
          
          <div className="h-64 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} items`, 'Count']}
                  contentStyle={{ 
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e2e8f0'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h4 className="font-medium text-green-800">Good Condition</h4>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-green-700 text-xl font-bold">
                  {statusCounts.good || 0}
                </p>
                <span className="text-green-600 text-sm font-medium">
                  {goodPercentage}%
                </span>
              </div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <h4 className="font-medium text-red-800">Damaged</h4>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-red-700 text-xl font-bold">
                  {statusCounts.damaged || 0}
                </p>
                <span className="text-red-600 text-sm font-medium">
                  {damagedPercentage}%
                </span>
              </div>
            </div>
            
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <h4 className="font-medium text-amber-800">Missing</h4>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-amber-700 text-xl font-bold">
                  {statusCounts.missing || 0}
                </p>
                <span className="text-amber-600 text-sm font-medium">
                  {missingPercentage}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">Photo Evidence Rate</h4>
            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
              {/* Calculate percentage of items with photos */}
              {(() => {
                const itemsWithPhotos = Object.values(unloadingData.conditions)
                  .filter(condition => condition.photo).length;
                const photoRate = Math.round((itemsWithPhotos / totalItems) * 100);
                return (
                  <div 
                    className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                    style={{ width: `${photoRate}%` }}
                  ></div>
                );
              })()}
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search and Filter Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search by LR number, article, or sender..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <Select 
            value={statusFilter} 
            onValueChange={setStatusFilter}
          >
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>{statusFilter === 'all' ? 'All Conditions' : 
                       statusFilter === 'good' ? 'Good Condition' : 
                       statusFilter === 'damaged' ? 'Damaged' : 'Missing'}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conditions</SelectItem>
              <SelectItem value="good">Good Condition</SelectItem>
              <SelectItem value="damaged">Damaged</SelectItem>
              <SelectItem value="missing">Missing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Unloaded Items - Accordion Style */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm"
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Unloaded Items
            <span className="ml-2 text-sm text-gray-500">
              {filteredRecords.length} items
            </span>
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          <AnimatePresence>
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => {
                const booking = record.booking;
                if (!booking) return null;
                
                const condition = unloadingData.conditions[booking.id] || { status: 'good' };
                const isExpanded = expandedItems[booking.id] || false;

                return (
                  <motion.div 
                    key={booking.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div 
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-gray-50' : ''}`}
                      onClick={() => toggleItemExpansion(booking.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            condition.status === 'good' ? 'bg-green-100' : 
                            condition.status === 'damaged' ? 'bg-red-100' : 'bg-amber-100'
                          }`}>
                            {getStatusIcon(condition.status)}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">LR #{booking.lr_number}</h4>
                            <p className="text-sm text-gray-500">
                              {booking.article?.name} • {booking.quantity} {booking.uom}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(condition.status)}`}>
                            {condition.status === 'good' ? 'Good' : 
                             condition.status === 'damaged' ? 'Damaged' : 'Missing'}
                          </div>
                          {isExpanded ? 
                            <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          }
                        </div>
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="px-4 pb-4 bg-gray-50"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Shipment Details</h5>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-gray-600">Sender</p>
                                  <p className="text-sm font-medium">{booking.sender?.name}</p>
                                  <p className="text-xs text-gray-500">{booking.sender?.mobile}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Receiver</p>
                                  <p className="text-sm font-medium">{booking.receiver?.name}</p>
                                  <p className="text-xs text-gray-500">{booking.receiver?.mobile}</p>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Condition Details</h5>
                              <div className={`p-3 rounded-lg ${
                                condition.status === 'good' ? 'bg-green-50 border border-green-100' : 
                                condition.status === 'damaged' ? 'bg-red-50 border border-red-100' : 
                                'bg-amber-50 border border-amber-100'
                              }`}>
                                <div className="flex items-center gap-2 mb-2">
                                  {getStatusIcon(condition.status)}
                                  <h4 className="font-medium">
                                    {condition.status === 'good' ? 'Good Condition' : 
                                     condition.status === 'damaged' ? 'Damaged' : 'Missing'}
                                  </h4>
                                </div>
                                
                                {condition.remarks && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium">Remarks:</p>
                                    <p className="text-sm">{condition.remarks}</p>
                                  </div>
                                )}
                                
                                {condition.photo && (
                                  <div className="mt-3">
                                    <p className="text-xs font-medium mb-1">Photo Evidence:</p>
                                    <div 
                                      className="relative cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedImage(condition.photo);
                                      }}
                                    >
                                      <img 
                                        src={condition.photo} 
                                        alt="Condition evidence" 
                                        className="w-full h-auto rounded-lg border border-gray-200 object-cover max-h-32"
                                      />
                                      <div className="absolute inset-0 bg-black/5 hover:bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                                        <div className="bg-white/80 p-2 rounded-full">
                                          <ExternalLink className="h-5 w-5 text-blue-600" />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 text-center"
              >
                <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900">No items found</h4>
                <p className="text-gray-500 mt-1">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria' 
                    : 'No LRs found in this OGPL'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex justify-end"
      >
        <Button onClick={onClose} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </motion.div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative max-w-4xl max-h-[90vh] p-2 bg-white rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={selectedImage} 
              alt="Condition evidence" 
              className="max-w-full max-h-[80vh] object-contain rounded"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}