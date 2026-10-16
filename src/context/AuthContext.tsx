import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, getStoredToken, setStoredToken, removeStoredToken } from '../utils/api';

interface AdminUser {
  id: number;
  username: string;
}

interface AuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updatePassword: (current: string, next: string, confirm: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getStoredToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await apiRequest<{ admin: AdminUser }>('/api/auth/me');
        setAdmin(res.admin);
      } catch (err) {
        removeStoredToken();
        setAdmin(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const handleUnauthorized = () => {
      setAdmin(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (username: string, password: string) => {
    const res = await apiRequest<{ token: string; admin: AdminUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setStoredToken(res.token);
    setAdmin(res.admin);
  };

  const logout = () => {
    removeStoredToken();
    setAdmin(null);
  };

  const updatePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    await apiRequest('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        isLoading,
        login,
        logout,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
