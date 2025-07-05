import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, MapPin, Search, Truck, Clock, AlertCircle, BarChart3, TrendingUp, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { articleTrackingService, type ArticleLocation } from '@/services/articleTracking';
import { warehouseService } from '@/services/warehouses';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import { format } from 'date-fns';

export function ArticleTrackingDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const { selectedBranch } = useBranchSelection();

  // Fetch all articles
  const { data: articles = [], isLoading: articlesLoading, refetch } = useQuery({
    queryKey: ['article-locations', selectedBranch, selectedWarehouse, selectedStatus],
    queryFn: async () => {
      const params: any = {};
      if (selectedWarehouse !== 'all') params.warehouse_id = selectedWarehouse;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      
      const data = await articleTrackingService.getCurrentLocations(params);
      
      // Filter by branch if needed
      if (selectedBranch) {
        return data.filter(article => article.to_branch === selectedBranch);
      }
      
      return data;
    },
    enabled: !!selectedBranch,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch warehouses for filter
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses', selectedBranch],
    queryFn: () => warehouseService.getWarehouses({ branch_id: selectedBranch || undefined }),
    enabled: !!selectedBranch
  });

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = articles.length;
    const inWarehouse = articles.filter(a => a.current_location_type === 'warehouse').length;
    const inTransit = articles.filter(a => a.current_location_type === 'vehicle').length;
    const delivered = articles.filter(a => a.current_location_type === 'delivered').length;
    
    const byLocation: Record<string, number> = {};
    articles.forEach(article => {
      if (article.location_code) {
        byLocation[article.location_code] = (byLocation[article.location_code] || 0) + 1;
      }
    });

    return {
      total,
      inWarehouse,
      inTransit,
      delivered,
      byLocation,
      deliveryRate: total > 0 ? (delivered / total) * 100 : 0
    };
  }, [articles]);

  // Filter articles based on search
  const filteredArticles = React.useMemo(() => {
    if (!searchTerm) return articles;
    
    const term = searchTerm.toLowerCase();
    return articles.filter(article => 
      article.lr_number?.toLowerCase().includes(term) ||
      article.article_name?.toLowerCase().includes(term) ||
      article.customer_name?.toLowerCase().includes(term) ||
      article.barcode?.toLowerCase().includes(term)
    );
  }, [articles, searchTerm]);

  // Group articles by status for visual representation
  const articlesByStatus = React.useMemo(() => {
    const groups: Record<string, ArticleLocation[]> = {
      warehouse: [],
      transit: [],
      delivered: []
    };

    filteredArticles.forEach(article => {
      if (article.current_location_type === 'warehouse') {
        groups.warehouse.push(article);
      } else if (article.current_location_type === 'vehicle') {
        groups.transit.push(article);
      } else if (article.current_location_type === 'delivered') {
        groups.delivered.push(article);
      }
    });

    return groups;
  }, [filteredArticles]);

  if (!selectedBranch) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please select a branch to view article tracking
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Article Tracking Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Real-time tracking of all articles in the system
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Across all locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Warehouse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inWarehouse}</div>
            <Progress value={(stats.inWarehouse / stats.total) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inTransit}</div>
            <Progress value={(stats.inTransit / stats.total) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered}</div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">{stats.deliveryRate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by LR number, article name, customer, or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Warehouses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="in_warehouse">In Warehouse</SelectItem>
                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Location Distribution */}
      {stats.inWarehouse > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Warehouse Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.byLocation).map(([location, count]) => (
                <div key={location} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={(count / stats.inWarehouse) * 100} 
                      className="w-[100px]" 
                    />
                    <span className="text-sm text-muted-foreground w-10 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Articles List */}
      <div className="space-y-4">
        {articlesLoading ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading articles...
            </div>
          </div>
        ) : filteredArticles.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {searchTerm ? 'No articles found matching your search' : 'No articles to track'}
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* In Warehouse */}
            {articlesByStatus.warehouse.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      In Warehouse
                    </span>
                    <Badge variant="secondary">{articlesByStatus.warehouse.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {articlesByStatus.warehouse.slice(0, 5).map((article) => (
                      <ArticleRow key={article.booking_article_id} article={article} />
                    ))}
                    {articlesByStatus.warehouse.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center pt-2">
                        And {articlesByStatus.warehouse.length - 5} more...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* In Transit */}
            {articlesByStatus.transit.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      In Transit
                    </span>
                    <Badge variant="secondary">{articlesByStatus.transit.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {articlesByStatus.transit.slice(0, 5).map((article) => (
                      <ArticleRow key={article.booking_article_id} article={article} />
                    ))}
                    {articlesByStatus.transit.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center pt-2">
                        And {articlesByStatus.transit.length - 5} more...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Delivered */}
            {articlesByStatus.delivered.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Recently Delivered
                    </span>
                    <Badge variant="secondary">{articlesByStatus.delivered.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {articlesByStatus.delivered.slice(0, 5).map((article) => (
                      <ArticleRow key={article.booking_article_id} article={article} />
                    ))}
                    {articlesByStatus.delivered.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center pt-2">
                        And {articlesByStatus.delivered.length - 5} more...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Article row component
function ArticleRow({ article }: { article: ArticleLocation }) {
  const getStatusColor = (type: string) => {
    switch (type) {
      case 'warehouse': return 'bg-blue-100 text-blue-800';
      case 'vehicle': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{article.article_name || 'Unknown Article'}</span>
          <Badge variant="outline" className="text-xs">{article.lr_number}</Badge>
          {article.barcode && (
            <Badge variant="outline" className="text-xs">{article.barcode}</Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          <span>{article.customer_name}</span>
          <span className="mx-2">•</span>
          <span>Qty: {article.quantity}</span>
          {article.location_name && (
            <>
              <span className="mx-2">•</span>
              <span>{article.location_name} ({article.location_code})</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge className={getStatusColor(article.current_location_type)}>
          {article.current_location_type}
        </Badge>
        <div className="text-right">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            {format(new Date(article.last_scan_time), 'dd/MM HH:mm')}
          </div>
        </div>
      </div>
    </div>
  );
}