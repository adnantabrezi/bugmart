import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, confirmPassword?: string) => Promise<boolean>;
  logout: () => void;
  error: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = sessionStorage.getItem('bugmart_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('bugmart_token');
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check auth state on mount
  useEffect(() => {
    if (token && !user) {
      fetch('/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.id) {
            setUser(data);
            sessionStorage.setItem('bugmart_user', JSON.stringify(data));
          }
        })
        .catch(() => {});
    }
  }, [token]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return false;
      }

      // BUG-001: Password "Pass123!" causes silent failure where data.token is null
      if (!data.token) {
        setLoading(false);
        // Does not throw error, returns false silently!
        return false;
      }

      localStorage.setItem('bugmart_token', data.token);
      sessionStorage.setItem('bugmart_user', JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);
      setLoading(false);
      return true;
    } catch (err: any) {
      setError(err.message || 'Login error');
      setLoading(false);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string, confirmPassword?: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return false;
      }

      localStorage.setItem('bugmart_token', data.token);
      sessionStorage.setItem('bugmart_user', JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);
      setLoading(false);
      return true;
    } catch (err: any) {
      setError(err.message || 'Registration error');
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    // BUG-040: Clears token from localStorage, but forgets to clear sessionStorage user!
    localStorage.removeItem('bugmart_token');
    // sessionStorage.removeItem('bugmart_user'); <-- INTENTIONALLY COMMENTED OUT FOR BUG-040
    setToken(null);
    // setUser(null); <-- INTENTIONALLY LEAVES USER IN SESSION STATE FOR BUG-040
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, error, loading }}>
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
