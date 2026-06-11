import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken, getApiBase } from '@/utils/auth-token';

const API_BASE = getApiBase();
const AUTH_SESSION_KEY = 'auth_session';

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

const parseJsonSafe = async (response: Response) => {
  const text = await response.text();
  if (text.startsWith('{') || text.startsWith('[')) {
    return JSON.parse(text);
  }
  throw new Error('服务器响应异常，请刷新页面重试');
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch full user info from backend using stored token.
  // 零 Supabase SDK 依赖 — 只从 AsyncStorage 读 token，发给后端验证
  const fetchUser = useCallback(async () => {
    try {
      const storedSession = await AsyncStorage.getItem(AUTH_SESSION_KEY);
      if (!storedSession) {
        setAuthToken(null);
        setUser(null);
        return;
      }

      let token: string | null = null;
      try {
        const session = JSON.parse(storedSession);
        token = session?.access_token || (typeof session === 'string' ? session : null);
      } catch {
        await AsyncStorage.removeItem(AUTH_SESSION_KEY);
        setAuthToken(null);
        setUser(null);
        return;
      }

      if (!token) {
        await AsyncStorage.removeItem(AUTH_SESSION_KEY);
        setAuthToken(null);
        setUser(null);
        return;
      }

      setAuthToken(token);

      // 8秒超时，避免后端验证 token 时卡住
      const controller = new AbortController();
      const fetchTimeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
        headers: { 'x-session': token },
        signal: controller.signal,
      });
      clearTimeout(fetchTimeout);

      if (res.ok) {
        const userData = await parseJsonSafe(res);
        setUser(userData);
      } else {
        // Session expired or invalid — 直接删除，不走任何 Supabase SDK 调用
        console.warn('[Auth] Session invalid, clearing');
        await AsyncStorage.removeItem(AUTH_SESSION_KEY);
        setAuthToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Auth fetchUser error:', err);
      // 超时/网络错误 — 清理本地 session，不走 signOut 网络请求
      await AsyncStorage.removeItem(AUTH_SESSION_KEY).catch(() => {});
      setAuthToken(null);
      setUser(null);
    }
  }, []);

  // Initialize: check for stored session on mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        await fetchUser();
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // 全局安全网：15 秒后强制关闭 loading
    const safetyTimer = setTimeout(() => {
      console.warn('[Auth] Safety timeout - forcing loading to false');
      setIsLoading(false);
    }, 15000);

    init().finally(() => clearTimeout(safetyTimer));
    return () => clearTimeout(safetyTimer);
  }, [fetchUser]);

  const login = useCallback(async (email: string, password: string) => {
    const deviceId = await AsyncStorage.getItem('fittrack_device_id');

    // 10秒超时
    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), 10000);
    let res;
    try {
      res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, device_id: deviceId }),
        signal: controller.signal,
      });
    } catch (fetchErr: any) {
      clearTimeout(fetchTimeout);
      if (fetchErr.name === 'AbortError') throw new Error('请求超时，请检查网络后重试');
      throw fetchErr;
    }
    clearTimeout(fetchTimeout);

    if (!res.ok) {
      const errData = await parseJsonSafe(res).catch(() => ({ error: '登录失败' }));
      throw new Error(errData.error || '登录失败');
    }

    const data = await parseJsonSafe(res);
    const session = data?.session;
    if (session) {
      // 直接存储 session 到 AsyncStorage，不走 Supabase SDK
      await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      setAuthToken(session.access_token);
      // 设置临时 user 触发路由守卫跳转
      setUser({ id: 0, device_id: '', daily_calorie_goal: 0, daily_carb_goal: 0, daily_protein_goal: 0, daily_fat_goal: 0 });
      // 获取完整用户信息
      await fetchUser();
    }
  }, [fetchUser]);

  const register = useCallback(async (email: string, password: string) => {
    const deviceId = await AsyncStorage.getItem('fittrack_device_id');

    // 10秒超时
    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), 10000);
    let res;
    try {
      res = await fetch(`${API_BASE}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, device_id: deviceId }),
        signal: controller.signal,
      });
    } catch (fetchErr: any) {
      clearTimeout(fetchTimeout);
      if (fetchErr.name === 'AbortError') throw new Error('请求超时，请检查网络后重试');
      throw fetchErr;
    }
    clearTimeout(fetchTimeout);

    if (!res.ok) {
      const errData = await parseJsonSafe(res).catch(() => ({ error: '注册失败' }));
      throw new Error(errData.error || '注册失败');
    }

    const data = await parseJsonSafe(res);
    const session = data?.session;
    if (session) {
      // 直接存储 session 到 AsyncStorage，不走 Supabase SDK
      await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      setAuthToken(session.access_token);
      // 设置临时 user 触发路由守卫跳转
      setUser({ id: 0, device_id: '', daily_calorie_goal: 0, daily_carb_goal: 0, daily_protein_goal: 0, daily_fat_goal: 0 });
      // 获取完整用户信息
      await fetchUser();
    }
  }, [fetchUser]);

  const logout = useCallback(async () => {
    // 只清理本地存储，不走 supabase.auth.signOut() 网络请求
    await AsyncStorage.removeItem(AUTH_SESSION_KEY).catch(() => {});
    // 同时清理可能残留的旧 Supabase SDK session key
    await AsyncStorage.removeItem('fittrack_auth').catch(() => {});
    setAuthToken(null);
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