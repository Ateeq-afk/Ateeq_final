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
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface PODRecord {
  id: string;
  booking_id: string;
  branch_id: string;
  delivered_at: string;
  delivered_by: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  receiver_name: string;
  receiver_phone: string;
  receiver_designation?: string;
  receiver_company?: string;
  receiver_id_type?: string;
  receiver_id_number?: string;
  signature_image_url?: string;
  photo_evidence_url?: string;
  receiver_photo_url?: string;
  delivery_condition: 'good' | 'damaged' | 'partial';
  damage_description?: string;
  shortage_description?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface PODAttempt {
  id: string;
  booking_id: string;
  attempt_number: number;
  attempted_at: string;
  attempted_by: string;
  reason_for_failure?: string;
  next_attempt_date?: string;
  notes?: string;
  created_at: string;
}

export interface PODTemplate {
  id: string;
  branch_id?: string;
  template_name: string;
  delivery_instructions?: string;
  required_documents?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PODStats {
  totalDelivered: number;
  pendingPODs: number;
  completedPODs: number;
  withSignature: number;
  withPhoto: number;
  completionRate: number;
}

export interface CreatePODData {
  booking_id: string;
  branch_id: string;
  delivered_by: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  receiver_name: string;
  receiver_phone: string;
  receiver_designation?: string;
  receiver_company?: string;
  receiver_id_type?: string;
  receiver_id_number?: string;
  signature_image_url?: string;
  photo_evidence_url?: string;
  receiver_photo_url?: string;
  delivery_condition?: 'good' | 'damaged' | 'partial';
  damage_description?: string;
  shortage_description?: string;
  remarks?: string;
}

export interface CreatePODAttemptData {
  booking_id: string;
  attempted_by: string;
  reason_for_failure?: string;
  next_attempt_date?: string;
  notes?: string;
}

class PODService {
  // Get all POD records
  async getPODRecords(branch_id?: string): Promise<PODRecord[]> {
    const params = branch_id ? { branch_id } : {};
    const response = await api.get('/pod', { params });
    return response.data.data;
  }

  // Get POD record by booking ID
  async getPODByBookingId(bookingId: string): Promise<PODRecord | null> {
    const response = await api.get(`/pod/booking/${bookingId}`);
    return response.data.data;
  }

  // Create POD record
  async createPOD(data: CreatePODData): Promise<PODRecord> {
    const response = await api.post('/pod', data);
    return response.data.data;
  }

  // Update POD record
  async updatePOD(id: string, data: Partial<CreatePODData>): Promise<PODRecord> {
    const response = await api.put(`/pod/${id}`, data);
    return response.data.data;
  }

  // Record delivery attempt
  async recordDeliveryAttempt(data: CreatePODAttemptData): Promise<PODAttempt> {
    const response = await api.post('/pod/attempts', data);
    return response.data.data;
  }

  // Get delivery attempts for a booking
  async getDeliveryAttempts(bookingId: string): Promise<PODAttempt[]> {
    const response = await api.get(`/pod/attempts/${bookingId}`);
    return response.data.data;
  }

  // Get POD templates
  async getPODTemplates(branch_id?: string): Promise<PODTemplate[]> {
    const params = branch_id ? { branch_id } : {};
    const response = await api.get('/pod/templates', { params });
    return response.data.data;
  }

  // Create POD template
  async createPODTemplate(data: Omit<PODTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<PODTemplate> {
    const response = await api.post('/pod/templates', data);
    return response.data.data;
  }

  // Get POD statistics
  async getPODStats(params?: {
    branch_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<PODStats> {
    const response = await api.get('/pod/stats', { params });
    return response.data.data;
  }

  // Upload signature image
  async uploadSignature(base64Image: string): Promise<string> {
    // In a real implementation, this would upload to a storage service
    // For now, we'll return the base64 string as-is
    // You can integrate with Supabase Storage or AWS S3 here
    return base64Image;
  }

  // Upload photo evidence
  async uploadPhotoEvidence(file: File): Promise<string> {
    // In a real implementation, this would upload to a storage service
    // For now, we'll convert to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Check if POD is required for booking
  async isPODRequired(bookingId: string): Promise<boolean> {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      const booking = response.data;
      return booking.pod_required !== false;
    } catch (error) {
      console.error('Error checking POD requirement:', error);
      return true; // Default to required if we can't check
    }
  }

  // Get current location (for delivery location tracking)
  async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          resolve(null);
        }
      );
    });
  }
}

export const podService = new PODService();