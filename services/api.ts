
import { InwardEntry, DispatchEntry, InstallStatus, InstallerUser } from '../types';

/**
 * PRODUCTION API SERVICE
 * Refactored to communicate with a real REST backend.
 * Replace BASE_URL with your actual server address.
 */

// Local Development - Change to production URL when deploying
const BASE_URL = 'http://localhost:4000';
// Production API on Render (uncomment when deploying)
// const BASE_URL = 'https://solarpump-backend.onrender.com';
const GET_TOKEN = () => localStorage.getItem('auth_token');

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = GET_TOKEN();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
    
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

export const ApiService = {
  // --- INWARD LOGS ---
  async getInwardEntries(): Promise<InwardEntry[]> {
    return request<InwardEntry[]>('/inward');
  },

  async deleteInwardEntry(id: string): Promise<void> {
    await request(`/inward/${id}`, { method: 'DELETE' });
  },

  async createInwardEntry(entry: InwardEntry): Promise<InwardEntry> {
    return request<InwardEntry>('/inward', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  },

  async updateInwardEntry(entry: InwardEntry): Promise<InwardEntry> {
    return request<InwardEntry>(`/inward/${entry.id}`, {
      method: 'PUT',
      body: JSON.stringify(entry),
    });
  },

  // --- DISPATCH & SITE TRACKING ---
  async getDispatchEntries(): Promise<DispatchEntry[]> {
    return request<DispatchEntry[]>('/dispatch');
  },

  async createDispatchEntry(entry: DispatchEntry): Promise<DispatchEntry> {
    return request<DispatchEntry>('/dispatch', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
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
