import React, { useState, useCallback, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { useFocusEffect } from 'expo-router';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { Ionicons } from '@expo/vector-icons';

// 默认后端地址
const API_BASE = 'http://localhost:9091';

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

// 获取或创建用户
async function getOrCreateUser(): Promise<number | null> {
  try {
    // 尝试从本地存储获取用户ID
    const userIdStr = await AsyncStorage.getItem('fittrack_user_id');
    if (userIdStr) {
      const userId = parseInt(userIdStr, 10);
      console.log('Found existing userId:', userId);
      return userId;
    }

    // 获取或创建设备ID
    let deviceId = await AsyncStorage.getItem('fittrack_device_id');
    if (!deviceId) {
      deviceId = Crypto.randomUUID();
      await AsyncStorage.setItem('fittrack_device_id', deviceId);
    }

    // 创建新用户
    console.log('Creating new user with deviceId:', deviceId);
    const response = await fetch(`${API_BASE}/api/v1/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId }),
    });

    if (response.ok) {
      const newUser = await response.json();
      console.log('New user created:', newUser);
      if (newUser.id) {
        await AsyncStorage.setItem('fittrack_user_id', newUser.id.toString());
        return newUser.id;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting/creating user:', error);
    return null;
  }
}

export default function SearchFoodScreen() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ mealType?: string; date?: string }>();
  
  const [userId, setUserId] = useState<number | null>(null);
  const [foods, setFoods] = useState<UserFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFood, setSelectedFood] = useState<UserFood | null>(null);
  const [servingAmount, setServingAmount] = useState('1');
  const [initialized, setInitialized] = useState(false);

  // 初始化用户
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      console.log('=== Initializing user ===');
      const id = await getOrCreateUser();
      if (mounted) {
        setUserId(id);
        setInitialized(true);
        console.log('User initialized:', id);
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  // 获取食材列表
  const fetchFoods = useCallback(async () => {
    if (!userId) {
      console.log('User not initialized yet, skipping fetch');
      return;
    }

    console.log('=== Fetching foods for user:', userId);
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/api/v1/user-foods?user_id=${userId}`);
      console.log('Foods response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Foods data:', data);
        setFoods(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch foods:', response.status);
        setFoods([]);
      }
    } catch (error) {
      console.error('Error fetching foods:', error);
      setFoods([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // 当用户初始化完成后获取食材
  useEffect(() => {
    if (userId && initialized) {
      console.log('User initialized, fetching foods...');
      fetchFoods();
    }
  }, [userId, initialized]);

  // 每次页面获取焦点时刷新
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        console.log('Page focused, refreshing foods...');
        fetchFoods();
      }
    }, [userId, fetchFoods])
  );

  // 计算营养
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
    console.log('=== handleAddFood called ===');
    console.log('selectedFood:', selectedFood);
    console.log('userId:', userId);

    if (!selectedFood) {
      Alert.alert('提示', '请先选择一个食材');
      return;
    }

    if (!userId) {
      Alert.alert('错误', '用户未初始化，请返回重试');
      return;
    }

    // 获取餐次类型，默认加餐
    const mealType = String(params.mealType || 'snack');
    const recordDate = String(params.date || new Date().toISOString().split('T')[0]);

    const amount = parseFloat(servingAmount) || 1;
    const nutrition = calculateNutrition(selectedFood, amount);

    console.log('Adding food:', {
      user_id: userId,
      food_name: selectedFood.name,
      meal_type: mealType,
      calorie: nutrition.calorie,
    });

    setSubmitting(true);
    try {
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
      console.log('API response:', result);

      if (response.ok) {
        Alert.alert('成功', `${selectedFood.name} 已添加（${amount}${selectedFood.serving_unit}）`, [
          { text: '确定', onPress: () => {
            setSelectedFood(null);
            router.back();
          }},
        ]);
      } else {
        Alert.alert('错误', result.error || '添加失败');
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
      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>选择食材</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 餐次提示 */}
      <View style={styles.mealTypeBar}>
        <Text style={styles.mealTypeText}>
          添加到：{getMealName(String(params.mealType || 'snack'))}
        </Text>
      </View>

      {/* 食材列表 */}
      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        ) : foods.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="restaurant-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>食材库为空</Text>
            <Text style={styles.emptyText}>请先在"我的食材库"中添加食材</Text>
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
      </View>

      {/* 选中食材信息 */}
      {selectedFood && (
        <View style={styles.selectedInfo}>
          <View style={styles.selectedHeader}>
            <Text style={styles.selectedTitle}>已选：{selectedFood.name}</Text>
            <TouchableOpacity onPress={() => setSelectedFood(null)}>
              <Ionicons name="close-circle" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>份量：</Text>
            <TextInput
              style={styles.amountInput}
              value={servingAmount}
              onChangeText={setServingAmount}
              keyboardType="numeric"
              placeholder="输入份量"
            />
            <Text style={styles.amountUnit}>{selectedFood.serving_unit}</Text>
          </View>

          <View style={styles.nutritionPreview}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>
                {Math.round(selectedFood.calorie * (parseFloat(servingAmount) || 1))}
              </Text>
              <Text style={styles.nutritionLabel}>千卡</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>
                {(selectedFood.carb * (parseFloat(servingAmount) || 1)).toFixed(1)}g
              </Text>
              <Text style={styles.nutritionLabel}>碳水</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>
                {(selectedFood.protein * (parseFloat(servingAmount) || 1)).toFixed(1)}g
              </Text>
              <Text style={styles.nutritionLabel}>蛋白</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>
                {(selectedFood.fat * (parseFloat(servingAmount) || 1)).toFixed(1)}g
              </Text>
              <Text style={styles.nutritionLabel}>脂肪</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.addButton, submitting && styles.addButtonDisabled]}
            onPress={handleAddFood}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.addButtonText}>确认添加</Text>
            )}
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  placeholder: {
    width: 32,
  },
  mealTypeBar: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  mealTypeText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748B',
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  foodItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  foodItemSelected: {
    borderWidth: 2,
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  foodUnit: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  foodStats: {
    alignItems: 'flex-end',
  },
  calorieText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  selectedInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  amountInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1E293B',
    marginHorizontal: 8,
  },
  amountUnit: {
    fontSize: 14,
    color: '#64748B',
  },
  nutritionPreview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#A7F3D0',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
