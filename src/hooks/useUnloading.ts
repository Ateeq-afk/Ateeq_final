import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/hooks/useBookings';
import type { OGPL } from '@/types';

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
        throw simpleError;
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
          throw fallbackError;
        }
        
        console.log('Fallback OGPL query successful, count:', fallbackData?.length);
        return fallbackData || [];
      }
      
      console.log('Full OGPL query successful, count:', data?.length);
      return data || [];
    } catch (err) {
      console.error('Failed to get incoming OGPLs:', err);
      setError(err instanceof Error ? err : new Error('Failed to get incoming OGPLs'));
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
          branch_id: userBranch?.id,
          total_items: bookingIds.length,
          items_damaged: damagedCount,
          items_missing: missingCount,
          notes: `Unloaded ${goodCount} items in good condition, ${damagedCount} damaged, ${missingCount} missing`
        })
        .select()
        .single();
      
      if (sessionError) {
        console.error('Error creating unloading session:', sessionError);
        throw sessionError;
      }
      
      console.log('Unloading session created:', sessionData);

      // 2. Create unloading record in the legacy format for backward compatibility
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
        console.error('Error creating legacy unloading record:', unloadingError);
        // Continue anyway since we have the new session record
      }

      // 3. Update OGPL status
      const { error: ogplError } = await supabase
        .from('ogpl')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', ogplId);

      if (ogplError) {
        console.error('Error updating OGPL status:', ogplError);
        throw ogplError;
      }

      // 4. Update booking statuses
      for (const bookingId of bookingIds) {
        const condition = conditions[bookingId];
        
        // Only mark as delivered if not missing
        if (condition && condition.status !== 'missing') {
          await updateBookingStatus(
            bookingId, 
            'delivered', 
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
      }
      
      showSuccess('Unloading Complete', `All items have been successfully unloaded`);
      return sessionData;
    } catch (err) {
      console.error('Failed to unload OGPL:', err);
      setError(err instanceof Error ? err : new Error('Failed to unload OGPL'));
      showError('Unloading Failed', err instanceof Error ? err.message : 'Failed to unload OGPL');
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
      
      // First try the new unloading_sessions table
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
        
        // Fall back to legacy unloading_records
        const { data: legacyData, error: legacyError } = await supabase
          .from('unloading_records')
          .select(`
            *,
            ogpl(
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
        
        if (legacyError) {
          console.error('Error fetching legacy unloading records:', legacyError);
          throw legacyError;
        }
        
        console.log('Legacy unloading records fetched:', legacyData?.length);
        return legacyData || [];
      }
      
      console.log('Unloading sessions fetched:', sessionData?.length);
      return sessionData || [];
    } catch (err) {
      console.error('Failed to get completed unloadings:', err);
      setError(err instanceof Error ? err : new Error('Failed to get completed unloadings'));
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
        throw new Error('No branch ID available');
      }
      
      console.log('Getting unloading stats, branchId:', effectiveBranchId);
      
      // Get total unloaded items
      const { count: totalCount, error: totalError } = await supabase
        .from('unloading_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('branch_id', effectiveBranchId);
      
      if (totalError) {
        console.error('Error fetching total unloading count:', totalError);
        throw totalError;
      }
      
      // Get damaged items count
      const { data: damagedData, error: damagedError } = await supabase
        .from('unloading_sessions')
        .select('items_damaged')
        .eq('branch_id', effectiveBranchId);
      
      if (damagedError) {
        console.error('Error fetching damaged items count:', damagedError);
        throw damagedError;
      }
      
      const totalDamaged = damagedData?.reduce((sum, session) => sum + (session.items_damaged || 0), 0) || 0;
      
      // Get missing items count
      const { data: missingData, error: missingError } = await supabase
        .from('unloading_sessions')
        .select('items_missing')
        .eq('branch_id', effectiveBranchId);
      
      if (missingError) {
        console.error('Error fetching missing items count:', missingError);
        throw missingError;
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
      setError(err instanceof Error ? err : new Error('Failed to get unloading stats'));
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