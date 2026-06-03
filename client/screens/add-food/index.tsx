import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { api, MealType } from '@/utils/api';
import { useUser } from '@/contexts/UserContext';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Ionicons } from '@expo/vector-icons';

export default function AddFoodScreen() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{
    name?: string;
    mealType?: MealType;
    date?: string;
  }>();
  const { user } = useUser();

  const [foodName, setFoodName] = useState(params?.name || '');
  const [calorie, setCalorie] = useState('');
  const [carb, setCarb] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [servingSize, setServingSize] = useState('100');
  const [servingUnit, setServingUnit] = useState('克');
  const [servingAmount, setServingAmount] = useState(1);
  const [loading, setLoading] = useState(false);

  const mealType = params.mealType || 'snack';
  const recordDate = params.date || new Date().toISOString().split('T')[0];

  const handleAdd = async () => {
    if (!user?.id) {
      Alert.alert('错误', '用户信息不存在');
      return;
    }

    if (!foodName.trim()) {
      Alert.alert('错误', '请输入食物名称');
      return;
    }

    const calorieNum = parseFloat(calorie) || 0;
    if (calorieNum <= 0) {
      Alert.alert('错误', '请输入正确的热量值');
      return;
    }

    setLoading(true);
    try {
      const serving = parseFloat(servingSize) || 100;
      const multiplier = servingAmount;

      await api.addDietRecord({
        user_id: user.id,
        food_name: foodName.trim(),
        meal_type: mealType,
        calorie: Math.round(calorieNum * multiplier),
        carb: Math.round((parseFloat(carb) || 0) * multiplier * 10) / 10,
        protein: Math.round((parseFloat(protein) || 0) * multiplier * 10) / 10,
        fat: Math.round((parseFloat(fat) || 0) * multiplier * 10) / 10,
        serving_amount: servingAmount,
        serving_unit: servingUnit,
        record_date: recordDate,
      });

      Alert.alert('成功', '食物已添加到记录', [
        { text: '确定', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Add food error:', error);
      Alert.alert('错误', '添加失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const mealTypeLabelMap: Record<string, string> = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    snack: '加餐',
  };
  const mealTypeLabel = mealTypeLabelMap[mealType] || '加餐';

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 顶部导航 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>添加自定义食物</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {/* 餐食标签 */}
          <View style={styles.mealTag}>
            <Text style={styles.mealTagText}>添加到 {mealTypeLabel}</Text>
            <Text style={styles.dateText}>{recordDate}</Text>
          </View>

          {/* 食物名称 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>食物名称 *</Text>
            <TextInput
              style={styles.input}
              placeholder="如：红烧肉"
              placeholderTextColor="#9CA3AF"
              value={foodName}
              onChangeText={setFoodName}
            />
          </View>

          {/* 份量设置 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>每份含量</Text>
            <View style={styles.servingRow}>
              <TextInput
                style={[styles.input, { width: 100 }]}
                placeholder="100"
                placeholderTextColor="#9CA3AF"
                value={servingSize}
                onChangeText={setServingSize}
                keyboardType="numeric"
              />
              <View style={styles.unitSelector}>
                {['克', '千卡', '份'].map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    style={[
                      styles.unitBtn,
                      servingUnit === unit && styles.unitBtnActive,
                    ]}
                    onPress={() => setServingUnit(unit)}
                  >
                    <Text
                      style={[
                        styles.unitBtnText,
                        servingUnit === unit && styles.unitBtnTextActive,
                      ]}
                    >
                      {unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* 份数 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>份数</Text>
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

          {/* 营养素输入 */}
          <Text style={styles.sectionTitle}>营养成分（每份）</Text>

          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionInput}>
              <Text style={styles.nutritionLabel}>热量</Text>
              <View style={styles.nutritionInputRow}>
                <TextInput
                  style={styles.nutritionField}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  value={calorie}
                  onChangeText={setCalorie}
                  keyboardType="numeric"
                />
                <Text style={styles.nutritionUnit}>千卡</Text>
              </View>
            </View>

            <View style={styles.nutritionInput}>
              <Text style={styles.nutritionLabel}>碳水</Text>
              <View style={styles.nutritionInputRow}>
                <TextInput
                  style={styles.nutritionField}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  value={carb}
                  onChangeText={setCarb}
                  keyboardType="numeric"
                />
                <Text style={styles.nutritionUnit}>克</Text>
              </View>
            </View>

            <View style={styles.nutritionInput}>
              <Text style={styles.nutritionLabel}>蛋白质</Text>
              <View style={styles.nutritionInputRow}>
                <TextInput
                  style={styles.nutritionField}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  value={protein}
                  onChangeText={setProtein}
                  keyboardType="numeric"
                />
                <Text style={styles.nutritionUnit}>克</Text>
              </View>
            </View>

            <View style={styles.nutritionInput}>
              <Text style={styles.nutritionLabel}>脂肪</Text>
              <View style={styles.nutritionInputRow}>
                <TextInput
                  style={styles.nutritionField}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  value={fat}
                  onChangeText={setFat}
                  keyboardType="numeric"
                />
                <Text style={styles.nutritionUnit}>克</Text>
              </View>
            </View>
          </View>

          {/* 快捷提示 */}
          <View style={styles.hint}>
            <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
            <Text style={styles.hintText}>
              营养成分数据可从食品包装上获取，输入每份的含量即可
            </Text>
          </View>
        </ScrollView>

        {/* 添加按钮 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.addButton, loading && styles.addButtonDisabled]}
            onPress={handleAdd}
            disabled={loading}
          >
            <Text style={styles.addButtonText}>
              {loading ? '添加中...' : '添加到记录'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
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
  inputGroup: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  servingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  unitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  unitBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unitBtnText: {
    fontSize: 14,
    color: '#6B7280',
  },
  unitBtnTextActive: {
    color: '#10B981',
    fontWeight: '600',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 4,
    alignSelf: 'flex-start',
  },
  stepperBtn: {
    padding: 12,
  },
  stepperBtnDisabled: {
    opacity: 0.5,
  },
  stepperValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 50,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  nutritionInput: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  nutritionLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  nutritionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nutritionField: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    padding: 0,
  },
  nutritionUnit: {
    fontSize: 13,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  hintText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
