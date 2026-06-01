import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { PrimaryButton, SecondaryButton } from '@/components/common';
import { useUser } from '@/contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { useSafeRouter as useRouter } from '@/hooks/useSafeRouter';

export default function GoalSettingsScreen() {
  const { user, updateGoals } = useUser();
  const router = useRouter();
  
  const [calorieGoal, setCalorieGoal] = useState(String(user?.daily_calorie_goal || 1800));
  const [carbGoal, setCarbGoal] = useState(String(user?.daily_carb_goal || 250));
  const [proteinGoal, setProteinGoal] = useState(String(user?.daily_protein_goal || 80));
  const [fatGoal, setFatGoal] = useState(String(user?.daily_fat_goal || 60));
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const calorie = parseInt(calorieGoal, 10);
    const carb = parseInt(carbGoal, 10);
    const protein = parseInt(proteinGoal, 10);
    const fat = parseInt(fatGoal, 10);

    if (isNaN(calorie) || calorie < 500 || calorie > 5000) {
      Alert.alert('错误', '请输入有效的热量值（500-5000千卡）');
      return;
    }

    if (isNaN(carb) || carb < 50 || carb > 500) {
      Alert.alert('错误', '请输入有效的碳水值（50-500克）');
      return;
    }

    if (isNaN(protein) || protein < 30 || protein > 300) {
      Alert.alert('错误', '请输入有效的蛋白质值（30-300克）');
      return;
    }

    if (isNaN(fat) || fat < 20 || fat > 200) {
      Alert.alert('错误', '请输入有效的脂肪值（20-200克）');
      return;
    }

    try {
      setLoading(true);
      await updateGoals({
        daily_calorie_goal: calorie,
        daily_carb_goal: carb,
        daily_protein_goal: protein,
        daily_fat_goal: fat,
      });
      Alert.alert('成功', '目标已更新', [
        { text: '确定', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('错误', '保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const adjustValue = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    current: string,
    delta: number,
    min: number,
    max: number
  ) => {
    const value = parseInt(current, 10) || min;
    const newValue = Math.max(min, Math.min(max, value + delta));
    setter(String(newValue));
  };

  const presets = [
    { label: '轻度减脂', calorie: 1500 },
    { label: '均衡饮食', calorie: 1800 },
    { label: '维持体重', calorie: 2000 },
    { label: '增肌塑形', calorie: 2200 },
  ];

  const handlePresetSelect = (preset: typeof presets[0]) => {
    setCalorieGoal(String(preset.calorie));
    // 根据热量自动调整营养素比例
    setCarbGoal(String(Math.round(preset.calorie * 0.5 / 4))); // 50%碳水
    setProteinGoal(String(Math.round(preset.calorie * 0.25 / 4))); // 25%蛋白质
    setFatGoal(String(Math.round(preset.calorie * 0.25 / 9))); // 25%脂肪
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
            <Text style={styles.title}>目标设置</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Presets */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>快速设置</Text>
            <View style={styles.presetsGrid}>
              {presets.map((preset) => (
                <TouchableOpacity
                  key={preset.label}
                  style={[
                    styles.presetCard,
                    calorieGoal === String(preset.calorie) && styles.presetCardActive,
                  ]}
                  onPress={() => handlePresetSelect(preset)}
                >
                  <Text style={[
                    styles.presetLabel,
                    calorieGoal === String(preset.calorie) && styles.presetLabelActive,
                  ]}>
                    {preset.label}
                  </Text>
                  <Text style={[
                    styles.presetCalorie,
                    calorieGoal === String(preset.calorie) && styles.presetCalorieActive,
                  ]}>
                    {preset.calorie}千卡
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Custom Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>自定义目标</Text>
            
            {/* Calorie */}
            <View style={styles.inputCard}>
              <View style={styles.inputHeader}>
                <Ionicons name="flame-outline" size={22} color="#10B981" />
                <Text style={styles.inputLabel}>每日热量目标</Text>
              </View>
              <View style={styles.inputRow}>
                <TouchableOpacity 
                  style={styles.adjustButton}
                  onPress={() => adjustValue(setCalorieGoal, calorieGoal, -50, 500, 5000)}
                >
                  <Ionicons name="remove" size={20} color="#10B981" />
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  value={calorieGoal}
                  onChangeText={setCalorieGoal}
                  keyboardType="number-pad"
                  textAlign="center"
                />
                <TouchableOpacity 
                  style={styles.adjustButton}
                  onPress={() => adjustValue(setCalorieGoal, calorieGoal, 50, 500, 5000)}
                >
                  <Ionicons name="add" size={20} color="#10B981" />
                </TouchableOpacity>
              </View>
              <Text style={styles.inputHint}>建议范围: 1200-3000千卡</Text>
            </View>

            {/* Carbohydrate */}
            <View style={styles.inputCard}>
              <View style={styles.inputHeader}>
                <Ionicons name="leaf-outline" size={22} color="#10B981" />
                <Text style={styles.inputLabel}>碳水化合物</Text>
              </View>
              <View style={styles.inputRow}>
                <TouchableOpacity 
                  style={styles.adjustButton}
                  onPress={() => adjustValue(setCarbGoal, carbGoal, -10, 50, 500)}
                >
                  <Ionicons name="remove" size={20} color="#10B981" />
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  value={carbGoal}
                  onChangeText={setCarbGoal}
                  keyboardType="number-pad"
                  textAlign="center"
                />
                <TouchableOpacity 
                  style={styles.adjustButton}
                  onPress={() => adjustValue(setCarbGoal, carbGoal, 10, 50, 500)}
                >
                  <Ionicons name="add" size={20} color="#10B981" />
                </TouchableOpacity>
              </View>
              <Text style={styles.inputUnit}>克 / 天</Text>
            </View>

            {/* Protein */}
            <View style={styles.inputCard}>
              <View style={styles.inputHeader}>
                <Ionicons name="barbell-outline" size={22} color="#6366F1" />
                <Text style={styles.inputLabel}>蛋白质</Text>
              </View>
              <View style={styles.inputRow}>
                <TouchableOpacity 
                  style={styles.adjustButton}
                  onPress={() => adjustValue(setProteinGoal, proteinGoal, -5, 30, 300)}
                >
                  <Ionicons name="remove" size={20} color="#6366F1" />
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  value={proteinGoal}
                  onChangeText={setProteinGoal}
                  keyboardType="number-pad"
                  textAlign="center"
                />
                <TouchableOpacity 
                  style={styles.adjustButton}
                  onPress={() => adjustValue(setProteinGoal, proteinGoal, 5, 30, 300)}
                >
                  <Ionicons name="add" size={20} color="#6366F1" />
                </TouchableOpacity>
              </View>
              <Text style={styles.inputUnit}>克 / 天</Text>
            </View>

            {/* Fat */}
            <View style={styles.inputCard}>
              <View style={styles.inputHeader}>
                <Ionicons name="water-outline" size={22} color="#F59E0B" />
                <Text style={styles.inputLabel}>脂肪</Text>
              </View>
              <View style={styles.inputRow}>
                <TouchableOpacity 
                  style={styles.adjustButton}
                  onPress={() => adjustValue(setFatGoal, fatGoal, -5, 20, 200)}
                >
                  <Ionicons name="remove" size={20} color="#F59E0B" />
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  value={fatGoal}
                  onChangeText={setFatGoal}
                  keyboardType="number-pad"
                  textAlign="center"
                />
                <TouchableOpacity 
                  style={styles.adjustButton}
                  onPress={() => adjustValue(setFatGoal, fatGoal, 5, 20, 200)}
                >
                  <Ionicons name="add" size={20} color="#F59E0B" />
                </TouchableOpacity>
              </View>
              <Text style={styles.inputUnit}>克 / 天</Text>
            </View>
          </View>

          {/* Save Button */}
          <View style={styles.buttonContainer}>
            <PrimaryButton
              title="保存设置"
              onPress={handleSave}
              loading={loading}
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  presetCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetCardActive: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  presetLabelActive: {
    color: '#10B981',
  },
  presetCalorie: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  presetCalorieActive: {
    color: '#10B981',
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    minWidth: 120,
    marginHorizontal: 16,
  },
  inputUnit: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  inputHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  buttonContainer: {
    paddingHorizontal: 16,
  },
});
