// API基础URL
import { getApiBase } from './auth-token';
const API_BASE_URL = getApiBase();

// 食物类型定义
export interface Food {
  id?: number;
  name: string;
  name_pinyin?: string;
  category?: string;
  calorie: number;
  carb: number;
  protein: number;
  fat: number;
  sodium?: number;
  serving_size?: string;
  serving_gram?: number;
  barcode?: string;
}

export interface DietRecord {
  id?: number;
  user_id: number;
  food_id?: number;
  food_name: string;
  meal_type: MealType;
  calorie: number;
  carb: number;
  protein: number;
  fat: number;
  sodium?: number;
  serving_amount?: number;
  serving_unit?: string;
  record_date: string;
  created_at?: string;
}

export interface User {
  id: number;
  device_id: string;
  username?: string;
  daily_calorie_goal: number;
  daily_carb_goal: number;
  daily_protein_goal: number;
  daily_fat_goal: number;
  daily_sodium_goal?: number;
  reminder_enabled: boolean;
  reminder_time?: string;
}

export interface DailySummary {
  byMeal: {
    meal_type: MealType;
    count: number;
    total_calorie: number;
    total_carb: number;
    total_protein: number;
    total_fat: number;
  }[];
  totals: {
    total_count: number;
    total_calorie: number;
    total_carb: number;
    total_protein: number;
    total_fat: number;
  };
}

export interface TrendData {
  stat_date: string;
  total_calorie: number;
  total_carb: number;
  total_protein: number;
  total_fat: number;
  daily_calorie_goal?: number;
}

export interface StatsSummary {
  daysWithRecords: number;
  avgCalorie: number;
  achievedDays: number;
  achievementRate: number;
  totalDeficit: number;
  avgCarb: number;
  avgProtein: number;
  avgFat: number;
  goalCalorie: number;
}

export interface AllTimeStats {
  totalRecordedDays: number;
  totalCalorieConsumed: number;
  totalDeficit: number;
  totalOverage: number;
  avgCaloriePerDay: number;
  achievementRate: number;
  totalAchievedDays: number;
  topFood: { name: string; count: number }[];
  firstRecordDate: string;
  lastRecordDate: string;
  totalDaysSinceFirst: number;
  dailyGoal: number;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const MEAL_TYPES: { key: MealType; label: string; icon: string }[] = [
  { key: 'breakfast', label: '早餐', icon: 'sunrise' },
  { key: 'lunch', label: '午餐', icon: 'sun' },
  { key: 'dinner', label: '晚餐', icon: 'moon' },
  { key: 'snack', label: '加餐', icon: 'cookie' },
];

// 格式化日期为 YYYY-MM-DD
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 获取今天的日期字符串
export function getToday(): string {
  return formatDate(new Date());
}

// 获取本周的日期范围
export function getWeekRange(): { start: string; end: string } {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 6);
  return {
    start: formatDate(start),
    end: formatDate(today),
  };
}

// 获取近30天的日期范围（包含今天）
export function getMonthRange(): { start: string; end: string } {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 29);
  return {
    start: formatDate(start),
    end: formatDate(today),
  };
}

// 格式化日期显示
export function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
  return `${month}月${day}日 周${weekday}`;
}

// 格式化时间显示
export function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':');
  return `${hours}:${minutes}`;
}

// 计算百分比
export function calculatePercentage(current: number, goal: number): number {
  if (goal === 0) return 0;
  return Math.min(Math.round((current / goal) * 100), 100);
}

// 计算剩余热量
export function calculateRemaining(consumed: number, goal: number): number {
  return Math.max(goal - consumed, 0);
}

// 获取设备ID（使用UUID）
export function getDeviceId(): string {
  // 简单实现，实际应该使用 expo-crypto
  let deviceId = '';
  for (let i = 0; i < 36; i++) {
    if (i === 14) deviceId += '4';
    else if (i === 19) deviceId += (Math.random() * 16 | 0).toString(16);
    else if (i === 8 || i === 13 || i === 18 || i === 23) deviceId += '-';
    else deviceId += (Math.random() * 16 | 0).toString(16);
  }
  return deviceId;
}

// 存储键名
export const STORAGE_KEYS = {
  USER_ID: 'fittrack_user_id',
  DEVICE_ID: 'fittrack_device_id',
};

import { withAuthHeaders } from './auth-token';

// API 请求函数
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}/api/v1${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: withAuthHeaders({
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// API 函数封装
export const api = {
  // 用户相关
  createUser: (deviceId: string, username?: string) =>
    apiRequest<User>('/users', {
      method: 'POST',
      body: JSON.stringify({ device_id: deviceId, username }),
    }),

  getUser: (userId: number) =>
    apiRequest<User>(`/users/${userId}`),

  updateGoals: (userId: number, goals: Partial<User>) =>
    apiRequest<User>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(goals),
    }),

  // 食物相关
  getFoods: (params?: { category?: string; search?: string; limit?: number; offset?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.offset) queryParams.append('offset', String(params.offset));
    const query = queryParams.toString();
    return apiRequest<Food[]>(`/foods${query ? `?${query}` : ''}`);
  },

  getFoodCategories: () =>
    apiRequest<{ category: string; count: string }[]>('/foods/categories'),

  getFoodByBarcode: (barcode: string) =>
    apiRequest<Food>(`/foods/barcode/${barcode}`),

  // 饮食记录相关
  addDietRecord: (record: Omit<DietRecord, 'id'>) =>
    apiRequest<DietRecord>('/records', {
      method: 'POST',
      body: JSON.stringify(record),
    }),

  getDietRecords: (params: { user_id: number; date?: string; start_date?: string; end_date?: string }) => {
    const queryParams = new URLSearchParams({ user_id: String(params.user_id) });
    if (params.date) queryParams.append('date', params.date);
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    return apiRequest<DietRecord[]>(`/records?${queryParams.toString()}`);
  },

  deleteDietRecord: (recordId: number) =>
    apiRequest<{ message: string }>(`/records/${recordId}`, {
      method: 'DELETE',
    }),

  getDietSummary: (userId: number, date: string) =>
    apiRequest<DailySummary>(`/stats/daily?user_id=${userId}&date=${date}`),

  // 统计相关
  getDailyStats: (userId: number, startDate?: string, endDate?: string) => {
    let query = `?user_id=${userId}`;
    if (startDate) query += `&start_date=${startDate}`;
    if (endDate) query += `&end_date=${endDate}`;
    return apiRequest<any[]>(`/stats/daily${query}`);
  },

  getTrendData: (userId: number, startDate: string, endDate: string) =>
    apiRequest<{ summary: StatsSummary; trend: TrendData[] }>(
      `/stats/history?user_id=${userId}&start_date=${startDate}&end_date=${endDate}`
    ),

  getAllTimeStats: (userId: number) =>
    apiRequest<AllTimeStats>(`/stats/all-time?user_id=${userId}`),

  // 收藏相关
  getFavorites: (userId: number) =>
    apiRequest<any[]>(`/favorites?user_id=${userId}`),

  addFavorite: (userId: number, foodId: number) =>
    apiRequest<any>('/favorites', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, food_id: foodId }),
    }),

  removeFavorite: (favoriteId: number) =>
    apiRequest<{ message: string }>(`/favorites/${favoriteId}`, {
      method: 'DELETE',
    }),
};
