import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { useUser } from '@/contexts/UserContext';
import * as FileSystem from 'expo-file-system/legacy';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

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
  created_at: string;
}

export default function FoodManageScreen() {
  const router = useSafeRouter();
  const { userId } = useUser();
  const [foods, setFoods] = useState<UserFood[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFood, setEditingFood] = useState<UserFood | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [calorie, setCalorie] = useState('');
  const [carb, setCarb] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [servingUnit, setServingUnit] = useState('份');
  const [servingGram, setServingGram] = useState('100');

  const fetchFoods = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${API_BASE}/api/v1/user-foods?user_id=${userId}`);
      const data = await response.json();
      setFoods(data);
    } catch (error) {
      console.error('Error fetching foods:', error);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchFoods();
    }, [fetchFoods])
  );

  const resetForm = () => {
    setName('');
    setCalorie('');
    setCarb('');
    setProtein('');
    setFat('');
    setServingUnit('份');
    setServingGram('100');
    setEditingFood(null);
  };

  const handleOpenModal = (food?: UserFood) => {
    if (food) {
      setEditingFood(food);
      setName(food.name);
      setCalorie(food.calorie.toString());
      setCarb(food.carb.toString());
      setProtein(food.protein.toString());
      setFat(food.fat.toString());
      setServingUnit(food.serving_unit);
      setServingGram(food.serving_gram.toString());
    } else {
      resetForm();
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!userId || !name.trim() || !calorie) {
      Alert.alert('错误', '请填写食材名称和热量');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        user_id: userId,
        name: name.trim(),
        calorie: parseInt(calorie) || 0,
        carb: parseFloat(carb) || 0,
        protein: parseFloat(protein) || 0,
        fat: parseFloat(fat) || 0,
        serving_unit: servingUnit || '份',
        serving_gram: parseInt(servingGram) || 100,
      };

      if (editingFood) {
        await fetch(`${API_BASE}/api/v1/user-foods/${editingFood.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(`${API_BASE}/api/v1/user-foods`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      setModalVisible(false);
      resetForm();
      fetchFoods();
    } catch (error) {
      console.error('Error saving food:', error);
      Alert.alert('错误', '保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (food: UserFood) => {
    Alert.alert(
      '删除确认',
      `确定要删除「${food.name}」吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`${API_BASE}/api/v1/user-foods/${food.id}`, {
                method: 'DELETE',
              });
              fetchFoods();
            } catch (error) {
              console.error('Error deleting food:', error);
              Alert.alert('错误', '删除失败');
            }
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>我的食材库</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleOpenModal()}
          >
            <Text style={styles.addButtonText}>+ 添加食材</Text>
          </TouchableOpacity>
        </View>

        {/* Food List */}
        {foods.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>暂无食材</Text>
            <Text style={styles.emptySubtext}>点击上方按钮添加你的第一份食材</Text>
          </View>
        ) : (
          <ScrollView style={styles.list}>
            {foods.map((food) => (
              <TouchableOpacity
                key={food.id}
                style={styles.foodCard}
                onPress={() => handleOpenModal(food)}
                onLongPress={() => handleDelete(food)}
              >
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  <Text style={styles.foodUnit}>
                    每{food.serving_unit} ({food.serving_gram}g)
                  </Text>
                </View>
                <View style={styles.foodStats}>
                  <Text style={styles.calorieText}>{food.calorie} 千卡</Text>
                  <View style={styles.macroRow}>
                    <Text style={styles.macroText}>碳水 {food.carb.toFixed(1)}g</Text>
                    <Text style={styles.macroText}>蛋白 {food.protein.toFixed(1)}g</Text>
                    <Text style={styles.macroText}>脂肪 {food.fat.toFixed(1)}g</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Add/Edit Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingFood ? '编辑食材' : '添加食材'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeBtn}>取消</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>食材名称 *</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="如：鸡胸肉沙拉"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>每份热量(千卡) *</Text>
                  <TextInput
                    style={styles.input}
                    value={calorie}
                    onChangeText={setCalorie}
                    placeholder="150"
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>碳水(g)</Text>
                    <TextInput
                      style={styles.input}
                      value={carb}
                      onChangeText={setCarb}
                      placeholder="5.0"
                      keyboardType="decimal-pad"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>蛋白质(g)</Text>
                    <TextInput
                      style={styles.input}
                      value={protein}
                      onChangeText={setProtein}
                      placeholder="30.0"
                      keyboardType="decimal-pad"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>脂肪(g)</Text>
                    <TextInput
                      style={styles.input}
                      value={fat}
                      onChangeText={setFat}
                      placeholder="3.0"
                      keyboardType="decimal-pad"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>每份克数</Text>
                    <TextInput
                      style={styles.input}
                      value={servingGram}
                      onChangeText={setServingGram}
                      placeholder="100"
                      keyboardType="numeric"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>单位名称</Text>
                  <TextInput
                    style={styles.input}
                    value={servingUnit}
                    onChangeText={setServingUnit}
                    placeholder="份/个/碗/100g"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={loading}
                >
                  <Text style={styles.saveButtonText}>
                    {loading ? '保存中...' : '保存'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  foodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  foodUnit: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  foodStats: {
    alignItems: 'flex-end',
  },
  calorieText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 4,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroText: {
    fontSize: 10,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeBtn: {
    fontSize: 16,
    color: '#6B7280',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
  },
  saveButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
