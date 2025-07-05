import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, MapPin, Search, Truck, Clock, AlertCircle, QrCode, History } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { articleTrackingService, type ArticleTrackingData, type ArticleScanHistory } from '@/services/articleTracking';
import { format } from 'date-fns';

interface ArticleTrackingViewProps {
  warehouseId: string;
  warehouseName: string;
}

export function ArticleTrackingView({ warehouseId, warehouseName }: ArticleTrackingViewProps) {
  const [searchCode, setSearchCode] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<ArticleTrackingData | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();

  // Fetch warehouse articles
  const { data: warehouseData, isLoading, refetch } = useQuery({
    queryKey: ['warehouse-articles', warehouseId],
    queryFn: () => articleTrackingService.getWarehouseArticles(warehouseId),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch article history when selected
  const { data: articleHistory } = useQuery({
    queryKey: ['article-history', selectedArticle?.booking_id],
    queryFn: () => selectedArticle 
      ? articleTrackingService.getArticleHistory(selectedArticle.booking_id)
      : Promise.resolve([]),
    enabled: !!selectedArticle && showHistory
  });

  // Search for article by code
  const handleSearch = async () => {
    if (!searchCode.trim()) return;

    try {
      const article = await articleTrackingService.searchByCode(searchCode);
      if (article) {
        setSelectedArticle(article);
        toast({
          title: 'Article Found',
          description: `Found article from booking ${article.booking.lr_number}`
        });
      } else {
        toast({
          title: 'Not Found',
          description: 'No article found with this code',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Search Failed',
        description: 'Failed to search for article',
        variant: 'destructive'
      });
    }
  };

  // Handle article scan/transfer
  const handleTransfer = async (bookingId: string, toLocationId: string) => {
    try {
      await articleTrackingService.scanArticle({
        booking_id: bookingId,
        scan_type: 'transfer',
        warehouse_location_id: toLocationId,
        notes: 'Manual transfer'
      });
      
      toast({
        title: 'Transfer Successful',
        description: 'Article has been transferred to the new location'
      });
      
      refetch();
    } catch (error) {
      toast({
        title: 'Transfer Failed',
        description: 'Failed to transfer article',
        variant: 'destructive'
      });
    }
  };

  const getLocationColor = (locationCode: string) => {
    if (locationCode === 'RECEIVING') return 'bg-blue-100 text-blue-800';
    if (locationCode.startsWith('STORAGE')) return 'bg-green-100 text-green-800';
    if (locationCode === 'DISPATCH') return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatScanType = (type: string) => {
    const types: Record<string, string> = {
      'check_in': 'Checked In',
      'check_out': 'Checked Out',
      'transfer': 'Transferred',
      'delivery': 'Delivered',
      'return': 'Returned',
      'inventory': 'Inventory Count'
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Article Search
          </CardTitle>
          <CardDescription>
            Search for articles by barcode or QR code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter barcode or QR code..."
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{warehouseData?.total_articles || 0}</div>
            <p className="text-xs text-muted-foreground">Total Articles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {warehouseData?.articles_by_location?.['RECEIVING']?.articles.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">In Receiving</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {Object.entries(warehouseData?.articles_by_location || {})
                .filter(([key]) => key.startsWith('STORAGE'))
                .reduce((sum, [, data]) => sum + data.articles.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">In Storage</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {warehouseData?.articles_by_location?.['DISPATCH']?.articles.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Ready for Dispatch</p>
          </CardContent>
        </Card>
      </div>

      {/* Articles by Location */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Locations</TabsTrigger>
          <TabsTrigger value="receiving">Receiving</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="dispatch">Dispatch</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Loading articles...
              </div>
            </div>
          ) : warehouseData?.total_articles === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No articles currently in this warehouse
              </AlertDescription>
            </Alert>
          ) : (
            Object.entries(warehouseData?.articles_by_location || {}).map(([locationCode, locationData]) => (
              <Card key={locationCode}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <CardTitle className="text-lg">{locationData.location.name}</CardTitle>
                      <Badge className={getLocationColor(locationCode)}>
                        {locationCode}
                      </Badge>
                    </div>
                    <Badge variant="secondary">
                      {locationData.articles.length} articles
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {locationData.articles.map((article) => (
                      <div
                        key={article.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          setSelectedArticle(article);
                          setShowHistory(true);
                        }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {article.booking.article?.name || 'Unknown Article'}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {article.barcode}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            <span>LR: {article.booking.lr_number}</span>
                            <span className="mx-2">•</span>
                            <span>{article.booking.customer.name}</span>
                            <span className="mx-2">•</span>
                            <span>Qty: {article.booking.quantity}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(article.last_scan_time), 'dd/MM HH:mm')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="receiving">
          <LocationArticles 
            articles={warehouseData?.articles_by_location?.['RECEIVING']?.articles || []}
            locationName="Receiving Area"
            onArticleClick={(article) => {
              setSelectedArticle(article);
              setShowHistory(true);
            }}
          />
        </TabsContent>

        <TabsContent value="storage">
          {Object.entries(warehouseData?.articles_by_location || {})
            .filter(([key]) => key.startsWith('STORAGE'))
            .map(([locationCode, locationData]) => (
              <LocationArticles
                key={locationCode}
                articles={locationData.articles}
                locationName={locationData.location.name}
                locationCode={locationCode}
                onArticleClick={(article) => {
                  setSelectedArticle(article);
                  setShowHistory(true);
                }}
              />
            ))}
        </TabsContent>

        <TabsContent value="dispatch">
          <LocationArticles 
            articles={warehouseData?.articles_by_location?.['DISPATCH']?.articles || []}
            locationName="Dispatch Area"
            onArticleClick={(article) => {
              setSelectedArticle(article);
              setShowHistory(true);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Article History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Article Tracking History</DialogTitle>
            <DialogDescription>
              {selectedArticle && (
                <div className="mt-2">
                  <p>{selectedArticle.booking.article?.name || 'Unknown Article'}</p>
                  <p className="text-sm">LR: {selectedArticle.booking.lr_number}</p>
                  <p className="text-sm">Barcode: {selectedArticle.barcode}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {articleHistory && articleHistory.length > 0 ? (
              <div className="space-y-3">
                {articleHistory.map((scan) => (
                  <div key={scan.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className={`p-2 rounded-full ${
                      scan.scan_type === 'check_in' ? 'bg-green-100' :
                      scan.scan_type === 'check_out' ? 'bg-red-100' :
                      scan.scan_type === 'transfer' ? 'bg-blue-100' :
                      'bg-gray-100'
                    }`}>
                      <History className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{formatScanType(scan.scan_type)}</span>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(scan.scan_time), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        By: {scan.scanned_by_user.full_name}
                      </p>
                      {scan.location && (
                        <p className="text-sm mt-1">
                          Location: {scan.location.name} ({scan.location.location_code})
                        </p>
                      )}
                      {scan.notes && (
                        <p className="text-sm mt-1 italic">{scan.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No scan history available</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Sub-component for location articles
function LocationArticles({ 
  articles, 
  locationName, 
  locationCode,
  onArticleClick 
}: { 
  articles: ArticleTrackingData[];
  locationName: string;
  locationCode?: string;
  onArticleClick: (article: ArticleTrackingData) => void;
}) {
  if (articles.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No articles in {locationName}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{locationName}</CardTitle>
          <Badge variant="secondary">{articles.length} articles</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {articles.map((article) => (
            <div
              key={article.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
              onClick={() => onArticleClick(article)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {article.booking.article?.name || 'Unknown Article'}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {article.barcode}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span>LR: {article.booking.lr_number}</span>
                  <span className="mx-2">•</span>
                  <span>{article.booking.customer.name}</span>
                  <span className="mx-2">•</span>
                  <span>Qty: {article.booking.quantity}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {format(new Date(article.last_scan_time), 'dd/MM HH:mm')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}