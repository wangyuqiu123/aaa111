import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseBrowserClientAsync } from '@/lib/supabase-browser';
import { setAuthToken } from '@/utils/auth-token';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

interface AuthUser {
  id: number;
  device_id: string;
  auth_id?: string;
  email?: string;
  username?: string;
  daily_calorie_goal: number;
  daily_carb_goal: number;
  daily_protein_goal: number;
  daily_fat_goal: number;
  created_at?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getSessionHeaders = useCallback(async () => {
    try {
      const supabase = await getSupabaseBrowserClientAsync();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        return { 'x-session': session.access_token };
      }
    } catch {
      // Not logged in
    }
    return {};
  }, []);

  // Fetch full user info from backend
  const fetchUser = useCallback(async () => {
    try {
      const supabase = await getSupabaseBrowserClientAsync();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAuthToken(null);
        setUser(null);
        return;
      }

      setAuthToken(session.access_token);
      const headers: Record<string, string> = { 'x-session': session.access_token };
      const res = await fetch(`${API_BASE}/api/v1/auth/me`, { headers });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        // Session expired
        await supabase.auth.signOut();
        setUser(null);
      }
    } catch (err) {
      console.error('Auth fetchUser error:', err);
      setUser(null);
    }
  }, []);

  // Initialize: check session on mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const supabase = await getSupabaseBrowserClientAsync();
        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await fetchUser();
          } else if (event === 'SIGNED_OUT') {
            setAuthToken(null);
            setUser(null);
          }
        });

        await fetchUser();
        return () => subscription?.unsubscribe();
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [fetchUser]);

  const login = useCallback(async (email: string, password: string) => {
    const deviceId = await AsyncStorage.getItem('fittrack_device_id');
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, device_id: deviceId }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: '登录失败' }));
      throw new Error(errData.error || '登录失败');
    }

    const { user, session } = await res.json();

    if (session) {
      const supabase = await getSupabaseBrowserClientAsync();
      await supabase.auth.setSession(session);
    }

    await fetchUser();
  }, [fetchUser]);

  const register = useCallback(async (email: string, password: string) => {
    const deviceId = await AsyncStorage.getItem('fittrack_device_id');
    const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, device_id: deviceId }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: '注册失败' }));
      throw new Error(errData.error || '注册失败');
    }

    const { user, session } = await res.json();

    if (session) {
      const supabase = await getSupabaseBrowserClientAsync();
      await supabase.auth.setSession(session);
    }

    await fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      const supabase = await getSupabaseBrowserClientAsync();
      await supabase.auth.signOut();
    } catch {
      // Already signed out
    }
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};