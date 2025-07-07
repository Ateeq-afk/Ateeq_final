import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Car, 
  Users, 
  Wrench, 
  Fuel, 
  AlertTriangle, 
  Calendar,
  MapPin,
  TrendingUp,
  Settings
} from 'lucide-react';
import { useVehicles, Vehicle } from '@/hooks/useVehicles';
import { driversService, Driver } from '@/services/drivers';
import { fleetService, MaintenanceAlert, UpcomingMaintenance } from '@/services/fleet';
import { useToast } from '@/hooks/use-toast';

interface FleetStats {
  totalVehicles: number;
  activeVehicles: number;
  vehiclesInMaintenance: number;
  totalDrivers: number;
  activeDrivers: number;
  pendingAlerts: number;
}

export const FleetDashboard: React.FC = () => {
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);
  const [upcomingMaintenance, setUpcomingMaintenance] = useState<UpcomingMaintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [driversData, alertsData, maintenanceData] = await Promise.all([
        driversService.getAll(),
        fleetService.alerts.getAll({ is_active: true, is_acknowledged: false }),
        fleetService.analytics.getUpcomingMaintenance(30)
      ]);
      
      setDrivers(driversData);
      setAlerts(alertsData);
      setUpcomingMaintenance(maintenanceData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load fleet data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getFleetStats = (): FleetStats => {
    return {
      totalVehicles: vehicles.length,
      activeVehicles: vehicles.filter(v => v.status === 'active').length,
      vehiclesInMaintenance: vehicles.filter(v => v.status === 'maintenance').length,
      totalDrivers: drivers.length,
      activeDrivers: drivers.filter(d => d.status === 'active').length,
      pendingAlerts: alerts.length
    };
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await fleetService.alerts.acknowledge(alertId);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      toast({
        title: 'Success',
        description: 'Alert acknowledged'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to acknowledge alert',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'sold': return 'bg-blue-100 text-blue-800';
      case 'accident': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'maintenance_due': return 'bg-yellow-100 text-yellow-800';
      case 'document_expiry': return 'bg-orange-100 text-orange-800';
      case 'insurance_expiry': return 'bg-red-100 text-red-800';
      case 'fitness_expiry': return 'bg-red-100 text-red-800';
      case 'permit_expiry': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = getFleetStats();

  if (loading || vehiclesLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Fleet Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Fleet Dashboard</h1>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Fleet Settings
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                <p className="text-2xl font-bold">{stats.totalVehicles}</p>
              </div>
              <Car className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Vehicles</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeVehicles}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Car className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Drivers</p>
                <p className="text-2xl font-bold text-blue-600">{stats.activeDrivers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Alerts</p>
                <p className="text-2xl font-bold text-red-600">{stats.pendingAlerts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No active alerts</p>
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getAlertTypeColor(alert.alert_type)}>
                          {alert.alert_type.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm font-medium">
                          {alert.vehicles?.vehicle_number}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{alert.alert_message}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                    >
                      Acknowledge
                    </Button>
                  </div>
                ))}
                {alerts.length > 5 && (
                  <Button variant="outline" className="w-full">
                    View All Alerts ({alerts.length})
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Upcoming Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingMaintenance.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No upcoming maintenance</p>
            ) : (
              <div className="space-y-3">
                {upcomingMaintenance.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{item.vehicle_number}</span>
                        <Badge variant="outline">{item.maintenance_type}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Due: {new Date(item.due_date).toLocaleDateString()}
                        {item.days_remaining <= 7 && (
                          <span className="text-red-600 ml-2">
                            ({item.days_remaining} days remaining)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
                {upcomingMaintenance.length > 5 && (
                  <Button variant="outline" className="w-full">
                    View All Maintenance ({upcomingMaintenance.length})
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {vehicles.slice(0, 8).map((vehicle) => (
              <div key={vehicle.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{vehicle.vehicle_number}</span>
                  <Badge className={getStatusColor(vehicle.status)}>
                    {vehicle.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {vehicle.make} {vehicle.model} ({vehicle.year})
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Type: {vehicle.type} | Fuel: {vehicle.fuel_type}
                </p>
              </div>
            ))}
          </div>
          {vehicles.length > 8 && (
            <div className="mt-4 text-center">
              <Button variant="outline">
                View All Vehicles ({vehicles.length})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};