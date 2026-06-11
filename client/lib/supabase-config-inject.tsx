import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

interface SupabaseConfigContextType {
  config: SupabaseConfig | null;
  isLoading: boolean;
  error: string | null;
}

const SupabaseConfigContext = createContext<SupabaseConfigContextType>({
  config: null,
  isLoading: true,
  error: null,
});

export function useSupabaseConfig() {
  return useContext(SupabaseConfigContext);
}

export const SUPABASE_CONFIG_READY_EVENT = 'supabase-config-ready';

interface SupabaseConfigProviderProps {
  children: ReactNode;
}

import { getApiBase } from '@/utils/auth-token';
const API_BASE = getApiBase();

export function SupabaseConfigProvider({ children }: SupabaseConfigProviderProps) {
  const [config, setConfig] = useState<SupabaseConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/supabase-config`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.url && data.anonKey) {
          setConfig(data);
          // For web compatibility
          try {
            (window as any).__SUPABASE_CONFIG__ = data;
            window.dispatchEvent(new CustomEvent(SUPABASE_CONFIG_READY_EVENT, { detail: data }));
          } catch {
            // Not in web environment
          }
        } else {
          throw new Error('Invalid config response');
        }
      })
      .catch((err) => {
        setError(err.message);
        console.error('Failed to load Supabase config:', err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <SupabaseConfigContext.Provider value={{ config, isLoading, error }}>
      {children}
    </SupabaseConfigContext.Provider>
  );
}