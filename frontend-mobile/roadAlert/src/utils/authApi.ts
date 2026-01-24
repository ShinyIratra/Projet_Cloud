import { API_URL } from './config';

export interface LoginResponse {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
}

export interface RegisterResponse {
  token?: string;
  user?: {
    uid: string;
    email: string;
  };
  message?: string;
}

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await fetch(`${API_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Email ou mot de passe incorrect');
    }
    throw new Error('Erreur de connexion');
  }
  
  return response.json();
};

export const registerUser = async (email: string, password: string): Promise<RegisterResponse> => {
  const response = await fetch(`${API_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error('Erreur lors de l\'inscription');
  return response.json();
};

export const updateUser = async (email?: string, password?: string) => {
  const response = await fetch(`${API_URL}/api/update`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error('Erreur lors de la mise à jour');
  return response.json();
};
