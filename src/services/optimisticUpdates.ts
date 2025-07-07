import { toast } from 'react-hot-toast';

export interface OptimisticUpdate<T> {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: T;
  originalData?: T;
  timestamp: number;
  status: 'pending' | 'success' | 'error';
  retryCount: number;
}

class OptimisticUpdateManager<T> {
  private updates: Map<string, OptimisticUpdate<T>> = new Map();
  private maxRetries: number = 3;
  private retryDelay: number = 1000;
  private listeners: Set<(updates: OptimisticUpdate<T>[]) => void> = new Set();

  /**
   * Add a listener to receive update notifications
   */
  subscribe(listener: (updates: OptimisticUpdate<T>[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of changes
   */
  private notify() {
    const updates = Array.from(this.updates.values());
    this.listeners.forEach(listener => listener(updates));
  }

  /**
   * Apply an optimistic update
   */
  applyUpdate(
    id: string,
    type: 'create' | 'update' | 'delete',
    data: T,
    originalData?: T,
    apiCall?: () => Promise<T>
  ): void {
    const update: OptimisticUpdate<T> = {
      id,
      type,
      data,
      originalData,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0
    };

    this.updates.set(id, update);
    this.notify();

    // Execute the actual API call if provided
    if (apiCall) {
      this.executeWithRetry(id, apiCall);
    }
  }

  /**
   * Execute API call with retry logic
   */
  private async executeWithRetry(id: string, apiCall: () => Promise<T>): Promise<void> {
    const update = this.updates.get(id);
    if (!update) return;

    try {
      const result = await apiCall();
      
      // Update with successful result
      update.status = 'success';
      update.data = result;
      this.updates.set(id, update);
      this.notify();

      // Remove after a delay to allow UI to show success state
      setTimeout(() => {
        this.updates.delete(id);
        this.notify();
      }, 1000);

    } catch (error) {
      console.error(`Optimistic update failed for ${id}:`, error);
      
      update.retryCount++;
      
      if (update.retryCount < this.maxRetries) {
        // Retry after delay
        setTimeout(() => {
          this.executeWithRetry(id, apiCall);
        }, this.retryDelay * update.retryCount);
      } else {
        // Max retries reached, mark as error
        update.status = 'error';
        this.updates.set(id, update);
        this.notify();

        // Show error toast
        toast.error(`Failed to ${update.type} item. Please try again.`);

        // Revert to original data if available
        if (update.originalData && update.type === 'update') {
          update.data = update.originalData;
          this.notify();
        }

        // Remove error update after delay
        setTimeout(() => {
          this.updates.delete(id);
          this.notify();
        }, 5000);
      }
    }
  }

  /**
   * Get all pending updates
   */
  getPendingUpdates(): OptimisticUpdate<T>[] {
    return Array.from(this.updates.values()).filter(u => u.status === 'pending');
  }

  /**
   * Get all updates
   */
  getAllUpdates(): OptimisticUpdate<T>[] {
    return Array.from(this.updates.values());
  }

  /**
   * Cancel a pending update
   */
  cancelUpdate(id: string): boolean {
    const update = this.updates.get(id);
    if (update && update.status === 'pending') {
      this.updates.delete(id);
      this.notify();
      return true;
    }
    return false;
  }

  /**
   * Clear all updates
   */
  clearAll(): void {
    this.updates.clear();
    this.notify();
  }

  /**
   * Get update by ID
   */
  getUpdate(id: string): OptimisticUpdate<T> | undefined {
    return this.updates.get(id);
  }

  /**
   * Check if there are any pending updates
   */
  hasPendingUpdates(): boolean {
    return Array.from(this.updates.values()).some(u => u.status === 'pending');
  }
}

// Create singleton instances for different data types
export const bookingUpdates = new OptimisticUpdateManager<any>();
export const customerUpdates = new OptimisticUpdateManager<any>();
export const vehicleUpdates = new OptimisticUpdateManager<any>();
export const articleUpdates = new OptimisticUpdateManager<any>();

/**
 * Hook for using optimistic updates in React components
 */
import { useState, useEffect } from 'react';

export function useOptimisticUpdates<T>(manager: OptimisticUpdateManager<T>) {
  const [updates, setUpdates] = useState<OptimisticUpdate<T>[]>([]);

  useEffect(() => {
    const unsubscribe = manager.subscribe(setUpdates);
    setUpdates(manager.getAllUpdates());
    return unsubscribe;
  }, [manager]);

  const applyUpdate = (
    id: string,
    type: 'create' | 'update' | 'delete',
    data: T,
    originalData?: T,
    apiCall?: () => Promise<T>
  ) => {
    manager.applyUpdate(id, type, data, originalData, apiCall);
  };

  const cancelUpdate = (id: string) => {
    return manager.cancelUpdate(id);
  };

  const clearAll = () => {
    manager.clearAll();
  };

  return {
    updates,
    pendingUpdates: updates.filter(u => u.status === 'pending'),
    applyUpdate,
    cancelUpdate,
    clearAll,
    hasPendingUpdates: manager.hasPendingUpdates()
  };
}

/**
 * Utility function to merge optimistic updates with real data
 */
export function mergeOptimisticData<T extends { id: string }>(
  realData: T[],
  updates: OptimisticUpdate<T>[]
): T[] {
  const result = [...realData];
  
  updates.forEach(update => {
    switch (update.type) {
      case 'create':
        // Add new item if not already in real data
        if (!result.find(item => item.id === update.data.id)) {
          result.unshift(update.data);
        }
        break;
        
      case 'update':
        // Update existing item
        const updateIndex = result.findIndex(item => item.id === update.data.id);
        if (updateIndex !== -1) {
          result[updateIndex] = { ...result[updateIndex], ...update.data };
        }
        break;
        
      case 'delete':
        // Remove item
        const deleteIndex = result.findIndex(item => item.id === update.data.id);
        if (deleteIndex !== -1) {
          result.splice(deleteIndex, 1);
        }
        break;
    }
  });
  
  return result;
}

/**
 * Utility to create optimistic ID for new items
 */
export function createOptimisticId(): string {
  return `optimistic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}