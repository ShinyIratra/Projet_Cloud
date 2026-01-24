import { API_URL } from './config';

export interface RoadAlert {
  id?: string;
  surface: number;
  budget: number;
  concerned_entreprise: string;
  status: string;
  latitude?: number;
  lattitude?: number;  // L'API retourne lattitude au lieu de latitude
  longitude: number;
  UID: string;
  date_alert: string;
}

export const fetchRoadAlerts = async (): Promise<RoadAlert[]> => {
  const response = await fetch(`${API_URL}/road_alerts`);
  if (!response.ok) throw new Error('Erreur lors du chargement des signalements');
  const result = await response.json();
  return result.data || [];
};

export const fetchUserRoadAlerts = async (uid: string): Promise<RoadAlert[]> => {
  const response = await fetch(`${API_URL}/road_alerts/user/${uid}`);
  if (!response.ok) throw new Error('Erreur lors du chargement des signalements utilisateur');
  const result = await response.json();
  return result.data || [];
};

export const createRoadAlert = async (alert: Omit<RoadAlert, 'id'>): Promise<RoadAlert> => {
  const response = await fetch(`${API_URL}/road_alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alert),
  });
  if (!response.ok) throw new Error('Erreur lors de la création du signalement');
  const result = await response.json();
  return result.data;
};

export const updateRoadAlert = async (alert: RoadAlert): Promise<RoadAlert> => {
  const response = await fetch(`${API_URL}/road_alerts`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alert),
  });
  if (!response.ok) throw new Error('Erreur lors de la mise à jour');
  const result = await response.json();
  return result.data;
};

export const updateAlertStatus = async (id: string, status: string): Promise<RoadAlert> => {
  const response = await fetch(`${API_URL}/road_alerts/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Erreur lors de la mise à jour du statut');
  return result.data;
};

export const deleteRoadAlert = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/road_alerts`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!response.ok) throw new Error('Erreur lors de la suppression');
};
