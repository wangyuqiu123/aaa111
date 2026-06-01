import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { SecondaryButton } from '@/components/common';
import { useUser } from '@/contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { useSafeRouter as useRouter } from '@/hooks/useSafeRouter';

export default function ProfileScreen() {
  const { user, refreshUser, updateGoals } = useUser();
  const router = useRouter();
  const [reminderEnabled, setReminderEnabled] = useState(user?.reminder_enabled ?? true);

  const handleToggleReminder = async () => {
    const newValue = !reminderEnabled;
    setReminderEnabled(newValue);
    try {
      await updateGoals({ reminder_enabled: newValue });
    } catch (error) {
      setReminderEnabled(!newValue);
      Alert.alert('错误', '设置失败');
    }
  };

  const handleGoalPress = () => {
    router.push('/goal-settings');
  };

  const handleRefresh = async () => {
    await refreshUser();
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
          <Text style={styles.title}>个人中心</Text>
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#10B981" />
            </View>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.username}>{user.username || '我的用户'}</Text>
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

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>设置</Text>
          
          {/* Reminder Toggle */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={22} color="#10B981" />
              <Text style={styles.settingLabel}>饮食提醒</Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={handleToggleReminder}
              trackColor={{ false: '#E5E7EB', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* History Records */}
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="time-outline" size={22} color="#6366F1" />
              <Text style={styles.settingLabel}>历史记录</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Favorite Foods */}
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="heart-outline" size={22} color="#EC4899" />
              <Text style={styles.settingLabel}>收藏食物</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* About */}
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle-outline" size={22} color="#6B7280" />
              <Text style={styles.settingLabel}>关于我们</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>快捷操作</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/search-food')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="restaurant-outline" size={24} color="#10B981" />
              </View>
              <Text style={styles.actionText}>添加食物</Text>
            </TouchableOpacity>
            
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
    paddingTop: 16,
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
    margin: 16,
    borderRadius: 20,
    padding: 20,
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
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ECFDF5',
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
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
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
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 10,
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
  settingsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 15,
    color: '#111827',
    marginLeft: 12,
  },
  actionsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  appVersion: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  appSlogan: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
  },
});
