import { API_URL } from './config';

export interface Signalement {
  id: number;
  titre?: string;
  surface: number;
  budget: number;
  lattitude: number;
  longitude: number;
  date_signalement: string;
  status: string;
  status_code: string;
  entreprise: string;
  updated_at?: string;
}

export interface Stats {
  total_points: number;
  total_surface: number;
  total_budget: number;
  avancement: number;
  termine?: number;
  en_cours?: number;
  nouveau?: number;
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
  token?: string;
}

// Helper pour obtenir les headers d'authentification
const getAuthHeaders = (): HeadersInit => {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const userData = JSON.parse(user);
      if (userData.token) {
        headers['Authorization'] = `Bearer ${userData.token}`;
      }
    } catch (e) {
      console.error('Erreur parsing user data:', e);
    }
  }
  return headers;
};

// Helper pour gérer les réponses API
const handleResponse = async (res: Response, errorMessage: string) => {
  const data = await res.json();
  if (data.status === 'error') {
    throw new Error(data.message || errorMessage);
  }
  if (!res.ok) {
    throw new Error(data.message || errorMessage);
  }
  return data;
};

export const api = {
  async login(email: string, password: string): Promise<User> {
    if (!email || !password) {
      throw new Error('Email et mot de passe requis');
    }
    const res = await fetch(`${API_URL}/api/web/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(res, 'Erreur de connexion');
    return data.data;
  },

  async register(username: string, email: string, password: string): Promise<void> {
    if (!username || !email || !password) {
      throw new Error('Tous les champs sont obligatoires');
    }
    if (password.length < 6) {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères');
    }
    const res = await fetch(`${API_URL}/api/web/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    await handleResponse(res, "Erreur lors de l'inscription");
  },

  async getSignalements(): Promise<Signalement[]> {
    try {
      const res = await fetch(`${API_URL}/api/web/signalements`);
      const data = await res.json();
      return data.data || [];
    } catch (error) {
      console.error('Erreur chargement signalements:', error);
      return [];
    }
  },

  async getStats(): Promise<Stats> {
    try {
      const res = await fetch(`${API_URL}/api/web/signalements/stats`);
      const data = await res.json();
      return data.data || { total_points: 0, total_surface: 0, total_budget: 0, avancement: 0 };
    } catch (error) {
      console.error('Erreur chargement stats:', error);
      return { total_points: 0, total_surface: 0, total_budget: 0, avancement: 0 };
    }
  },

  async getEntreprises(): Promise<Entreprise[]> {
    try {
      const res = await fetch(`${API_URL}/api/web/entreprises`);
      const data = await res.json();
      return data.data || [];
    } catch (error) {
      console.error('Erreur chargement entreprises:', error);
      return [];
    }
  },

  async updateSignalement(id: number, updates: Partial<Signalement>): Promise<void> {
    if (!id) throw new Error('ID du signalement requis');
    
    const res = await fetch(`${API_URL}/api/web/signalements`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ id, ...updates }),
    });
    await handleResponse(res, 'Erreur lors de la mise à jour');
  },

  async updateStatus(id: number, status: string): Promise<void> {
    if (!id) throw new Error('ID du signalement requis');
    if (!status) throw new Error('Statut requis');
    
    const res = await fetch(`${API_URL}/api/web/signalements/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ id, status }),
    });
    await handleResponse(res, 'Erreur lors du changement de statut');
  },

  async createSignalement(signalement: Partial<Signalement> & { userId?: number }): Promise<void> {
    if (!signalement.surface) throw new Error('La surface est obligatoire');
    if (!signalement.lattitude || !signalement.longitude) throw new Error('Les coordonnées sont obligatoires');
    
    const res = await fetch(`${API_URL}/api/web/signalements`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(signalement),
    });
    await handleResponse(res, 'Erreur lors de la création');
  },

  async syncFromFirebase(): Promise<{synced: number, updated: number, addedToPostgres?: number, updatedInPostgres?: number, addedToFirebase?: number, updatedInFirebase?: number}> {
    const res = await fetch(`${API_URL}/api/web/sync/from-firebase`, { 
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await handleResponse(res, 'Erreur de synchronisation');
    return data.data || { synced: 0, updated: 0 };
  },

  async syncToFirebase(): Promise<number> {
    const res = await fetch(`${API_URL}/api/web/sync/to-firebase`, { 
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await handleResponse(res, 'Erreur de synchronisation');
    return data.data?.synced || 0;
  },

  async getAllUsers(): Promise<any[]> {
    const res = await fetch(`${API_URL}/api/web/users`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    return data.data || [];
  },

  async getBlockedUsers(): Promise<any[]> {
    const res = await fetch(`${API_URL}/api/web/users/blocked`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    return data.data || [];
  },

  async unblockUser(userId: number, managerId?: number): Promise<void> {
    if (!userId) throw new Error('ID utilisateur requis');
    
    const res = await fetch(`${API_URL}/api/web/unblock`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId }),
    });
    await handleResponse(res, 'Erreur lors du déblocage');
  },

  async createUser(userData: { username: string; email: string; password: string }): Promise<User> {
    const res = await fetch(`${API_URL}/api/web/users/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    const data = await handleResponse(res, 'Erreur lors de la création de l\'utilisateur');
    return data.data;
  },

  async syncUsersToFirebase(): Promise<{ addedToFirebase: number; updatedInFirebase: number }> {
    const res = await fetch(`${API_URL}/api/web/sync/users-to-firebase`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await handleResponse(res, 'Erreur de synchronisation des utilisateurs');
    return data.data || { addedToFirebase: 0, updatedInFirebase: 0 };
  },
};
