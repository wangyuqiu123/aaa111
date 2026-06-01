import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { useUser } from '@/contexts/UserContext';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';

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

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

export default function SearchFoodScreen() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ mealType?: string; date?: string }>();
  
  const { userId, loading: userLoading } = useUser();
  
  const [foods, setFoods] = useState<UserFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFood, setSelectedFood] = useState<UserFood | null>(null);
  const [amount, setAmount] = useState(1);
  
  const mealType = params.mealType || 'snack';
  const recordDate = params.date || new Date().toISOString().split('T')[0];

  // 获取食材列表
  const fetchFoodsList = useCallback(async () => {
    if (!userId) {
      console.log('User not ready yet, skipping fetch');
      return;
    }

    console.log('Fetching foods for user:', userId);
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/api/v1/user-foods?user_id=${userId}`);
      console.log('Foods response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Foods data:', data);
        setFoods(Array.isArray(data) ? data : []);
      } else {
        console.log('Failed to fetch foods, status:', response.status);
        setFoods([]);
      }
    } catch (err) {
      console.error('Error fetching foods:', err);
      setFoods([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // 页面加载时获取食材
  useEffect(() => {
    if (userId && !userLoading) {
      fetchFoodsList();
    }
  }, [userId, userLoading, fetchFoodsList]);

  // 计算营养
  const calculateNutrition = (food: UserFood, amt: number) => {
    return {
      calorie: Math.round(food.calorie * amt),
      carb: (food.carb * amt).toFixed(1),
      protein: (food.protein * amt).toFixed(1),
      fat: (food.fat * amt).toFixed(1),
    };
  };

  // 步进器
  const handleDecrease = () => {
    setAmount(prev => Math.max(1, prev - 1));
  };

  const handleIncrease = () => {
    setAmount(prev => prev + 1);
  };

  // 选中食材
  const handleSelectFood = (food: UserFood) => {
    setSelectedFood(food);
    setAmount(1);
  };

  // 确认添加
  const handleAddFood = async () => {
    if (!selectedFood) {
      Alert.alert('提示', '请先选择一个食材');
      return;
    }

    if (!userId) {
      Alert.alert('提示', '用户未初始化');
      return;
    }

    const nutrition = calculateNutrition(selectedFood, amount);
    setSubmitting(true);

    try {
      console.log('Adding food record:', {
        user_id: userId,
        food_id: selectedFood.id,
        food_name: selectedFood.name,
        meal_type: mealType,
        calorie: nutrition.calorie,
        serving_amount: amount,
        record_date: recordDate,
      });

      const response = await fetch(`${API_BASE}/api/v1/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          food_id: selectedFood.id,
          food_name: selectedFood.name,
          meal_type: mealType,
          calorie: nutrition.calorie,
          carb: parseFloat(nutrition.carb),
          protein: parseFloat(nutrition.protein),
          fat: parseFloat(nutrition.fat),
          serving_amount: amount,
          serving_unit: selectedFood.serving_unit,
          record_date: recordDate,
        }),
      });

      const result = await response.json();
      console.log('Add food result:', result);

      if (response.ok) {
        Alert.alert('成功', '饮食记录已添加', [
          {
            text: '确定',
            onPress: () => {
              setSelectedFood(null);
              setAmount(1);
              router.back();
            },
          },
        ]);
      } else {
        Alert.alert('错误', result.error || '添加失败');
      }
    } catch (err) {
      console.error('Error adding food:', err);
      Alert.alert('错误', '网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const renderFoodItem = ({ item }: { item: UserFood }) => {
    const isSelected = selectedFood?.id === item.id;
    
    return (
      <TouchableOpacity
        style={[styles.foodItem, isSelected && styles.foodItemSelected]}
        onPress={() => handleSelectFood(item)}
        activeOpacity={0.7}
      >
        <View style={styles.foodInfo}>
          <Text style={[styles.foodName, isSelected && styles.foodNameSelected]}>
            {item.name}
          </Text>
          <Text style={styles.foodDetail}>
            {item.calorie}千卡 · {item.serving_unit || '份'}
          </Text>
        </View>
        {isSelected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const selectedNutrition = selectedFood ? calculateNutrition(selectedFood, amount) : null;

  return (
    <Screen>
      <View style={styles.container}>
        {/* 标题 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>返回</Text>
          </TouchableOpacity>
          <Text style={styles.title}>选择食材</Text>
          <View style={styles.placeholder} />
        </View>

        {/* 食材列表 */}
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        ) : foods.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>食材库为空</Text>
            <Text style={styles.emptyHint}>请先在"我的食材库"中添加食材</Text>
          </View>
        ) : (
          <FlatList
            data={foods}
            renderItem={renderFoodItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* 选中食材信息 */}
        {selectedFood && selectedNutrition && (
          <View style={styles.selectedInfo}>
            <View style={styles.selectedHeader}>
              <Text style={styles.selectedTitle}>已选：{selectedFood.name}</Text>
            </View>
            
            {/* 分量步进器 */}
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>份量：</Text>
              <View style={styles.stepper}>
                <TouchableOpacity 
                  style={[styles.stepperBtn, amount <= 1 && styles.stepperBtnDisabled]}
                  onPress={handleDecrease}
                  disabled={amount <= 1}
                >
                  <Text style={styles.stepperBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.amountValue}>{amount}</Text>
                <TouchableOpacity 
                  style={styles.stepperBtn}
                  onPress={handleIncrease}
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.unitText}>{selectedFood.serving_unit || '份'}</Text>
            </View>

            {/* 营养预览 */}
            <View style={styles.nutritionPreview}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{selectedNutrition.calorie}</Text>
                <Text style={styles.nutritionLabel}>千卡</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{selectedNutrition.carb}g</Text>
                <Text style={styles.nutritionLabel}>碳水</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{selectedNutrition.protein}g</Text>
                <Text style={styles.nutritionLabel}>蛋白</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{selectedNutrition.fat}g</Text>
                <Text style={styles.nutritionLabel}>脂肪</Text>
              </View>
            </View>

            {/* 确认按钮 */}
            <TouchableOpacity
              style={[styles.addButton, submitting && styles.addButtonDisabled]}
              onPress={handleAddFood}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.addButtonText}>确认添加</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    padding: 8,
  },
  backBtnText: {
    fontSize: 16,
    color: '#10B981',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 50,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyHint: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
  },
  listContent: {
    padding: 16,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  foodItemSelected: {
    borderWidth: 2,
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  foodNameSelected: {
    color: '#10B981',
  },
  foodDetail: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectedInfo: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedHeader: {
    marginBottom: 16,
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 15,
    color: '#4B5563',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  stepperBtnText: {
    fontSize: 24,
    color: '#10B981',
    fontWeight: 'bold',
  },
  amountValue: {
    minWidth: 40,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  unitText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#6B7280',
  },
  nutritionPreview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
    fontWeight: 'bold',
    color: '#1F2937',
  },
  nutritionLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  addButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
