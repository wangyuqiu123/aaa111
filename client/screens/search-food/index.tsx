import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { useUser } from '@/contexts/UserContext';

// 默认后端地址，用于本地开发
const DEFAULT_API_BASE = 'http://localhost:9091';

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
}

export default function SearchFoodScreen() {
  const router = useSafeRouter();
  const { userId } = useUser();
  const params = useSafeSearchParams<{ mealType?: string; date?: string }>();
  const [foods, setFoods] = useState<UserFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFood, setSelectedFood] = useState<UserFood | null>(null);
  const [servingAmount, setServingAmount] = useState('1');

  const fetchFoods = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await fetch(`${DEFAULT_API_BASE}/api/v1/user-foods?user_id=${userId}`);
      const data = await response.json();
      setFoods(data);
    } catch (error) {
      console.error('Error fetching foods:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchFoods();
    }, [fetchFoods])
  );

  // Auto-calculate nutrition based on serving amount
  const calculateNutrition = (food: UserFood, amount: number) => {
    return {
      calorie: Math.round(food.calorie * amount),
      carb: (food.carb * amount).toFixed(1),
      protein: (food.protein * amount).toFixed(1),
      fat: (food.fat * amount).toFixed(1),
    };
  };

  const handleSelectFood = (food: UserFood) => {
    setSelectedFood(food);
    setServingAmount('1');
  };

  const handleAddFood = async () => {
    // 调试日志
    console.log('=== handleAddFood called ===');
    console.log('selectedFood:', selectedFood);
    console.log('userId:', userId);
    console.log('params:', params);
    console.log('servingAmount:', servingAmount);

    if (!selectedFood) {
      Alert.alert('提示', '请先选择一个食材');
      return;
    }

    if (!userId) {
      Alert.alert('错误', '用户未初始化，请重启应用');
      return;
    }

    // 获取参数，确保类型正确
    const mealType = String(params.mealType || 'snack');
    const recordDate = String(params.date || new Date().toISOString().split('T')[0]);

    const amount = parseFloat(servingAmount) || 1;
    const nutrition = calculateNutrition(selectedFood, amount);

    setSubmitting(true);
    try {
      console.log('=== Adding food to API ===');
      const response = await fetch(`${DEFAULT_API_BASE}/api/v1/records`, {
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
      console.log('API response:', result);

      if (response.ok) {
        Alert.alert('成功', `${selectedFood.name} 已添加（${amount}${selectedFood.serving_unit}）`, [
          { text: '确定', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('错误', result.message || '添加失败');
      }
    } catch (error) {
      console.error('Error adding food:', error);
      Alert.alert('错误', '添加失败，请检查网络连接');
    } finally {
      setSubmitting(false);
    }
  };

  const getMealName = (type: string) => {
    const names: Record<string, string> = {
      breakfast: '早餐',
      lunch: '午餐',
      dinner: '晚餐',
      snack: '加餐',
    };
    return names[type] || type;
  };

  const renderFoodItem = ({ item }: { item: UserFood }) => (
    <TouchableOpacity
      style={[
        styles.foodItem,
        selectedFood?.id === item.id && styles.foodItemSelected,
      ]}
      onPress={() => handleSelectFood(item)}
    >
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        <Text style={styles.foodUnit}>
          每{item.serving_unit} ({item.serving_gram}g)
        </Text>
      </View>
      <View style={styles.foodStats}>
        <Text style={styles.calorieText}>{item.calorie} 千卡</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Screen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>返回</Text>
          </TouchableOpacity>
          <Text style={styles.title}>选择食材</Text>
          <View style={{ width: 40 }} />
        </View>

        {foods.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>食材库为空</Text>
            <Text style={styles.emptySubtext}>请先在「我的」-「食材管理」中添加食材</Text>
          </View>
        ) : (
          <>
            {/* Food List */}
            <FlatList
              data={foods}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderFoodItem}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />

            {/* Selected Food & Amount Input */}
            {selectedFood && (
              <View style={styles.bottomSheet}>
                <View style={styles.selectedInfo}>
                  <Text style={styles.selectedName}>{selectedFood.name}</Text>
                  <Text style={styles.selectedBase}>
                    每{selectedFood.serving_unit} = {selectedFood.calorie} 千卡
                  </Text>
                </View>

                <View style={styles.amountSection}>
                  <Text style={styles.amountLabel}>份量（{selectedFood.serving_unit}）</Text>
                  <View style={styles.amountControls}>
                    <TouchableOpacity
                      style={styles.amountBtn}
                      onPress={() => {
                        const val = parseFloat(servingAmount) || 1;
                        if (val > 0.5) setServingAmount((val - 0.5).toFixed(1));
                      }}
                    >
                      <Text style={styles.amountBtnText}>-</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={styles.amountInput}
                      value={servingAmount}
                      onChangeText={setServingAmount}
                      keyboardType="decimal-pad"
                      selectTextOnFocus
                    />
                    <TouchableOpacity
                      style={styles.amountBtn}
                      onPress={() => {
                        const val = parseFloat(servingAmount) || 1;
                        setServingAmount((val + 0.5).toFixed(1));
                      }}
                    >
                      <Text style={styles.amountBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.previewSection}>
                  <Text style={styles.previewTitle}>本次摄入</Text>
                  <View style={styles.previewRow}>
                    <View style={styles.previewItem}>
                      <Text style={styles.previewValue}>
                        {calculateNutrition(selectedFood, parseFloat(servingAmount) || 1).calorie}
                      </Text>
                      <Text style={styles.previewLabel}>千卡</Text>
                    </View>
                    <View style={styles.previewItem}>
                      <Text style={styles.previewValue}>
                        {calculateNutrition(selectedFood, parseFloat(servingAmount) || 1).carb}g
                      </Text>
                      <Text style={styles.previewLabel}>碳水</Text>
                    </View>
                    <View style={styles.previewItem}>
                      <Text style={styles.previewValue}>
                        {calculateNutrition(selectedFood, parseFloat(servingAmount) || 1).protein}g
                      </Text>
                      <Text style={styles.previewLabel}>蛋白</Text>
                    </View>
                    <View style={styles.previewItem}>
                      <Text style={styles.previewValue}>
                        {calculateNutrition(selectedFood, parseFloat(servingAmount) || 1).fat}g
                      </Text>
                      <Text style={styles.previewLabel}>脂肪</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.addBtn, submitting && styles.addBtnDisabled]} 
                  onPress={handleAddFood}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.addBtnText}>确认添加</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    fontSize: 16,
    color: '#10B981',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  list: {
    padding: 16,
    paddingBottom: 280,
  },
  foodItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  foodItemSelected: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  foodUnit: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  foodStats: {
    alignItems: 'flex-end',
  },
  calorieText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  selectedInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  selectedBase: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  amountSection: {
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  amountControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  amountBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountBtnText: {
    fontSize: 24,
    color: '#10B981',
    fontWeight: '600',
  },
  amountInput: {
    width: 80,
    height: 44,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  previewSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  previewItem: {
    alignItems: 'center',
  },
  previewValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  previewLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addBtnDisabled: {
    backgroundColor: '#A7F3D0',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
