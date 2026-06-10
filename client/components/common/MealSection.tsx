import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DietRecord, MealType } from '@/utils/api';
import { FoodListItem } from './FoodCard';
import { mergeDietRecords } from '@/utils/helpers';

interface MealSectionProps {
  mealType: MealType;
  label: string;
  records: DietRecord[];
  onAddFood: () => void;
  onDeleteRecord?: (record: DietRecord) => void;
  totalCalorie: number;
}

const mealIcons: Record<MealType, string> = {
  breakfast: 'sunny-outline',
  lunch: 'partly-sunny-outline',
  dinner: 'moon-outline',
  snack: 'pizza-outline',
};

export function MealSection({ 
  mealType, 
  label, 
  records, 
  onAddFood,
  onDeleteRecord,
  totalCalorie 
}: MealSectionProps) {
  // 合并同名食材记录
  const mergedRecords = useMemo(() => mergeDietRecords(records), [records]);

  // 已合并后的项数（用于展示）
  const mergedCount = mergedRecords.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: getMealColor(mealType) + '15' }]}>
            <Ionicons 
              name={mealIcons[mealType] as any} 
              size={20} 
              color={getMealColor(mealType)} 
            />
          </View>
          <View>
            <Text style={styles.title}>{label}</Text>
            <Text style={styles.subtitle}>
              {mergedCount}项 · {totalCalorie}千卡
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={onAddFood}>
          <Ionicons name="add" size={20} color="#10B981" />
          <Text style={styles.addButtonText}>添加</Text>
        </TouchableOpacity>
      </View>
      
      {mergedRecords.length > 0 ? (
        <View style={styles.recordsList}>
          {mergedRecords.map((item, index) => (
            <FoodListItem
              key={item.food_name}
              record={{
                id: item.recordIds[0],
                food_name: item.food_name,
                serving_amount: item.serving_amount,
                serving_unit: item.serving_unit,
                calorie: item.calorie,
              } as DietRecord}
              onDelete={() => {
                // 如果有多条同名记录，删除全部
                const targetRecords = records.filter(r => r.food_name === item.food_name);
                targetRecords.forEach(r => onDeleteRecord?.(r));
              }}
            />
          ))}
        </View>
      ) : (
        <TouchableOpacity style={styles.emptyState} onPress={onAddFood}>
          <Ionicons name="add-circle-outline" size={32} color="#D1D5DB" />
          <Text style={styles.emptyText}>点击添加{label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function getMealColor(mealType: MealType): string {
  switch (mealType) {
    case 'breakfast': return '#F59E0B';
    case 'lunch': return '#10B981';
    case 'dinner': return '#6366F1';
    case 'snack': return '#EC4899';
    default: return '#6B7280';
  }
}

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    return {
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      day: date.getDate(),
      weekday: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
      isToday: i === 0,
    };
  });

  return (
    <View style={styles.dateSelector}>
      {dates.map((item) => {
        const isSelected = item.date === selectedDate;
        return (
          <TouchableOpacity
            key={item.date}
            style={[
              styles.dateItem,
              isSelected && styles.dateItemSelected,
              item.isToday && styles.dateItemToday,
            ]}
            onPress={() => onDateChange(item.date)}
          >
            <Text style={[
              styles.dateWeekday,
              isSelected && styles.dateTextSelected,
            ]}>
              {item.weekday}
            </Text>
            <Text style={[
              styles.dateDay,
              isSelected && styles.dateDaySelected,
            ]}>
              {item.day}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addButtonText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
    marginLeft: 4,
  },
  recordsList: {
    // gap: 8, // 使用 gap 可能导致触摸事件问题
  },
  emptyState: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },

  // DateSelector styles
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  dateItemSelected: {
    backgroundColor: '#10B981',
  },
  dateItemToday: {
    borderWidth: 1,
    borderColor: '#10B981',
  },
  dateWeekday: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  dateDay: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  dateTextSelected: {
    color: '#FFFFFF',
  },
  dateDaySelected: {
    color: '#FFFFFF',
  },
});
