// Service de gestion des utilisateurs - Logique métier intégrée directement dans le mobile
// Remplace les appels API vers le backend pour la gestion utilisateurs

import { 
  doc, 
  getDoc, 
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from './firebase';

// Interface pour le statut utilisateur
export interface UserStatus {
  blocked: boolean;
  attempts: number;
  message?: string;
}

// Interface pour les données utilisateur
export interface UserData {
  UID: string;
  email: string;
  failed_login_attempt: number;
  status: string;
  type_user: string;
}

// Service de gestion des utilisateurs
class UserService {

  /**
   * Vérifier si un utilisateur est bloqué
   */
  async isUserBlocked(uid: string): Promise<UserStatus> {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error('Utilisateur non trouvé');
      }

      const userData = userDoc.data() as UserData;
      const isBlocked = userData.status === 'blocked';

      return {
        blocked: isBlocked,
        attempts: userData.failed_login_attempt || 0,
        message: isBlocked ? 'Compte bloqué' : 'Compte actif'
      };
    } catch (error: any) {
      throw new Error(`Erreur lors de la vérification du statut: ${error.message}`);
    }
  }

  /**
   * Récupérer le nombre de tentatives échouées d'un utilisateur
   */
  async getUserAttempts(uid: string): Promise<{ failed_login_attempt: number }> {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error('Utilisateur non trouvé');
      }

      const userData = userDoc.data() as UserData;
      return { failed_login_attempt: userData.failed_login_attempt || 0 };
    } catch (error: any) {
      throw new Error(`Erreur lors de la récupération des tentatives: ${error.message}`);
    }
  }

  /**
   * Débloquer un utilisateur (nécessite un manager)
   */
  async unblockUser(uid: string, managerUid?: string): Promise<void> {
    try {
      // Vérifier si le demandeur est un manager (si fourni)
      if (managerUid) {
        const managerRef = doc(db, 'users', managerUid);
        const managerDoc = await getDoc(managerRef);

        if (!managerDoc.exists() || managerDoc.data()?.type_user !== 'manager') {
          throw new Error('Accès refusé. Seul un manager peut débloquer un utilisateur.');
        }
      }

      // Débloquer l'utilisateur
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        status: 'active',
        failed_login_attempt: 0
      });
    } catch (error: any) {
      throw new Error(`Erreur lors du déblocage: ${error.message}`);
    }
  }

  /**
   * Récupérer les données d'un utilisateur
   */
  async getUserData(uid: string): Promise<UserData | null> {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return null;
      }

      return userDoc.data() as UserData;
    } catch (error: any) {
      throw new Error(`Erreur lors de la récupération des données utilisateur: ${error.message}`);
    }
  }

  /**
   * Récupérer un utilisateur par email
   */
  async getUserByEmail(email: string): Promise<UserData | null> {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const userSnapshot = await getDocs(q);

      if (userSnapshot.empty) {
        return null;
      }

      return userSnapshot.docs[0].data() as UserData;
    } catch (error: any) {
      throw new Error(`Erreur lors de la recherche de l'utilisateur: ${error.message}`);
    }
  }

  /**
   * Vérifier si l'utilisateur courant est un manager
   */
  async isManager(uid: string): Promise<boolean> {
    try {
      const userData = await this.getUserData(uid);
      return userData?.type_user === 'manager';
    } catch {
      return false;
    }
  }

  /**
   * Récupérer tous les utilisateurs (managers uniquement)
   */
  async getAllUsers(managerUid: string): Promise<UserData[]> {
    try {
      // Vérifier si le demandeur est un manager
      const isManager = await this.isManager(managerUid);
      if (!isManager) {
        throw new Error('Accès refusé. Seul un manager peut voir tous les utilisateurs.');
      }

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users: UserData[] = [];

      usersSnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
        users.push(docSnap.data() as UserData);
      });

      return users;
    } catch (error: any) {
      throw new Error(`Erreur lors de la récupération des utilisateurs: ${error.message}`);
    }
  }

  /**
   * Récupérer tous les utilisateurs bloqués (managers uniquement)
   */
  async getBlockedUsers(managerUid: string): Promise<UserData[]> {
    try {
      // Vérifier si le demandeur est un manager
      const isManager = await this.isManager(managerUid);
      if (!isManager) {
        throw new Error('Accès refusé. Seul un manager peut voir les utilisateurs bloqués.');
      }

      const q = query(collection(db, 'users'), where('status', '==', 'blocked'));
      const usersSnapshot = await getDocs(q);
      const users: UserData[] = [];

      usersSnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
        users.push(docSnap.data() as UserData);
      });

      return users;
    } catch (error: any) {
      throw new Error(`Erreur lors de la récupération des utilisateurs bloqués: ${error.message}`);
    }
  }
}

// Export d'une instance unique du service
export const userService = new UserService();
export default userService;
