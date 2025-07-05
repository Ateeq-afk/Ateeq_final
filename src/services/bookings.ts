import api from './api';
import type { Booking } from '@/types';

export interface BookingFilters {
  branch_id?: string;
  from_branch?: string;
  to_branch?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
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

  // Create new booking
  async createBooking(data: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<Booking> {
    const response = await api.post('/bookings', data);
    return response.data.data || response.data;
  }

  // Update booking
  async updateBooking(id: string, data: Partial<Booking>): Promise<Booking> {
    const response = await api.put(`/bookings/${id}`, data);
    return response.data.data || response.data;
  }

  // Update booking status
  async updateBookingStatus(id: string, status: Booking['status'], pod_required?: boolean): Promise<Booking> {
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