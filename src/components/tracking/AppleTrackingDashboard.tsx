import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Truck, 
  Package, 
  Activity,
  Route,
  Search,
  RefreshCw,
  CheckCircle2,
  Zap,
  Navigation2,
  MapIcon,
  Compass,
  Layers
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { AppleSparkline } from '@/components/charts/AppleCharts';

// Apple-style map component
const AppleMap = ({ vehicles = [], articles = [], selectedItem, onSelectItem }) => {
  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Map placeholder with gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Grid overlay */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        
        {/* Map features */}
        <div className="absolute inset-0">
          {/* Routes */}
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#007AFF" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#007AFF" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#007AFF" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            
            {/* Example route paths */}
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
              d="M 100 200 Q 300 150 500 250"
              stroke="url(#routeGradient)"
              strokeWidth="3"
              fill="none"
              strokeDasharray="5 5"
            />
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2.5, ease: "easeInOut", delay: 0.5 }}
              d="M 200 100 Q 400 200 600 150"
              stroke="url(#routeGradient)"
              strokeWidth="3"
              fill="none"
              strokeDasharray="5 5"
            />
          </svg>
          
          {/* Vehicle markers */}
          {vehicles.map((vehicle, i) => (
            <motion.div
              key={vehicle.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "absolute cursor-pointer transition-all",
                selectedItem?.id === vehicle.id && "z-10"
              )}
              style={{ 
                left: `${20 + i * 25}%`, 
                top: `${30 + (i % 3) * 20}%`,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={() => onSelectItem(vehicle)}
            >
              <div className={cn(
                "relative group",
                selectedItem?.id === vehicle.id && "scale-125"
              )}>
                {/* Pulse animation */}
                <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20" />
                
                {/* Vehicle icon */}
                <div className={cn(
                  "relative w-12 h-12 rounded-full flex items-center justify-center",
                  "bg-white dark:bg-gray-800 shadow-lg",
                  "border-2 border-blue-500",
                  "group-hover:scale-110 transition-transform"
                )}>
                  <Truck className="h-5 w-5 text-blue-600" />
                </div>
                
                {/* Info tooltip */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: selectedItem?.id === vehicle.id ? 1 : 0, y: 0 }}
                  className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap"
                >
                  <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded-lg">
                    {vehicle.name}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
          
          {/* Warehouse/Branch markers */}
          {[
            { id: 1, name: 'Mumbai Hub', x: 20, y: 50 },
            { id: 2, name: 'Delhi Branch', x: 70, y: 30 },
            { id: 3, name: 'Bangalore Center', x: 50, y: 70 }
          ].map((branch, i) => (
            <motion.div
              key={branch.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="absolute"
              style={{ 
                left: `${branch.x}%`, 
                top: `${branch.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="relative group cursor-pointer">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center",
                  "bg-gradient-to-br from-gray-100 to-gray-200",
                  "dark:from-gray-700 dark:to-gray-800",
                  "shadow-lg border border-gray-300 dark:border-gray-600",
                  "group-hover:scale-110 transition-transform"
                )}>
                  <MapPin className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                </div>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {branch.name}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button
          size="icon"
          variant="secondary"
          className="h-10 w-10 rounded-xl shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur"
        >
          <Layers className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-10 w-10 rounded-xl shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur"
        >
          <Compass className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-10 w-10 rounded-xl shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur"
        >
          <Navigation2 className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-xl p-3 shadow-lg">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Active Vehicle</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Warehouse</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-blue-500 opacity-50" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Route</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Vehicle tracking card
const VehicleCard = ({ vehicle, isSelected, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl cursor-pointer transition-all",
        "border border-gray-200 dark:border-gray-800",
        isSelected 
          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700" 
          : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            vehicle.status === 'active' 
              ? "bg-green-100 dark:bg-green-900/30" 
              : "bg-gray-100 dark:bg-gray-800"
          )}>
            <Truck className={cn(
              "h-5 w-5",
              vehicle.status === 'active' 
                ? "text-green-600 dark:text-green-400" 
                : "text-gray-600 dark:text-gray-400"
            )} />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100">{vehicle.name}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">{vehicle.driver}</p>
          </div>
        </div>
        <Badge 
          variant={vehicle.status === 'active' ? 'default' : 'secondary'}
          className="text-xs"
        >
          {vehicle.status}
        </Badge>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Speed</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{vehicle.speed || 0} km/h</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Location</span>
          <span className="font-medium text-gray-900 dark:text-gray-100 text-right truncate max-w-[150px]">
            {vehicle.location || 'Unknown'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Load</span>
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${vehicle.loadPercentage || 0}%` }}
              />
            </div>
            <span className="text-xs font-medium">{vehicle.loadPercentage || 0}%</span>
          </div>
        </div>
      </div>
      
      {vehicle.eta && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">ETA</span>
            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{vehicle.eta}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default function AppleTrackingDashboard() {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for demonstration
  const vehicles = [
    { 
      id: 1, 
      name: 'DL-01-AB-1234', 
      driver: 'Rajesh Kumar', 
      status: 'active',
      speed: 45,
      location: 'NH-48, Near Gurgaon',
      loadPercentage: 85,
      eta: '2:30 PM'
    },
    { 
      id: 2, 
      name: 'MH-02-CD-5678', 
      driver: 'Amit Singh', 
      status: 'active',
      speed: 0,
      location: 'Mumbai Terminal',
      loadPercentage: 100,
      eta: '4:00 PM'
    },
    { 
      id: 3, 
      name: 'KA-03-EF-9012', 
      driver: 'Suresh Patel', 
      status: 'idle',
      speed: 0,
      location: 'Bangalore Hub',
      loadPercentage: 0,
      eta: null
    }
  ];

  const stats = {
    totalVehicles: 24,
    activeVehicles: 18,
    inTransit: 156,
    delivered: 892
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/70 dark:bg-black/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-semibold text-gray-900 dark:text-gray-100"
              >
                Real-Time Tracking
              </motion.h1>
              <Badge variant="outline" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search vehicles..."
                  className="pl-9 pr-4 h-9 w-64 bg-gray-100 dark:bg-gray-900 border-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="idle">Idle</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="h-9"
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          <Card className="border-gray-200/50 dark:border-gray-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Vehicles</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{stats.totalVehicles}</p>
                </div>
                <Truck className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-gray-200/50 dark:border-gray-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
                  <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{stats.activeVehicles}</p>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-gray-200/50 dark:border-gray-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">In Transit</p>
                  <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{stats.inTransit}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-gray-200/50 dark:border-gray-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Delivered Today</p>
                  <p className="text-2xl font-semibold text-purple-600 dark:text-purple-400">{stats.delivered}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Map View */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
              <CardHeader className="border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Live Map</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8">
                      <MapIcon className="h-4 w-4 mr-1" />
                      Satellite
                    </Button>
                    <Button variant="outline" size="sm" className="h-8">
                      <Route className="h-4 w-4 mr-1" />
                      Routes
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-73px)]">
                <AppleMap 
                  vehicles={vehicles}
                  selectedItem={selectedVehicle}
                  onSelectItem={setSelectedVehicle}
                />
              </CardContent>
            </Card>
          </div>

          {/* Vehicle List */}
          <div>
            <Card className="h-[600px] border-gray-200/50 dark:border-gray-800/50">
              <CardHeader className="border-b border-gray-100 dark:border-gray-800">
                <CardTitle className="text-lg font-semibold">Active Vehicles</CardTitle>
              </CardHeader>
              <CardContent className="p-4 h-[calc(100%-73px)] overflow-y-auto space-y-3">
                {vehicles
                  .filter(v => filterStatus === 'all' || v.status === filterStatus)
                  .filter(v => searchQuery === '' || 
                    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    v.driver.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(vehicle => (
                    <VehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      isSelected={selectedVehicle?.id === vehicle.id}
                      onClick={() => setSelectedVehicle(vehicle)}
                    />
                  ))}
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Route Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Card className="border-gray-200/50 dark:border-gray-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Route Efficiency</h3>
                <Zap className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500 dark:text-gray-400">Average Speed</span>
                    <span className="font-medium">42 km/h</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-green-500 to-green-600" />
                  </div>
                </div>
                <AppleSparkline height={40} color="#10B981" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200/50 dark:border-gray-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Delivery Performance</h3>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500 dark:text-gray-400">On-Time Rate</span>
                    <span className="font-medium">94%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full w-[94%] bg-gradient-to-r from-blue-500 to-blue-600" />
                  </div>
                </div>
                <AppleSparkline height={40} color="#3B82F6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200/50 dark:border-gray-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Fuel Efficiency</h3>
                <Activity className="h-5 w-5 text-purple-500" />
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500 dark:text-gray-400">Avg. Consumption</span>
                    <span className="font-medium">8.2 km/l</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-gradient-to-r from-purple-500 to-purple-600" />
                  </div>
                </div>
                <AppleSparkline height={40} color="#A855F7" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}