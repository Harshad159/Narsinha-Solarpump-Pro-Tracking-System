
import { useState, useEffect } from 'react';
import { InwardEntry, DispatchEntry } from '../types';
import { ApiService } from '../services/api';
import { STORAGE_KEYS } from '../constants';

// Backup storage keys
const INWARD_BACKUP_KEY = 'inward_backup_entries';
const DISPATCH_BACKUP_KEY = 'dispatch_backup_entries';
const SYNC_PENDING_KEY = 'sync_pending_entries';

/**
 * Load data from backend, with fallback to local backup
 */
const fetchWithFallback = async (fetchFn: () => Promise<any[]>, backupKey: string, fallbackKey: string) => {
  try {
    const data = await fetchFn();
    // Successfully fetched from backend - update backup
    localStorage.setItem(backupKey, JSON.stringify(data));
    return data;
  } catch (err) {
    console.error(`Failed to fetch from backend, using local backup:`, err);
    
    // Try to use local backup
    const backup = localStorage.getItem(backupKey);
    if (backup) {
      console.log('✓ Using local backup');
      return JSON.parse(backup);
    }
    
    // Last resort: show empty array but warn user
    console.warn('⚠️ No backup available - data may be lost');
    return [];
  }
};

export const useAppData = (isLoggedIn: boolean) => {
  const [inwardEntries, setInwardEntries] = useState<InwardEntry[]>([]);
  const [dispatchEntries, setDispatchEntries] = useState<DispatchEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!isLoggedIn) return;
    setIsLoading(true);
    setBackendError(null);
    
    try {
      const [inwards, dispatches] = await Promise.all([
        fetchWithFallback(
          () => ApiService.getInwardEntries(),
          INWARD_BACKUP_KEY,
          STORAGE_KEYS.INWARD
        ),
        fetchWithFallback(
          () => ApiService.getDispatchEntries(),
          DISPATCH_BACKUP_KEY,
          STORAGE_KEYS.DISPATCH
        )
      ]);
      
      setInwardEntries(inwards);
      setDispatchEntries(dispatches);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch data';
      setBackendError(message);
      console.error("Critical Data Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on login
  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn]);

  // Refresh data when page becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isLoggedIn) {
        console.log('Page became visible, refreshing data...');
        fetchData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isLoggedIn]);

  // Refresh data when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      if (isLoggedIn) {
        console.log('Window focused, refreshing data...');
        fetchData();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isLoggedIn]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.DISPATCH || e.key === STORAGE_KEYS.INWARD) {
        fetchData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    inwardEntries,
    setInwardEntries,
    dispatchEntries,
    setDispatchEntries,
    isLoading,
    setIsLoading,
    refresh: fetchData,
    backendError,
    setBackendError
  };
};
