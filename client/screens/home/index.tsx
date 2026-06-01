import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { CalorieRing, NutritionBar, MealSection, DateSelector } from '@/components/common';
import { useUser } from '@/contexts/UserContext';
import { api, DietRecord, DailySummary, MealType, getToday, formatDateDisplay, MEAL_TYPES } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { useSafeRouter as useRouter } from '@/hooks/useSafeRouter';

export default function HomeScreen() {
  const { user, refreshUser } = useUser();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [records, setRecords] = useState<DietRecord[]>([]);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [recordsData, summaryData] = await Promise.all([
        api.getDietRecords({ user_id: user.id, date: selectedDate }),
        api.getDietSummary(user.id, selectedDate),
      ]);
      setRecords(recordsData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, selectedDate, refreshUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), refreshUser()]);
    setRefreshing(false);
  };

  const handleDeleteRecord = async (record: DietRecord) => {
    if (!record.id) return;
    
    Alert.alert(
      '删除确认',
      `确定要删除"${record.food_name}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteDietRecord(record.id!);
              fetchData();
            } catch (error) {
              Alert.alert('错误', '删除失败');
            }
          },
        },
      ]
    );
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

  const totals = summary?.totals || { total_calorie: 0, total_carb: 0, total_protein: 0, total_fat: 0 };
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

        {/* Quick Add Button */}
        <TouchableOpacity 
          style={styles.quickAddButton}
          onPress={() => router.push('/search-food?date=' + selectedDate)}
        >
          <Ionicons name="add-circle" size={24} color="#FFFFFF" />
          <Text style={styles.quickAddText}>快速添加食物</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
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
