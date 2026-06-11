import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseBrowserClientAsync } from '@/lib/supabase-browser';
import { setAuthToken, getApiBase } from '@/utils/auth-token';

const API_BASE = getApiBase();

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
      const url = `${API_BASE}/api/v1/auth/me`;
      console.warn('[AUTH DEBUG] fetchUser URL:', url);

      // 8秒超时，避免后端验证 token 时 Supabase 响应慢导致卡住
      const controller = new AbortController();
      const fetchTimeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(fetchTimeout);

      if (res.ok) {
        const userData = await parseJsonSafe(res);
        setUser(userData);
      } else {
        console.warn('[AUTH DEBUG] fetchUser not ok, status:', res.status, '- clearing session');
        // 不等待 signOut 网络请求，直接清理本地存储（防止 signOut 网络请求卡住）
        try {
          const keys = await AsyncStorage.getAllKeys();
          const staleKeys = keys.filter(k => k.startsWith('fittrack_auth'));
          if (staleKeys.length > 0) {
            await AsyncStorage.multiRemove(staleKeys);
          }
        } catch {}
        setAuthToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Auth fetchUser error:', err);
      // fetch 超时/网络错误时，清理本地旧 session 防止卡住
      try {
        const keys = await AsyncStorage.getAllKeys();
        const staleKeys = keys.filter(k => k.startsWith('fittrack_auth'));
        if (staleKeys.length > 0) {
          await AsyncStorage.multiRemove(staleKeys);
        }
      } catch {}
      setAuthToken(null);
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

    // 全局安全网：15 秒后强制关闭 loading，防止任何意外卡住
    const safetyTimer = setTimeout(() => {
      console.warn('[Auth] Safety timeout - forcing loading to false');
      setIsLoading(false);
    }, 15000);

    init().finally(() => clearTimeout(safetyTimer));
    return () => clearTimeout(safetyTimer);
  }, [fetchUser]);

  const login = useCallback(async (email: string, password: string) => {
    const deviceId = await AsyncStorage.getItem('fittrack_device_id');
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, device_id: deviceId }),
    });

    if (!res.ok) {
      const errData = await parseJsonSafe(res).catch(() => ({ error: '登录失败' }));
      throw new Error(errData.error || '登录失败');
    }

    const { user, session } = await parseJsonSafe(res);

    if (session) {
      const supabase = await getSupabaseBrowserClientAsync();
      // 设置 session 加入超时，超时后继续流程（避免卡住用户）
      await Promise.race([
        supabase.auth.setSession(session),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
      ]).catch((err) => {
        if (err?.message !== 'timeout') throw err;
        console.warn('[Auth] setSession timeout, continuing');
      });
    }

    await fetchUser();
  }, [fetchUser]);

  const parseJsonSafe = async (response: Response) => {
    const text = await response.text();
    if (text.startsWith('{') || text.startsWith('[')) {
      return JSON.parse(text);
    }
    throw new Error('服务器响应异常，请刷新页面重试');
  };

  const register = useCallback(async (email: string, password: string) => {
    const deviceId = await AsyncStorage.getItem('fittrack_device_id');
    const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, device_id: deviceId }),
    });

    if (!res.ok) {
      const errData = await parseJsonSafe(res).catch(() => ({ error: '注册失败' }));
      throw new Error(errData.error || '注册失败');
    }

    const { user, session } = await parseJsonSafe(res);

    if (session) {
      const supabase = await getSupabaseBrowserClientAsync();
      await Promise.race([
        supabase.auth.setSession(session),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
      ]).catch((err) => {
        if (err?.message !== 'timeout') throw err;
        console.warn('[Auth] register setSession timeout, continuing');
      });
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