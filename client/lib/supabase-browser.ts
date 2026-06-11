import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

let browserClient: SupabaseClient | null = null;
let configPromise: Promise<{ url: string; anonKey: string }> | null = null;

import { getApiBase } from '@/utils/auth-token';
const API_BASE = getApiBase();

async function fetchConfig(): Promise<{ url: string; anonKey: string }> {
  const res = await fetch(`${API_BASE}/api/v1/supabase-config`);
  if (!res.ok) throw new Error(`Failed to load Supabase config: HTTP ${res.status}`);
  const text = await res.text();
  if (!text.startsWith('{')) {
    throw new Error('服务器配置加载异常，请刷新页面重试');
  }
  const data = JSON.parse(text);
  if (!data.url || !data.anonKey) throw new Error('Invalid supabase config');
  return data;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getSupabaseBrowserClientAsync(): Promise<SupabaseClient> {
  if (browserClient) return browserClient;

  if (!configPromise) {
    configPromise = fetchConfig();
  }

  const config = await configPromise;

  if (!browserClient) {
    browserClient = createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storage: AsyncStorage,
      },
    });
  }

  return browserClient;
}

export async function getSupabaseBrowserClientWithRetry(maxRetries = 5, retryInterval = 1000): Promise<SupabaseClient> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await getSupabaseBrowserClientAsync();
    } catch {
      if (i < maxRetries - 1) {
        await sleep(retryInterval);
      }
    }
  }
  return getSupabaseBrowserClientAsync();
}