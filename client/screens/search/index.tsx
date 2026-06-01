import { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useUser } from '@/contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';

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

export default function SearchScreen() {
  const router = useSafeRouter();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [foods, setFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFoods = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const baseUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;
      const params = new URLSearchParams({ user_id: String(user.id), limit: '50' });
      if (searchQuery) params.append('q', searchQuery);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      
      const response = await fetch(`${baseUrl}/api/v1/foods?${params}`);
      const data = await response.json();
      setFoods(data.foods || []);
    } catch (error) {
      console.error('Failed to fetch foods:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, searchQuery, selectedCategory]);

  useFocusEffect(
    useCallback(() => {
      fetchFoods();
    }, [fetchFoods])
  );

  const handleFoodSelect = (food: any) => {
    router.push('/add-food', { 
      foodId: food.id,
      foodName: food.name,
      calorie: food.calorie,
      carb: food.carb,
      protein: food.protein,
      fat: food.fat,
      servingUnit: food.serving_size
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      breakfast: '#FFB74D',
      staple: '#81C784',
      vegetable: '#4FC3F7',
      meat: '#E57373',
      fruit: '#BA68C8',
      drink: '#64B5F6',
      snack: '#FF8A65',
      fastfood: '#90A4AE',
    };
    return colors[category] || '#90A4AE';
  };

  return (
    <Screen>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="搜索食物..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Filter */}
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          style={styles.categoryList}
          contentContainerStyle={styles.categoryContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryItem,
                selectedCategory === item.key && styles.categoryItemActive,
              ]}
              onPress={() => setSelectedCategory(item.key)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === item.key && styles.categoryTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Food List */}
        <FlatList
          data={foods}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.foodList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {loading ? '加载中...' : '暂无食物数据'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.foodItem}
              onPress={() => handleFoodSelect(item)}
            >
              <View style={styles.foodInfo}>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
                  <Text style={[styles.categoryBadgeText, { color: getCategoryColor(item.category) }]}>
                    {CATEGORIES.find(c => c.key === item.category)?.label || item.category}
                  </Text>
                </View>
                <Text style={styles.foodName}>{item.name}</Text>
                <Text style={styles.foodServing}>
                  {item.serving_size} · {item.serving_gram}g
                </Text>
              </View>
              <View style={styles.calorieInfo}>
                <Text style={styles.calorieValue}>{item.calorie}</Text>
                <Text style={styles.calorieUnit}>千卡</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1F2937',
  },
  categoryList: {
    maxHeight: 50,
    backgroundColor: '#FFFFFF',
  },
  categoryContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 4,
  },
  categoryItemActive: {
    backgroundColor: '#10B981',
  },
  categoryText: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  foodList: {
    padding: 16,
    gap: 12,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  foodInfo: {
    flex: 1,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  foodServing: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  calorieInfo: {
    alignItems: 'flex-end',
    marginLeft: 16,
  },
  calorieValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  calorieUnit: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});
