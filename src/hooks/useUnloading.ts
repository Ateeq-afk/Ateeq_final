import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/hooks/useBookings';
import type { OGPL } from '@/types';

// Simple UUID validation used across hooks
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (uuid: string | null): boolean => !!uuid && UUID_REGEX.test(uuid);

export function useUnloading(organizationId: string | null = null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { showSuccess, showError } = useNotificationSystem();
  const { getCurrentUserBranch } = useAuth();
  const { updateBookingStatus } = useBookings();
  const userBranch = getCurrentUserBranch();

  // Get incoming OGPLs that need to be unloaded
  const getIncomingOGPLs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const effectiveBranchId = userBranch?.id;
      
      if (!effectiveBranchId) {
        console.warn('No branch ID available, fetching all in_transit OGPLs');
      } else {
        console.log('Getting incoming OGPLs for branch:', effectiveBranchId);
      }
      
      // First try a simple query to debug
      const { data: simpleData, error: simpleError } = await supabase
        .from('ogpl')
        .select('id, ogpl_number, status')
        .eq('status', 'in_transit')
        .limit(5);
        
      if (simpleError) {
        console.error('Simple OGPL query failed:', simpleError);
        const errorMessage = `Failed to fetch OGPLs: ${simpleError.message} (Code: ${simpleError.code})`;
        throw new Error(errorMessage);
      }
      
      console.log('Simple OGPL query successful, sample:', simpleData);
      
      // Now try the full query
      let query = supabase
        .from('ogpl')
        .select(`
          *,
          vehicle:vehicles(*),
          from_station:branches!from_station(*),
          to_station:branches!to_station(*),
          loading_records(
            *,
            booking:bookings(
              *,
              sender:customers!sender_id(*),
              receiver:customers!receiver_id(*),
              article:articles(*)
            )
          )
        `)
        .eq('status', 'in_transit')
        .order('created_at', { ascending: false });
      
      if (effectiveBranchId) {
        query = query.eq('to_station', effectiveBranchId);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) {
        console.error('Full OGPL query failed:', fetchError);
        
        // Fall back to a simpler query without relationships
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('ogpl')
          .select('*')
          .eq('status', 'in_transit')
          .order('created_at', { ascending: false });
          
        if (fallbackError) {
          console.error('Fallback OGPL query failed:', fallbackError);
          const errorMessage = `Failed to fetch OGPLs: ${fallbackError.message} (Code: ${fallbackError.code})`;
          throw new Error(errorMessage);
        }
        
        console.log('Fallback OGPL query successful, count:', fallbackData?.length);
        return fallbackData || [];
      }
      
      console.log('Full OGPL query successful, count:', data?.length);
      return data || [];
    } catch (err) {
      console.error('Failed to get incoming OGPLs:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get incoming OGPLs';
      setError(new Error(errorMessage));
      return [];
    } finally {
      setLoading(false);
    }
  }, [userBranch]);

  // Unload an OGPL
  const unloadOGPL = async (
    ogplId: string,
    bookingIds: string[],
    conditions: Record<string, { status: string; remarks?: string; photo?: string }>
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Validate identifiers before hitting the database
      if (!isValidUUID(ogplId)) {
        throw new Error('Invalid OGPL ID');
      }

      if (!userBranch?.id || !isValidUUID(userBranch.id)) {
        throw new Error('Invalid or missing branch ID');
      }

      if (!bookingIds.length) {
        throw new Error('No bookings provided for unloading');
      }
      for (const id of bookingIds) {
        if (!isValidUUID(id)) {
          throw new Error(`Invalid booking ID: ${id}`);
        }
        if (!conditions[id]) {
          throw new Error(`Missing unloading condition for booking ${id}`);
        }
      }

      console.log('Unloading OGPL:', ogplId);
      console.log('Booking IDs:', bookingIds);
      console.log('Conditions:', conditions);

      // Validate conditions
      const hasInvalidEntries = Object.entries(conditions).some(([bookingId, condition]) => {
        if (condition.status === 'damaged' && !condition.remarks) {
          showError('Validation Error', 'Please provide remarks for all damaged items');
          return true;
        }
        return false;
      });
      
      if (hasInvalidEntries) {
        throw new Error('Please provide remarks for all damaged items');
      }

      // Count items by status
      const goodCount = Object.values(conditions).filter(c => c.status === 'good').length;
      const damagedCount = Object.values(conditions).filter(c => c.status === 'damaged').length;
      const missingCount = Object.values(conditions).filter(c => c.status === 'missing').length;

      // 1. Create unloading session
      const { data: sessionData, error: sessionError } = await supabase
        .from('unloading_sessions')
        .insert({
          ogpl_id: ogplId,
          unloaded_by: 'Admin User', // In a real app, this would be the current user
          branch_id: userBranch.id,
          total_items: bookingIds.length,
          items_damaged: damagedCount,
          items_missing: missingCount,
          notes: `Unloaded ${goodCount} items in good condition, ${damagedCount} damaged, ${missingCount} missing`
        })
        .select()
        .single();
      
      if (sessionError) {
        console.error('Error creating unloading session:', sessionError);
        const errorMessage = `Failed to create unloading session: ${sessionError.message} (Code: ${sessionError.code})`;
        throw new Error(errorMessage);
      }
      
      console.log('Unloading session created:', sessionData);

      // 2. Create unloading record in the legacy format for backward compatibility (optional)
      try {
        const { data: unloadingRecord, error: unloadingError } = await supabase
          .from('unloading_records')
          .insert({
            ogpl_id: ogplId,
            unloaded_at: new Date().toISOString(),
            unloaded_by: 'Admin User', // This would be the current user's ID
            conditions
          })
          .select()
          .single();

        if (unloadingError) {
          console.warn('Legacy unloading record creation failed (non-critical):', unloadingError);
          // Continue anyway since we have the new session record
        } else {
          console.log('Legacy unloading record created:', unloadingRecord);
        }
      } catch (legacyError) {
        console.warn('Legacy unloading record creation failed (non-critical):', legacyError);
        // Continue anyway
      }

      // 3. Update OGPL status to 'unloaded' instead of 'completed'
      const { error: ogplError } = await supabase
        .from('ogpl')
        .update({
          status: 'unloaded',
          updated_at: new Date().toISOString()
        })
        .eq('id', ogplId);

      if (ogplError) {
        console.error('Error updating OGPL status:', ogplError);
        const errorMessage = `Failed to update OGPL status: ${ogplError.message} (Code: ${ogplError.code})`;
        throw new Error(errorMessage);
      }

      // 4. Update booking statuses
      for (const bookingId of bookingIds) {
        const condition = conditions[bookingId];
        
        try {
          // Mark as unloaded if item was received
          if (condition && condition.status !== 'missing') {
            await updateBookingStatus(
              bookingId,
              'unloaded',
              {
                unloading_status: 'unloaded',
                unloading_session_id: sessionData.id,
                pod_status: 'pending',
                pod_data: {
                  condition: condition.status,
                  remarks: condition.remarks,
                  photo: condition.photo,
                  unloaded_at: new Date().toISOString()
                }
              }
            );
          } else {
            // For missing items, update status but don't mark as delivered
            await updateBookingStatus(
              bookingId, 
              'in_transit', 
              { 
                unloading_status: 'missing',
                unloading_session_id: sessionData.id,
                pod_data: {
                  condition: 'missing',
                  remarks: condition?.remarks,
                  unloaded_at: new Date().toISOString()
                }
              }
            );
          }
        } catch (bookingError) {
          console.error(`Failed to update booking ${bookingId}:`, bookingError);
          const errorMessage = bookingError instanceof Error ? bookingError.message : 'Unknown error';
          throw new Error(`Failed to update booking ${bookingId}: ${errorMessage}`);
        }
      }
      
      showSuccess('Unloading Complete', `All items have been successfully unloaded`);
      return sessionData;
    } catch (err) {
      console.error('Failed to unload OGPL:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to unload OGPL';
      setError(new Error(errorMessage));
      showError('Unloading Failed', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get completed unloadings
  const getCompletedUnloadings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const effectiveBranchId = userBranch?.id;
      
      console.log('Getting completed unloadings, branchId:', effectiveBranchId);
      
      // Use the new unloading_sessions table
      let query = supabase
        .from('unloading_sessions')
        .select(`
          *,
          ogpl:ogpl(
            *,
            vehicle:vehicles(*),
            from_station:branches!from_station(*),
            to_station:branches!to_station(*),
            loading_records(
              *,
              booking:bookings(
                *,
                sender:customers!sender_id(*),
                receiver:customers!receiver_id(*),
                article:articles(*)
              )
            )
          )
        `)
        .order('unloaded_at', { ascending: false });
      
      if (effectiveBranchId) {
        query = query.eq('branch_id', effectiveBranchId);
      }
      
      const { data: sessionData, error: sessionError } = await query;
      
      if (sessionError) {
        console.error('Error fetching unloading sessions:', sessionError);
        const errorMessage = `Failed to fetch unloading sessions: ${sessionError.message} (Code: ${sessionError.code})`;
        throw new Error(errorMessage);
      }
      
      console.log('Unloading sessions fetched:', sessionData?.length);
      return sessionData || [];
    } catch (err) {
      console.error('Failed to get completed unloadings:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get completed unloadings';
      setError(new Error(errorMessage));
      return [];
    } finally {
      setLoading(false);
    }
  }, [userBranch]);

  // Get unloading statistics
  const getUnloadingStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const effectiveBranchId = userBranch?.id;
      
      if (!effectiveBranchId) {
        console.warn('No branch ID available for unloading stats');
        return {
          totalSessions: 0,
          totalDamaged: 0,
          totalMissing: 0,
          goodCondition: 0
        };
      }
      
      console.log('Getting unloading stats, branchId:', effectiveBranchId);
      
      // Get total unloaded items
      const { count: totalCount, error: totalError } = await supabase
        .from('unloading_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('branch_id', effectiveBranchId);
      
      if (totalError) {
        console.error('Error fetching total unloading count:', totalError);
        const errorMessage = `Failed to fetch unloading stats: ${totalError.message} (Code: ${totalError.code})`;
        throw new Error(errorMessage);
      }
      
      // Get damaged items count
      const { data: damagedData, error: damagedError } = await supabase
        .from('unloading_sessions')
        .select('items_damaged')
        .eq('branch_id', effectiveBranchId);
      
      if (damagedError) {
        console.error('Error fetching damaged items count:', damagedError);
        const errorMessage = `Failed to fetch damaged items: ${damagedError.message} (Code: ${damagedError.code})`;
        throw new Error(errorMessage);
      }
      
      const totalDamaged = damagedData?.reduce((sum, session) => sum + (session.items_damaged || 0), 0) || 0;
      
      // Get missing items count
      const { data: missingData, error: missingError } = await supabase
        .from('unloading_sessions')
        .select('items_missing')
        .eq('branch_id', effectiveBranchId);
      
      if (missingError) {
        console.error('Error fetching missing items count:', missingError);
        const errorMessage = `Failed to fetch missing items: ${missingError.message} (Code: ${missingError.code})`;
        throw new Error(errorMessage);
      }
      
      const totalMissing = missingData?.reduce((sum, session) => sum + (session.items_missing || 0), 0) || 0;
      
      return {
        totalSessions: totalCount || 0,
        totalDamaged,
        totalMissing,
        goodCondition: (totalCount || 0) - totalDamaged - totalMissing
      };
    } catch (err) {
      console.error('Failed to get unloading stats:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get unloading stats';
      setError(new Error(errorMessage));
      return {
        totalSessions: 0,
        totalDamaged: 0,
        totalMissing: 0,
        goodCondition: 0
      };
    } finally {
      setLoading(false);
    }
  }, [userBranch]);

  return {
    loading,
    error,
    getIncomingOGPLs,
    unloadOGPL,
    getCompletedUnloadings,
    getUnloadingStats
  };
}