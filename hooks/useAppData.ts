
import { useState, useEffect } from 'react';
import { InwardEntry, DispatchEntry } from '../types';
import { ApiService } from '../services/api';
import { STORAGE_KEYS } from '../constants';

export const useAppData = (isLoggedIn: boolean) => {
  const [inwardEntries, setInwardEntries] = useState<InwardEntry[]>([]);
  const [dispatchEntries, setDispatchEntries] = useState<DispatchEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    if (!isLoggedIn) return;
    setIsLoading(true);
    try {
      const [inwards, dispatches] = await Promise.all([
        ApiService.getInwardEntries(),
        ApiService.getDispatchEntries()
      ]);
      setInwardEntries(inwards);
      setDispatchEntries(dispatches);
    } catch (err) {
      console.error("Critical Data Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
    refresh: fetchData
  };
};
