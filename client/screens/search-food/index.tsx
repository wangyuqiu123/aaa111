import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { api, Food, MealType } from '@/utils/api';
import { useUser } from '@/contexts/UserContext';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Ionicons } from '@expo/vector-icons';

export default function SearchFoodScreen() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ mealType?: MealType; date?: string }>();
  const { user } = useUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [servingAmount, setServingAmount] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);

  const mealType = params.mealType || 'snack';
  const recordDate = params.date || new Date().toISOString().split('T')[0];

  // 搜索食物
  const searchFoods = useCallback(async (query: string) => {
    if (!query.trim()) {
      setFoods([]);
      return;
    }
    
    setLoading(true);
    try {
      const result = await api.getFoods({ search: query, limit: 50 });
      setFoods(result);
    } catch (error) {
      console.error('Search foods error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      searchFoods(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchFoods]);

  // 添加食物到记录
  const handleAddToRecord = async () => {
    if (!selectedFood || !user?.id) return;

    try {
      const serving = selectedFood.serving_gram || 100;
      const multiplier = servingAmount;

      await api.addDietRecord({
        user_id: user.id,
        food_id: selectedFood.id,
        food_name: selectedFood.name,
        meal_type: mealType,
        calorie: Math.round(selectedFood.calorie * multiplier),
        carb: Math.round(selectedFood.carb * multiplier * 10) / 10,
        protein: Math.round(selectedFood.protein * multiplier * 10) / 10,
        fat: Math.round(selectedFood.fat * multiplier * 10) / 10,
        serving_amount: servingAmount,
        serving_unit: selectedFood.serving_size || '份',
        record_date: recordDate,
      });

      Keyboard.dismiss();
      router.back();
    } catch (error) {
      console.error('Add to record error:', error);
    }
  };

  // 选择食物
  const handleSelectFood = (food: Food) => {
    setSelectedFood(food);
    setServingAmount(1);
    setShowAddForm(true);
  };

  // 计算营养素（根据份数）
  const getNutrientWithServing = (value: number) => {
    if (!selectedFood) return 0;
    const baseServing = selectedFood.serving_gram || 100;
    return Math.round(value * servingAmount * 10) / 10;
  };

  const renderFoodItem = ({ item }: { item: Food }) => (
    <TouchableOpacity
      style={styles.foodItem}
      onPress={() => handleSelectFood(item)}
    >
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        <Text style={styles.foodMeta}>
          {item.serving_size || '100g'} · {item.calorie}千卡
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  const mealTypeLabelMap: Record<string, string> = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    snack: '加餐',
  };
  const mealTypeLabel = mealTypeLabelMap[mealType] || '加餐';

  return (
    <Screen>
      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>搜索食物</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 餐食标签 */}
      <View style={styles.mealTag}>
        <Text style={styles.mealTagText}>添加到 {mealTypeLabel}</Text>
        <Text style={styles.dateText}>{recordDate}</Text>
      </View>

      {/* 搜索框 */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="搜索食物名称..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* 添加表单 */}
      {showAddForm && selectedFood && (
        <View style={styles.addForm}>
          <View style={styles.selectedFoodHeader}>
            <Text style={styles.selectedFoodName}>{selectedFood.name}</Text>
            <TouchableOpacity onPress={() => setShowAddForm(false)}>
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* 份数调节 */}
          <View style={styles.servingRow}>
            <Text style={styles.servingLabel}>份数</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={[styles.stepperBtn, servingAmount <= 1 && styles.stepperBtnDisabled]}
                onPress={() => setServingAmount(Math.max(1, servingAmount - 1))}
                disabled={servingAmount <= 1}
              >
                <Ionicons name="remove" size={20} color={servingAmount <= 1 ? '#D1D5DB' : '#10B981'} />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{servingAmount}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setServingAmount(servingAmount + 1)}
              >
                <Ionicons name="add" size={20} color="#10B981" />
              </TouchableOpacity>
            </View>
          </View>

          {/* 营养素预览 */}
          <View style={styles.nutritionPreview}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{getNutrientWithServing(selectedFood.calorie)}</Text>
              <Text style={styles.nutritionLabel}>千卡</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{getNutrientWithServing(selectedFood.carb)}g</Text>
              <Text style={styles.nutritionLabel}>碳水</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{getNutrientWithServing(selectedFood.protein)}g</Text>
              <Text style={styles.nutritionLabel}>蛋白质</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{getNutrientWithServing(selectedFood.fat)}g</Text>
              <Text style={styles.nutritionLabel}>脂肪</Text>
            </View>
          </View>

          {/* 添加按钮 */}
          <TouchableOpacity style={styles.addButton} onPress={handleAddToRecord}>
            <Text style={styles.addButtonText}>添加到今日{mealTypeLabel}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 搜索结果 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : (
        <FlatList
          data={foods}
          renderItem={renderFoodItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            searchQuery.length > 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>未找到相关食物</Text>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => router.push('/add-food', {
                    name: searchQuery,
                    mealType,
                    date: recordDate,
                  })}
                >
                  <Ionicons name="add" size={20} color="#10B981" />
                  <Text style={styles.createButtonText}>创建&quot; {searchQuery} &quot;</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyHint}>输入食物名称开始搜索</Text>
              </View>
            )
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerRight: {
    width: 32,
  },
  mealTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F0FDF4',
    borderBottomWidth: 1,
    borderBottomColor: '#D1FAE5',
  },
  mealTagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  dateText: {
    fontSize: 12,
    color: '#059669',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  foodMeta: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 16,
  },
  emptyHint: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 20,
    borderStyle: 'dashed',
  },
  createButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  addForm: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedFoodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedFoodName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  servingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  servingLabel: {
    fontSize: 15,
    color: '#374151',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  stepperBtn: {
    padding: 10,
  },
  stepperBtnDisabled: {
    opacity: 0.5,
  },
  stepperValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 40,
    textAlign: 'center',
  },
  nutritionPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  addButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
