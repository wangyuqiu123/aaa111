import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { CalorieRing } from '@/components/common';
import { useUser } from '@/contexts/UserContext';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface DietRecord {
  id: number;
  food_name: string;
  meal_type: string;
  calorie: number;
  carb: number;
  protein: number;
  fat: number;
  serving_amount: number;
  serving_unit: string;
  created_at: string;
}

interface DailyStats {
  total_calorie: number;
  total_carb: number;
  total_protein: number;
  total_fat: number;
  daily_calorie_goal: number;
  daily_carb_goal: number;
  daily_protein_goal: number;
  daily_fat_goal: number;
}

const MEAL_TYPES = [
  { key: 'breakfast', label: '早餐', icon: 'sunny-outline', time: '07:00-09:00' },
  { key: 'lunch', label: '午餐', icon: 'partly-sunny-outline', time: '12:00-14:00' },
  { key: 'dinner', label: '晚餐', icon: 'moon-outline', time: '18:00-20:00' },
  { key: 'snack', label: '加餐', icon: 'cafe-outline', time: '任意时间' },
];

export default function HomeScreen() {
  const router = useSafeRouter();
  const { userId } = useUser();
  const [records, setRecords] = useState<DietRecord[]>([]);
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [mealModalVisible, setMealModalVisible] = useState(false);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [recordsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/records?user_id=${userId}&date=${selectedDate}`),
        fetch(`${API_BASE}/api/v1/stats/daily?user_id=${userId}&date=${selectedDate}`),
      ]);
      const recordsData = await recordsRes.json();
      const statsData = await statsRes.json();
      setRecords(Array.isArray(recordsData) ? recordsData : []);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, selectedDate]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleDeleteRecord = async (id: number, calorie: number) => {
    try {
      await fetch(`${API_BASE}/api/v1/records/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  const handleAddFood = (mealType: string) => {
    setMealModalVisible(false);
    router.push('/search-food', { mealType, date: selectedDate });
  };

  const getMealRecords = (mealType: string) => {
    return records.filter((r) => r.meal_type === mealType);
  };

  const getMealCalorie = (mealType: string) => {
    return getMealRecords(mealType).reduce((sum, r) => sum + r.calorie, 0);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) return '今天';
    if (dateStr === yesterday.toISOString().split('T')[0]) return '昨天';
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  return (
    <Screen>
      <View style={styles.container}>
        {/* Date Selector */}
        <View style={styles.dateSelector}>
          <TouchableOpacity onPress={() => changeDate(-1)}>
            <Text style={styles.dateArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          <TouchableOpacity onPress={() => changeDate(1)}>
            <Text style={styles.dateArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Calorie Ring */}
        <View style={styles.ringContainer}>
          <CalorieRing
            consumed={stats?.total_calorie || 0}
            goal={stats?.daily_calorie_goal || 1800}
            size={180}
          />
        </View>

        {/* Macro Summary */}
        <View style={styles.macroSummary}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>
              {((stats?.total_carb || 0) / (stats?.daily_carb_goal || 1) * 100).toFixed(0)}%
            </Text>
            <Text style={styles.macroLabel}>碳水</Text>
            <Text style={styles.macroSub}>
              {(stats?.total_carb || 0).toFixed(0)}/{stats?.daily_carb_goal || 250}g
            </Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>
              {((stats?.total_protein || 0) / (stats?.daily_protein_goal || 1) * 100).toFixed(0)}%
            </Text>
            <Text style={styles.macroLabel}>蛋白质</Text>
            <Text style={styles.macroSub}>
              {(stats?.total_protein || 0).toFixed(0)}/{stats?.daily_protein_goal || 80}g
            </Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>
              {((stats?.total_fat || 0) / (stats?.daily_fat_goal || 1) * 100).toFixed(0)}%
            </Text>
            <Text style={styles.macroLabel}>脂肪</Text>
            <Text style={styles.macroSub}>
              {(stats?.total_fat || 0).toFixed(0)}/{stats?.daily_fat_goal || 60}g
            </Text>
          </View>
        </View>

        {/* Add Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setMealModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ 添加食物</Text>
        </TouchableOpacity>

        {/* Meal Sections */}
        <ScrollView style={styles.mealList} showsVerticalScrollIndicator={false}>
          {MEAL_TYPES.map((meal) => {
            const mealRecords = getMealRecords(meal.key);
            const mealCalorie = getMealCalorie(meal.key);
            return (
              <View key={meal.key} style={styles.mealSection}>
                <TouchableOpacity
                  style={styles.mealHeader}
                  onPress={() => handleAddFood(meal.key)}
                >
                  <View style={styles.mealTitleRow}>
                    <Ionicons name={meal.icon as any} size={18} color="#10B981" style={{ marginRight: 8 }} />
                    <Text style={styles.mealTitle}>{meal.label}</Text>
                    <Text style={styles.mealTime}>{meal.time}</Text>
                  </View>
                  <View style={styles.mealStatsRow}>
                    <Text style={styles.mealCalorie}>{mealCalorie} 千卡</Text>
                    <Text style={styles.mealAdd}>+ 添加</Text>
                  </View>
                </TouchableOpacity>

                {mealRecords.map((record) => (
                  <View key={record.id} style={styles.recordItem}>
                    <View style={styles.recordInfo}>
                      <Text style={styles.recordName}>{record.food_name}</Text>
                      <Text style={styles.recordDetail}>
                        {record.serving_amount}{record.serving_unit} · {record.calorie}千卡
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteRecord(record.id, record.calorie)}
                    >
                      <Text style={styles.deleteBtn}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            );
          })}
          <View style={{ height: 30 }} />
        </ScrollView>

        {/* Meal Type Selection Modal */}
        <Modal
          visible={mealModalVisible}
          animationType="fade"
          transparent
          onRequestClose={() => setMealModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setMealModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>添加到哪一餐？</Text>
              <View style={styles.mealGrid}>
                {MEAL_TYPES.map((meal) => (
                  <TouchableOpacity
                    key={meal.key}
                    style={styles.mealOption}
                    onPress={() => handleAddFood(meal.key)}
                  >
                    <Ionicons name={meal.icon as any} size={32} color="#10B981" style={{ marginBottom: 8 }} />
                    <Text style={styles.mealOptionLabel}>{meal.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setMealModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#10B981" />
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    gap: 20,
  },
  dateArrow: {
    fontSize: 28,
    color: '#10B981',
    fontWeight: '300',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    minWidth: 80,
    textAlign: 'center',
  },
  ringContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
  },
  macroSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  macroLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  macroSub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#10B981',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mealList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mealSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  mealHeader: {
    padding: 14,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  mealIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  mealTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  mealStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealCalorie: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  mealAdd: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '500',
  },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  recordInfo: {
    flex: 1,
  },
  recordName: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 2,
  },
  recordDetail: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  deleteBtn: {
    fontSize: 24,
    color: '#D1D5DB',
    paddingHorizontal: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20,
  },
  mealGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  mealOption: {
    width: '48%',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  mealOptionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  mealOptionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  modalCancel: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
});
