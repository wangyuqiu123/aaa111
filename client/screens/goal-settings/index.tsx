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
import { api } from '@/utils/api';
import { useUser } from '@/contexts/UserContext';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Ionicons } from '@expo/vector-icons';

export default function GoalSettingsScreen() {
  const router = useSafeRouter();
  const { user, refreshUser } = useUser();

  const [calorieGoal, setCalorieGoal] = useState(String(user?.daily_calorie_goal || 1800));
  const [carbGoal, setCarbGoal] = useState(String(user?.daily_carb_goal || 200));
  const [proteinGoal, setProteinGoal] = useState(String(user?.daily_protein_goal || 60));
  const [fatGoal, setFatGoal] = useState(String(user?.daily_fat_goal || 50));
  const [sodiumGoal, setSodiumGoal] = useState(String(user?.daily_sodium_goal || 2000));
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert('错误', '用户信息不存在');
      return;
    }

    const calorie = parseInt(calorieGoal) || 0;
    const carb = parseInt(carbGoal) || 0;
    const protein = parseInt(proteinGoal) || 0;
    const fat = parseInt(fatGoal) || 0;
    const sodium = parseInt(sodiumGoal) || 0;

    if (calorie < 1000 || calorie > 5000) {
      Alert.alert('错误', '每日热量建议在 1000-5000 千卡之间');
      return;
    }

    setLoading(true);
    try {
      await api.updateGoals(user.id, {
        daily_calorie_goal: calorie,
        daily_carb_goal: carb,
        daily_protein_goal: protein,
        daily_fat_goal: fat,
        daily_sodium_goal: sodium,
      });

      await refreshUser();
      router.back();
    } catch (error) {
      console.error('Save goals error:', error);
      Alert.alert('错误', '保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.headerTitle}>目标设置</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <Text style={styles.hint}>设置你的每日营养目标</Text>

          {/* 热量目标 */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>每日热量</Text>
              <Text style={styles.unit}>千卡/天</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="1800"
              placeholderTextColor="#9CA3AF"
              value={calorieGoal}
              onChangeText={setCalorieGoal}
              keyboardType="numeric"
            />
          </View>

          {/* 碳水目标 */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>碳水化合物</Text>
              <Text style={styles.unit}>克/天</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="200"
              placeholderTextColor="#9CA3AF"
              value={carbGoal}
              onChangeText={setCarbGoal}
              keyboardType="numeric"
            />
          </View>

          {/* 蛋白质目标 */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>蛋白质</Text>
              <Text style={styles.unit}>克/天</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="60"
              placeholderTextColor="#9CA3AF"
              value={proteinGoal}
              onChangeText={setProteinGoal}
              keyboardType="numeric"
            />
          </View>

          {/* 脂肪目标 */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>脂肪</Text>
              <Text style={styles.unit}>克/天</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="50"
              placeholderTextColor="#9CA3AF"
              value={fatGoal}
              onChangeText={setFatGoal}
              keyboardType="numeric"
            />
          </View>

          {/* 提示 */}
          <View style={styles.tipCard}>
            <Ionicons name="information-circle" size={20} color="#10B981" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>营养建议</Text>
              <Text style={styles.tipText}>
                减脂期建议热量缺口 300-500 千卡；蛋白质摄入建议 1.2-1.6g/kg体重
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* 保存按钮 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? '保存中...' : '保存目标'}
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
    padding: 16,
    paddingBottom: 100,
  },
  hint: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  unit: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlign: 'center',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
