import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('finaudit_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth-unauthorized', handleUnauthorized);

    const initAuth = async () => {
      const savedToken = localStorage.getItem('finaudit_token');
      if (savedToken) {
        try {
          const profile = await api.getProfile();
          setUser(profile);
          setToken(savedToken);
        } catch {
          localStorage.removeItem('finaudit_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const data: AuthResponse = await api.login(credentials);
    localStorage.setItem('finaudit_token', data.access_token);
    setToken(data.access_token);

    const userObj: User = {
      id: 1,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
      company_name: data.company_name,
      created_at: new Date().toISOString(),
    };
    setUser(userObj);
    localStorage.setItem('finaudit_user', JSON.stringify(userObj));
  };

  const logout = () => {
    localStorage.removeItem('finaudit_token');
    localStorage.removeItem('finaudit_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
