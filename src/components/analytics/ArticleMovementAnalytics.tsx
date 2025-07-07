import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  MapPin, 
  Package, 
  Route,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  AlertTriangle,
  Target
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement,
  PointElement,
  Title, 
  Tooltip, 
  Legend,
  TimeScale,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { articleTrackingService } from '@/services/articleTracking';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import { addDays, format, subDays, startOfMonth, endOfMonth } from 'date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

interface MovementPattern {
  fromLocation: string;
  toLocation: string;
  count: number;
  averageTime: number; // in hours
  articles: string[];
}

interface LocationAnalytics {
  locationCode: string;
  locationName: string;
  totalArticles: number;
  avgDwellTime: number; // in hours
  throughput: number; // articles per day
  utilization: number; // percentage
  patterns: {
    inbound: MovementPattern[];
    outbound: MovementPattern[];
  };
}

interface TimeAnalytics {
  date: string;
  movements: number;
  avgProcessingTime: number;
  peakHour: number;
  efficiency: number;
}

interface ArticleFlowData {
  articleId: string;
  articleName: string;
  customerName: string;
  journey: {
    location: string;
    timestamp: Date;
    scanType: string;
    dwellTime?: number;
  }[];
  totalJourneyTime: number;
  anomalies: string[];
}

export function ArticleMovementAnalytics() {
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedMetric, setSelectedMetric] = useState<string>('throughput');
  const [selectedTab, setSelectedTab] = useState('overview');
  
  const { selectedBranch } = useBranchSelection();

  // Fetch article movement data
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['article-movements', selectedBranch?.id, dateRange],
    queryFn: async () => {
      // This would be replaced with actual API call
      return articleTrackingService.getCurrentLocations();
    },
    enabled: !!selectedBranch
  });

  // Generate analytics data
  const analyticsData = useMemo(() => {
    if (!movements.length) return null;

    // Simulate movement patterns and analytics
    const locationAnalytics: LocationAnalytics[] = [
      {
        locationCode: 'RECEIVING',
        locationName: 'Receiving Dock',
        totalArticles: 1250,
        avgDwellTime: 2.5,
        throughput: 85,
        utilization: 78,
        patterns: {
          inbound: [
            { fromLocation: 'EXTERNAL', toLocation: 'RECEIVING', count: 1250, averageTime: 0.5, articles: [] }
          ],
          outbound: [
            { fromLocation: 'RECEIVING', toLocation: 'STORAGE_A1', count: 520, averageTime: 1.2, articles: [] },
            { fromLocation: 'RECEIVING', toLocation: 'STORAGE_B1', count: 430, averageTime: 1.5, articles: [] },
            { fromLocation: 'RECEIVING', toLocation: 'DISPATCH', count: 300, averageTime: 0.8, articles: [] }
          ]
        }
      },
      {
        locationCode: 'STORAGE_A1',
        locationName: 'Storage Zone A1',
        totalArticles: 2100,
        avgDwellTime: 48.5,
        throughput: 25,
        utilization: 85,
        patterns: {
          inbound: [
            { fromLocation: 'RECEIVING', toLocation: 'STORAGE_A1', count: 520, averageTime: 1.2, articles: [] }
          ],
          outbound: [
            { fromLocation: 'STORAGE_A1', toLocation: 'DISPATCH', count: 480, averageTime: 2.1, articles: [] },
            { fromLocation: 'STORAGE_A1', toLocation: 'STORAGE_B1', count: 40, averageTime: 3.2, articles: [] }
          ]
        }
      },
      {
        locationCode: 'DISPATCH',
        locationName: 'Dispatch Area',
        totalArticles: 850,
        avgDwellTime: 4.2,
        throughput: 120,
        utilization: 92,
        patterns: {
          inbound: [
            { fromLocation: 'STORAGE_A1', toLocation: 'DISPATCH', count: 480, averageTime: 2.1, articles: [] },
            { fromLocation: 'STORAGE_B1', toLocation: 'DISPATCH', count: 370, averageTime: 1.8, articles: [] }
          ],
          outbound: [
            { fromLocation: 'DISPATCH', toLocation: 'VEHICLE', count: 850, averageTime: 0.3, articles: [] }
          ]
        }
      }
    ];

    // Generate time-based analytics
    const timeAnalytics: TimeAnalytics[] = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return {
        date: format(date, 'yyyy-MM-dd'),
        movements: Math.floor(Math.random() * 200) + 100,
        avgProcessingTime: Math.random() * 5 + 2,
        peakHour: Math.floor(Math.random() * 8) + 9, // 9 AM to 5 PM
        efficiency: Math.random() * 20 + 80
      };
    });

    // Generate sample article flows
    const articleFlows: ArticleFlowData[] = [
      {
        articleId: '1',
        articleName: 'Electronics Package',
        customerName: 'Tech Corp',
        journey: [
          { location: 'RECEIVING', timestamp: new Date('2024-01-15T09:00:00'), scanType: 'check_in', dwellTime: 2.5 },
          { location: 'STORAGE_A1', timestamp: new Date('2024-01-15T11:30:00'), scanType: 'transfer', dwellTime: 36.0 },
          { location: 'DISPATCH', timestamp: new Date('2024-01-16T23:30:00'), scanType: 'check_out', dwellTime: 3.5 },
          { location: 'VEHICLE', timestamp: new Date('2024-01-17T03:00:00'), scanType: 'delivery' }
        ],
        totalJourneyTime: 42.0,
        anomalies: ['Extended storage time']
      }
    ];

    return { locationAnalytics, timeAnalytics, articleFlows };
  }, [movements]);

  // Chart configurations
  const throughputChartData = {
    labels: analyticsData?.timeAnalytics.map(item => format(new Date(item.date), 'MM/dd')) || [],
    datasets: [
      {
        label: 'Daily Movements',
        data: analyticsData?.timeAnalytics.map(item => item.movements) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const dwellTimeChartData = {
    labels: analyticsData?.locationAnalytics.map(loc => loc.locationCode) || [],
    datasets: [
      {
        label: 'Average Dwell Time (hours)',
        data: analyticsData?.locationAnalytics.map(loc => loc.avgDwellTime) || [],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(168, 85, 247, 0.8)'
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(249, 115, 22)',
          'rgb(168, 85, 247)'
        ],
        borderWidth: 2
      }
    ]
  };

  const utilizationChartData = {
    labels: analyticsData?.locationAnalytics.map(loc => loc.locationName) || [],
    datasets: [
      {
        data: analyticsData?.locationAnalytics.map(loc => loc.utilization) || [],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(168, 85, 247, 0.8)'
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(249, 115, 22)',
          'rgb(168, 85, 247)'
        ],
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-blue-600">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Article Movement Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Analyze patterns and optimize warehouse operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <DatePickerWithRange
                date={dateRange}
                onDateChange={(range) => setDateRange(range || { from: subDays(new Date(), 30), to: new Date() })}
              />
            </div>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {analyticsData?.locationAnalytics.map((location) => (
                  <SelectItem key={location.locationCode} value={location.locationCode}>
                    {location.locationName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="throughput">Throughput</SelectItem>
                <SelectItem value="dwellTime">Dwell Time</SelectItem>
                <SelectItem value="utilization">Utilization</SelectItem>
                <SelectItem value="efficiency">Efficiency</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="patterns">Movement Patterns</TabsTrigger>
          <TabsTrigger value="flows">Article Flows</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">4,200</div>
                    <div className="text-xs text-muted-foreground">Total Articles</div>
                  </div>
                  <Package className="h-8 w-8 text-blue-500" />
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">+12% vs last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">18.5h</div>
                    <div className="text-xs text-muted-foreground">Avg Dwell Time</div>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">-8% vs last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">85%</div>
                    <div className="text-xs text-muted-foreground">Avg Utilization</div>
                  </div>
                  <Target className="h-8 w-8 text-green-500" />
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">+5% vs last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">250</div>
                    <div className="text-xs text-muted-foreground">Daily Throughput</div>
                  </div>
                  <Route className="h-8 w-8 text-purple-500" />
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">+15% vs last month</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Daily Movement Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Line data={throughputChartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Dwell Time by Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Bar data={dwellTimeChartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Location Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.locationAnalytics.map((location) => (
                  <div key={location.locationCode} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex-1">
                      <div className="font-medium">{location.locationName}</div>
                      <div className="text-sm text-muted-foreground">
                        {location.totalArticles} articles • {location.throughput}/day throughput
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-sm font-medium">{location.avgDwellTime}h</div>
                        <div className="text-xs text-muted-foreground">Dwell Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">{location.utilization}%</div>
                        <div className="text-xs text-muted-foreground">Utilization</div>
                      </div>
                      <Progress value={location.utilization} className="w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Movement Patterns Tab */}
        <TabsContent value="patterns" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Location Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Doughnut 
                    data={utilizationChartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }} 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Flow Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData?.locationAnalytics.map((location) => (
                    <div key={location.locationCode}>
                      <div className="font-medium text-sm mb-2">{location.locationName}</div>
                      <div className="space-y-1">
                        {location.patterns.outbound.map((pattern, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span>{pattern.fromLocation} → {pattern.toLocation}</span>
                            <Badge variant="outline" className="text-xs">
                              {pattern.count} articles
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Article Flows Tab */}
        <TabsContent value="flows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                Article Journey Analysis
              </CardTitle>
              <CardDescription>
                Track individual article movements through the warehouse
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData?.articleFlows.map((flow) => (
                <div key={flow.articleId} className="p-4 rounded-lg border mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium">{flow.articleName}</div>
                      <div className="text-sm text-muted-foreground">{flow.customerName}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{flow.totalJourneyTime}h</div>
                      <div className="text-xs text-muted-foreground">Total Journey</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {flow.journey.map((step, index) => (
                      <React.Fragment key={index}>
                        <div className="flex-shrink-0 text-center">
                          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <div className="text-xs mt-1 whitespace-nowrap">{step.location}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(step.timestamp, 'HH:mm')}
                          </div>
                          {step.dwellTime && (
                            <div className="text-xs text-orange-600">
                              {step.dwellTime}h
                            </div>
                          )}
                        </div>
                        {index < flow.journey.length - 1 && (
                          <div className="flex-shrink-0 h-0.5 w-8 bg-gray-300"></div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  
                  {flow.anomalies.length > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <div className="flex gap-1">
                        {flow.anomalies.map((anomaly, index) => (
                          <Badge key={index} variant="outline" className="text-orange-600">
                            {anomaly}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                  <div>
                    <div className="font-medium text-green-800">Efficiency Improvement</div>
                    <div className="text-sm text-green-700">
                      Dispatch area shows 92% utilization, indicating optimal throughput
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                  <div>
                    <div className="font-medium text-orange-800">Bottleneck Alert</div>
                    <div className="text-sm text-orange-700">
                      Storage A1 has high dwell time (48.5h) - consider rebalancing
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                  <div>
                    <div className="font-medium text-blue-800">Growth Opportunity</div>
                    <div className="text-sm text-blue-700">
                      15% increase in daily throughput suggests good operational scaling
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded border">
                  <div className="font-medium">Optimize Storage Layout</div>
                  <div className="text-sm text-muted-foreground">
                    Consider redistributing high-velocity items closer to dispatch
                  </div>
                </div>
                
                <div className="p-3 rounded border">
                  <div className="font-medium">Peak Hour Management</div>
                  <div className="text-sm text-muted-foreground">
                    Schedule staff based on 10-11 AM peak processing times
                  </div>
                </div>
                
                <div className="p-3 rounded border">
                  <div className="font-medium">Technology Enhancement</div>
                  <div className="text-sm text-muted-foreground">
                    Implement automated scanning to reduce processing time
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}