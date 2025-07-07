import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Navigation, 
  Battery, 
  Signal, 
  Car, 
  Gauge,
  Thermometer,
  RefreshCw,
  Settings
} from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import { fleetService, GPSTracking } from '@/services/fleet';
import { useToast } from '@/hooks/use-toast';

interface VehicleLocation extends GPSTracking {
  vehicle?: {
    vehicle_number: string;
    make: string;
    model: string;
    status: string;
  };
}

export const GPSTrackingComponent: React.FC = () => {
  const { vehicles } = useVehicles();
  const [trackingData, setTrackingData] = useState<VehicleLocation[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [currentLocation, setCurrentLocation] = useState<GPSTracking | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAllVehicleLocations();
  }, [vehicles]);

  useEffect(() => {
    if (selectedVehicle) {
      loadVehicleLocation(selectedVehicle);
    }
  }, [selectedVehicle]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        if (selectedVehicle) {
          loadVehicleLocation(selectedVehicle);
        } else {
          loadAllVehicleLocations();
        }
      }, 30000); // Refresh every 30 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh, selectedVehicle]);

  const loadAllVehicleLocations = async () => {
    try {
      setLoading(true);
      const locations: VehicleLocation[] = [];
      
      for (const vehicle of vehicles.slice(0, 10)) { // Limit to first 10 vehicles
        try {
          const location = await fleetService.tracking.getByVehicle(vehicle.id);
          if (location) {
            locations.push({
              ...location,
              vehicle: {
                vehicle_number: vehicle.vehicle_number,
                make: vehicle.make,
                model: vehicle.model,
                status: vehicle.status
              }
            });
          }
        } catch (error) {
          // Skip vehicles without GPS data
        }
      }
      
      setTrackingData(locations);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load GPS tracking data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadVehicleLocation = async (vehicleId: string) => {
    try {
      const location = await fleetService.tracking.getByVehicle(vehicleId);
      setCurrentLocation(location);
    } catch (error) {
      console.error('Failed to load vehicle location:', error);
    }
  };

  const handleRefresh = () => {
    if (selectedVehicle) {
      loadVehicleLocation(selectedVehicle);
    } else {
      loadAllVehicleLocations();
    }
  };

  const formatLastUpdated = (timestamp: string) => {
    const now = new Date();
    const lastUpdate = new Date(timestamp);
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hr ago`;
    return lastUpdate.toLocaleDateString();
  };

  const getSignalStrengthColor = (strength?: number) => {
    if (!strength) return 'text-gray-400';
    if (strength >= 80) return 'text-green-600';
    if (strength >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBatteryColor = (level?: number) => {
    if (!level) return 'text-gray-400';
    if (level >= 60) return 'text-green-600';
    if (level >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">GPS Tracking</h1>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Vehicle Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Vehicle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="flex-1 h-10 px-3 rounded-md border border-input bg-background"
            >
              <option value="">View all vehicles</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.vehicle_number} - {vehicle.make} {vehicle.model}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Single Vehicle Detailed View */}
      {selectedVehicle && currentLocation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              {vehicles.find(v => v.id === selectedVehicle)?.vehicle_number} - Detailed Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Location Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Location</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                    </span>
                  </div>
                  {currentLocation.altitude && (
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">Altitude: {currentLocation.altitude}m</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      Last updated: {formatLastUpdated(currentLocation.last_updated)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vehicle Status */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Vehicle Status</h3>
                <div className="space-y-2">
                  {currentLocation.speed !== undefined && (
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">Speed: {currentLocation.speed} km/h</span>
                    </div>
                  )}
                  {currentLocation.heading !== undefined && (
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">Heading: {currentLocation.heading}°</span>
                    </div>
                  )}
                  {currentLocation.engine_status !== undefined && (
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        Engine: {currentLocation.engine_status ? 'On' : 'Off'}
                      </span>
                    </div>
                  )}
                  {currentLocation.fuel_level !== undefined && (
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">Fuel: {currentLocation.fuel_level}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Device Status */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Device Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Device ID:</span>
                    <span className="text-sm">{currentLocation.device_id}</span>
                  </div>
                  {currentLocation.provider && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Provider:</span>
                      <span className="text-sm">{currentLocation.provider}</span>
                    </div>
                  )}
                  {currentLocation.signal_strength !== undefined && (
                    <div className="flex items-center gap-2">
                      <Signal className={`h-4 w-4 ${getSignalStrengthColor(currentLocation.signal_strength)}`} />
                      <span className="text-sm">Signal: {currentLocation.signal_strength}%</span>
                    </div>
                  )}
                  {currentLocation.battery_level !== undefined && (
                    <div className="flex items-center gap-2">
                      <Battery className={`h-4 w-4 ${getBatteryColor(currentLocation.battery_level)}`} />
                      <span className="text-sm">Battery: {currentLocation.battery_level}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="mt-6 p-8 bg-gray-100 rounded-lg text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Map integration would be displayed here
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Location: {currentLocation.latitude}, {currentLocation.longitude}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Vehicles Overview */}
      {!selectedVehicle && (
        <Card>
          <CardHeader>
            <CardTitle>Fleet Location Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="p-4 border rounded-lg animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : trackingData.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No GPS tracking data available</p>
                <p className="text-sm text-gray-500">
                  Install GPS devices on vehicles to track their locations
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trackingData.map((location) => (
                  <div key={location.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{location.vehicle?.vehicle_number}</h4>
                        <p className="text-sm text-gray-600">
                          {location.vehicle?.make} {location.vehicle?.model}
                        </p>
                      </div>
                      <Badge className={getStatusColor(location.vehicle?.status || 'inactive')}>
                        {location.vehicle?.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-xs">
                          {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                        </span>
                      </div>
                      
                      {location.speed !== undefined && (
                        <div className="flex items-center gap-2">
                          <Gauge className="h-3 w-3 text-gray-400" />
                          <span className="text-xs">{location.speed} km/h</span>
                        </div>
                      )}

                      <div className="flex items-center gap-4 pt-2">
                        {location.battery_level !== undefined && (
                          <div className="flex items-center gap-1">
                            <Battery className={`h-3 w-3 ${getBatteryColor(location.battery_level)}`} />
                            <span className="text-xs">{location.battery_level}%</span>
                          </div>
                        )}
                        {location.signal_strength !== undefined && (
                          <div className="flex items-center gap-1">
                            <Signal className={`h-3 w-3 ${getSignalStrengthColor(location.signal_strength)}`} />
                            <span className="text-xs">{location.signal_strength}%</span>
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 pt-1">
                        Updated: {formatLastUpdated(location.last_updated)}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-3"
                      onClick={() => setSelectedVehicle(location.vehicle_id)}
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* GPS Setup Instructions */}
      {trackingData.length === 0 && !selectedVehicle && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              GPS Setup Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">To enable GPS tracking:</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>1. Install GPS tracking devices in your vehicles</li>
                <li>2. Configure device IDs and providers in the fleet system</li>
                <li>3. Ensure devices have cellular connectivity for data transmission</li>
                <li>4. Test GPS functionality and verify location accuracy</li>
              </ul>
            </div>
            <Button variant="outline" className="w-full">
              Learn More About GPS Integration
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GPSTrackingComponent;