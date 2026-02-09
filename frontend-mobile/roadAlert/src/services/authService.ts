// Service d'authentification - Logique métier intégrée directement dans le mobile
// Remplace les appels API vers le backend

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  updateEmail as firebaseUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  sendPasswordResetEmail,
  signOut,
  User,
  UserCredential
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  DocumentData
} from 'firebase/firestore';
import { auth, db, getRemoteConfigValue } from './firebase';

// Interfaces
export interface LoginResponse {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T | null;
  message: string;
}

export interface RegisterResponse {
  uid: string;
  email: string;
  message: string;
}

export interface UserData {
  UID: string;
  email: string;
  failed_login_attempt: number;
  status: string;
  type_user: string;
}

// Classe de modèle utilisateur (équivalent du UserModel backend)
class UserModel {
  UID: string;
  failed_login_attempt: number;
  status: string;
  type_user: string;

  constructor(UID: string, failed_login_attempt: number, status: string, type_user: string) {
    this.UID = UID;
    this.failed_login_attempt = failed_login_attempt;
    this.status = status;
    this.type_user = type_user;
  }
}

// Service d'authentification avec toute la logique métier
class AuthService {
  
  /**
   * Connexion utilisateur avec gestion des tentatives échouées
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    // Vérifier si l'utilisateur existe dans Firestore
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const userSnapshot = await getDocs(q);

    if (userSnapshot.empty) {
      throw new Error('Compte non trouvé');
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data() as UserData;
    const userRef = doc(db, 'users', userDoc.id);

    // Vérifier si l'utilisateur est bloqué
    if (userData.status === 'blocked') {
      throw new Error('Compte bloqué. Veuillez contacter un administrateur.');
    }

    try {
      // Tentative de connexion avec Firebase Authentication
      const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Réinitialiser les tentatives échouées en cas de succès
      await updateDoc(userRef, {
        failed_login_attempt: 0
      });

      // Récupérer le token
      const idToken = await user.getIdToken();

      return {
        idToken,
        email: user.email || email,
        refreshToken: user.refreshToken,
        expiresIn: '3600',
        localId: user.uid
      };

    } catch (error: any) {
      // Récupérer le nombre max de tentatives depuis Remote Config
      const maxAttempts = await getRemoteConfigValue('MAX_LOGIN_ATTEMPTS') || 3;

      // Vérifier si l'erreur est liée à un mot de passe invalide
      if (error.code === 'auth/wrong-password' || 
          error.code === 'auth/invalid-credential' ||
          error.code === 'auth/invalid-login-credentials') {
        
        const newAttempts = (userData.failed_login_attempt || 0) + 1;

        if (newAttempts >= maxAttempts) {
          await updateDoc(userRef, { 
            failed_login_attempt: newAttempts, 
            status: 'blocked' 
          });
          throw new Error(`Compte bloqué après ${maxAttempts} tentatives échouées.`);
        } else {
          await updateDoc(userRef, { 
            failed_login_attempt: newAttempts 
          });
          throw new Error(`Mot de passe incorrect. Tentative ${newAttempts}/${maxAttempts}`);
        }
      }

      // Autres erreurs
      throw new Error(this.getFirebaseErrorMessage(error.code));
    }
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(
    email: string, 
    password: string, 
    displayName: string = '', 
    type_user: string = 'utilisateur'
  ): Promise<RegisterResponse> {
    try {
      // Créer l'utilisateur dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Mettre à jour le profil avec le displayName
      if (displayName) {
        await updateProfile(user, { displayName });
      }

      // Créer le document utilisateur dans Firestore
      const userModel = new UserModel(user.uid, 0, 'active', type_user);
      const userRef = doc(db, 'users', user.uid);
      
      await setDoc(userRef, {
        UID: userModel.UID,
        email: email,
        failed_login_attempt: userModel.failed_login_attempt,
        status: userModel.status,
        type_user: userModel.type_user
      });

      return {
        uid: user.uid,
        email: email,
        message: 'Utilisateur créé avec succès'
      };

    } catch (error: any) {
      throw new Error(this.getFirebaseErrorMessage(error.code));
    }
  }

  /**
   * Mise à jour de l'email et/ou du mot de passe
   */
  async updateEmailAndPassword(
    uid: string, 
    newEmail?: string, 
    newPassword?: string
  ): Promise<void> {
    const user = auth.currentUser;
    
    if (!user || user.uid !== uid) {
      throw new Error('Utilisateur non authentifié ou UID incorrect');
    }

    try {
      if (newEmail) {
        await firebaseUpdateEmail(user, newEmail);
        // Mettre à jour l'email dans Firestore également
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, { email: newEmail });
      }

      if (newPassword) {
        await firebaseUpdatePassword(user, newPassword);
      }

    } catch (error: any) {
      throw new Error(this.getFirebaseErrorMessage(error.code));
    }
  }

  /**
   * Débloquer un utilisateur (réservé aux managers)
   */
  async unblockUser(uid: string, managerUid: string): Promise<void> {
    // Vérifier que le demandeur est un manager
    const managerRef = doc(db, 'users', managerUid);
    const managerDoc = await getDoc(managerRef);

    if (!managerDoc.exists() || managerDoc.data()?.type_user !== 'manager') {
      throw new Error('Accès refusé. Seul un manager peut débloquer un utilisateur.');
    }

    // Débloquer l'utilisateur
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      status: 'active',
      failed_login_attempt: 0
    });
  }

  /**
   * Réinitialisation du mot de passe
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(this.getFirebaseErrorMessage(error.code));
    }
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    await signOut(auth);
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  /**
   * Récupérer l'utilisateur courant
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Récupérer les données utilisateur depuis Firestore
   */
  async getUserData(uid: string): Promise<UserData | null> {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return null;
  }

  /**
   * Convertir les codes d'erreur Firebase en messages lisibles
   */
  private getFirebaseErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      'auth/email-already-in-use': 'Cette adresse email est déjà utilisée',
      'auth/invalid-email': 'Adresse email invalide',
      'auth/operation-not-allowed': 'Opération non autorisée',
      'auth/weak-password': 'Le mot de passe est trop faible (minimum 6 caractères)',
      'auth/user-disabled': 'Ce compte a été désactivé',
      'auth/user-not-found': 'Aucun compte trouvé avec cette adresse email',
      'auth/wrong-password': 'Mot de passe incorrect',
      'auth/invalid-credential': 'Identifiants invalides',
      'auth/invalid-login-credentials': 'Email ou mot de passe incorrect',
      'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer plus tard',
      'auth/requires-recent-login': 'Veuillez vous reconnecter pour effectuer cette action',
      'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion internet'
    };

    return errorMessages[errorCode] || `Erreur d'authentification: ${errorCode}`;
  }
}

// Export d'une instance unique du service
export const authService = new AuthService();
export default authService;
