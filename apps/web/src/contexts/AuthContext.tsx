import React, { createContext, useContext, useState } from 'react';
import { api } from '../lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface User {
  id: string;
  email: string;
  name: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await api.get('/auth/me');
      return response.data as User;
    },
    enabled: !!token,
    retry: false,
  });

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    queryClient.setQueryData(['auth', 'me'], newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    queryClient.clear();
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
