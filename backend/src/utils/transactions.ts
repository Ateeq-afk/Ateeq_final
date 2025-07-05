import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

// Transaction wrapper for complex operations
export class Transaction {
  private client: SupabaseClient;
  private operations: Array<() => Promise<any>> = [];
  private rollbackOperations: Array<() => Promise<any>> = [];

  constructor(client: SupabaseClient = supabase) {
    this.client = client;
  }

  // Add an operation to the transaction
  addOperation(
    operation: () => Promise<any>,
    rollback?: () => Promise<any>
  ) {
    this.operations.push(operation);
    if (rollback) {
      this.rollbackOperations.unshift(rollback); // Reverse order for rollback
    }
    return this;
  }

  // Execute all operations
  async execute(): Promise<any[]> {
    const results: any[] = [];
    let operationIndex = 0;

    try {
      // Execute operations in sequence
      for (const operation of this.operations) {
        const result = await operation();
        results.push(result);
        operationIndex++;
      }

      return results;
    } catch (error) {
      console.error(`Transaction failed at operation ${operationIndex}:`, error);
      
      // Attempt rollback of completed operations
      await this.rollback(operationIndex);
      
      throw error;
    }
  }

  // Rollback completed operations
  private async rollback(failedOperationIndex: number) {
    console.log(`Rolling back ${failedOperationIndex} operations...`);
    
    // Execute rollback operations for completed operations only
    const rollbacksToExecute = this.rollbackOperations.slice(
      this.rollbackOperations.length - failedOperationIndex
    );

    for (const rollback of rollbacksToExecute) {
      try {
        await rollback();
      } catch (rollbackError) {
        console.error('Rollback operation failed:', rollbackError);
        // Continue with other rollbacks even if one fails
      }
    }
  }
}

// Helper for booking-related transactions
export class BookingTransaction extends Transaction {
  
  // Update booking status with audit logging
  updateBookingStatus(
    bookingId: string, 
    newStatus: string, 
    metadata: any = {},
    orgId: string,
    userId: string
  ) {
    let oldStatus: string;
    
    this.addOperation(
      async () => {
        // Get current status first
        const { data: booking, error: fetchError } = await this.client
          .from('bookings')
          .select('status')
          .eq('id', bookingId)
          .eq('organization_id', orgId)
          .single();

        if (fetchError || !booking) {
          throw new Error('Booking not found');
        }

        oldStatus = booking.status;

        // Update status
        const { data, error } = await this.client
          .from('bookings')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', bookingId)
          .eq('organization_id', orgId)
          .select()
          .single();

        if (error) throw error;

        // Log the status change
        await this.client
          .from('logistics_events')
          .insert({
            booking_id: bookingId,
            event_type: 'status_change',
            event_data: {
              old_status: oldStatus,
              new_status: newStatus,
              metadata
            },
            created_by: userId,
            organization_id: orgId,
            created_at: new Date().toISOString()
          });

        return data;
      },
      // Rollback: restore old status
      async () => {
        if (oldStatus) {
          await this.client
            .from('bookings')
            .update({ status: oldStatus })
            .eq('id', bookingId)
            .eq('organization_id', orgId);
        }
      }
    );

    return this;
  }

  // Create OGPL and update booking statuses
  createOGPLWithBookings(
    ogplData: any,
    bookingIds: string[],
    orgId: string,
    userId: string
  ) {
    let createdOGPLId: string;
    const updatedBookings: string[] = [];

    this.addOperation(
      async () => {
        // Create OGPL
        const { data: ogpl, error: ogplError } = await this.client
          .from('ogpl')
          .insert({
            ...ogplData,
            organization_id: orgId,
            created_by: userId,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (ogplError) throw ogplError;
        createdOGPLId = ogpl.id;

        // Update bookings
        for (const bookingId of bookingIds) {
          const { error: bookingError } = await this.client
            .from('bookings')
            .update({ 
              status: 'in_transit',
              loading_session_id: createdOGPLId,
              updated_at: new Date().toISOString()
            })
            .eq('id', bookingId)
            .eq('organization_id', orgId);

          if (bookingError) throw bookingError;
          updatedBookings.push(bookingId);
        }

        return ogpl;
      },
      // Rollback: delete OGPL and restore booking statuses
      async () => {
        // Restore booking statuses
        for (const bookingId of updatedBookings) {
          await this.client
            .from('bookings')
            .update({ 
              status: 'booked',
              loading_session_id: null
            })
            .eq('id', bookingId);
        }

        // Delete OGPL
        if (createdOGPLId) {
          await this.client
            .from('ogpl')
            .delete()
            .eq('id', createdOGPLId);
        }
      }
    );

    return this;
  }
}

// Helper for POD transactions
export class PODTransaction extends Transaction {
  
  createPODWithBookingUpdate(
    podData: any,
    bookingId: string,
    orgId: string,
    userId: string
  ) {
    let createdPODId: string;
    let oldBookingStatus: string;

    this.addOperation(
      async () => {
        // Get current booking status
        const { data: booking, error: fetchError } = await this.client
          .from('bookings')
          .select('status, pod_status')
          .eq('id', bookingId)
          .eq('organization_id', orgId)
          .single();

        if (fetchError || !booking) {
          throw new Error('Booking not found');
        }

        oldBookingStatus = booking.status;

        // Validate booking is ready for POD
        if (!['out_for_delivery', 'delivered'].includes(booking.status)) {
          throw new Error('Booking must be out for delivery to create POD');
        }

        // Create POD record
        const { data: pod, error: podError } = await this.client
          .from('pod_records')
          .insert({
            ...podData,
            booking_id: bookingId,
            organization_id: orgId,
            created_by: userId,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (podError) throw podError;
        createdPODId = pod.id;

        // Update booking status
        const { error: bookingError } = await this.client
          .from('bookings')
          .update({
            status: 'delivered',
            pod_status: 'completed',
            pod_record_id: createdPODId,
            delivery_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingId)
          .eq('organization_id', orgId);

        if (bookingError) throw bookingError;

        return pod;
      },
      // Rollback: delete POD and restore booking status
      async () => {
        // Restore booking status
        if (oldBookingStatus) {
          await this.client
            .from('bookings')
            .update({
              status: oldBookingStatus,
              pod_status: 'pending',
              pod_record_id: null,
              delivery_date: null
            })
            .eq('id', bookingId);
        }

        // Delete POD record
        if (createdPODId) {
          await this.client
            .from('pod_records')
            .delete()
            .eq('id', createdPODId);
        }
      }
    );

    return this;
  }
}

// Factory function for creating transactions
export function createTransaction(): Transaction {
  return new Transaction();
}

export function createBookingTransaction(): BookingTransaction {
  return new BookingTransaction();
}

export function createPODTransaction(): PODTransaction {
  return new PODTransaction();
}

export default {
  Transaction,
  BookingTransaction,
  PODTransaction,
  createTransaction,
  createBookingTransaction,
  createPODTransaction
};