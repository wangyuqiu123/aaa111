import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { PrimaryButton, SecondaryButton } from '@/components/common';
import { useUser } from '@/contexts/UserContext';
import { api, MealType } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { useSafeRouter as useRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';

const MEAL_OPTIONS: { key: MealType; label: string }[] = [
  { key: 'breakfast', label: '早餐' },
  { key: 'lunch', label: '午餐' },
  { key: 'dinner', label: '晚餐' },
  { key: 'snack', label: '加餐' },
];

export default function AddFoodScreen() {
  const { user } = useUser();
  const router = useRouter();
  const params = useSafeSearchParams<{ mealType?: string; date?: string }>();

  const [foodName, setFoodName] = useState('');
  const [calorie, setCalorie] = useState('');
  const [carb, setCarb] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [servingAmount, setServingAmount] = useState('1');
  const [servingUnit, setServingUnit] = useState('份');
  const [selectedMeal, setSelectedMeal] = useState<MealType>(
    (params.mealType as MealType) || 'lunch'
  );
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!foodName.trim()) {
      Alert.alert('错误', '请输入食物名称');
      return;
    }

    const calorieNum = parseFloat(calorie);
    if (isNaN(calorieNum) || calorieNum < 0) {
      Alert.alert('错误', '请输入有效的热量值');
      return;
    }

    if (!user) {
      Alert.alert('错误', '用户未初始化');
      return;
    }

    try {
      setLoading(true);
      await api.addDietRecord({
        user_id: user.id,
        food_name: foodName.trim(),
        meal_type: selectedMeal,
        calorie: Math.round(calorieNum),
        carb: parseFloat(carb) || 0,
        protein: parseFloat(protein) || 0,
        fat: parseFloat(fat) || 0,
        serving_amount: parseFloat(servingAmount) || 1,
        serving_unit: servingUnit,
        record_date: params.date || new Date().toISOString().split('T')[0],
      });

      Alert.alert('成功', '食物已添加', [
        { text: '继续添加', style: 'default' },
        { text: '返回', onPress: () => router.back() },
      ]);

      // 重置表单
      setFoodName('');
      setCalorie('');
      setCarb('');
      setProtein('');
      setFat('');
    } catch (error) {
      Alert.alert('错误', '添加失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const adjustValue = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    current: string,
    delta: number
  ) => {
    const value = parseFloat(current) || 0;
    const newValue = Math.max(0, value + delta);
    setter(String(newValue));
  };

  return (
    <Screen style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.title}>添加食物</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Food Name */}
          <View style={styles.section}>
            <Text style={styles.label}>食物名称 *</Text>
            <TextInput
              style={styles.textInput}
              value={foodName}
              onChangeText={setFoodName}
              placeholder="输入食物名称"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Meal Type */}
          <View style={styles.section}>
            <Text style={styles.label}>餐次</Text>
            <View style={styles.mealOptions}>
              {MEAL_OPTIONS.map((meal) => (
                <TouchableOpacity
                  key={meal.key}
                  style={[
                    styles.mealOption,
                    selectedMeal === meal.key && styles.mealOptionActive,
                  ]}
                  onPress={() => setSelectedMeal(meal.key)}
                >
                  <Text style={[
                    styles.mealOptionText,
                    selectedMeal === meal.key && styles.mealOptionTextActive,
                  ]}>
                    {meal.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Serving */}
          <View style={styles.section}>
            <Text style={styles.label}>份量</Text>
            <View style={styles.servingRow}>
              <View style={styles.servingInput}>
                <TouchableOpacity 
                  style={styles.adjustButton}
                  onPress={() => adjustValue(setServingAmount, servingAmount, -0.5)}
                >
                  <Ionicons name="remove" size={18} color="#6B7280" />
                </TouchableOpacity>
                <TextInput
                  style={[styles.numberInput, { flex: 1 }]}
                  value={servingAmount}
                  onChangeText={setServingAmount}
                  keyboardType="decimal-pad"
                  textAlign="center"
                />
                <TouchableOpacity 
                  style={styles.adjustButton}
                  onPress={() => adjustValue(setServingAmount, servingAmount, 0.5)}
                >
                  <Ionicons name="add" size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.textInput, { width: 80, marginLeft: 12 }]}
                value={servingUnit}
                onChangeText={setServingUnit}
                placeholder="单位"
                placeholderTextColor="#9CA3AF"
                textAlign="center"
              />
            </View>
          </View>

          {/* Nutrition Info */}
          <View style={styles.section}>
            <Text style={styles.label}>营养信息</Text>
            
            <View style={styles.nutritionCard}>
              {/* Calorie */}
              <View style={styles.nutritionRow}>
                <View style={styles.nutritionLabel}>
                  <Ionicons name="flame-outline" size={20} color="#10B981" />
                  <Text style={styles.nutritionLabelText}>热量 *</Text>
                </View>
                <View style={styles.nutritionInput}>
                  <TouchableOpacity 
                    style={styles.adjustButtonSmall}
                    onPress={() => adjustValue(setCalorie, calorie, -10)}
                  >
                    <Ionicons name="remove" size={16} color="#10B981" />
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.numberInput, { width: 70 }]}
                    value={calorie}
                    onChangeText={setCalorie}
                    keyboardType="number-pad"
                    textAlign="center"
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity 
                    style={styles.adjustButtonSmall}
                    onPress={() => adjustValue(setCalorie, calorie, 10)}
                  >
                    <Ionicons name="add" size={16} color="#10B981" />
                  </TouchableOpacity>
                  <Text style={styles.unit}>千卡</Text>
                </View>
              </View>

              {/* Carbohydrate */}
              <View style={styles.nutritionRow}>
                <View style={styles.nutritionLabel}>
                  <Ionicons name="leaf-outline" size={20} color="#10B981" />
                  <Text style={styles.nutritionLabelText}>碳水</Text>
                </View>
                <View style={styles.nutritionInput}>
                  <TextInput
                    style={[styles.numberInput, { width: 60 }]}
                    value={carb}
                    onChangeText={setCarb}
                    keyboardType="decimal-pad"
                    textAlign="center"
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Text style={styles.unit}>克</Text>
                </View>
              </View>

              {/* Protein */}
              <View style={styles.nutritionRow}>
                <View style={styles.nutritionLabel}>
                  <Ionicons name="barbell-outline" size={20} color="#6366F1" />
                  <Text style={styles.nutritionLabelText}>蛋白质</Text>
                </View>
                <View style={styles.nutritionInput}>
                  <TextInput
                    style={[styles.numberInput, { width: 60 }]}
                    value={protein}
                    onChangeText={setProtein}
                    keyboardType="decimal-pad"
                    textAlign="center"
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Text style={styles.unit}>克</Text>
                </View>
              </View>

              {/* Fat */}
              <View style={styles.nutritionRow}>
                <View style={styles.nutritionLabel}>
                  <Ionicons name="water-outline" size={20} color="#F59E0B" />
                  <Text style={styles.nutritionLabelText}>脂肪</Text>
                </View>
                <View style={styles.nutritionInput}>
                  <TextInput
                    style={[styles.numberInput, { width: 60 }]}
                    value={fat}
                    onChangeText={setFat}
                    keyboardType="decimal-pad"
                    textAlign="center"
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Text style={styles.unit}>克</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <PrimaryButton
              title="保存"
              onPress={handleSave}
              loading={loading}
            />
            <View style={{ height: 12 }} />
            <SecondaryButton
              title="取消"
              onPress={() => router.back()}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mealOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  mealOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mealOptionActive: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  mealOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  mealOptionTextActive: {
    color: '#10B981',
  },
  servingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servingInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  adjustButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustButtonSmall: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  numberInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  nutritionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  nutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  nutritionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nutritionLabelText: {
    fontSize: 15,
    color: '#374151',
    marginLeft: 8,
  },
  nutritionInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unit: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 8,
    width: 40,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
});
