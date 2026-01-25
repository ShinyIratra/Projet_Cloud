import { API_URL } from './config';

export interface LoginResponse {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T | null;
  message: string;
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
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  const apiResponse: ApiResponse<LoginResponse> = await response.json();
  
  if (apiResponse.status === 'error' || !apiResponse.data) {
    throw new Error(apiResponse.message || 'Erreur de connexion');
  }
  
  return apiResponse.data;
};

export const registerUser = async (
  email: string, 
  password: string, 
  displayName: string = '',
  type_user: string = 'utilisateur'
): Promise<RegisterResponse> => {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName, type_user }),
  });
  
  const apiResponse: ApiResponse<{ uid: string }> = await response.json();
  
  if (apiResponse.status === 'error') {
    throw new Error(apiResponse.message || 'Erreur lors de l\'inscription');
  }
  
  return {
    user: {
      uid: apiResponse.data?.uid || '',
      email: email
    },
    message: apiResponse.message
  };
};

export const updateUser = async (uid: string, email?: string, password?: string) => {
  const updateData: { uid: string; email?: string; password?: string } = { uid };
  
  if (email) updateData.email = email;
  if (password) updateData.password = password;

  const response = await fetch(`${API_URL}/update`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });
  
  const apiResponse: ApiResponse<null> = await response.json();
  
  if (apiResponse.status === 'error') {
    throw new Error(apiResponse.message || 'Erreur lors de la mise à jour');
  }
  
  return apiResponse;
};
