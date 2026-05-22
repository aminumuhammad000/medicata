import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  user: any;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedAuth = localStorage.getItem('medicata_admin_auth');
    if (savedAuth) {
      const parsed = JSON.parse(savedAuth);
      if (parsed.token && parsed.user?.role === 'admin') {
        setIsAuthenticated(true);
        setUser(parsed.user);
        setToken(parsed.token);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const response = await api.post('/auth/login', { email, password: pass });
      const { token, user } = response.data;

      if (user.role !== 'admin') {
        return { success: false, error: 'Access denied: You are not an admin.' };
      }

      setIsAuthenticated(true);
      setUser(user);
      setToken(token);
      localStorage.setItem('medicata_admin_auth', JSON.stringify({ token, user }));
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Invalid credentials or server error' 
      };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    localStorage.removeItem('medicata_admin_auth');
  };

  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center font-bold text-slate-400">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, user, token }}>
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
