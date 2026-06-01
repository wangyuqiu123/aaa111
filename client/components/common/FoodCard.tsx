import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Food, DietRecord } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';

interface FoodCardProps {
  food: Food;
  onPress?: () => void;
  onAdd?: () => void;
  showAddButton?: boolean;
}

export function FoodCard({ food, onPress, onAdd, showAddButton = true }: FoodCardProps) {
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{food.name}</Text>
          <Text style={styles.detail}>
            {food.serving_gram || 100}g · {food.calorie}千卡
          </Text>
          <View style={styles.nutrition}>
            <Text style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{food.carb}</Text>g 碳水
            </Text>
            <Text style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{food.protein}</Text>g 蛋白
            </Text>
            <Text style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{food.fat}</Text>g 脂肪
            </Text>
          </View>
        </View>
        {showAddButton && (
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={onAdd}
          >
            <Ionicons name="add" size={24} color="#10B981" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

interface FoodListItemProps {
  record: DietRecord;
  onPress?: () => void;
  onDelete?: () => void;
}

export function FoodListItem({ record, onPress, onDelete }: FoodListItemProps) {
  return (
    <TouchableOpacity 
      style={styles.listItem} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.listContent}>
        <Text style={styles.listName} numberOfLines={1}>{record.food_name}</Text>
        <Text style={styles.listDetail}>
          {record.serving_amount || 1}{record.serving_unit || '份'} · {record.calorie}千卡
        </Text>
      </View>
      {onDelete && (
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={onDelete}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

interface NutritionBarProps {
  label: string;
  current: number;
  goal: number;
  color: string;
  unit?: string;
}

export function NutritionBar({ 
  label, 
  current, 
  goal, 
  color,
  unit = 'g' 
}: NutritionBarProps) {
  const percentage = Math.min((current / goal) * 100, 100);

  return (
    <View style={styles.barContainer}>
      <View style={styles.barHeader}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barValue}>
          <Text style={[styles.barCurrent, { color }]}>{current}</Text>
          <Text style={styles.barUnit}>/{goal}{unit}</Text>
        </Text>
      </View>
      <View style={styles.barBackground}>
        <View 
          style={[
            styles.barFill, 
            { 
              width: `${percentage}%`, 
              backgroundColor: color 
            }
          ]} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // FoodCard styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  detail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  nutrition: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  nutritionItem: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  nutritionValue: {
    fontWeight: '600',
    color: '#374151',
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

  // FoodListItem styles
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
  },
  listContent: {
    flex: 1,
  },
  listName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  listDetail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },

  // NutritionBar styles
  barContainer: {
    marginBottom: 16,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  barValue: {
    fontSize: 14,
  },
  barCurrent: {
    fontWeight: '600',
  },
  barUnit: {
    color: '#9CA3AF',
  },
  barBackground: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});
