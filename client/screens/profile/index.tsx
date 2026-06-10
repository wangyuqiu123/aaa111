import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { useUser } from '@/contexts/UserContext';

export default function ProfileScreen() {
  const { user, refreshUser, updateGoals } = useUser();
  const router = useSafeRouter();

  const handleGoalPress = () => {
    router.push('/goal-settings');
  };

  const handleFoodManage = () => {
    router.push('/food-manage');
  };

  const handleRefresh = async () => {
    try {
      await refreshUser();
      Alert.alert('成功', '数据已刷新');
    } catch {
      Alert.alert('错误', '刷新失败');
    }
  };

  if (!user) {
    return (
      <Screen style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>我的</Text>
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#10B981" />
            </View>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.username}>健康生活家</Text>
            <Text style={styles.userSubtitle}>坚持记录，健康生活</Text>
          </View>
        </View>

        {/* Goals Summary */}
        <TouchableOpacity style={styles.goalsCard} onPress={handleGoalPress}>
          <View style={styles.goalsHeader}>
            <Ionicons name="flag-outline" size={24} color="#10B981" />
            <Text style={styles.goalsTitle}>每日目标</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
          <View style={styles.goalsGrid}>
            <View style={styles.goalItem}>
              <Text style={styles.goalValue}>{user.daily_calorie_goal}</Text>
              <Text style={styles.goalLabel}>千卡</Text>
            </View>
            <View style={styles.goalItem}>
              <Text style={styles.goalValue}>{user.daily_carb_goal}g</Text>
              <Text style={styles.goalLabel}>碳水</Text>
            </View>
            <View style={styles.goalItem}>
              <Text style={styles.goalValue}>{user.daily_protein_goal}g</Text>
              <Text style={styles.goalLabel}>蛋白</Text>
            </View>
            <View style={styles.goalItem}>
              <Text style={styles.goalValue}>{user.daily_fat_goal}g</Text>
              <Text style={styles.goalLabel}>脂肪</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Food Management Section */}
        <View style={styles.foodSection}>
          <Text style={styles.sectionTitle}>食材管理</Text>
          
          <TouchableOpacity style={styles.foodManageCard} onPress={handleFoodManage}>
            <View style={styles.foodManageIcon}>
              <Ionicons name="restaurant" size={28} color="#10B981" />
            </View>
            <View style={styles.foodManageInfo}>
              <Text style={styles.foodManageTitle}>我的食材库</Text>
              <Text style={styles.foodManageSub}>管理自定义食材</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>快捷操作</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handleRefresh}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="refresh-outline" size={24} color="#6366F1" />
              </View>
              <Text style={styles.actionText}>刷新数据</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/stats')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="stats-chart-outline" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.actionText}>查看统计</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>FitTrack</Text>
          <Text style={styles.appVersion}>版本 1.0.0</Text>
          <Text style={styles.appSlogan}>记录饮食，健康生活</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  userSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  goalsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  goalsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  goalsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalItem: {
    alignItems: 'center',
    flex: 1,
  },
  goalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  goalLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  foodSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  foodManageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  foodManageIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodManageInfo: {
    flex: 1,
    marginLeft: 12,
  },
  foodManageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  foodManageSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  actionsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    color: '#374151',
    marginTop: 8,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 16,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  appVersion: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  appSlogan: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
});
