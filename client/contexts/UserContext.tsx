import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, api } from '@/utils/api';

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  updateGoals: (goals: Partial<User>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initUser();
  }, []);

  const initUser = async () => {
    try {
      setLoading(true);
      // 获取或创建设备ID
      let deviceId = await AsyncStorage.getItem('fittrack_device_id');
      if (!deviceId) {
        deviceId = generateUUID();
        await AsyncStorage.setItem('fittrack_device_id', deviceId);
      }

      // 尝试获取用户ID
      const userIdStr = await AsyncStorage.getItem('fittrack_user_id');
      let userId = userIdStr ? parseInt(userIdStr, 10) : null;

      // 如果有用户ID，获取用户信息
      if (userId) {
        try {
          const userData = await api.getUser(userId);
          setUser(userData);
        } catch (err) {
          // 用户不存在，创建新用户
          userId = null;
        }
      }

      // 如果没有用户，创建一个新用户
      if (!userId) {
        const newUser = await api.createUser(deviceId, '我的用户');
        setUser(newUser);
        await AsyncStorage.setItem('fittrack_user_id', String(newUser.id));
      }

      setError(null);
    } catch (err) {
      console.error('Error initializing user:', err);
      setError('初始化用户失败');
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const userData = await api.getUser(user.id);
      setUser(userData);
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  const updateGoals = async (goals: Partial<User>) => {
    if (!user) return;
    try {
      const updatedUser = await api.updateGoals(user.id, goals);
      setUser(updatedUser);
    } catch (err) {
      console.error('Error updating goals:', err);
      throw err;
    }
  };

  return (
    <UserContext.Provider value={{ user, loading, error, refreshUser, updateGoals }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
