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
            每100g · {food.calorie}千卡
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
            <Text style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{food.sodium || 0}</Text>mg 钠
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
  const handleDelete = (e: any) => {
    if (e?.stopPropagation) {
      e.stopPropagation();
    }
    console.log('[FoodCard] Delete button pressed, record:', record);
    onDelete?.();
  };

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
        <View style={styles.listNutrition}>
          <Text style={styles.listNutritionItem}>
            <Text style={styles.listNutritionValue}>{Math.round(record.carb || 0)}</Text>g 碳水
          </Text>
          <Text style={styles.listNutritionItem}>
            <Text style={styles.listNutritionValue}>{Math.round(record.protein || 0)}</Text>g 蛋白
          </Text>
          <Text style={styles.listNutritionItem}>
            <Text style={styles.listNutritionValue}>{Math.round(record.fat || 0)}</Text>g 脂肪
          </Text>
          <Text style={styles.listNutritionItem}>
            <Text style={styles.listNutritionValue}>{Math.round(record.sodium || 0)}</Text>mg 钠
          </Text>
        </View>
      </View>
      {onDelete && (
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={22} color="#EF4444" />
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
  const ratio = current / goal;
  const isOver = ratio >= 1;
  const isWarning = ratio >= 0.9 && ratio < 1;
  
  const barColor = isOver ? '#EF4444' : isWarning ? '#F59E0B' : color;
  const displayPercent = Math.min(ratio * 100, 100);
  const overPercent = isOver ? Math.round((ratio - 1) * 100) : 0;

  return (
    <View style={styles.barContainer}>
      <View style={styles.barHeader}>
        <Text style={[styles.barLabel, isOver && styles.barLabelOver]}>
          {label}
        </Text>
        <View style={styles.barValueRow}>
          <Text style={[styles.barCurrent, { color: barColor }]}>{current}</Text>
          <Text style={styles.barUnit}>/{goal}{unit}</Text>
          {isOver && (
            <View style={styles.overBadge}>
              <Text style={styles.overBadgeText}>+{overPercent}%</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.barBackground}>
        <View 
          style={[
            styles.barFill, 
            { 
              width: `${displayPercent}%`, 
              backgroundColor: barColor,
            },
            isOver && styles.barFillOver,
          ]} 
        />
        {isOver && <View style={styles.barOverflow} />}
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
  listNutrition: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 12,
  },
  listNutritionItem: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  listNutritionValue: {
    fontWeight: '600',
    color: '#374151',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
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
  barLabelOver: {
    color: '#EF4444',
    fontWeight: '700',
  },
  barValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barValue: {
    fontSize: 14,
  },
  barCurrent: {
    fontWeight: '700',
    fontSize: 15,
  },
  barUnit: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  overBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  overBadgeText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
  },
  barBackground: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  barFillOver: {
    borderRadius: 5,
  },
  barOverflow: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#FECACA',
  },
});
