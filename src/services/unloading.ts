import api from './api';

export interface UnloadingCondition {
  status: 'good' | 'damaged' | 'missing';
  remarks?: string;
  photo?: string;
}

export interface UnloadingRequest {
  unloading_conditions: Record<string, UnloadingCondition>;
}

export interface PartialUnloadingRequest {
  booking_ids: string[];
  unloading_conditions: Record<string, UnloadingCondition>;
}

export const unloadingService = {
  // Complete unloading of all bookings in an OGPL
  completeUnloading: async (ogplId: string, conditions: Record<string, UnloadingCondition>) => {
    const { data } = await api.post(`/api/loading/ogpls/${ogplId}/unload`, {
      unloading_conditions: conditions
    });
    return data;
  },

  // Partial unloading of specific bookings
  unloadBookings: async (ogplId: string, bookingIds: string[], conditions: Record<string, UnloadingCondition>) => {
    const { data } = await api.post(`/api/loading/ogpls/${ogplId}/unload-bookings`, {
      booking_ids: bookingIds,
      unloading_conditions: conditions
    });
    return data;
  },

  // Upload photo for condition evidence
  uploadConditionPhoto: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('photo', file);
    
    const { data } = await api.post('/api/upload/condition-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return data.photo_url;
  }
};