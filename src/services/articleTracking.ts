import api from './api';

export interface ArticleLocation {
  booking_id: string;
  lr_number: string;
  article_id: string;
  article_name: string;
  article_description: string;
  quantity: number;
  weight: number;
  current_location_type: 'warehouse' | 'vehicle' | 'delivered' | 'customer';
  warehouse_name?: string;
  location_name?: string;
  location_code?: string;
  last_scan_time: string;
  tracking_status: string;
  barcode?: string;
  booking_status: string;
  customer_name: string;
  customer_phone: string;
}

export interface ArticleScanHistory {
  id: string;
  scan_type: 'check_in' | 'check_out' | 'transfer' | 'delivery' | 'return' | 'inventory';
  scan_location_type: string;
  scan_time: string;
  scanned_by_user: {
    id: string;
    full_name: string;
    email: string;
  };
  warehouse?: {
    id: string;
    name: string;
  };
  location?: {
    id: string;
    name: string;
    location_code: string;
  };
  notes?: string;
  condition_at_scan?: string;
}

export interface ArticleTrackingData {
  id: string;
  booking_id: string;
  article_id?: string;
  current_location_type: string;
  warehouse_id?: string;
  warehouse_location_id?: string;
  status: string;
  last_scan_time: string;
  barcode: string;
  booking: {
    id: string;
    lr_number: string;
    quantity: number;
    weight: number;
    article?: {
      name: string;
      description: string;
    };
    customer: {
      name: string;
      phone: string;
    };
  };
  warehouse?: {
    name: string;
  };
  warehouse_location?: {
    name: string;
    location_code: string;
  };
}

export interface WarehouseArticles {
  warehouse_id: string;
  total_articles: number;
  articles_by_location: {
    [locationCode: string]: {
      location: {
        id?: string;
        name: string;
        location_code: string;
      };
      articles: ArticleTrackingData[];
    };
  };
}

export interface ScanArticleData {
  booking_id: string;
  scan_type: 'check_in' | 'check_out' | 'transfer' | 'delivery' | 'return' | 'inventory';
  warehouse_location_id?: string;
  notes?: string;
  condition_at_scan?: 'good' | 'damaged' | 'wet' | 'torn' | 'missing_parts';
  gps_coordinates?: { lat: number; lng: number };
}

class ArticleTrackingService {
  // Get current locations of articles
  async getCurrentLocations(params?: {
    booking_id?: string;
    lr_number?: string;
    status?: string;
    warehouse_id?: string;
  }): Promise<ArticleLocation[]> {
    const response = await api.get('/article-tracking/current-locations', { params });
    return response.data.data || [];
  }

  // Get article tracking history
  async getArticleHistory(bookingId: string): Promise<ArticleScanHistory[]> {
    const response = await api.get(`/article-tracking/history/${bookingId}`);
    return response.data.data || [];
  }

  // Scan article (update location)
  async scanArticle(data: ScanArticleData): Promise<any> {
    const response = await api.post('/article-tracking/scan', data);
    return response.data.data;
  }

  // Get articles in a specific warehouse
  async getWarehouseArticles(warehouseId: string, params?: {
    location_id?: string;
    status?: string;
  }): Promise<WarehouseArticles> {
    const response = await api.get(`/article-tracking/warehouse/${warehouseId}`, { params });
    return response.data.data;
  }

  // Search for article by barcode/QR code
  async searchByCode(code: string): Promise<ArticleTrackingData | null> {
    try {
      const response = await api.get(`/article-tracking/search/${code}`);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  // Get undelivered articles for a branch
  async getUndeliveredArticles(branchId: string): Promise<ArticleLocation[]> {
    const response = await api.get('/article-tracking/current-locations', {
      params: {
        status: 'active',
        to_branch: branchId
      }
    });
    return response.data.data?.filter((article: ArticleLocation) => 
      article.current_location_type === 'warehouse' && 
      article.booking_status !== 'delivered'
    ) || [];
  }

  // Get article summary statistics
  async getArticleStats(warehouseId?: string): Promise<{
    total: number;
    in_receiving: number;
    in_storage: number;
    in_dispatch: number;
    out_for_delivery: number;
  }> {
    const articles = await this.getCurrentLocations({ warehouse_id: warehouseId });
    
    return {
      total: articles.length,
      in_receiving: articles.filter(a => a.location_code === 'RECEIVING').length,
      in_storage: articles.filter(a => a.location_code?.startsWith('STORAGE')).length,
      in_dispatch: articles.filter(a => a.location_code === 'DISPATCH').length,
      out_for_delivery: articles.filter(a => a.current_location_type === 'vehicle').length
    };
  }
}

export const articleTrackingService = new ArticleTrackingService();