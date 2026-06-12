import React, { useState, useCallback } from 'react';
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
import { withAuthHeaders } from '@/utils/auth-token';

import { getApiBase } from '@/utils/auth-token';
const API_BASE = getApiBase();

const CATEGORIES = ['代餐类', '外卖轻食类', '水煮轻食类'];

interface UserFood {
  id: number;
  user_id: number;
  name: string;
  category: string;
  calorie: number;
  carb: number;
  protein: number;
  fat: number;
  sodium: number;
  serving_unit: string;
  serving_amount: number;
  created_at: string;
}

export default function FoodManageScreen() {
  const router = useSafeRouter();
  const { userId } = useUser();
  const [foods, setFoods] = useState<UserFood[]>([]);
  const [activeCategory, setActiveCategory] = useState('全部');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFood, setEditingFood] = useState<UserFood | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('其他');
  const [kJAmount, setKJAmount] = useState('');
  const [calorie, setCalorie] = useState('');
  const [carb, setCarb] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [sodium, setSodium] = useState('');

  const fetchFoods = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${API_BASE}/api/v1/user-foods?user_id=${userId}`, {
        headers: withAuthHeaders(),
      });
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

  const filteredFoods = activeCategory === '全部'
    ? foods
    : foods.filter(f => f.category === activeCategory);

  const resetForm = () => {
    setName('');
    setCategory('代餐类');
    setKJAmount('');
    setCalorie('');
    setCarb('');
    setProtein('');
    setFat('');
    setSodium('');
    setEditingFood(null);
  };

  const handleOpenModal = (food?: UserFood) => {
    if (food) {
      setEditingFood(food);
      setName(food.name);
      setCategory(food.category || '其他');
      setKJAmount(Math.round(food.calorie * 4.184).toString());
      setCalorie(food.calorie.toString());
      setCarb(food.carb.toString());
      setProtein(food.protein.toString());
      setFat(food.fat.toString());
      setSodium(food.sodium?.toString() || '0');
    } else {
      resetForm();
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!userId || !name.trim() || !kJAmount) {
      Alert.alert('错误', '请填写食材名称和热量');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        user_id: userId,
        name: name.trim(),
        category,
        calorie: Math.round((parseFloat(kJAmount) || 0) / 4.184),
        carb: parseFloat(carb) || 0,
        protein: parseFloat(protein) || 0,
        fat: parseFloat(fat) || 0,
        sodium: parseFloat(sodium) || 0,
        serving_unit: 'g',
        serving_amount: 100,
      };

      if (editingFood) {
        const res = await fetch(`${API_BASE}/api/v1/user-foods/${editingFood.id}`, {
          method: 'PUT',
          headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json();
          Alert.alert('保存失败', errData.error || '请重试');
          return;
        }
      } else {
        const res = await fetch(`${API_BASE}/api/v1/user-foods`, {
          method: 'POST',
          headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json();
          Alert.alert('保存失败', errData.error || '请重试');
          return;
        }
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
                headers: withAuthHeaders(),
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

        {/* Category Tabs */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['全部', ...CATEGORIES].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.tab,
                  activeCategory === cat && styles.tabActive,
                ]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeCategory === cat && styles.tabTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Food List */}
        {filteredFoods.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>暂无食材</Text>
            <Text style={styles.emptySubtext}>点击上方按钮添加你的第一份食材</Text>
          </View>
        ) : (
          <ScrollView style={styles.list}>
            {filteredFoods.map((food) => (
              <View key={food.id} style={styles.foodCard}>
                <TouchableOpacity
                  style={styles.foodCardBody}
                  onPress={() => handleOpenModal(food)}
                >
                  <View style={styles.foodInfo}>
                    <View style={styles.foodNameRow}>
                      <Text style={styles.foodName}>{food.name}</Text>
                      {food.category && food.category !== '其他' && (
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>{food.category}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.foodUnit}>每100g</Text>
                  </View>
                  <View style={styles.foodStats}>
                    <Text style={styles.calorieText}>{food.calorie} 千卡</Text>
                    <View style={styles.macroRow}>
                      <Text style={styles.macroText}>碳水 {food.carb.toFixed(1)}g</Text>
                      <Text style={styles.macroText}>蛋白 {food.protein.toFixed(1)}g</Text>
                      <Text style={styles.macroText}>脂肪 {food.fat.toFixed(1)}g</Text>
                      <Text style={styles.macroText}>钠 {(food.sodium || 0).toFixed(0)}mg</Text>
                    </View>
                  </View>
                </TouchableOpacity>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => handleOpenModal(food)}
                  >
                    <Text style={styles.editBtnIcon}>✎</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(food)}
                  >
                    <Text style={styles.deleteBtnIcon}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
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

                {/* Category Selector */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>分类</Text>
                  <View style={styles.categorySelector}>
                    {CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryOption,
                          category === cat && styles.categoryOptionActive,
                        ]}
                        onPress={() => setCategory(cat)}
                      >
                        <Text
                          style={[
                            styles.categoryOptionText,
                            category === cat && styles.categoryOptionTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>每百克热量(kJ) *</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={kJAmount}
                      onChangeText={(val) => {
                        setKJAmount(val);
                        const kJ = parseFloat(val);
                        if (!isNaN(kJ) && kJ > 0) {
                          setCalorie(Math.round(kJ / 4.184).toString());
                        } else {
                          setCalorie('');
                        }
                      }}
                      placeholder="837"
                      keyboardType="decimal-pad"
                      placeholderTextColor="#9CA3AF"
                    />
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>
                      ≈{' '}
                      <Text style={{ fontWeight: '600', color: '#10B981' }}>
                        {calorie || '0'}
                      </Text>{' '}
                      千卡
                    </Text>
                  </View>
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
                    <Text style={styles.label}>钠(mg)</Text>
                    <TextInput
                      style={styles.input}
                      value={sodium}
                      onChangeText={setSodium}
                      placeholder="500"
                      keyboardType="decimal-pad"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
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
  tabContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  tabActive: {
    backgroundColor: '#10B981',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
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
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  foodCardBody: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cardActions: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingRight: 8,
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtnIcon: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '700',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnIcon: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '700',
  },
  foodInfo: {
    flex: 1,
  },
  foodNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  categoryBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#059669',
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
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  categoryOptionActive: {
    backgroundColor: '#10B981',
  },
  categoryOptionText: {
    fontSize: 13,
    color: '#6B7280',
  },
  categoryOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
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