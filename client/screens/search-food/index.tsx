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

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

interface UserFood {
  id: number;
  user_id: number;
  name: string;
  calorie: number;
  carb: number;
  protein: number;
  fat: number;
  serving_unit: string;
  serving_gram: number;
  created_at: string;
}

type TabType = 'preset' | 'my';

export default function SearchFoodScreen() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ mealType?: MealType; date?: string }>();
  const { userId } = useUser();

  const [activeTab, setActiveTab] = useState<TabType>('preset');
  const [searchQuery, setSearchQuery] = useState('');
  const [presetFoods, setPresetFoods] = useState<Food[]>([]);
  const [myFoods, setMyFoods] = useState<UserFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | UserFood | null>(null);
  const [servingAmount, setServingAmount] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);

  const mealType = params.mealType || 'snack';
  const recordDate = params.date || new Date().toISOString().split('T')[0];

  // 获取预置食物
  const searchPresetFoods = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const result = await api.getFoods({ search: query, limit: 50 });
      setPresetFoods(result);
    } catch (error) {
      console.error('Search preset foods error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取我的食材库
  const fetchMyFoods = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/user-foods?user_id=${userId}`);
      const data = await response.json();
      setMyFoods(data);
    } catch (error) {
      console.error('Fetch my foods error:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // 搜索我的食材库（本地过滤）
  const searchMyFoods = (query: string) => {
    if (!query.trim()) {
      fetchMyFoods();
      return;
    }
    const filtered = myFoods.filter(food =>
      food.name.toLowerCase().includes(query.toLowerCase())
    );
    setMyFoods(filtered);
  };

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'preset') {
        searchPresetFoods(searchQuery);
      } else {
        searchMyFoods(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, searchPresetFoods]);

  // 切换标签时加载数据
  useEffect(() => {
    if (activeTab === 'my') {
      fetchMyFoods();
    } else {
      searchPresetFoods(searchQuery);
    }
  }, [activeTab]);

  // 添加食物到记录
  const handleAddToRecord = async () => {
    if (!selectedFood || !userId) return;

    try {
      let foodData;
      
      // 判断是预置食物还是自定义食物
      const isPreset = 'serving_size' in selectedFood;
      
      if (isPreset) {
        // 预置食物
        const preset = selectedFood as Food;
        foodData = {
          food_id: preset.id,
          food_name: preset.name,
          calorie: Math.round(preset.calorie * servingAmount),
          carb: Math.round((preset.carb || 0) * servingAmount * 10) / 10,
          protein: Math.round((preset.protein || 0) * servingAmount * 10) / 10,
          fat: Math.round((preset.fat || 0) * servingAmount * 10) / 10,
          serving_amount: servingAmount,
          serving_unit: preset.serving_size || '份',
        };
      } else {
        // 自定义食物
        const userFood = selectedFood as UserFood;
        foodData = {
          food_name: userFood.name,
          calorie: Math.round(userFood.calorie * servingAmount),
          carb: Math.round(userFood.carb * servingAmount * 10) / 10,
          protein: Math.round(userFood.protein * servingAmount * 10) / 10,
          fat: Math.round(userFood.fat * servingAmount * 10) / 10,
          serving_amount: servingAmount,
          serving_unit: userFood.serving_unit || '份',
        };
      }

      await api.addDietRecord({
        user_id: userId,
        meal_type: mealType,
        record_date: recordDate,
        ...foodData,
      });

      Keyboard.dismiss();
      router.back();
    } catch (error) {
      console.error('Add to record error:', error);
    }
  };

  // 选择食物
  const handleSelectFood = (food: Food | UserFood) => {
    setSelectedFood(food);
    setServingAmount(1);
    setShowAddForm(true);
  };

  // 获取食物名称
  const getFoodName = (food: Food | UserFood): string => {
    return food.name;
  };

  // 获取食物热量
  const getFoodCalorie = (food: Food | UserFood): number => {
    return food.calorie;
  };

  // 获取份量信息
  const getFoodServing = (food: Food | UserFood): string => {
    if ('serving_size' in food) {
      return (food as Food).serving_size || `${(food as Food).serving_gram || 100}g`;
    }
    return `${(food as UserFood).serving_gram || 100}${(food as UserFood).serving_unit}`;
  };

  // 计算营养素（根据份数）
  const getNutrientWithServing = (value: number) => {
    return Math.round(value * servingAmount * 10) / 10;
  };

  const mealTypeLabelMap: Record<string, string> = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    snack: '加餐',
  };
  const mealTypeLabel = mealTypeLabelMap[mealType] || '加餐';

  const renderFoodItem = ({ item }: { item: Food | UserFood }) => (
    <TouchableOpacity
      style={styles.foodItem}
      onPress={() => handleSelectFood(item)}
    >
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{getFoodName(item)}</Text>
        <Text style={styles.foodMeta}>
          {getFoodServing(item)} · {getFoodCalorie(item)}千卡
        </Text>
      </View>
      <Ionicons name="add-circle" size={28} color="#10B981" />
    </TouchableOpacity>
  );

  return (
    <Screen>
      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>添加食物</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 餐食标签 */}
      <View style={styles.mealTag}>
        <Text style={styles.mealTagText}>添加到 {mealTypeLabel}</Text>
        <Text style={styles.dateText}>{recordDate}</Text>
      </View>

      {/* 标签切换 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'preset' && styles.tabActive]}
          onPress={() => {
            setActiveTab('preset');
            setShowAddForm(false);
            setSelectedFood(null);
          }}
        >
          <Text style={[styles.tabText, activeTab === 'preset' && styles.tabTextActive]}>
            食物库
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.tabActive]}
          onPress={() => {
            setActiveTab('my');
            setShowAddForm(false);
            setSelectedFood(null);
          }}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>
            我的食材库
          </Text>
        </TouchableOpacity>
      </View>

      {/* 搜索框 */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={activeTab === 'preset' ? "搜索食物名称..." : "搜索我的食材..."}
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
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
            <View>
              <Text style={styles.selectedFoodName}>{getFoodName(selectedFood)}</Text>
              <Text style={styles.selectedFoodMeta}>
                每{getFoodServing(selectedFood)} · {getFoodCalorie(selectedFood)}千卡
              </Text>
            </View>
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
              <Text style={styles.nutritionValue}>{getNutrientWithServing(getFoodCalorie(selectedFood))}</Text>
              <Text style={styles.nutritionLabel}>千卡</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{getNutrientWithServing('serving_size' in selectedFood ? ((selectedFood as Food).carb || 0) : ((selectedFood as UserFood).carb || 0))}g</Text>
              <Text style={styles.nutritionLabel}>碳水</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{getNutrientWithServing('serving_size' in selectedFood ? ((selectedFood as Food).protein || 0) : ((selectedFood as UserFood).protein || 0))}g</Text>
              <Text style={styles.nutritionLabel}>蛋白质</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{getNutrientWithServing('serving_size' in selectedFood ? ((selectedFood as Food).fat || 0) : ((selectedFood as UserFood).fat || 0))}g</Text>
              <Text style={styles.nutritionLabel}>脂肪</Text>
            </View>
          </View>

          {/* 添加按钮 */}
          <TouchableOpacity style={styles.addButton} onPress={handleAddToRecord}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>添加到今日{mealTypeLabel}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 列表 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'preset' ? presetFoods : myFoods}
          renderItem={renderFoodItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                {activeTab === 'preset' ? '未找到相关食物' : '我的食材库为空'}
              </Text>
              {activeTab === 'my' && (
                <Text style={styles.emptyHint}>
                  请先在「我的」→「食材管理」中添加食材
                </Text>
              )}
            </View>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#10B981',
  },
  tabText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#10B981',
    fontWeight: '600',
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
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
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
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  selectedFoodName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  selectedFoodMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
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
    flexDirection: 'row',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
