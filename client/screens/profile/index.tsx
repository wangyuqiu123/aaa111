import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { useUser } from '@/contexts/UserContext';
import { api, AllTimeStats } from '@/utils/api';

export default function ProfileScreen() {
  const { user, refreshUser, updateGoals } = useUser();
  const router = useSafeRouter();
  const [stats, setStats] = useState<AllTimeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await api.getAllTimeStats(user.id);
        setStats(data);
      } catch (e) {
        console.error('Failed to load stats:', e);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [user]);

  const handleGoalPress = () => {
    router.push('/goal-settings');
  };

  const handleFoodManage = () => {
    router.push('/food-manage');
  };

  if (!user) {
    return (
      <Screen style={styles.container}>
        <View style={styles.center}>
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
        <TouchableOpacity style={styles.card} onPress={handleGoalPress}>
          <View style={styles.cardHeader}>
            <Ionicons name="flag-outline" size={22} color="#10B981" />
            <Text style={styles.cardTitle}>每日目标</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
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

        {/* All-time Stats Section */}
        <View style={styles.sectionGap}>
          <Text style={styles.sectionTitle}>数据统计</Text>

          {loading ? (
            <View style={styles.card}>
              <ActivityIndicator size="large" color="#10B981" />
            </View>
          ) : stats ? (
            <>
              {/* Big Number Cards */}
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{stats.totalRecordedDays}</Text>
                  <Text style={styles.statLabel}>记录天数</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statNumber, { color: '#6366F1' }]}>
                    {stats.totalDeficit.toLocaleString()}
                  </Text>
                  <Text style={styles.statLabel}>累计缺口(kcal)</Text>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={[styles.statNumber, { color: '#F59E0B' }]}>
                    {stats.totalCalorieConsumed.toLocaleString()}
                  </Text>
                  <Text style={styles.statLabel}>总摄入(kcal)</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statNumber, { color: '#8B5CF6' }]}>
                    {stats.achievementRate}%
                  </Text>
                  <Text style={styles.statLabel}>达标率</Text>
                </View>
              </View>

              {/* Extra Info Row */}
              <View style={styles.card}>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                  <Text style={styles.infoText}>
                    首次记录: {stats.firstRecordDate}  ·  已坚持 <Text style={styles.infoBold}>{stats.totalDaysSinceFirst}</Text> 天
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="trending-up-outline" size={18} color="#6B7280" />
                  <Text style={styles.infoText}>
                    日均摄入 <Text style={styles.infoBold}>{stats.avgCaloriePerDay}</Text> kcal
                  </Text>
                </View>
                {stats.topFood && stats.topFood.length > 0 && (
                  <View style={styles.infoRow}>
                    <Ionicons name="restaurant-outline" size={18} color="#6B7280" />
                    <Text style={styles.infoText}>
                      最爱食材: <Text style={styles.infoBold}>{stats.topFood[0]}</Text> (出现了 {stats.topFood[1]} 次)
                    </Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#6B7280" />
                  <Text style={styles.infoText}>
                    达标 <Text style={styles.infoBold}>{stats.totalAchievedDays}</Text> 天 / {stats.totalRecordedDays} 天
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.card}>
              <Text style={styles.emptyText}>暂无数据，开始记录吧</Text>
            </View>
          )}
        </View>

        {/* Food Management */}
        <View style={styles.sectionGap}>
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

        {/* Bottom */}
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
  center: {
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  goalsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
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
  sectionGap: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#10B981',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  infoBold: {
    fontWeight: '700',
    color: '#111827',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 12,
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