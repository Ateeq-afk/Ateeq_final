import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  MapPin, 
  Navigation, 
  Truck, 
  Clock, 
  Route,
  AlertTriangle,
  Wifi,
  WifiOff,
  Play,
  Pause,
  Target
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: Date;
}

interface TrackingSession {
  id: string;
  vehicleId?: string;
  driverId?: string;
  startTime: Date;
  isActive: boolean;
  currentLocation?: Location;
  route: Location[];
}

interface LocationTrackerProps {
  vehicleId?: string;
  driverId?: string;
  onLocationUpdate?: (location: Location) => void;
}

export function LocationTracker({ vehicleId, driverId, onLocationUpdate }: LocationTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationHistory, setLocationHistory] = useState<Location[]>([]);
  const [trackingSession, setTrackingSession] = useState<TrackingSession | null>(null);
  const [isLocationPermissionGranted, setIsLocationPermissionGranted] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [updateInterval, setUpdateInterval] = useState(30); // seconds

  // Check geolocation support and permissions
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    // Check permission status
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setIsLocationPermissionGranted(result.state === 'granted');
        if (result.state === 'denied') {
          setLocationError('Location permission denied');
        }
      });
    }
  }, []);

  // Get current position
  const getCurrentLocation = (): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date()
          };
          resolve(location);
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  // Start location tracking
  const startTracking = async () => {
    try {
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      setLocationHistory([location]);
      setIsTracking(true);
      setLocationError(null);
      
      // Create tracking session
      const session: TrackingSession = {
        id: `session_${Date.now()}`,
        vehicleId,
        driverId,
        startTime: new Date(),
        isActive: true,
        currentLocation: location,
        route: [location]
      };
      setTrackingSession(session);

      // Call callback if provided
      if (onLocationUpdate) {
        onLocationUpdate(location);
      }

      // Start continuous tracking if auto-update is enabled
      if (autoUpdate && navigator.geolocation) {
        const id = navigator.geolocation.watchPosition(
          (position) => {
            const newLocation: Location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date()
            };
            
            setCurrentLocation(newLocation);
            setLocationHistory(prev => [...prev, newLocation]);
            
            if (onLocationUpdate) {
              onLocationUpdate(newLocation);
            }
          },
          (error) => {
            console.error('Location tracking error:', error);
            setLocationError('Failed to track location continuously');
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
        setWatchId(id);
      }

      toast.success('Location tracking started');
    } catch (error: any) {
      setLocationError(error.message);
      toast.error(`Failed to start tracking: ${error.message}`);
    }
  };

  // Stop location tracking
  const stopTracking = () => {
    setIsTracking(false);
    
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }

    if (trackingSession) {
      setTrackingSession({
        ...trackingSession,
        isActive: false
      });
    }

    toast.success('Location tracking stopped');
  };

  // Manual location update
  const updateLocation = async () => {
    try {
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      setLocationHistory(prev => [...prev, location]);
      
      if (onLocationUpdate) {
        onLocationUpdate(location);
      }
      
      toast.success('Location updated');
    } catch (error: any) {
      setLocationError(error.message);
      toast.error(`Failed to update location: ${error.message}`);
    }
  };

  // Format coordinates for display
  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  // Calculate distance between two points (in km)
  const calculateDistance = (loc1: Location, loc2: Location): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate total distance traveled
  const totalDistance = locationHistory.length > 1 
    ? locationHistory.reduce((total, location, index) => {
        if (index === 0) return 0;
        return total + calculateDistance(locationHistory[index - 1], location);
      }, 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">GPS Location Tracker</h2>
        <p className="text-muted-foreground mt-1">
          Real-time location tracking for vehicles and deliveries
        </p>
      </div>

      {/* Location Error Alert */}
      {locationError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{locationError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tracking Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Tracking Controls
            </CardTitle>
            <CardDescription>
              Start/stop location tracking and configure settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tracking Status */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                {isTracking ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600" />
                )}
                <span className="font-medium">
                  {isTracking ? 'Tracking Active' : 'Tracking Inactive'}
                </span>
              </div>
              <Badge variant={isTracking ? 'default' : 'secondary'}>
                {isTracking ? 'LIVE' : 'STOPPED'}
              </Badge>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={isTracking ? stopTracking : startTracking}
                variant={isTracking ? 'destructive' : 'default'}
                className="w-full"
                disabled={!isLocationPermissionGranted && !isTracking}
              >
                {isTracking ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Stop Tracking
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Tracking
                  </>
                )}
              </Button>
              
              <Button
                onClick={updateLocation}
                variant="outline"
                disabled={isTracking && autoUpdate}
              >
                <Target className="h-4 w-4 mr-2" />
                Update Location
              </Button>
            </div>

            {/* Auto-update setting */}
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-update">Auto-update location</Label>
              <Switch
                id="auto-update"
                checked={autoUpdate}
                onCheckedChange={setAutoUpdate}
                disabled={isTracking}
              />
            </div>

            {/* Vehicle/Driver Info */}
            {(vehicleId || driverId) && (
              <div className="space-y-2 p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium">Tracking For:</div>
                {vehicleId && (
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="h-3 w-3" />
                    Vehicle: {vehicleId}
                  </div>
                )}
                {driverId && (
                  <div className="flex items-center gap-2 text-sm">
                    <Navigation className="h-3 w-3" />
                    Driver: {driverId}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Current Location
            </CardTitle>
            <CardDescription>
              Latest GPS coordinates and tracking information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentLocation ? (
              <div className="space-y-4">
                {/* Coordinates */}
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-mono text-sm">
                    {formatCoordinates(currentLocation.lat, currentLocation.lng)}
                  </div>
                  {currentLocation.accuracy && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Accuracy: ±{Math.round(currentLocation.accuracy)}m
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Updated: {format(currentLocation.timestamp, 'dd/MM/yyyy HH:mm:ss')}
                </div>

                {/* Google Maps Link */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = `https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`;
                    window.open(url, '_blank');
                  }}
                >
                  <MapPin className="h-3 w-3 mr-2" />
                  View on Maps
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No location data</p>
                <p className="text-xs">Start tracking to see current location</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tracking Statistics */}
      {trackingSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Tracking Session
            </CardTitle>
            <CardDescription>
              Statistics and information for current tracking session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{locationHistory.length}</div>
                <div className="text-xs text-muted-foreground">Location Updates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{totalDistance.toFixed(1)} km</div>
                <div className="text-xs text-muted-foreground">Distance Traveled</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {Math.floor((Date.now() - trackingSession.startTime.getTime()) / 60000)}m
                </div>
                <div className="text-xs text-muted-foreground">Session Duration</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {trackingSession.isActive ? 'ACTIVE' : 'STOPPED'}
                </div>
                <div className="text-xs text-muted-foreground">Status</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location History */}
      {locationHistory.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Location History
            </CardTitle>
            <CardDescription>
              Recent location updates during this session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {locationHistory.slice(-10).reverse().map((location, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-2 rounded border"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="font-mono text-xs">
                      {formatCoordinates(location.lat, location.lng)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(location.timestamp, 'HH:mm:ss')}
                  </span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}