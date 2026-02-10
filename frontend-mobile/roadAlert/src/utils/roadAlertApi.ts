// API des signalements routiers - Logique métier locale (sans backend)
// Utilise Firebase directement depuis le mobile

import { roadAlertService, RoadAlert, MobileRoadAlert } from '../services/roadAlertService';

// Ré-export des interfaces pour la compatibilité
export type { RoadAlert, MobileRoadAlert };

/**
 * Récupérer tous les signalements
 */
export const fetchRoadAlerts = async (): Promise<RoadAlert[]> => {
  return await roadAlertService.getAllRoadAlerts();
};

/**
 * Récupérer les signalements d'un utilisateur
 */
export const fetchUserRoadAlerts = async (uid: string): Promise<RoadAlert[]> => {
  return await roadAlertService.getRoadAlertsByUser(uid);
};

/**
 * Créer un nouveau signalement (version complète)
 */
export const createRoadAlert = async (alert: Omit<RoadAlert, 'id'>): Promise<RoadAlert> => {
  const result = await roadAlertService.createRoadAlert(alert);
  return { ...alert, id: result.id };
};

/**
 * Créer un signalement depuis mobile (version simplifiée)
 */
export const createMobileRoadAlert = async (alert: MobileRoadAlert): Promise<RoadAlert> => {
  const result = await roadAlertService.createMobileRoadAlert(alert);
  return {
    id: result.id,
    surface: 0,
    prix_m2: 0,
    niveau: 1,
    budget: 0,
    concerned_entreprise: '',
    status: 'nouveau',
    lattitude: alert.lattitude,
    longitude: alert.longitude,
    UID: alert.UID,
    date_alert: alert.date_alert
  };
};

/**
 * Mettre à jour un signalement
 */
export const updateRoadAlert = async (alert: RoadAlert): Promise<RoadAlert> => {
  await roadAlertService.updateRoadAlert(alert);
  return alert;
};

/**
 * Mettre à jour le statut d'un signalement
 */
export const updateAlertStatus = async (id: string, status: string): Promise<RoadAlert> => {
  await roadAlertService.updateRoadAlertStatus(id, status);
  const updatedAlert = await roadAlertService.getRoadAlertById(id);
  if (!updatedAlert) {
    throw new Error('Signalement non trouvé après mise à jour');
  }
  return updatedAlert;
};

/**
 * Supprimer un signalement
 */
export const deleteRoadAlert = async (id: string): Promise<void> => {
  await roadAlertService.deleteRoadAlert(id);
};

/**
 * Récupérer un signalement par ID
 */
export const fetchRoadAlertById = async (id: string): Promise<RoadAlert | null> => {
  return await roadAlertService.getRoadAlertById(id);
};
