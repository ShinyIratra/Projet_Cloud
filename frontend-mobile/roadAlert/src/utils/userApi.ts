import { API_URL } from './config';

export interface UserStatus {
  blocked: boolean;
  attempts?: number;
  message?: string;
}

export const checkUserBlocked = async (uid: string): Promise<UserStatus> => {
  const response = await fetch(`${API_URL}/api/users/blocked`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ UID: uid }),
  });
  if (!response.ok) throw new Error('Erreur lors de la vérification');
  return response.json();
};

export const getUserAttempts = async (uid: string) => {
  const response = await fetch(`${API_URL}/api/users/tentative`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ UID: uid }),
  });
  if (!response.ok) throw new Error('Erreur lors de la récupération des tentatives');
  return response.json();
};

export const unblockUser = async (uid: string) => {
  const response = await fetch(`${API_URL}/api/unblock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ UID: uid }),
  });
  if (!response.ok) throw new Error('Erreur lors du déblocage');
  return response.json();
};
