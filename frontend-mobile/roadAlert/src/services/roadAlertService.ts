// Service de gestion des signalements routiers - Logique métier intégrée directement dans le mobile
// Remplace les appels API vers le backend pour les signalements

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc,
  deleteDoc,
  query, 
  where,
  orderBy,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

// Interface pour les signalements routiers
export interface RoadAlert {
  id?: string;
  surface: number;
  budget: number;
  concerned_entreprise: string;
  status: string;
  lattitude: number;
  longitude: number;
  UID: string;
  date_alert: string;
  updated_at?: string;
  created_at?: string;
}

// Interface pour les signalements depuis mobile (simplifié)
export interface MobileRoadAlert {
  UID: string;
  date_alert: string;
  lattitude: number;
  longitude: number;
}

// Classe modèle pour les signalements (équivalent du RoadAlertModel backend)
class RoadAlertModel implements RoadAlert {
  id?: string;
  surface: number;
  budget: number;
  concerned_entreprise: string;
  status: string;
  lattitude: number;
  longitude: number;
  UID: string;
  date_alert: string;
  updated_at?: string;
  created_at?: string;

  constructor(
    id: string | null,
    surface: number,
    budget: number,
    concerned_entreprise: string,
    status: string,
    lattitude: number,
    longitude: number,
    UID: string,
    date_alert: string
  ) {
    this.id = id || undefined;
    this.surface = surface;
    this.budget = budget;
    this.concerned_entreprise = concerned_entreprise;
    this.status = status;
    this.lattitude = lattitude;
    this.longitude = longitude;
    this.UID = UID;
    this.date_alert = date_alert;
  }
}

// Service de gestion des signalements routiers
class RoadAlertService {

  /**
   * Créer un nouveau signalement (version complète)
   */
  async createRoadAlert(alertData: Omit<RoadAlert, 'id'>): Promise<{ id: string }> {
    try {
      const roadAlert = new RoadAlertModel(
        null,
        alertData.surface,
        alertData.budget,
        alertData.concerned_entreprise,
        alertData.status,
        alertData.lattitude,
        alertData.longitude,
        alertData.UID,
        alertData.date_alert
      );

      const roadAlertRef = doc(collection(db, 'road_alerts'));
      roadAlert.id = roadAlertRef.id;

      await setDoc(roadAlertRef, {
        id: roadAlert.id,
        surface: roadAlert.surface,
        budget: roadAlert.budget,
        concerned_entreprise: roadAlert.concerned_entreprise,
        status: roadAlert.status,
        lattitude: roadAlert.lattitude,
        longitude: roadAlert.longitude,
        UID: roadAlert.UID,
        date_alert: roadAlert.date_alert,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

      return { id: roadAlertRef.id };
    } catch (error: any) {
      throw new Error(`Erreur lors de la création du signalement: ${error.message}`);
    }
  }

  /**
   * Créer un signalement depuis mobile (version simplifiée)
   */
  async createMobileRoadAlert(alertData: MobileRoadAlert): Promise<{ id: string }> {
    try {
      const roadAlert = new RoadAlertModel(
        null,
        0, // surface par défaut
        0, // budget par défaut
        '', // concerned_entreprise vide par défaut
        'nouveau', // status automatiquement défini à "nouveau"
        alertData.lattitude,
        alertData.longitude,
        alertData.UID,
        alertData.date_alert
      );

      const roadAlertRef = doc(collection(db, 'road_alerts'));
      roadAlert.id = roadAlertRef.id;

      await setDoc(roadAlertRef, {
        id: roadAlert.id,
        surface: roadAlert.surface,
        budget: roadAlert.budget,
        concerned_entreprise: roadAlert.concerned_entreprise,
        status: roadAlert.status,
        lattitude: roadAlert.lattitude,
        longitude: roadAlert.longitude,
        UID: roadAlert.UID,
        date_alert: roadAlert.date_alert,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

      return { id: roadAlertRef.id };
    } catch (error: any) {
      throw new Error(`Erreur lors de la création du signalement mobile: ${error.message}`);
    }
  }

  /**
   * Récupérer tous les signalements
   */
  async getAllRoadAlerts(): Promise<RoadAlert[]> {
    try {
      const roadAlertsSnapshot = await getDocs(collection(db, 'road_alerts'));
      const roadAlerts: RoadAlert[] = [];

      roadAlertsSnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
        const data = docSnap.data();
        roadAlerts.push({
          id: data.id,
          surface: data.surface,
          budget: data.budget,
          concerned_entreprise: data.concerned_entreprise,
          status: data.status,
          lattitude: data.lattitude,
          longitude: data.longitude,
          UID: data.UID,
          date_alert: data.date_alert,
          updated_at: data.updated_at,
          created_at: data.created_at
        });
      });

      return roadAlerts;
    } catch (error: any) {
      throw new Error(`Erreur lors de la récupération des signalements: ${error.message}`);
    }
  }

  /**
   * Récupérer les signalements d'un utilisateur
   */
  async getRoadAlertsByUser(UID: string): Promise<RoadAlert[]> {
    try {
      const q = query(collection(db, 'road_alerts'), where('UID', '==', UID));
      const roadAlertsSnapshot = await getDocs(q);
      const roadAlerts: RoadAlert[] = [];

      roadAlertsSnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
        const data = docSnap.data();
        roadAlerts.push({
          id: data.id,
          surface: data.surface,
          budget: data.budget,
          concerned_entreprise: data.concerned_entreprise,
          status: data.status,
          lattitude: data.lattitude,
          longitude: data.longitude,
          UID: data.UID,
          date_alert: data.date_alert,
          updated_at: data.updated_at,
          created_at: data.created_at
        });
      });

      return roadAlerts;
    } catch (error: any) {
      throw new Error(`Erreur lors de la récupération des signalements utilisateur: ${error.message}`);
    }
  }

  /**
   * Mettre à jour un signalement
   */
  async updateRoadAlert(alertData: RoadAlert): Promise<void> {
    try {
      if (!alertData.id) {
        throw new Error('ID du signalement requis');
      }

      const roadAlertRef = doc(db, 'road_alerts', alertData.id);

      await updateDoc(roadAlertRef, {
        surface: alertData.surface,
        budget: alertData.budget,
        concerned_entreprise: alertData.concerned_entreprise,
        lattitude: alertData.lattitude,
        longitude: alertData.longitude,
        UID: alertData.UID,
        date_alert: alertData.date_alert,
        updated_at: new Date().toISOString()
      });
    } catch (error: any) {
      throw new Error(`Erreur lors de la mise à jour du signalement: ${error.message}`);
    }
  }

  /**
   * Mettre à jour le statut d'un signalement (avec création de notification)
   */
  async updateRoadAlertStatus(id: string, status: string): Promise<void> {
    try {
      const roadAlertRef = doc(db, 'road_alerts', id);
      const roadAlertDoc = await getDoc(roadAlertRef);

      if (!roadAlertDoc.exists()) {
        throw new Error('Signalement non trouvé');
      }

      const roadAlertData = roadAlertDoc.data();
      const oldStatus = roadAlertData.status;
      const userUID = roadAlertData.UID;

      // Mettre à jour le statut
      await updateDoc(roadAlertRef, {
        status: status,
        updated_at: new Date().toISOString()
      });

      // Créer une notification si le statut a changé
      if (oldStatus !== status && userUID) {
        try {
          // Import dynamique pour éviter les dépendances circulaires
          const { notificationService } = await import('./notificationService');
          await notificationService.createNotification(userUID, id, oldStatus, status);
        } catch (notifError) {
          console.error('Erreur lors de la création de la notification:', notifError);
          // Ne pas bloquer si la notification échoue
        }
      }
    } catch (error: any) {
      throw new Error(`Erreur lors de la mise à jour du statut: ${error.message}`);
    }
  }

  /**
   * Supprimer un signalement
   */
  async deleteRoadAlert(id: string): Promise<void> {
    try {
      const roadAlertRef = doc(db, 'road_alerts', id);
      await deleteDoc(roadAlertRef);
    } catch (error: any) {
      throw new Error(`Erreur lors de la suppression du signalement: ${error.message}`);
    }
  }

  /**
   * Récupérer un signalement par ID
   */
  async getRoadAlertById(id: string): Promise<RoadAlert | null> {
    try {
      const roadAlertRef = doc(db, 'road_alerts', id);
      const roadAlertDoc = await getDoc(roadAlertRef);

      if (!roadAlertDoc.exists()) {
        return null;
      }

      const data = roadAlertDoc.data();
      return {
        id: data.id,
        surface: data.surface,
        budget: data.budget,
        concerned_entreprise: data.concerned_entreprise,
        status: data.status,
        lattitude: data.lattitude,
        longitude: data.longitude,
        UID: data.UID,
        date_alert: data.date_alert,
        updated_at: data.updated_at,
        created_at: data.created_at
      };
    } catch (error: any) {
      throw new Error(`Erreur lors de la récupération du signalement: ${error.message}`);
    }
  }
}

// Export d'une instance unique du service
export const roadAlertService = new RoadAlertService();
export default roadAlertService;
