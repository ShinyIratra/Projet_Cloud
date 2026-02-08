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

// =====================
// INTERFACES POUR LE SUIVI D'AVANCEMENT (adapté à la base existante)
// =====================

export interface Task {
  id: number;
  surface: number;
  budget: number;
  statut: string;
  statut_label: string;
  avancement_pourcentage: number;
  date_signalement: string | null;
  date_mise_a_jour: string | null;
  date_fin: string | null;
  duree_jours: number | null;
  duree_heures: number | null;
  id_entreprise: number | null;
  entreprise_nom: string | null;
  id_users: number | null;
  utilisateur_nom: string | null;
  id_firebase: string | null;
}

export interface TaskStatistics {
  total_signalements: number;
  signalements_nouveaux: number;
  signalements_en_cours: number;
  signalements_termines: number;
  avancement_moyen: number;
  delai_moyen_jours: number | null;
  delai_min_jours: number | null;
  delai_max_jours: number | null;
  taux_completion: number;
}

export interface TaskStatutInfo {
  code: string;
  label: string;
  pourcentage: number;
}

export interface EntrepriseStats {
  id_entreprise: number;
  entreprise_nom: string;
  total_signalements: number;
  signalements_termines: number;
  avancement_moyen: number;
  delai_moyen_jours: number | null;
}

export interface PerformanceRow {
  id: number;
  surface: number;
  budget: number;
  statut: string;
  statut_label: string;
  avancement_pourcentage: number;
  date_signalement: string | null;
  date_mise_a_jour: string | null;
  date_fin: string | null;
  duree_jours: number | null;
  entreprise_nom: string | null;
  utilisateur_nom: string | null;
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

  // =====================
  // API SUIVI D'AVANCEMENT (adapté à la base existante)
  // =====================

  /**
   * Récupérer tous les signalements avec leur avancement calculé
   */
  async getAvancement(): Promise<Task[]> {
    const res = await fetch(`${API_URL}/api/tasks/avancement`);
    const data = await res.json();
    return data.data || [];
  },

  /**
   * Récupérer l'avancement d'un signalement par ID
   */
  async getAvancementById(id: number): Promise<Task> {
    const res = await fetch(`${API_URL}/api/tasks/avancement/${id}`);
    const data = await res.json();
    if (data.status === 'error') throw new Error(data.message);
    return data.data;
  },

  /**
   * Mettre à jour le statut d'un signalement (conversion automatique en %)
   * nouveau=0%, en_cours=50%, termine=100%
   */
  async updateTaskStatus(id: number, statut: string): Promise<void> {
    const res = await fetch(`${API_URL}/api/tasks/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    });
    const data = await res.json();
    if (data.status === 'error') throw new Error(data.message);
  },

  /**
   * Récupérer les statistiques globales de performance
   */
  async getTaskStatistics(): Promise<TaskStatistics> {
    const res = await fetch(`${API_URL}/api/tasks/stats/global`);
    const data = await res.json();
    return data.data;
  },

  /**
   * Récupérer les statistiques par entreprise
   */
  async getTaskStatisticsParEntreprise(): Promise<EntrepriseStats[]> {
    const res = await fetch(`${API_URL}/api/tasks/stats/entreprises`);
    const data = await res.json();
    return data.data || [];
  },

  /**
   * Récupérer le tableau de performance détaillé
   */
  async getPerformanceTable(): Promise<PerformanceRow[]> {
    const res = await fetch(`${API_URL}/api/tasks/stats/performance`);
    const data = await res.json();
    return data.data || [];
  },

  /**
   * Récupérer les statuts disponibles avec leurs pourcentages
   */
  async getTaskStatuts(): Promise<TaskStatutInfo[]> {
    const res = await fetch(`${API_URL}/api/tasks/statuts`);
    const data = await res.json();
    return data.data || [];
  },
};
