import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  X, 
  Calendar, 
  Tag, 
  MapPin, 
  Clock, 
  FileText, 
  Wrench, 
  Edit, 
  Download, 
  Printer, 
  Share2, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Fuel,
  BarChart3,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVehicles } from '@/hooks/useVehicles';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { motion } from 'framer-motion';

interface Props {
  vehicleId: string;
  onClose: () => void;
  onEdit: (vehicle: any) => void;
  onScheduleMaintenance: (vehicleId: string) => void;
  onManageDocuments: (vehicleId: string) => void;
}

export default function VehicleDetails({ vehicleId, onClose, onEdit, onScheduleMaintenance, onManageDocuments }: Props) {
  const { vehicles, loading, error } = useVehicles();
  const [vehicle, setVehicle] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock maintenance history
  const maintenanceHistory = [
    { 
      id: '1', 
      date: '2023-12-15', 
      type: 'Regular Service', 
      description: 'Oil change, filter replacement, general inspection',
      cost: 2500,
      odometer: 15000,
      status: 'completed'
    },
    { 
      id: '2', 
      date: '2023-09-20', 
      type: 'Tire Replacement', 
      description: 'Replaced all four tires',
      cost: 12000,
      odometer: 12500,
      status: 'completed'
    },
    { 
      id: '3', 
      date: '2023-06-10', 
      type: 'Regular Service', 
      description: 'Oil change, brake inspection',
      cost: 1800,
      odometer: 10000,
      status: 'completed'
    }
  ];

  // Mock documents
  const documents = [
    {
      id: '1',
      name: 'Registration Certificate',
      number: 'RC123456789',
      issuedDate: '2022-01-15',
      expiryDate: '2027-01-14',
      status: 'valid'
    },
    {
      id: '2',
      name: 'Insurance Policy',
      number: 'INS987654321',
      issuedDate: '2023-11-01',
      expiryDate: '2024-10-31',
      status: 'valid'
    },
    {
      id: '3',
      name: 'Pollution Certificate',
      number: 'PUC654321',
      issuedDate: '2023-12-01',
      expiryDate: '2024-05-31',
      status: 'valid'
    },
    {
      id: '4',
      name: 'Fitness Certificate',
      number: 'FC123789',
      issuedDate: '2023-06-15',
      expiryDate: '2024-06-14',
      status: 'expiring_soon'
    }
  ];

  // Mock usage statistics
  const usageStats = {
    totalTrips: 156,
    totalDistance: 25600,
    fuelConsumption: 3200,
    averageMileage: 8.0,
    maintenanceCost: 16300,
    costPerKm: 0.64,
    utilization: 78 // percentage
  };

  useEffect(() => {
    if (vehicles.length > 0 && vehicleId) {
      const foundVehicle = vehicles.find(v => v.id === vehicleId);
      if (foundVehicle) {
        setVehicle(foundVehicle);
      }
    }
  }, [vehicles, vehicleId]);

  if (loading || !vehicle) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl max-w-4xl w-full mx-4 p-8 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl max-w-4xl w-full mx-4 p-8">
          <div className="flex items-center justify-center text-red-600">
            <AlertTriangle className="h-6 w-6 mr-2" />
            <span>Failed to load vehicle details</span>
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'maintenance':
        return <Wrench className="h-4 w-4" />;
      case 'inactive':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{vehicle.vehicle_number}</h2>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <span>{vehicle.make} {vehicle.model}</span>
                <span>•</span>
                <span>{vehicle.year}</span>
                <span>•</span>
                <span className="capitalize">{vehicle.type}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${getStatusColor(vehicle.status)}`}>
              {getStatusIcon(vehicle.status)}
              <span className="font-medium capitalize">
                {vehicle.status}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="overview" className="p-6" onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="usage">Usage Statistics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* Vehicle Details */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Vehicle Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Vehicle Number</p>
                      <p className="font-medium text-gray-900">{vehicle.vehicle_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Make & Model</p>
                      <p className="font-medium text-gray-900">{vehicle.make} {vehicle.model}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Year</p>
                      <p className="font-medium text-gray-900">{vehicle.year}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-medium text-gray-900 capitalize">{vehicle.type}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(vehicle.status)}`}>
                        {vehicle.status}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Last Maintenance</p>
                      <p className="font-medium text-gray-900">
                        {vehicle.last_maintenance_date 
                          ? new Date(vehicle.last_maintenance_date).toLocaleDateString() 
                          : 'Not available'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Next Maintenance</p>
                      <p className={`font-medium ${
                        vehicle.next_maintenance_date && new Date(vehicle.next_maintenance_date) <= new Date()
                          ? 'text-red-600'
                          : 'text-gray-900'
                      }`}>
                        {vehicle.next_maintenance_date 
                          ? new Date(vehicle.next_maintenance_date).toLocaleDateString() 
                          : 'Not scheduled'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Added On</p>
                      <p className="font-medium text-gray-900">
                        {new Date(vehicle.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-blue-700">Total Trips</h4>
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-blue-800">{usageStats.totalTrips}</p>
                  <p className="text-sm text-blue-600 mt-1">Last 12 months</p>
                </div>
                
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-green-700">Total Distance</h4>
                    <MapPin className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-green-800">{usageStats.totalDistance} km</p>
                  <p className="text-sm text-green-600 mt-1">Lifetime</p>
                </div>
                
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-purple-700">Utilization</h4>
                    <Clock className="h-4 w-4 text-purple-500" />
                  </div>
                  <p className="text-2xl font-bold text-purple-800">{usageStats.utilization}%</p>
                  <p className="text-sm text-purple-600 mt-1">Last 30 days</p>
                </div>
              </div>
              
              {/* Recent Activity */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <Truck className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Trip Completed</p>
                      <p className="text-sm text-gray-600">Mumbai to Delhi • 1,400 km</p>
                      <p className="text-xs text-gray-500 mt-1">Yesterday</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
                      <Wrench className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Maintenance Performed</p>
                      <p className="text-sm text-gray-600">Oil change and general inspection</p>
                      <p className="text-xs text-gray-500 mt-1">1 week ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                      <Fuel className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Fuel Refill</p>
                      <p className="text-sm text-gray-600">100 liters • ₹9,500</p>
                      <p className="text-xs text-gray-500 mt-1">2 weeks ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="maintenance" className="space-y-6">
              {/* Maintenance Summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Maintenance Summary</h3>
                  <Button 
                    onClick={() => onScheduleMaintenance(vehicle.id)}
                    className="flex items-center gap-2"
                  >
                    <Wrench className="h-4 w-4" />
                    Schedule Maintenance
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Last Maintenance</p>
                    <p className="font-medium text-gray-900">
                      {vehicle.last_maintenance_date 
                        ? new Date(vehicle.last_maintenance_date).toLocaleDateString() 
                        : 'Not available'}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Next Maintenance</p>
                    <p className={`font-medium ${
                      vehicle.next_maintenance_date && new Date(vehicle.next_maintenance_date) <= new Date()
                        ? 'text-red-600'
                        : 'text-gray-900'
                    }`}>
                      {vehicle.next_maintenance_date 
                        ? new Date(vehicle.next_maintenance_date).toLocaleDateString() 
                        : 'Not scheduled'}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Maintenance Cost</p>
                    <p className="font-medium text-gray-900">₹{usageStats.maintenanceCost}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Oil Change</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: '70%' }}></div>
                      </div>
                      <span className="text-gray-900">70%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Brake Pads</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500 rounded-full" style={{ width: '40%' }}></div>
                      </div>
                      <span className="text-gray-900">40%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tires</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: '15%' }}></div>
                      </div>
                      <span className="text-gray-900">15%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Maintenance History */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Maintenance History</h3>
                <div className="space-y-4">
                  {maintenanceHistory.map((record) => (
                    <div key={record.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <Wrench className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{record.type}</p>
                          <Badge variant={record.status === 'completed' ? 'success' : 'warning'}>
                            {record.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{record.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{new Date(record.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{record.odometer} km</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <IndianRupee className="h-3.5 w-3.5" />
                            <span>₹{record.cost}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="documents" className="space-y-6">
              {/* Documents Summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Vehicle Documents</h3>
                  <Button 
                    onClick={() => onManageDocuments(vehicle.id)}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Manage Documents
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{doc.name}</p>
                          <p className="text-sm text-gray-600 mt-1">Number: {doc.number}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>Issued: {new Date(doc.issuedDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              <span className={doc.status === 'expiring_soon' ? 'text-yellow-600 font-medium' : ''}>
                                Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <Printer className="h-3.5 w-3.5" />
                          Print
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Document Expiry Timeline */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Document Expiry Timeline</h3>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  {documents
                    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
                    .map((doc, index) => {
                      const expiryDate = new Date(doc.expiryDate);
                      const today = new Date();
                      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      
                      let statusColor = 'bg-green-100 text-green-800';
                      if (daysUntilExpiry < 0) {
                        statusColor = 'bg-red-100 text-red-800';
                      } else if (daysUntilExpiry < 30) {
                        statusColor = 'bg-yellow-100 text-yellow-800';
                      }
                      
                      return (
                        <div key={doc.id} className="relative flex items-start gap-4 mb-6">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center z-10 ${
                            daysUntilExpiry < 0 
                              ? 'bg-red-100' 
                              : daysUntilExpiry < 30 
                              ? 'bg-yellow-100' 
                              : 'bg-green-100'
                          }`}>
                            <FileText className={`h-4 w-4 ${
                              daysUntilExpiry < 0 
                                ? 'text-red-600' 
                                : daysUntilExpiry < 30 
                                ? 'text-yellow-600' 
                                : 'text-green-600'
                            }`} />
                          </div>
                          <div className="flex-1 pt-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900">{doc.name}</h4>
                              <Badge variant={
                                daysUntilExpiry < 0 
                                  ? 'destructive' 
                                  : daysUntilExpiry < 30 
                                  ? 'warning' 
                                  : 'success'
                              }>
                                {daysUntilExpiry < 0 
                                  ? 'Expired' 
                                  : daysUntilExpiry < 30 
                                  ? 'Expiring Soon' 
                                  : 'Valid'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">Number: {doc.number}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {daysUntilExpiry < 0 
                                ? `Expired ${Math.abs(daysUntilExpiry)} days ago` 
                                : `Expires in ${daysUntilExpiry} days`} 
                              ({new Date(doc.expiryDate).toLocaleDateString()})
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="usage" className="space-y-6">
              {/* Usage Statistics */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Distance</p>
                    <p className="text-xl font-bold text-gray-900">{usageStats.totalDistance} km</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Trips</p>
                    <p className="text-xl font-bold text-gray-900">{usageStats.totalTrips}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Utilization Rate</p>
                    <p className="text-xl font-bold text-gray-900">{usageStats.utilization}%</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Fuel Efficiency</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Total Fuel Consumption</span>
                          <span className="font-medium">{usageStats.fuelConsumption} L</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Average Mileage</span>
                          <span className="font-medium">{usageStats.averageMileage} km/L</span>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-blue-700">Fuel Efficiency Trend</p>
                          <ArrowRight className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="mt-2 h-10 bg-white rounded-md overflow-hidden">
                          <div className="flex h-full">
                            <div className="bg-red-400 h-full" style={{ width: '20%' }}></div>
                            <div className="bg-yellow-400 h-full" style={{ width: '30%' }}></div>
                            <div className="bg-green-400 h-full" style={{ width: '50%' }}></div>
                          </div>
                        </div>
                        <p className="text-xs text-blue-600 mt-2">Improving over last 3 months</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Cost Analysis</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Total Maintenance Cost</span>
                          <span className="font-medium">₹{usageStats.maintenanceCost}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Cost per Kilometer</span>
                          <span className="font-medium">₹{usageStats.costPerKm}</span>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-green-700">Cost Comparison</p>
                          <ArrowRight className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            <div className="h-3 w-3 rounded-full bg-green-500"></div>
                            <span className="text-xs text-gray-600">This Vehicle</span>
                          </div>
                          <span className="text-xs font-medium">₹{usageStats.costPerKm}/km</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-1">
                            <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                            <span className="text-xs text-gray-600">Fleet Average</span>
                          </div>
                          <span className="text-xs font-medium">₹0.72/km</span>
                        </div>
                        <p className="text-xs text-green-600 mt-2">11% below fleet average</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Recent Trips */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Trips</h3>
                <div className="space-y-4">
                  {[1, 2, 3].map((trip) => (
                    <div key={trip} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                        <MapPin className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">Mumbai</p>
                            <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                            <p className="font-medium text-gray-900">Delhi</p>
                          </div>
                          <Badge variant="outline">Completed</Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{new Date(Date.now() - trip * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>1,400 km</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Fuel className="h-3.5 w-3.5" />
                            <span>175 L</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onEdit(vehicle)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Vehicle
              </Button>
              {activeTab === 'maintenance' && (
                <Button variant="outline" onClick={() => onScheduleMaintenance(vehicle.id)}>
                  <Wrench className="h-4 w-4 mr-2" />
                  Schedule Maintenance
                </Button>
              )}
              {activeTab === 'documents' && (
                <Button variant="outline" onClick={() => onManageDocuments(vehicle.id)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Manage Documents
                </Button>
              )}
            </div>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Helper component for Indian Rupee icon
function IndianRupee(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3h12" />
      <path d="M6 8h12" />
      <path d="m6 13 8.5 8" />
      <path d="M6 13h3" />
      <path d="M9 13c6.667 0 6.667-10 0-10" />
    </svg>
  );
}