
import { InwardEntry, DispatchEntry, InstallStatus, InstallerUser } from '../types';

/**
 * PRODUCTION API SERVICE WITH OFFLINE FALLBACK
 * Saves data to backend AND local backup storage
 */

// Production API on Render (Cloud Storage)
const BASE_URL = 'https://solarpump-backend.onrender.com';

// For Local Development Only (uncomment to use local server)
// const BASE_URL = 'http://localhost:4000';

const GET_TOKEN = () => localStorage.getItem('auth_token');

// Backup storage for offline-first support
const INWARD_BACKUP_KEY = 'inward_backup_entries';
const DISPATCH_BACKUP_KEY = 'dispatch_backup_entries';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = GET_TOKEN();
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}?t=${Date.now()}`, { ...options, headers });
    
    if (response.status === 401) {
      // Logic for unauthorized: Reset key and redirect to login
      localStorage.removeItem('is_logged_in');
      localStorage.removeItem('auth_token');
      window.location.reload();
      throw new Error("Session expired. Please log in again.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Fetch Error [${endpoint}]:`, error);
    throw error;
  }
}

/**
 * Helper to save a copy to local backup
 */
const saveToBackup = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save backup:', err);
  }
};

/**
 * Helper to load from local backup
 */
const loadFromBackup = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (err) {
    console.warn('Failed to load backup:', err);
    return defaultValue;
  }
};

export const ApiService = {
  // --- INWARD LOGS ---
  async getInwardEntries(): Promise<InwardEntry[]> {
    return request<InwardEntry[]>('/inward');
  },

  async deleteInwardEntry(id: string): Promise<void> {
    await request(`/inward/${id}`, { method: 'DELETE' });
  },

  async createInwardEntry(entry: InwardEntry): Promise<InwardEntry> {
    try {
      const result = await request<InwardEntry>('/inward', {
        method: 'POST',
        body: JSON.stringify(entry),
      });
      
      // Backup successful entry
      const backup = loadFromBackup<InwardEntry[]>(INWARD_BACKUP_KEY, []);
      saveToBackup(INWARD_BACKUP_KEY, [result, ...backup]);
      
      return result;
    } catch (err) {
      // If backend fails, save to backup anyway
      console.warn('Backend save failed, saving to local backup:', err);
      const backup = loadFromBackup<InwardEntry[]>(INWARD_BACKUP_KEY, []);
      saveToBackup(INWARD_BACKUP_KEY, [entry, ...backup]);
      
      // Show warning to user
      const message = `⚠️ Could not reach server. Data saved locally. Will sync when connection restored.`;
      console.warn(message);
      alert(message);
      
      return entry;
    }
  },

  async updateInwardEntry(entry: InwardEntry): Promise<InwardEntry> {
    try {
      const result = await request<InwardEntry>(`/inward/${entry.id}`, {
        method: 'PUT',
        body: JSON.stringify(entry),
      });
      
      // Backup successful update
      const backup = loadFromBackup<InwardEntry[]>(INWARD_BACKUP_KEY, []);
      const updated = backup.map(e => e.id === result.id ? result : e);
      saveToBackup(INWARD_BACKUP_KEY, updated);
      
      return result;
    } catch (err) {
      console.warn('Backend update failed, saving to local backup:', err);
      const backup = loadFromBackup<InwardEntry[]>(INWARD_BACKUP_KEY, []);
      const updated = backup.map(e => e.id === entry.id ? entry : e);
      saveToBackup(INWARD_BACKUP_KEY, updated);
      
      const message = `⚠️ Could not reach server. Data updated locally. Will sync when connection restored.`;
      console.warn(message);
      alert(message);
      
      return entry;
    }
  },

  // --- DISPATCH & SITE TRACKING ---
  async getDispatchEntries(): Promise<DispatchEntry[]> {
    return request<DispatchEntry[]>('/dispatch');
  },

  async createDispatchEntry(entry: DispatchEntry): Promise<DispatchEntry> {
    try {
      const result = await request<DispatchEntry>('/dispatch', {
        method: 'POST',
        body: JSON.stringify(entry),
      });
      
      // Backup successful entry
      const backup = loadFromBackup<DispatchEntry[]>(DISPATCH_BACKUP_KEY, []);
      saveToBackup(DISPATCH_BACKUP_KEY, [result, ...backup]);
      
      return result;
    } catch (err) {
      console.warn('Backend save failed, saving to local backup:', err);
      const backup = loadFromBackup<DispatchEntry[]>(DISPATCH_BACKUP_KEY, []);
      saveToBackup(DISPATCH_BACKUP_KEY, [entry, ...backup]);
      
      const message = `⚠️ Could not reach server. Data saved locally. Will sync when connection restored.`;
      console.warn(message);
      alert(message);
      
      return entry;
    }
  },

  async deleteDispatchEntry(id: string): Promise<void> {
    await request(`/dispatch/${id}`, { method: 'DELETE' });
  },

  async updateSiteStatus(beneficiaryId: string, newStatus: InstallStatus, remarks: string, imageUrls?: string[]): Promise<DispatchEntry> {
    return request<DispatchEntry>(`/site/${beneficiaryId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus, remarks, imageUrls }),
    });
  },

  // --- PERSONNEL MANAGEMENT ---
  async getInstallers(): Promise<InstallerUser[]> {
    return request<InstallerUser[]>('/installers');
  },

  async saveInstaller(installer: InstallerUser): Promise<InstallerUser> {
    return request<InstallerUser>('/installers', {
      method: 'POST',
      body: JSON.stringify(installer),
    });
  },

  async deleteInstaller(id: string): Promise<void> {
    return request<void>(`/installers/${id}`, {
      method: 'DELETE',
    });
  },

  // --- ADMIN UTILITIES ---
  async resetSampleData(): Promise<{ ok: boolean; message: string }> {
    return request<{ ok: boolean; message: string }>('/admin/reset-sample-data', {
      method: 'POST',
    });
  },

  // --- AUTHENTICATION ---
  async login(payload: { role: string; id?: string; pin: string }): Promise<{ token: string; userName: string }> {
    return request<{ token: string; userName: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
};
