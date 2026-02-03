import { API_URL } from './config';

export interface Notification {
  id: string;
  UID: string;
  roadAlertId: string;
  oldStatus: string;
  newStatus: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const fetchUserNotifications = async (uid: string): Promise<Notification[]> => {
  const response = await fetch(`${API_URL}/notifications/user/${uid}`);
  if (!response.ok) throw new Error('Erreur lors du chargement des notifications');
  const result = await response.json();
  return result.data || [];
};

export const fetchUnreadNotifications = async (uid: string): Promise<Notification[]> => {
  const response = await fetch(`${API_URL}/notifications/unread/${uid}`);
  if (!response.ok) throw new Error('Erreur lors du chargement des notifications non lues');
  const result = await response.json();
  return result.data || [];
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/notifications/read`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!response.ok) throw new Error('Erreur lors du marquage de la notification');
};

export const markAllNotificationsAsRead = async (uid: string): Promise<void> => {
  const response = await fetch(`${API_URL}/notifications/read-all`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ UID: uid }),
  });
  if (!response.ok) throw new Error('Erreur lors du marquage des notifications');
};
