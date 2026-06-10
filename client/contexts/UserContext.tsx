import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

export interface User {
  id: number;
  device_id: string;
  daily_calorie_goal: number;
  daily_carb_goal: number;
  daily_protein_goal: number;
  daily_fat_goal: number;
  created_at?: string;
}

interface UserContextType {
  userId: number | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  updateGoals: (goals: Partial<User>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

function generateUUID() {
  return Crypto.randomUUID();
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initUser = useCallback(async () => {
    try {
      setLoading(true);
      let deviceId = await AsyncStorage.getItem('fittrack_device_id');
      if (!deviceId) {
        deviceId = generateUUID();
        await AsyncStorage.setItem('fittrack_device_id', deviceId);
      }

      const userIdStr = await AsyncStorage.getItem('fittrack_user_id');
      let currentUserId: number | null = userIdStr ? parseInt(userIdStr, 10) : null;

      if (currentUserId) {
        try {
          const response = await fetch(`${API_BASE}/api/v1/users/${currentUserId}`);
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            currentUserId = null;
          }
        } catch {
          currentUserId = null;
        }
      }

      if (!currentUserId) {
        const response = await fetch(`${API_BASE}/api/v1/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ device_id: deviceId }),
        });
        
        if (response.ok) {
          const newUser = await response.json();
          currentUserId = newUser.id;
          if (currentUserId !== null) {
            await AsyncStorage.setItem('fittrack_user_id', currentUserId.toString());
          }
          setUser(newUser);
        }
      }

      if (currentUserId !== null) {
        setUserId(currentUserId);
        console.log('[UserContext] User initialized with ID:', currentUserId);
      } else {
        console.log('[UserContext] Failed to initialize user');
      }
    } catch (err) {
      console.error('Error initializing user:', err);
      setError('Failed to initialize user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initUser();
  }, [initUser]);

  const refreshUser = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${API_BASE}/api/v1/users/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
      throw err;
    }
  }, [userId]);

  const updateGoals = useCallback(async (goals: Partial<User>) => {
    if (!userId) return;
    try {
      const response = await fetch(`${API_BASE}/api/v1/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goals),
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
      } else {
        throw new Error('Failed to update goals');
      }
    } catch (err) {
      console.error('Error updating goals:', err);
      throw err;
    }
  }, [userId]);

  return (
    <UserContext.Provider value={{ userId, user, loading, error, refreshUser, updateGoals }}>
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
