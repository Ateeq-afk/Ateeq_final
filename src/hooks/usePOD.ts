import { useState, useCallback } from 'react';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import { podService, type CreatePODData } from '@/services/pod';
import type { PODRecord, PODAttempt, PODTemplate, Booking } from '@/types';

export function usePOD() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { showSuccess, showError } = useNotificationSystem();
  const { getCurrentUserBranch } = useAuth();
  const { selectedBranch } = useBranchSelection();
  const userBranch = getCurrentUserBranch();

  // Get bookings that need POD
  const getPendingPODBookings = useCallback(async (): Promise<Booking[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const effectiveBranchId = selectedBranch || userBranch?.id;
      
      if (!effectiveBranchId) {
        console.warn('No branch ID available for pending POD bookings');
        return [];
      }
      
      // This would need to be implemented in the bookings API
      // For now, we'll return an empty array
      console.log('Getting bookings pending POD, branchId:', effectiveBranchId);
      return [];
    } catch (err) {
      console.error('Failed to get bookings pending POD:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get bookings pending POD';
      setError(new Error(errorMessage));
      return [];
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, userBranch]);

  // Submit POD for a booking
  const submitPOD = async (data: {
    bookingId: string;
    deliveredBy: string;
    receiverName: string;
    receiverPhone: string;
    receiverDesignation?: string;
    receiverCompany?: string;
    receiverIdType?: string;
    receiverIdNumber?: string;
    signatureImage?: string;
    photoEvidence?: string;
    receiverPhoto?: string;
    deliveryCondition?: 'good' | 'damaged' | 'partial';
    damageDescription?: string;
    shortageDescription?: string;
    remarks?: string;
  }): Promise<PODRecord> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Submitting POD:', data);
      
      // Get current location if available
      const location = await podService.getCurrentLocation();
      
      // Upload images if they are base64
      let signatureUrl = data.signatureImage;
      let photoUrl = data.photoEvidence;
      let receiverPhotoUrl = data.receiverPhoto;
      
      if (data.signatureImage?.startsWith('data:')) {
        signatureUrl = await podService.uploadSignature(data.signatureImage);
      }
      
      if (data.photoEvidence?.startsWith('data:')) {
        // Convert base64 to File object for upload
        const response = await fetch(data.photoEvidence);
        const blob = await response.blob();
        const file = new File([blob], 'evidence.jpg', { type: 'image/jpeg' });
        photoUrl = await podService.uploadPhotoEvidence(file);
      }
      
      // Create POD data
      const podData: CreatePODData = {
        booking_id: data.bookingId,
        branch_id: userBranch?.id || '',
        delivered_by: data.deliveredBy,
        delivery_latitude: location?.latitude,
        delivery_longitude: location?.longitude,
        receiver_name: data.receiverName,
        receiver_phone: data.receiverPhone,
        receiver_designation: data.receiverDesignation,
        receiver_company: data.receiverCompany,
        receiver_id_type: data.receiverIdType as any,
        receiver_id_number: data.receiverIdNumber,
        signature_image_url: signatureUrl,
        photo_evidence_url: photoUrl,
        receiver_photo_url: receiverPhotoUrl,
        delivery_condition: data.deliveryCondition || 'good',
        damage_description: data.damageDescription,
        shortage_description: data.shortageDescription,
        remarks: data.remarks,
      };
      
      const podRecord = await podService.createPOD(podData);
      
      showSuccess('POD Submitted', 'Proof of delivery has been recorded successfully');
      return podRecord;
    } catch (err) {
      console.error('Failed to submit POD:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit POD';
      setError(new Error(errorMessage));
      showError('POD Submission Failed', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get POD record by booking ID
  const getPODByBookingId = useCallback(async (bookingId: string): Promise<PODRecord | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const podRecord = await podService.getPODByBookingId(bookingId);
      return podRecord;
    } catch (err) {
      console.error('Failed to get POD record:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get POD record';
      setError(new Error(errorMessage));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get POD history
  const getPODHistory = useCallback(async (): Promise<PODRecord[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const effectiveBranchId = selectedBranch || userBranch?.id;
      
      if (!effectiveBranchId) {
        console.warn('No branch ID available for POD history');
        return [];
      }
      
      console.log('Getting POD history, branchId:', effectiveBranchId);
      
      const records = await podService.getPODRecords(effectiveBranchId);
      return records;
    } catch (err) {
      console.error('Failed to get POD history:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get POD history';
      setError(new Error(errorMessage));
      return [];
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, userBranch]);

  // Get POD statistics
  const getPODStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const effectiveBranchId = selectedBranch || userBranch?.id;
      
      if (!effectiveBranchId) {
        console.warn('No branch ID available for POD stats');
        return {
          totalDelivered: 0,
          totalPending: 0,
          withSignature: 0,
          withPhoto: 0,
          completionRate: 0
        };
      }
      
      console.log('Getting POD stats, branchId:', effectiveBranchId);
      
      const stats = await podService.getPODStats({ branch_id: effectiveBranchId });
      
      return {
        totalDelivered: stats.totalDelivered,
        totalPending: stats.pendingPODs,
        withSignature: stats.withSignature,
        withPhoto: stats.withPhoto,
        completionRate: stats.completionRate
      };
    } catch (err) {
      console.error('Failed to get POD stats:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get POD stats';
      setError(new Error(errorMessage));
      return {
        totalDelivered: 0,
        totalPending: 0,
        withSignature: 0,
        withPhoto: 0,
        completionRate: 0
      };
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, userBranch]);

  // Record delivery attempt
  const recordDeliveryAttempt = async (data: {
    bookingId: string;
    attemptedBy: string;
    reasonForFailure?: string;
    nextAttemptDate?: string;
    notes?: string;
  }): Promise<PODAttempt> => {
    try {
      setLoading(true);
      setError(null);
      
      const attempt = await podService.recordDeliveryAttempt({
        booking_id: data.bookingId,
        attempted_by: data.attemptedBy,
        reason_for_failure: data.reasonForFailure,
        next_attempt_date: data.nextAttemptDate,
        notes: data.notes,
      });
      
      showSuccess('Attempt Recorded', 'Delivery attempt has been recorded');
      return attempt;
    } catch (err) {
      console.error('Failed to record delivery attempt:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to record delivery attempt';
      setError(new Error(errorMessage));
      showError('Failed to Record Attempt', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get delivery attempts
  const getDeliveryAttempts = useCallback(async (bookingId: string): Promise<PODAttempt[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const attempts = await podService.getDeliveryAttempts(bookingId);
      return attempts;
    } catch (err) {
      console.error('Failed to get delivery attempts:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get delivery attempts';
      setError(new Error(errorMessage));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get POD templates
  const getPODTemplates = useCallback(async (): Promise<PODTemplate[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const templates = await podService.getPODTemplates(userBranch?.id);
      return templates;
    } catch (err) {
      console.error('Failed to get POD templates:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get POD templates';
      setError(new Error(errorMessage));
      return [];
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, userBranch]);

  return {
    loading,
    error,
    getPendingPODBookings,
    submitPOD,
    getPODByBookingId,
    getPODHistory,
    getPODStats,
    recordDeliveryAttempt,
    getDeliveryAttempts,
    getPODTemplates,
  };
}