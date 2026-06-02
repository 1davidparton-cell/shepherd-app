import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE, getAuthToken, clearAuthToken } from '../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  counselorId: string | null;
  _count: { disciples: number };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = getAuthToken();
    if (!token) { setUser(null); setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) { setUser(await res.json()); }
      else { clearAuthToken(); setUser(null); }
    } catch { setUser(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUser(); }, []);

  const logout = async () => {
    clearAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refetch: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
