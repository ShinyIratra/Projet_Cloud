import { API_URL } from './config';

export interface Signalement {
  id: number;
  surface: number;
  budget: number;
  lattitude: number;
  longitude: number;
  date_signalement: string;
  status: string;
  status_code: string;
  entreprise: string;
}

export interface Stats {
  total_points: number;
  total_surface: number;
  total_budget: number;
  avancement: number;
}

export interface Entreprise {
  id: number;
  nom: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  type_user: string;
}

export const api = {
  async login(email: string, password: string): Promise<User> {
    const res = await fetch(`${API_URL}/api/web/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.status === 'error') throw new Error(data.message);
    return data.data;
  },

  async register(username: string, email: string, password: string): Promise<void> {
    const res = await fetch(`${API_URL}/api/web/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (data.status === 'error') throw new Error(data.message);
  },

  async getSignalements(): Promise<Signalement[]> {
    const res = await fetch(`${API_URL}/api/web/signalements`);
    const data = await res.json();
    return data.data || [];
  },

  async getStats(): Promise<Stats> {
    const res = await fetch(`${API_URL}/api/web/signalements/stats`);
    const data = await res.json();
    return data.data;
  },

  async getEntreprises(): Promise<Entreprise[]> {
    const res = await fetch(`${API_URL}/api/web/entreprises`);
    const data = await res.json();
    return data.data || [];
  },

  async updateSignalement(id: number, updates: Partial<Signalement>): Promise<void> {
    await fetch(`${API_URL}/api/web/signalements`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
  },

  async updateStatus(id: number, status: string): Promise<void> {
    await fetch(`${API_URL}/api/web/signalements/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
  },

  async createSignalement(signalement: Omit<Signalement, 'id' | 'date_signalement'>): Promise<void> {
    const res = await fetch(`${API_URL}/api/web/signalements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signalement),
    });
    const data = await res.json();
    if (data.status === 'error') throw new Error(data.message);
  },

  async syncFromFirebase(): Promise<{synced: number, updated: number}> {
    const res = await fetch(`${API_URL}/api/web/sync/from-firebase`, { method: 'POST' });
    const data = await res.json();
    return data.data || { synced: 0, updated: 0 };
  },

  async syncToFirebase(): Promise<number> {
    const res = await fetch(`${API_URL}/api/web/sync/to-firebase`, { method: 'POST' });
    const data = await res.json();
    return data.data?.synced || 0;
  },

  async getBlockedUsers(): Promise<any[]> {
    const res = await fetch(`${API_URL}/api/web/users/blocked`);
    const data = await res.json();
    return data.data || [];
  },

  async unblockUser(userId: number, managerId: number): Promise<void> {
    await fetch(`${API_URL}/api/web/unblock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, managerId }),
    });
  },
};
