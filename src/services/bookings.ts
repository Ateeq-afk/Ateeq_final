import api from './api';
import type { Booking } from '@/types';
import { bookingUpdates, createOptimisticId } from './optimisticUpdates';
import { toast } from 'react-hot-toast';

export interface BookingFilters {
  branch_id?: string;
  from_branch?: string;
  to_branch?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

export interface BookingArticle {
  article_id: string;
  quantity: number;
  actual_weight: number;
  charged_weight: number;
  declared_value: number;
  rate_per_unit: number;
  rate_type: 'per_kg' | 'per_quantity';
  loading_charge_per_unit: number;
  unloading_charge_per_unit: number;
  insurance_required?: boolean;
  insurance_value?: number;
  insurance_charge?: number;
  packaging_charge?: number;
  description?: string;
  private_mark_number?: string;
  is_fragile?: boolean;
  special_instructions?: string;
  warehouse_location?: string;
}

export interface CreateBookingData {
  // Core booking fields
  lr_type: 'system' | 'manual';
  manual_lr_number?: string;
  branch_id?: string;
  from_branch: string;
  to_branch: string;
  
  // Customer information
  sender_id: string;
  receiver_id: string;
  
  // Articles (new multi-article support)
  articles: BookingArticle[];
  
  // Payment and delivery
  payment_type: 'Paid' | 'To Pay' | 'Quotation';
  delivery_type?: 'Standard' | 'Express' | 'Same Day';
  priority?: 'Normal' | 'High' | 'Urgent';
  expected_delivery_date?: string;
  
  // Additional details
  reference_number?: string;
  remarks?: string;
  has_invoice?: boolean;
  invoice_number?: string;
  invoice_date?: string;
  invoice_amount?: number;
  eway_bill_number?: string;
}

class BookingService {
  // Get all bookings with filters
  async getBookings(filters?: BookingFilters): Promise<Booking[]> {
    const response = await api.get('/bookings', { params: filters });
    return response.data.data || response.data;
  }

  // Get single booking by ID
  async getBookingById(id: string): Promise<Booking> {
    const response = await api.get(`/bookings/${id}`);
    return response.data.data || response.data;
  }

  // Create new booking with optimistic updates
  async createBooking(data: CreateBookingData | Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<Booking> {
    const optimisticId = createOptimisticId();
    const optimisticBooking: Booking = {
      id: optimisticId,
      lr_number: `OPT-${Date.now()}`,
      status: 'booked',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data
    } as Booking;

    // Apply optimistic update
    bookingUpdates.applyUpdate(
      optimisticId,
      'create',
      optimisticBooking,
      undefined,
      async () => {
        // If the data has 'articles' array, it's the new format
        if ('articles' in data && Array.isArray(data.articles)) {
          const response = await api.post('/bookings', data);
          return response.data.data || response.data;
        }
        
        // Otherwise, it's the old format - convert to new format if needed
        const response = await api.post('/bookings', data);
        return response.data.data || response.data;
      }
    );

    toast.success('Booking created! Syncing with server...');
    return optimisticBooking;
  }

  // Update booking with optimistic updates
  async updateBooking(id: string, data: Partial<Booking>, originalBooking?: Booking): Promise<Booking> {
    const optimisticData = {
      ...originalBooking,
      ...data,
      updated_at: new Date().toISOString()
    } as Booking;

    // Apply optimistic update
    bookingUpdates.applyUpdate(
      id,
      'update',
      optimisticData,
      originalBooking,
      async () => {
        const response = await api.put(`/bookings/${id}`, data);
        return response.data.data || response.data;
      }
    );

    return optimisticData;
  }

  // Update booking status with optimistic updates
  async updateBookingStatus(id: string, status: Booking['status'], pod_required?: boolean, originalBooking?: Booking): Promise<Booking> {
    const optimisticData = {
      ...originalBooking,
      status,
      updated_at: new Date().toISOString()
    } as Booking;

    // Apply optimistic update
    bookingUpdates.applyUpdate(
      id,
      'update',
      optimisticData,
      originalBooking,
      async () => {
        try {
          const response = await api.patch(`/bookings/${id}/status`, { status, pod_required });
          return response.data.data || response.data;
        } catch (error: any) {
          // Handle POD-specific errors
          if (error.response?.data?.details?.action_required === 'complete_pod') {
            // Re-throw with a more specific error
            const podError = new Error(error.response.data.error);
            (podError as any).requiresPOD = true;
            (podError as any).details = error.response.data.details;
            throw podError;
          }
          throw error;
        }
      }
    );

    toast.success(`Booking status updated to ${status}`);
    return optimisticData;
  }

  // Delete booking
  async deleteBooking(id: string): Promise<void> {
    await api.delete(`/bookings/${id}`);
  }

  // Get bookings pending POD
  async getBookingsPendingPOD(branch_id?: string): Promise<Booking[]> {
    const filters: BookingFilters = {
      status: 'delivered',
      branch_id,
    };
    const bookings = await this.getBookings(filters);
    // Filter for bookings with pending POD
    return bookings.filter(b => b.pod_status === 'pending' && b.pod_required !== false);
  }

  // Check if booking can be delivered
  async canMarkAsDelivered(bookingId: string): Promise<{ canDeliver: boolean; reason?: string }> {
    try {
      const booking = await this.getBookingById(bookingId);
      
      if (booking.status === 'delivered') {
        return { canDeliver: false, reason: 'Booking is already delivered' };
      }
      
      if (booking.status !== 'out_for_delivery') {
        return { canDeliver: false, reason: 'Booking must be out for delivery first' };
      }
      
      if (booking.pod_required !== false && booking.pod_status !== 'completed') {
        return { canDeliver: false, reason: 'POD must be completed before marking as delivered' };
      }
      
      return { canDeliver: true };
    } catch (error) {
      console.error('Error checking delivery eligibility:', error);
      return { canDeliver: false, reason: 'Failed to check booking status' };
    }
  }
}

export const bookingService = new BookingService();