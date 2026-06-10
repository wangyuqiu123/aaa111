import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { CalorieRing, NutritionBar, MealSection } from '@/components/common';
import { useUser } from '@/contexts/UserContext';
import { api, DietRecord, MealType, getToday, formatDateDisplay, MEAL_TYPES } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';

export default function HomeScreen() {
  const { user, refreshUser } = useUser();
  const router = useSafeRouter();
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [records, setRecords] = useState<DietRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // 按日期缓存数据，避免频繁切换时重复请求
  const cacheRef = useRef<Record<string, DietRecord[]>>({});

  // 核心加载函数：优先用缓存，后台静默刷新
  const fetchDateData = useCallback(async (date: string, showLoading = false) => {
    if (!user) return;

    const cached = cacheRef.current[date];
    if (cached && !showLoading) {
      // 有缓存：先直接展示，后台刷新
      if (date === selectedDate) setRecords(cached);
      try {
        const data = await api.getDietRecords({ user_id: user.id, date });
        cacheRef.current[date] = data;
        if (date === selectedDate) setRecords(data);
      } catch { /* 静默失败，缓存数据兜底 */ }
      return;
    }

    // 无缓存：显示加载动画，等待请求
    if (date === selectedDate) setLoading(true);
    try {
      const data = await api.getDietRecords({ user_id: user.id, date });
      cacheRef.current[date] = data;
      if (date === selectedDate) setRecords(data);
    } catch (error) {
      console.error('[Home] Error:', error);
    } finally {
      if (date === selectedDate) setLoading(false);
    }
  }, [user, selectedDate]);

  // 日期切换：有缓存直接用，没缓存再请求（也不显示 loading）
  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
    const cached = cacheRef.current[date];
    if (cached) setRecords(cached);
    fetchDateData(date);
  }, [fetchDateData]);

  // 页面返回时刷新当前日期的数据
  useFocusEffect(useCallback(() => { fetchDateData(selectedDate); }, [fetchDateData, selectedDate]));

  // 首次进入加载（显示 loading）
  useEffect(() => { fetchDateData(selectedDate, true); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = async () => {
    setRefreshing(true);
    cacheRef.current = {};
    await Promise.all([fetchDateData(selectedDate, true), refreshUser()]);
    setRefreshing(false);
  };

  const handleDeleteRecord = async (record: DietRecord) => {
    if (!record.id) return;
    const updated = records.filter((r) => r.id !== record.id);
    setRecords(updated);
    cacheRef.current[selectedDate] = updated;
    try {
      await api.deleteDietRecord(record.id!);
    } catch (error) {
      console.error('[Home] Delete failed:', error);
      fetchDateData(selectedDate, true);
    }
  };

  const handleAddFood = (mealType: MealType) => {
    router.push('/search-food', { mealType, date: selectedDate });
  };

  // 按餐食类型分组记录
  const getRecordsByMeal = (mealType: MealType) => {
    return records.filter(r => r.meal_type === mealType);
  };

  const getMealCalorie = (mealType: MealType) => {
    const mealRecords = getRecordsByMeal(mealType);
    return mealRecords.reduce((sum, r) => sum + r.calorie, 0);
  };

  // 计算总营养
  const totals = records.reduce(
    (acc, r) => ({
      total_calorie: acc.total_calorie + r.calorie,
      total_carb: acc.total_carb + (r.carb || 0),
      total_protein: acc.total_protein + (r.protein || 0),
      total_fat: acc.total_fat + (r.fat || 0),
    }),
    { total_calorie: 0, total_carb: 0, total_protein: 0, total_fat: 0 }
  );

  const goal = user?.daily_calorie_goal || 1800;

  return (
    <Screen style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>今日饮食</Text>
            <Text style={styles.subGreeting}>
              {selectedDate === getToday() ? '今天' : formatDateDisplay(selectedDate)}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="person-circle" size={36} color="#10B981" />
          </TouchableOpacity>
        </View>

        {/* Date Selector */}
        <DateSelector 
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        {/* Calorie Overview Card */}
        <View style={styles.calorieCard}>
          <View style={styles.calorieContent}>
            <CalorieRing 
              consumed={totals.total_calorie}
              goal={goal}
              size={180}
            />
            <View style={styles.nutritionRings}>
              <View style={styles.nutritionItem}>
                <View style={styles.nutritionDot} />
                <Text style={styles.nutritionLabel}>碳水</Text>
                <Text style={styles.nutritionValue}>{totals.total_carb.toFixed(1)}g</Text>
              </View>
              <View style={styles.nutritionItem}>
                <View style={[styles.nutritionDot, { backgroundColor: '#6366F1' }]} />
                <Text style={styles.nutritionLabel}>蛋白质</Text>
                <Text style={styles.nutritionValue}>{totals.total_protein.toFixed(1)}g</Text>
              </View>
              <View style={styles.nutritionItem}>
                <View style={[styles.nutritionDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.nutritionLabel}>脂肪</Text>
                <Text style={styles.nutritionValue}>{totals.total_fat.toFixed(1)}g</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Nutrition Progress Bars */}
        <View style={styles.nutritionCard}>
          <Text style={styles.sectionTitle}>营养摄入</Text>
          <NutritionBar 
            label="碳水化合物" 
            current={totals.total_carb} 
            goal={user?.daily_carb_goal || 250}
            color="#10B981"
          />
          <NutritionBar 
            label="蛋白质" 
            current={totals.total_protein} 
            goal={user?.daily_protein_goal || 80}
            color="#6366F1"
          />
          <NutritionBar 
            label="脂肪" 
            current={totals.total_fat} 
            goal={user?.daily_fat_goal || 60}
            color="#F59E0B"
          />
        </View>

        {/* Meal Sections */}
        <View style={styles.mealsSection}>
          <Text style={styles.sectionTitle}>今日饮食</Text>
          {MEAL_TYPES.map(meal => (
            <MealSection
              key={meal.key}
              mealType={meal.key}
              label={meal.label}
              records={getRecordsByMeal(meal.key)}
              totalCalorie={getMealCalorie(meal.key)}
              onAddFood={() => handleAddFood(meal.key)}
              onDeleteRecord={handleDeleteRecord}
            />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  );
}

// Date Selector Component
interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    return {
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      day: date.getDate(),
      weekday: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
      isToday: i === 0,
    };
  });

  return (
    <View style={styles.dateSelector}>
      {dates.map((item) => {
        const isSelected = item.date === selectedDate;
        return (
          <TouchableOpacity
            key={item.date}
            style={[
              styles.dateItem,
              isSelected && styles.dateItemSelected,
              item.isToday && !isSelected && styles.dateItemToday,
            ]}
            onPress={() => onDateChange(item.date)}
          >
            <Text style={[
              styles.dateWeekday,
              isSelected && styles.dateTextSelected,
            ]}>
              {item.weekday}
            </Text>
            <Text style={[
              styles.dateDay,
              isSelected && styles.dateDaySelected,
            ]}>
              {item.day}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subGreeting: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  profileButton: {
    padding: 4,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  dateItemSelected: {
    backgroundColor: '#10B981',
  },
  dateItemToday: {
    borderWidth: 1,
    borderColor: '#10B981',
  },
  dateWeekday: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  dateDay: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  dateTextSelected: {
    color: '#FFFFFF',
  },
  dateDaySelected: {
    color: '#FFFFFF',
  },
  calorieCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    margin: 16,
    padding: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  calorieContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nutritionRings: {
    flex: 1,
    marginLeft: 20,
  },
  nutritionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nutritionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  nutritionLabel: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  nutritionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  mealsSection: {
    paddingHorizontal: 16,
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  quickAddText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
