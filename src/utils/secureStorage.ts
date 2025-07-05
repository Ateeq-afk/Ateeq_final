// Secure storage utility with encryption for sensitive data
import CryptoJS from 'crypto-js';

// Generate a unique key per session (in production, this should come from the server)
const getEncryptionKey = () => {
  let key = sessionStorage.getItem('_ek');
  if (!key) {
    key = CryptoJS.lib.WordArray.random(256/8).toString();
    sessionStorage.setItem('_ek', key);
  }
  return key;
};

export const secureStorage = {
  setItem: (key: string, value: string): void => {
    try {
      const encryptionKey = getEncryptionKey();
      const encrypted = CryptoJS.AES.encrypt(value, encryptionKey).toString();
      sessionStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Secure storage setItem error:', error);
    }
  },

  getItem: (key: string): string | null => {
    try {
      const encrypted = sessionStorage.getItem(key);
      if (!encrypted) return null;
      
      const encryptionKey = getEncryptionKey();
      const decrypted = CryptoJS.AES.decrypt(encrypted, encryptionKey);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Secure storage getItem error:', error);
      return null;
    }
  },

  removeItem: (key: string): void => {
    sessionStorage.removeItem(key);
  },

  clear: (): void => {
    sessionStorage.clear();
  }
};

// Token validation with expiration check
export const validateToken = (token: string): boolean => {
  try {
    // Basic JWT structure validation
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Decode payload without verification (for expiration check)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token is expired
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      console.warn('Token expired');
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Token validation failed:', err);
    return false;
  }
};

// Secure token management
export const tokenManager = {
  setToken: (token: string): void => {
    if (!validateToken(token)) {
      throw new Error('Invalid or expired token');
    }
    
    const tokenData = {
      token,
      timestamp: Date.now()
    };
    
    secureStorage.setItem('auth_token', JSON.stringify(tokenData));
  },

  getToken: (): string | null => {
    try {
      const storedData = secureStorage.getItem('auth_token');
      if (!storedData) return null;

      const tokenData = JSON.parse(storedData);
      
      // Validate token age (max 7 days)
      const maxAge = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - tokenData.timestamp > maxAge) {
        secureStorage.removeItem('auth_token');
        return null;
      }
      
      if (!validateToken(tokenData.token)) {
        secureStorage.removeItem('auth_token');
        return null;
      }
      
      return tokenData.token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  removeToken: (): void => {
    secureStorage.removeItem('auth_token');
  }
};