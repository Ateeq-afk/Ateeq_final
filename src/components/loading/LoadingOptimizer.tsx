import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Route, 
  Weight, 
  Calculator, 
  Truck, 
  MapPin, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import LoadingSpinner from '@/components/ui/loading-spinner';

interface LoadingOptimizerProps {
  bookings: any[];
  vehicles: any[];
  onOptimize: (optimizedGroups: any[]) => void;
  onClose: () => void;
}

interface OptimizedGroup {
  id: string;
  vehicle: any;
  bookings: any[];
  route: string;
  totalWeight: number;
  totalValue: number;
  utilization: number;
  efficiency: number;
  warnings: string[];
}

export default function LoadingOptimizer({ 
  bookings, 
  vehicles, 
  onOptimize, 
  onClose 
}: LoadingOptimizerProps) {
  const [optimizationStrategy, setOptimizationStrategy] = useState<'route' | 'weight' | 'value' | 'capacity'>('route');
  const [optimizedGroups, setOptimizedGroups] = useState<OptimizedGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Optimize loading based on selected strategy
  const optimizeLoading = async () => {
    setIsOptimizing(true);
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let groups: OptimizedGroup[] = [];
      
      switch (optimizationStrategy) {
        case 'route':
          groups = optimizeByRoute();
          break;
        case 'weight':
          groups = optimizeByWeight();
          break;
        case 'value':
          groups = optimizeByValue();
          break;
        case 'capacity':
          groups = optimizeByCapacity();
          break;
      }
      
      setOptimizedGroups(groups);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Route-based optimization
  const optimizeByRoute = (): OptimizedGroup[] => {
    const routeGroups = bookings.reduce((acc, booking) => {
      const route = `${booking.from_branch_details?.city || 'Unknown'} → ${booking.to_branch_details?.city || 'Unknown'}`;
      if (!acc[route]) acc[route] = [];
      acc[route].push(booking);
      return acc;
    }, {});

    return Object.entries(routeGroups).map(([route, groupBookings]: [string, any], index) => {
      const totalWeight = groupBookings.reduce((sum, b) => sum + (b.actual_weight || 0), 0);
      const totalValue = groupBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      
      // Find best vehicle for this group
      const bestVehicle = findBestVehicle(groupBookings, totalWeight);
      
      const warnings = [];
      if (bestVehicle && bestVehicle.max_weight && totalWeight > bestVehicle.max_weight) {
        warnings.push('Weight limit exceeded');
      }
      if (bestVehicle && bestVehicle.max_capacity && groupBookings.length > bestVehicle.max_capacity) {
        warnings.push('Capacity limit exceeded');
      }
      
      return {
        id: `route-${index}`,
        vehicle: bestVehicle,
        bookings: groupBookings,
        route,
        totalWeight,
        totalValue,
        utilization: bestVehicle ? Math.min((totalWeight / (bestVehicle.max_weight || 1000)) * 100, 100) : 0,
        efficiency: calculateEfficiency(groupBookings, bestVehicle),
        warnings
      };
    });
  };

  // Weight-based optimization
  const optimizeByWeight = (): OptimizedGroup[] => {
    const sortedBookings = [...bookings].sort((a, b) => (b.actual_weight || 0) - (a.actual_weight || 0));
    const groups: OptimizedGroup[] = [];
    let currentGroup: any[] = [];
    let currentWeight = 0;
    let currentVehicle = vehicles[0];

    sortedBookings.forEach((booking) => {
      const bookingWeight = booking.actual_weight || 0;
      
      if (currentVehicle?.max_weight && currentWeight + bookingWeight > currentVehicle.max_weight) {
        if (currentGroup.length > 0) {
          groups.push(createOptimizedGroup(currentGroup, currentVehicle, groups.length));
        }
        currentGroup = [booking];
        currentWeight = bookingWeight;
        currentVehicle = findBestVehicle([booking], bookingWeight);
      } else {
        currentGroup.push(booking);
        currentWeight += bookingWeight;
      }
    });

    if (currentGroup.length > 0) {
      groups.push(createOptimizedGroup(currentGroup, currentVehicle, groups.length));
    }

    return groups;
  };

  // Value-based optimization
  const optimizeByValue = (): OptimizedGroup[] => {
    const sortedBookings = [...bookings].sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0));
    return createBalancedGroups(sortedBookings, 'value');
  };

  // Capacity-based optimization
  const optimizeByCapacity = (): OptimizedGroup[] => {
    const groups: OptimizedGroup[] = [];
    const remainingBookings = [...bookings];

    vehicles.forEach((vehicle, index) => {
      if (remainingBookings.length === 0) return;

      const maxCapacity = vehicle.max_capacity || 50;
      const maxWeight = vehicle.max_weight || 1000;
      
      const group: any[] = [];
      let totalWeight = 0;

      // Fill vehicle to capacity
      for (let i = remainingBookings.length - 1; i >= 0; i--) {
        const booking = remainingBookings[i];
        const bookingWeight = booking.actual_weight || 0;

        if (group.length < maxCapacity && totalWeight + bookingWeight <= maxWeight) {
          group.push(booking);
          totalWeight += bookingWeight;
          remainingBookings.splice(i, 1);
        }
      }

      if (group.length > 0) {
        groups.push(createOptimizedGroup(group, vehicle, index));
      }
    });

    // Handle remaining bookings
    if (remainingBookings.length > 0) {
      const lastVehicle = vehicles[vehicles.length - 1];
      groups.push(createOptimizedGroup(remainingBookings, lastVehicle, groups.length));
    }

    return groups;
  };

  // Helper functions
  const findBestVehicle = (groupBookings: any[], totalWeight: number) => {
    return vehicles.find(v => 
      (!v.max_weight || totalWeight <= v.max_weight) &&
      (!v.max_capacity || groupBookings.length <= v.max_capacity)
    ) || vehicles[0];
  };

  const createOptimizedGroup = (groupBookings: any[], vehicle: any, index: number): OptimizedGroup => {
    const totalWeight = groupBookings.reduce((sum, b) => sum + (b.actual_weight || 0), 0);
    const totalValue = groupBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const routes = new Set(groupBookings.map(b => 
      `${b.from_branch_details?.city} → ${b.to_branch_details?.city}`
    ));
    
    const warnings = [];
    if (vehicle?.max_weight && totalWeight > vehicle.max_weight) {
      warnings.push('Weight limit exceeded');
    }
    if (vehicle?.max_capacity && groupBookings.length > vehicle.max_capacity) {
      warnings.push('Capacity limit exceeded');
    }

    return {
      id: `group-${index}`,
      vehicle,
      bookings: groupBookings,
      route: Array.from(routes).join(', '),
      totalWeight,
      totalValue,
      utilization: vehicle ? Math.min((totalWeight / (vehicle.max_weight || 1000)) * 100, 100) : 0,
      efficiency: calculateEfficiency(groupBookings, vehicle),
      warnings
    };
  };

  const createBalancedGroups = (sortedBookings: any[], type: string): OptimizedGroup[] => {
    const numVehicles = Math.min(vehicles.length, Math.ceil(sortedBookings.length / 10));
    const groups: any[][] = Array(numVehicles).fill(null).map(() => []);
    
    sortedBookings.forEach((booking, index) => {
      groups[index % numVehicles].push(booking);
    });

    return groups.map((group, index) => 
      createOptimizedGroup(group, vehicles[index % vehicles.length], index)
    );
  };

  const calculateEfficiency = (groupBookings: any[], vehicle: any): number => {
    if (!vehicle) return 0;
    
    const weightUtilization = vehicle.max_weight ? 
      Math.min((groupBookings.reduce((sum, b) => sum + (b.actual_weight || 0), 0) / vehicle.max_weight) * 100, 100) : 50;
    
    const capacityUtilization = vehicle.max_capacity ? 
      Math.min((groupBookings.length / vehicle.max_capacity) * 100, 100) : 50;
    
    const routeConsolidation = new Set(groupBookings.map(b => 
      `${b.from_branch_details?.city} → ${b.to_branch_details?.city}`
    )).size;
    
    const routeEfficiency = Math.max(0, 100 - (routeConsolidation - 1) * 20);
    
    return Math.round((weightUtilization + capacityUtilization + routeEfficiency) / 3);
  };

  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleOptimize = () => {
    const selectedGroupData = optimizedGroups
      .filter(group => selectedGroups.includes(group.id))
      .map(group => ({
        vehicle: group.vehicle,
        bookings: group.bookings,
        route: group.route,
        metrics: {
          totalWeight: group.totalWeight,
          totalValue: group.totalValue,
          utilization: group.utilization,
          efficiency: group.efficiency
        }
      }));
    
    onOptimize(selectedGroupData);
  };

  useEffect(() => {
    if (bookings.length > 0) {
      optimizeLoading();
    }
  }, [optimizationStrategy, bookings]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Loading Optimizer</h2>
          <p className="text-gray-600 mt-1">
            Optimize loading assignments for {bookings.length} bookings
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Optimization Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Optimization Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: 'route', label: 'Route Consolidation', icon: Route, description: 'Group by common routes' },
              { value: 'weight', label: 'Weight Distribution', icon: Weight, description: 'Balance vehicle loads' },
              { value: 'value', label: 'Value Optimization', icon: Calculator, description: 'Prioritize high-value shipments' },
              { value: 'capacity', label: 'Capacity Utilization', icon: Truck, description: 'Maximize vehicle usage' }
            ].map((strategy) => (
              <div
                key={strategy.value}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  optimizationStrategy === strategy.value 
                    ? 'border-brand-500 bg-brand-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setOptimizationStrategy(strategy.value as any)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <strategy.icon className="h-5 w-5 text-brand-600" />
                  <span className="font-medium">{strategy.label}</span>
                </div>
                <p className="text-sm text-gray-600">{strategy.description}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex justify-center">
            <Button 
              onClick={optimizeLoading} 
              disabled={isOptimizing}
              className="flex items-center gap-2"
            >
              {isOptimizing ? (
                <>
                  <LoadingSpinner size="sm" className="border-white border-t-transparent" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Target className="h-4 w-4" />
                  Re-optimize
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Optimized Groups */}
      {optimizedGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Optimized Loading Groups</span>
              <Badge variant="secondary">{optimizedGroups.length} groups</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {optimizedGroups.map((group) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedGroups.includes(group.id)
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleGroupSelection(group.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="checkbox"
                          checked={selectedGroups.includes(group.id)}
                          onChange={() => toggleGroupSelection(group.id)}
                          className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        />
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">
                            {group.vehicle?.vehicle_number || 'No vehicle assigned'}
                          </span>
                        </div>
                        <Badge 
                          variant={group.efficiency >= 80 ? 'default' : group.efficiency >= 60 ? 'secondary' : 'destructive'}
                        >
                          {group.efficiency}% efficient
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Route className="h-4 w-4 text-gray-400" />
                          <span>{group.route}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Weight className="h-4 w-4 text-gray-400" />
                          <span>{group.totalWeight.toFixed(1)} kg</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calculator className="h-4 w-4 text-gray-400" />
                          <span>₹{group.totalValue.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-gray-400" />
                          <span>{group.bookings.length} items</span>
                        </div>
                      </div>
                      
                      {group.warnings.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-600">
                            {group.warnings.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Utilization</div>
                      <div className="font-medium">{group.utilization.toFixed(1)}%</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <div className="text-sm text-gray-600">
                {selectedGroups.length} of {optimizedGroups.length} groups selected
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleOptimize}
                  disabled={selectedGroups.length === 0}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Apply Optimization ({selectedGroups.length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}