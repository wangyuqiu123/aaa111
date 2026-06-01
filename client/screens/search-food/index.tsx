import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { SearchBar, TabButton } from '@/components/common';
import { useUser } from '@/contexts/UserContext';
import { api, Food, MealType } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { useSafeRouter as useRouter } from '@/hooks/useSafeRouter';
import { useSafeSearchParams } from '@/hooks/useSafeRouter';

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'breakfast', label: '早餐' },
  { key: 'staple', label: '主食' },
  { key: 'vegetable', label: '蔬菜' },
  { key: 'meat', label: '肉类' },
  { key: 'fruit', label: '水果' },
  { key: 'drink', label: '饮品' },
  { key: 'snack', label: '零食' },
  { key: 'fastfood', label: '快餐' },
];

export default function SearchFoodScreen() {
  const { user } = useUser();
  const router = useRouter();
  const params = useSafeSearchParams<{ mealType?: string; date?: string }>();
  
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingFood, setAddingFood] = useState<number | null>(null);

  const fetchFoods = useCallback(async () => {
    try {
      setLoading(true);
      const category = selectedCategory === 'all' ? undefined : selectedCategory;
      const search = searchText || undefined;
      const data = await api.getFoods({ category, search, limit: 100 });
      setFoods(data);
    } catch (error) {
      console.error('Error fetching foods:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchText]);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  const handleAddFood = async (food: Food) => {
    if (!user) return;
    
    const mealType = (params.mealType as MealType) || 'snack';
    const recordDate = params.date || new Date().toISOString().split('T')[0];

    try {
      setAddingFood(food.id!);
      await api.addDietRecord({
        user_id: user.id,
        food_id: food.id,
        food_name: food.name,
        meal_type: mealType,
        calorie: food.calorie,
        carb: food.carb,
        protein: food.protein,
        fat: food.fat,
        serving_amount: 1,
        serving_unit: food.serving_size || '份',
        record_date: recordDate,
      });
      
      Alert.alert('成功', `${food.name} 已添加到记录`, [
        { text: '继续添加', style: 'default' },
        { text: '返回', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('错误', '添加失败，请重试');
    } finally {
      setAddingFood(null);
    }
  };

  const renderFoodItem = ({ item }: { item: Food }) => (
    <TouchableOpacity 
      style={styles.foodItem}
      onPress={() => handleAddFood(item)}
      activeOpacity={0.7}
    >
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        <Text style={styles.foodDetail}>
          {item.serving_gram || 100}g · {item.calorie}千卡
        </Text>
        <View style={styles.foodNutrition}>
          <Text style={styles.nutritionTag}>碳水 {item.carb}g</Text>
          <Text style={styles.nutritionTag}>蛋白 {item.protein}g</Text>
          <Text style={styles.nutritionTag}>脂肪 {item.fat}g</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => handleAddFood(item)}
        disabled={addingFood === item.id}
      >
        {addingFood === item.id ? (
          <ActivityIndicator size="small" color="#10B981" />
        ) : (
          <Ionicons name="add" size={24} color="#10B981" />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBarWrapper, { flex: 1 }]}>
          <SearchBar
            value={searchText}
            onChangeText={setSearchText}
            placeholder="搜索食物名称..."
          />
        </View>
      </View>

      {/* Category Tabs */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={CATEGORIES}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <TabButton
            label={item.label}
            active={selectedCategory === item.key}
            onPress={() => setSelectedCategory(item.key)}
          />
        )}
        style={styles.categoryList}
        contentContainerStyle={styles.categoryContent}
      />

      {/* Meal Type Info */}
      {params.mealType && (
        <View style={styles.mealTypeInfo}>
          <Text style={styles.mealTypeText}>
            添加到: {getMealTypeLabel(params.mealType as MealType)}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <Screen style={styles.container}>
      <FlatList
        data={foods}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderFoodItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={styles.emptyText}>加载中...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>没有找到相关食物</Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

function getMealTypeLabel(mealType: MealType): string {
  const labels: Record<MealType, string> = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    snack: '加餐',
  };
  return labels[mealType] || '加餐';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBarWrapper: {
    flex: 1,
  },
  scanButton: {
    width: 44,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryList: {
    marginTop: 16,
  },
  categoryContent: {
    paddingRight: 16,
  },
  mealTypeInfo: {
    marginTop: 12,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  mealTypeText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  foodDetail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  foodNutrition: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  nutritionTag: {
    fontSize: 11,
    color: '#9CA3AF',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
});
