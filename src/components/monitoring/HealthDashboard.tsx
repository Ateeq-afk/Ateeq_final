import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertTriangle, XCircle, Activity, Database, Server, Gauge } from 'lucide-react';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  responseTime: number;
  uptime: number;
  environment: string;
  version: string;
  checks?: {
    database: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      responseTime: number;
      error?: string;
    };
    memory: {
      heapUsed: number;
      heapTotal: number;
      usagePercent: number;
    };
    environment: {
      status: 'healthy' | 'unhealthy';
      nodeEnv: string;
      missingVars: string[];
    };
  };
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'healthy':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'degraded':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'unhealthy':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Activity className="h-5 w-5 text-gray-500" />;
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const variant = status === 'healthy' ? 'success' : status === 'degraded' ? 'warning' : 'destructive';
  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  );
};

export default function HealthDashboard() {
  const [healthData, setHealthData] = useState<HealthStatus | null>(null);
  const [detailedData, setDetailedData] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthData = async (detailed = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const endpoint = detailed ? '/health/detailed' : '/health';
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${endpoint}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (detailed) {
        setDetailedData(data);
      } else {
        setHealthData(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    fetchHealthData(true);
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchHealthData();
      fetchHealthData(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-600">
            <XCircle className="h-5 w-5" />
            <span>Failed to load health data: {error}</span>
            <Button variant="outline" size="sm" onClick={() => fetchHealthData()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Health Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <Server className="h-5 w-5" />
            System Health
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              fetchHealthData();
              fetchHealthData(true);
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {healthData ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <StatusIcon status={healthData.status} />
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <StatusBadge status={healthData.status} />
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Response Time</p>
                <p className="text-lg font-semibold">{healthData.responseTime}ms</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Uptime</p>
                <p className="text-lg font-semibold">{formatUptime(healthData.uptime)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Environment</p>
                <p className="text-lg font-semibold capitalize">{healthData.environment}</p>
              </div>
            </div>
          ) : (
            <div className="animate-pulse">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Health Checks */}
      {detailedData?.checks && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Database Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <StatusBadge status={detailedData.checks.database.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span>Response Time</span>
                  <span className="font-mono">{detailedData.checks.database.responseTime}ms</span>
                </div>
                {detailedData.checks.database.error && (
                  <div className="text-sm text-red-600 mt-2">
                    {detailedData.checks.database.error}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Memory Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                Memory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Usage</span>
                  <span className="font-mono">
                    {detailedData.checks.memory.usagePercent.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Heap Used</span>
                  <span className="font-mono">{detailedData.checks.memory.heapUsed}MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Heap Total</span>
                  <span className="font-mono">{detailedData.checks.memory.heapTotal}MB</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      detailedData.checks.memory.usagePercent > 80 
                        ? 'bg-red-500' 
                        : detailedData.checks.memory.usagePercent > 60 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                    }`}
                    style={{ width: `${detailedData.checks.memory.usagePercent}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Environment Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Environment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <StatusBadge status={detailedData.checks.environment.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span>Node Env</span>
                  <span className="font-mono capitalize">{detailedData.checks.environment.nodeEnv}</span>
                </div>
                {detailedData.checks.environment.missingVars.length > 0 && (
                  <div className="text-sm text-red-600">
                    Missing vars: {detailedData.checks.environment.missingVars.join(', ')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Last Updated */}
      {healthData && (
        <p className="text-sm text-gray-500 text-center">
          Last updated: {new Date(healthData.timestamp).toLocaleString()}
        </p>
      )}
    </div>
  );
}