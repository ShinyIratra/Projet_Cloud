const STORAGE_KEY = 'api_url_override';

export const getApiUrl = () => {
  return localStorage.getItem(STORAGE_KEY) || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
};

export const setApiUrl = (url: string) => {
  if (url) {
    let cleanUrl = url.trim();
    // Ajouter http:// si aucun protocole n'est spécifié
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = `http://${cleanUrl}`;
    }
    // Retirer le slash final s'il existe pour éviter les doubles slashs
    cleanUrl = cleanUrl.replace(/\/$/, '');
    
    localStorage.setItem(STORAGE_KEY, cleanUrl);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  window.location.reload();
};

export const API_URL = getApiUrl();
