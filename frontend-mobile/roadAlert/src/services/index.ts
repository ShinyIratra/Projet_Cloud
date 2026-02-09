// Export centralisé des services
// Permet d'importer facilement les services depuis un seul point d'entrée

// Service d'authentification
export { authService, type LoginResponse, type RegisterResponse, type UserData as AuthUserData } from './authService';

// Service de signalements routiers
export { roadAlertService, type RoadAlert, type MobileRoadAlert } from './roadAlertService';

// Service de notifications
export { notificationService, type Notification } from './notificationService';

// Service utilisateurs
export { userService, type UserStatus, type UserData } from './userService';

// Service de gestion de photos
export {
  uploadProfilePhoto,
  getProfilePhoto,
  deleteProfilePhoto,
  addSignalementPhoto,
  getSignalementPhotos,
  setMainSignalementPhoto,
  deleteSignalementPhoto,
  deleteAllSignalementPhotos,
} from './photoService';

// Configuration Firebase
export { auth, db, app, getRemoteConfigValue } from './firebase';
