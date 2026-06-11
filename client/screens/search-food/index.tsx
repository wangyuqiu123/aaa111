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
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { api, MealType, DietRecord } from '@/utils/api';
import { useUser } from '@/contexts/UserContext';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

const CATEGORIES = ['代餐类', '外卖轻食类', '水煮轻食类'];

interface UserFood {
  id: number;
  user_id: number;
  name: string;
  category: string;
  calorie: number;
  carb: number;
  protein: number;
  fat: number;
  serving_unit: string;
  serving_amount: number;
  created_at: string;
}

interface AddedItem {
  foodName: string;
  calorie: number;
  servingAmount: number;
  servingUnit: string;
}

export default function SearchFoodScreen() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ mealType?: MealType; date?: string }>();
  const { userId } = useUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [foods, setFoods] = useState<UserFood[]>([]);
  const [allFoods, setAllFoods] = useState<UserFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<UserFood | null>(null);
  const [servingAmount, setServingAmount] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeCategory, setActiveCategory] = useState('全部');

  // 当前批次已添加的食物列表
  const [addedItems, setAddedItems] = useState<AddedItem[]>([]);
  // 正在添加中（避免重复点击）
  const [adding, setAdding] = useState(false);

  const mealType = params.mealType || 'snack';
  const recordDate = params.date || new Date().toISOString().split('T')[0];

  // 计算已添加的累计热量
  const addedTotalCalorie = addedItems.reduce((sum, item) => sum + item.calorie, 0);

  // 获取我的食材库
  const fetchFoods = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/user-foods?user_id=${userId}`);
      const data = await response.json();
      setFoods(data);
      setAllFoods(data);
    } catch (error) {
      console.error('Fetch foods error:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  // 防抖搜索 + 分类过滤
  useEffect(() => {
    const timer = setTimeout(() => {
      let filtered = allFoods;

      // 分类过滤
      if (activeCategory !== '全部') {
        filtered = filtered.filter(f => f.category === activeCategory);
      }

      // 搜索过滤
      if (searchQuery.trim()) {
        filtered = filtered.filter(food =>
          food.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setFoods(filtered);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, allFoods, activeCategory]);

  // 添加食物到记录（留在当前页）
  const handleAddToRecord = async () => {
    if (!selectedFood || !userId || adding) return;

    setAdding(true);
    try {
      const record = await api.addDietRecord({
        user_id: userId,
        meal_type: mealType,
        record_date: recordDate,
        food_name: selectedFood.name,
        calorie: Math.round(selectedFood.calorie * servingAmount),
        carb: Math.round(selectedFood.carb * servingAmount * 10) / 10,
        protein: Math.round(selectedFood.protein * servingAmount * 10) / 10,
        fat: Math.round(selectedFood.fat * servingAmount * 10) / 10,
        serving_amount: servingAmount,
        serving_unit: selectedFood.serving_unit || '份',
      });

      // 添加到本地已添加列表（合并同名食材）
      setAddedItems(prev => {
        const existingIndex = prev.findIndex(item => item.foodName === selectedFood.name);
        if (existingIndex >= 0) {
          // 同名食材：累加份数和热量
          const updated = [...prev];
          const existing = updated[existingIndex];
          updated[existingIndex] = {
            ...existing,
            servingAmount: existing.servingAmount + servingAmount,
            calorie: existing.calorie + Math.round(selectedFood.calorie * servingAmount),
          };
          return updated;
        }
        // 新食材：追加
        return [
          ...prev,
          {
            foodName: selectedFood.name,
            calorie: Math.round(selectedFood.calorie * servingAmount),
            servingAmount,
            servingUnit: selectedFood.serving_unit || '份',
          },
        ];
      });

      // 关闭弹窗
      setShowAddForm(false);
      setSelectedFood(null);
    } catch (error) {
      console.error('Add to record error:', error);
      Alert.alert('添加失败', '请重试');
    } finally {
      setAdding(false);
    }
  };

  // 完成添加，返回首页
  const handleFinish = () => {
    Keyboard.dismiss();
    router.back();
  };

  // 选择食物
  const handleSelectFood = (food: UserFood) => {
    setSelectedFood(food);
    setServingAmount(1);
    setShowAddForm(true);
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

  const renderFoodItem = ({ item }: { item: UserFood }) => (
    <TouchableOpacity
      style={styles.foodItem}
      onPress={() => handleSelectFood(item)}
    >
      <View style={styles.foodInfo}>
        <View style={styles.foodNameRow}>
          <Text style={styles.foodName}>{item.name}</Text>
          {item.category && item.category !== '其他' && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{item.category}</Text>
            </View>
          )}
        </View>
        <Text style={styles.foodMeta}>
          {item.serving_amount || 100}{item.serving_unit} · {item.calorie}千卡
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
        <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
          <Text style={styles.finishBtnText}>完成</Text>
        </TouchableOpacity>
      </View>

      {/* 餐食标签 */}
      <View style={styles.mealTag}>
        <Text style={styles.mealTagText}>添加到 {mealTypeLabel}</Text>
        <Text style={styles.dateText}>{recordDate}</Text>
      </View>

      {/* 已添加食物预览区 */}
      {addedItems.length > 0 && (
        <View style={styles.addedPreview}>
          <View style={styles.addedHeader}>
            <View style={styles.addedHeaderLeft}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.addedTitle}>
                已添加 {addedItems.length} 项
              </Text>
            </View>
            <Text style={styles.addedCalorie}>
              共 <Text style={styles.addedCalorieNum}>{addedTotalCalorie}</Text> 千卡
            </Text>
          </View>
          {addedItems.map((item, index) => (
            <View key={index} style={styles.addedItemRow}>
              <View style={styles.addedItemDot} />
              <Text style={styles.addedItemName} numberOfLines={1}>{item.foodName}</Text>
              <Text style={styles.addedItemServing}>×{item.servingAmount}{item.servingUnit}</Text>
              <Text style={styles.addedItemCalorie}>{item.calorie}千卡</Text>
            </View>
          ))}
        </View>
      )}

      {/* 分类 Tab */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['全部', ...CATEGORIES].map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.tab,
                activeCategory === cat && styles.tabActive,
              ]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeCategory === cat && styles.tabTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 搜索框 */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="搜索我的食材..."
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

      {/* 列表 */}
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
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>食材库为空</Text>
              <Text style={styles.emptyHint}>
                请先在「我的」→「食材管理」中添加食材
              </Text>
            </View>
          }
        />
      )}

      {/* 添加食物底部弹窗 */}
      <Modal
        visible={showAddForm && !!selectedFood}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddForm(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowAddForm(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalWrapper}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} disabled={Platform.OS === 'web'}>
            <View style={styles.bottomSheet}>
              <View style={styles.dragHandle} />

              {/* 食物信息头部 */}
              <View style={styles.sheetHeader}>
                <View style={styles.sheetHeaderLeft}>
                  <View style={styles.foodIconContainer}>
                    <Ionicons name="nutrition-outline" size={22} color="#10B981" />
                  </View>
                  <View style={styles.sheetTitleArea}>
                    <Text style={styles.sheetFoodName}>{selectedFood?.name}</Text>
                    <Text style={styles.sheetFoodMeta}>
                      每{selectedFood?.serving_amount || 100}{selectedFood?.serving_unit} · {selectedFood?.calorie}千卡
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setShowAddForm(false)} style={styles.sheetCloseBtn}>
                  <Ionicons name="close" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {/* 份数调节 */}
              <View style={styles.sheetSection}>
                <View style={styles.servingRow}>
                  <Text style={styles.servingLabel}>份数</Text>
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      style={[styles.stepperBtn, servingAmount <= 1 && styles.stepperBtnDisabled]}
                      onPress={() => setServingAmount(Math.max(1, servingAmount - 1))}
                      disabled={servingAmount <= 1}
                    >
                      <Ionicons name="remove" size={18} color={servingAmount <= 1 ? '#D1D5DB' : '#10B981'} />
                    </TouchableOpacity>
                    <Text style={styles.stepperValue}>{servingAmount}</Text>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => setServingAmount(servingAmount + 1)}
                    >
                      <Ionicons name="add" size={18} color="#10B981" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* 营养素迷你展示 */}
              <View style={styles.miniNutritionRow}>
                <View style={styles.miniNutritionItem}>
                  <Text style={styles.miniNutritionValue}>{getNutrientWithServing(selectedFood?.calorie || 0)}</Text>
                  <Text style={styles.miniNutritionUnit}>千卡</Text>
                </View>
                <View style={styles.miniDivider} />
                <View style={styles.miniNutritionItem}>
                  <Text style={styles.miniNutritionValue}>{getNutrientWithServing(selectedFood?.carb || 0)}g</Text>
                  <Text style={styles.miniNutritionUnit}>碳水</Text>
                </View>
                <View style={styles.miniDivider} />
                <View style={styles.miniNutritionItem}>
                  <Text style={styles.miniNutritionValue}>{getNutrientWithServing(selectedFood?.protein || 0)}g</Text>
                  <Text style={styles.miniNutritionUnit}>蛋白</Text>
                </View>
                <View style={styles.miniDivider} />
                <View style={styles.miniNutritionItem}>
                  <Text style={styles.miniNutritionValue}>{getNutrientWithServing(selectedFood?.fat || 0)}g</Text>
                  <Text style={styles.miniNutritionUnit}>脂肪</Text>
                </View>
              </View>

              {/* 添加到记录按钮 */}
              <TouchableOpacity
                style={[styles.sheetAddButton, adding && styles.sheetAddButtonDisabled]}
                onPress={handleAddToRecord}
                disabled={adding}
              >
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.sheetAddButtonText}>
                  {adding ? '添加中...' : '添加到今日' + mealTypeLabel}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
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
  finishBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  finishBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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
  // ========== 分类 Tab ==========
  tabContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  tabActive: {
    backgroundColor: '#10B981',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // ========== 已添加预览区 ==========
  addedPreview: {
    backgroundColor: '#F0FDF4',
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  addedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  addedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
  },
  addedCalorie: {
    fontSize: 13,
    color: '#065F46',
  },
  addedCalorieNum: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  addedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  addedItemDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  addedItemName: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
  },
  addedItemServing: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 8,
  },
  addedItemCalorie: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    minWidth: 50,
    textAlign: 'right',
  },
  // ========== 搜索框 ==========
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
  foodNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  foodName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  categoryBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '500',
    color: '#059669',
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
  // ========== 底部弹窗 ==========
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  foodIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sheetTitleArea: {
    flex: 1,
  },
  sheetFoodName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  sheetFoodMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 16,
  },
  sheetSection: {
    marginBottom: 16,
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
  miniNutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  miniNutritionItem: {
    alignItems: 'center',
    flex: 1,
  },
  miniNutritionValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  miniNutritionUnit: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  miniDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E7EB',
  },
  sheetAddButton: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  sheetAddButtonDisabled: {
    opacity: 0.6,
  },
  sheetAddButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});