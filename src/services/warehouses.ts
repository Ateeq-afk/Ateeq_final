import axios from 'axios';

// Create an axios instance for API calls
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'development' ? 'http://localhost:4000/api' : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Warehouse {
  id: string;
  name: string;
  branch_id?: string | null;
  organization_id?: string | null;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  status?: string;
  warehouse_type?: string;
  total_capacity_sqft?: number;
  manager_name?: string;
  manager_contact?: string;
  operating_hours?: Record<string, { open: string; close: string }>;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface WarehouseLocation {
  id: string;
  warehouse_id: string;
  location_code: string;
  name: string;
  description?: string;
  location_type?: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  capacity_weight?: number;
  capacity_volume?: number;
  capacity_units?: number;
  temperature_controlled?: boolean;
  humidity_controlled?: boolean;
  min_temperature?: number;
  max_temperature?: number;
  min_humidity?: number;
  max_humidity?: number;
  status?: string;
  is_hazmat_approved?: boolean;
  parent_location_id?: string;
  zone_id?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface InventoryRecord {
  id: string;
  warehouse_location_id: string;
  article_id?: string;
  booking_id?: string;
  item_code?: string;
  batch_number?: string;
  serial_number?: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  weight_per_unit?: number;
  total_weight?: number;
  dimensions_per_unit?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  status: string;
  condition_rating?: string;
  received_date?: string;
  expiry_date?: string;
  last_moved_at: string;
  unit_cost?: number;
  total_cost?: number;
  supplier_name?: string;
  supplier_batch_ref?: string;
  quality_check_status?: string;
  quality_check_date?: string;
  quality_check_by?: string;
  compliance_certifications?: Record<string, any>;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface InboundData {
  warehouse_location_id: string;
  article_id?: string;
  quantity: number;
  status?: string;
  booking_id?: string;
}

export interface OutboundData {
  warehouse_location_id: string;
  article_id?: string;
  quantity: number;
  booking_id?: string;
}

export interface TransferData {
  from_location_id: string;
  to_location_id: string;
  article_id?: string;
  quantity: number;
}

export interface CreateWarehouseData {
  name: string;
  branch_id?: string;
  organization_id?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  status?: string;
  warehouse_type?: string;
  total_capacity_sqft?: number;
  manager_name?: string;
  manager_contact?: string;
  operating_hours?: Record<string, { open: string; close: string }>;
}

export interface CreateLocationData {
  warehouse_id: string;
  location_code: string;
  name: string;
  description?: string;
  location_type?: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  capacity_weight?: number;
  capacity_volume?: number;
  capacity_units?: number;
  temperature_controlled?: boolean;
  humidity_controlled?: boolean;
  min_temperature?: number;
  max_temperature?: number;
  min_humidity?: number;
  max_humidity?: number;
  status?: string;
  is_hazmat_approved?: boolean;
  parent_location_id?: string;
  zone_id?: string;
}

class WarehouseService {
  // Get all warehouses
  async getWarehouses(params?: { branch_id?: string }): Promise<Warehouse[]> {
    const response = await api.get('/warehouses', { params });
    return response.data.data || response.data;
  }

  // Create new warehouse
  async createWarehouse(data: CreateWarehouseData): Promise<Warehouse> {
    const response = await api.post('/warehouses', data);
    return response.data.data || response.data;
  }

  // Get warehouse by ID
  async getWarehouseById(id: string): Promise<Warehouse> {
    const response = await api.get(`/warehouses/${id}`);
    return response.data.data || response.data;
  }

  // Update warehouse
  async updateWarehouse(id: string, data: Partial<CreateWarehouseData>): Promise<Warehouse> {
    const response = await api.put(`/warehouses/${id}`, data);
    return response.data.data || response.data;
  }

  // Delete warehouse
  async deleteWarehouse(id: string): Promise<void> {
    await api.delete(`/warehouses/${id}`);
  }

  // Get all warehouse locations
  async getWarehouseLocations(): Promise<WarehouseLocation[]> {
    const response = await api.get('/warehouses/locations');
    return response.data.data || response.data;
  }

  // Get locations for a specific warehouse
  async getLocationsByWarehouse(warehouseId: string): Promise<WarehouseLocation[]> {
    const response = await api.get('/warehouses/locations', {
      params: { warehouse_id: warehouseId }
    });
    return response.data.data || response.data;
  }

  // Create new location
  async createLocation(data: CreateLocationData): Promise<WarehouseLocation> {
    const response = await api.post('/warehouses/locations', data);
    return response.data.data || response.data;
  }

  // Update location
  async updateLocation(id: string, data: Partial<CreateLocationData>): Promise<WarehouseLocation> {
    const response = await api.put(`/warehouses/locations/${id}`, data);
    return response.data.data || response.data;
  }

  // Delete location
  async deleteLocation(id: string): Promise<void> {
    await api.delete(`/warehouses/locations/${id}`);
  }

  // Get inventory for a location
  async getInventory(locationId: string, articleId?: string): Promise<InventoryRecord[]> {
    const params = articleId ? { location_id: locationId, article_id: articleId } : { location_id: locationId };
    const response = await api.get('/warehouses/inventory', { params });
    return response.data.data || response.data;
  }

  // Receive inventory (inbound)
  async receiveInventory(data: InboundData): Promise<InventoryRecord> {
    const response = await api.post('/warehouses/inventory', data);
    return response.data.data || response.data;
  }

  // Dispatch inventory (outbound)
  async dispatchInventory(data: OutboundData): Promise<any> {
    const response = await api.post('/warehouses/inventory/movements', {
      movement_type: 'outbound',
      movement_reason: 'shipping',
      inventory_record_id: data.warehouse_location_id, // This needs to be updated to proper inventory record ID
      quantity_moved: data.quantity,
      quantity_before: 0, // This should be fetched first
      quantity_after: 0,  // This should be calculated
    });
    return response.data.data || response.data;
  }

  // Transfer inventory between locations
  async transferInventory(data: TransferData): Promise<any> {
    const response = await api.post('/warehouses/inventory/movements', {
      movement_type: 'transfer',
      movement_reason: 'transfer',
      from_location_id: data.from_location_id,
      to_location_id: data.to_location_id,
      quantity_moved: data.quantity,
      quantity_before: 0, // This should be fetched first
      quantity_after: 0,  // This should be calculated
    });
    return response.data.data || response.data;
  }

  // Get all inventory records
  async getAllInventory(): Promise<InventoryRecord[]> {
    const response = await api.get('/warehouses/inventory');
    return response.data.data || response.data;
  }

  // Get inventory summary by warehouse
  async getInventorySummary(warehouseId?: string): Promise<any> {
    const params = warehouseId ? { warehouse_id: warehouseId } : {};
    const response = await api.get('/warehouses/inventory/summary', { params });
    return response.data.data || response.data;
  }
}

export const warehouseService = new WarehouseService();