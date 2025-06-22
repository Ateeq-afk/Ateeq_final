import React from 'react';
import { X, BarChart3, TrendingUp, TrendingDown, Calendar, Truck, Fuel, Wrench, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface Props {
  onClose: () => void;
}

export default function VehicleAnalytics({ onClose }: Props) {
  // Mock data for charts
  const fleetComposition = [
    { name: 'Own', value: 12 },
    { name: 'Hired', value: 8 },
    { name: 'Attached', value: 5 },
  ];
  
  const statusDistribution = [
    { name: 'Active', value: 18 },
    { name: 'Maintenance', value: 4 },
    { name: 'Inactive', value: 3 },
  ];
  
  const monthlyMaintenance = [
    { month: 'Jan', cost: 12000 },
    { month: 'Feb', cost: 8000 },
    { month: 'Mar', cost: 15000 },
    { month: 'Apr', cost: 6000 },
    { month: 'May', cost: 9000 },
    { month: 'Jun', cost: 18000 },
  ];
  
  const fuelEfficiency = [
    { month: 'Jan', efficiency: 7.8 },
    { month: 'Feb', efficiency: 7.5 },
    { month: 'Mar', efficiency: 8.2 },
    { month: 'Apr', efficiency: 8.0 },
    { month: 'May', efficiency: 7.9 },
    { month: 'Jun', efficiency: 8.3 },
  ];
  
  const vehicleUtilization = [
    { vehicle: 'MH01AB1234', utilization: 85 },
    { vehicle: 'MH01CD5678', utilization: 72 },
    { vehicle: 'DL01EF9012', utilization: 90 },
    { vehicle: 'KA01GH3456', utilization: 65 },
    { vehicle: 'TN01IJ7890', utilization: 78 },
  ];
  
  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Fleet Analytics</h2>
              <p className="text-gray-600">Comprehensive analysis of your vehicle fleet</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select defaultValue="last6months">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last3months">Last 3 Months</SelectItem>
                <SelectItem value="last6months">Last 6 Months</SelectItem>
                <SelectItem value="lastyear">Last Year</SelectItem>
                <SelectItem value="alltime">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-blue-700">Total Vehicles</h3>
                <Truck className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-blue-800">25</p>
              <div className="flex items-center gap-1 mt-1 text-sm text-blue-600">
                <TrendingUp className="h-4 w-4" />
                <span>+3 since last month</span>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-green-700">Active Vehicles</h3>
                <Truck className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-800">18</p>
              <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>72% of fleet</span>
              </div>
            </div>
            
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-yellow-700">Maintenance Cost</h3>
                <Wrench className="h-5 w-5 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-yellow-800">₹68,000</p>
              <div className="flex items-center gap-1 mt-1 text-sm text-yellow-600">
                <TrendingDown className="h-4 w-4" />
                <span>-12% from last period</span>
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-purple-700">Avg. Utilization</h3>
                <Calendar className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-purple-800">78%</p>
              <div className="flex items-center gap-1 mt-1 text-sm text-purple-600">
                <TrendingUp className="h-4 w-4" />
                <span>+5% from last period</span>
              </div>
            </div>
          </div>
          
          {/* Charts - First Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Fleet Composition */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Fleet Composition</h3>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <ArrowRight className="h-4 w-4" />
                  Details
                </Button>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fleetComposition}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {fleetComposition.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} vehicles`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Status Distribution */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Status Distribution</h3>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <ArrowRight className="h-4 w-4" />
                  Details
                </Button>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#22c55e" /> {/* Active - Green */}
                      <Cell fill="#f59e0b" /> {/* Maintenance - Yellow */}
                      <Cell fill="#ef4444" /> {/* Inactive - Red */}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} vehicles`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Charts - Second Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Monthly Maintenance Cost */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Monthly Maintenance Cost</h3>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <ArrowRight className="h-4 w-4" />
                  Details
                </Button>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyMaintenance}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `₹${value/1000}K`} />
                    <Tooltip formatter={(value) => [`₹${value}`, 'Cost']} />
                    <Bar dataKey="cost" fill="#8884d8" name="Maintenance Cost" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Fuel Efficiency Trend */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Fuel Efficiency Trend</h3>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <ArrowRight className="h-4 w-4" />
                  Details
                </Button>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fuelEfficiency}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis domain={[7, 9]} tickFormatter={(value) => `${value} km/L`} />
                    <Tooltip formatter={(value) => [`${value} km/L`, 'Efficiency']} />
                    <Line 
                      type="monotone" 
                      dataKey="efficiency" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      name="Fuel Efficiency"
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Vehicle Utilization */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Vehicle Utilization</h3>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <ArrowRight className="h-4 w-4" />
                View All
              </Button>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={vehicleUtilization}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <YAxis type="category" dataKey="vehicle" width={80} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Utilization']} />
                  <Bar 
                    dataKey="utilization" 
                    fill="#3b82f6" 
                    name="Utilization Rate"
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Data last updated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Report
              </Button>
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Helper component for Download icon
function Download(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}