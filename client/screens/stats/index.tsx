import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { TabButton, NutritionBar } from '@/components/common';
import { useUser } from '@/contexts/UserContext';
import { api, StatsSummary } from '@/utils/api';
import Svg, { Path, Circle, Line, Text as SvgText, G, Rect } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;

type ViewMode = 'week' | 'month';

function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getWeekRange() {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 6);
  return { start: formatDateStr(start), end: formatDateStr(today) };
}

function getMonthRange() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  return { start: formatDateStr(start), end: formatDateStr(today) };
}

interface TrendPoint {
  date: string;
  label: string;
  value: number;
  goal: number;
}

export default function StatsScreen() {
  const { user } = useUser();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const range = viewMode === 'week' ? getWeekRange() : getMonthRange();
      const res = await api.getTrendData(user.id, range.start, range.end);
      setSummary(res.summary);
      setTrend(
        res.trend.map((d: any) => {
          const dt = new Date(d.stat_date);
          const label = `${dt.getMonth() + 1}/${dt.getDate()}`;
          return {
            date: d.stat_date,
            label,
            value: d.total_calorie,
            goal: d.daily_calorie_goal || user.daily_calorie_goal,
          };
        })
      );
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user, viewMode]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const goalCalorie = summary?.goalCalorie || user?.daily_calorie_goal || 1800;

  // ====== Chart Rendering ======
  const renderChart = () => {
    if (trend.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartText}>暂无数据</Text>
          <Text style={styles.emptyChartSubText}>添加饮食记录后即可查看趋势</Text>
        </View>
      );
    }

    const chartHeight = 210;
    const paddingLeft = 42;
    const paddingRight = 20;
    const paddingTop = 28;
    const paddingBottom = 32;

    const innerW = CHART_WIDTH - paddingLeft - paddingRight;
    const innerH = chartHeight - paddingTop - paddingBottom;

    const allValues = trend.map((d) => d.value);
    const allGoals = trend.map((d) => d.goal);
    const maxVal = Math.max(...allValues, ...allGoals, goalCalorie) * 1.12;
    const minVal = 0;

    const getX = (i: number) =>
      paddingLeft + (i / Math.max(trend.length - 1, 1)) * innerW;
    const getY = (v: number) =>
      paddingTop + innerH - ((v - minVal) / (maxVal - minVal)) * innerH;

    // Area fill path
    const areaPath =
      trend
        .map((d, i) => {
          const x = getX(i);
          const y = getY(d.value);
          return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
        })
        .join(' ') +
      ` L ${getX(trend.length - 1)} ${getY(minVal)} L ${getX(0)} ${getY(minVal)} Z`;

    // Line path
    const linePath = trend
      .map((d, i) => {
        const x = getX(i);
        const y = getY(d.value);
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(' ');

    // Goal line Y
    const goalY = getY(goalCalorie);
    const isAboveGoal = trend.some((d) => d.value > goalCalorie);

    return (
      <Svg width={CHART_WIDTH} height={chartHeight}>
        {/* Y-axis grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = paddingTop + innerH * (1 - ratio);
          const val = Math.round(minVal + (maxVal - minVal) * ratio);
          return (
            <G key={i}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={CHART_WIDTH - paddingRight}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              <SvgText
                x={paddingLeft - 8}
                y={y + 4}
                fontSize={10}
                fill="#9CA3AF"
                textAnchor="end"
              >
                {val}
              </SvgText>
            </G>
          );
        })}

        {/* Area fill under line */}
        <Path
          d={areaPath}
          fill="rgba(16,185,129,0.08)"
        />

        {/* Goal line */}
        <Line
          x1={paddingLeft}
          y1={goalY}
          x2={CHART_WIDTH - paddingRight}
          y2={goalY}
          stroke={isAboveGoal ? '#EF4444' : '#10B981'}
          strokeWidth={2}
          strokeDasharray="6,4"
        />
        <G>
          <Rect
            x={CHART_WIDTH - paddingRight - 40}
            y={Math.max(goalY - 22, 2)}
            width={42}
            height={18}
            rx={4}
            fill={isAboveGoal ? '#FEE2E2' : '#D1FAE5'}
          />
          <SvgText
            x={CHART_WIDTH - paddingRight - 19}
            y={Math.max(goalY - 9, 11)}
            fontSize={10}
            fontWeight="600"
            fill={isAboveGoal ? '#EF4444' : '#059669'}
            textAnchor="middle"
          >
            目标 {goalCalorie}
          </SvgText>
        </G>

        {/* Data line */}
        <Path
          d={linePath}
          fill="none"
          stroke="#10B981"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data dots */}
        {trend.map((d, i) => {
          const x = getX(i);
          const y = getY(d.value);
          const isOver = d.value > d.goal;
          return (
            <G key={i}>
              <Circle cx={x} cy={y} r={6} fill="#FFFFFF" stroke="#10B981" strokeWidth={2.5} />
              {isOver && (
                <Circle cx={x} cy={y} r={3} fill="#F59E0B" />
              )}
            </G>
          );
        })}

        {/* X-axis labels */}
        {trend.map((d, i) => {
          const x = getX(i);
          return (
            <SvgText
              key={i}
              x={x}
              y={chartHeight - 6}
              fontSize={10}
              fill="#9CA3AF"
              textAnchor="middle"
            >
              {d.label}
            </SvgText>
          );
        })}
      </Svg>
    );
  };

  // ====== Render ======
  return (
    <Screen style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10B981"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>数据统计</Text>
          <Text style={styles.subtitle}>
            {viewMode === 'week' ? '最近 7 天（含今天）' : '最近 30 天（含今天）'}
          </Text>
        </View>

        {/* Period Selector */}
        <View style={styles.modeSelector}>
          <TabButton
            label="本周"
            active={viewMode === 'week'}
            onPress={() => setViewMode('week')}
          />
          <TabButton
            label="本月"
            active={viewMode === 'month'}
            onPress={() => setViewMode('month')}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
          </View>
        ) : (
          <>
            {/* Stats Summary Cards */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="flame" size={20} color="#059669" />
                </View>
                <Text style={styles.statValue}>{summary?.avgCalorie || 0}</Text>
                <Text style={styles.statLabel}>日均摄入（千卡）</Text>
                <Text style={styles.statHint}>
                  共 {summary?.daysWithRecords || 0} 天有记录
                </Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="flag" size={20} color="#4F46E5" />
                </View>
                <Text style={[styles.statValue, { color: '#6366F1' }]}>
                  {summary?.achievementRate || 0}%
                </Text>
                <Text style={styles.statLabel}>目标达成率</Text>
                <Text style={styles.statHint}>
                  {summary?.achievedDays || 0}/{summary?.daysWithRecords || 0} 天
                </Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="checkmark-circle" size={20} color="#D97706" />
                </View>
                <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                  {summary?.achievedDays || 0}
                </Text>
                <Text style={styles.statLabel}>达标天数</Text>
                <Text style={styles.statHint}>
                  摄入 ≤ {goalCalorie} 千卡
                </Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#FCE7F3' }]}>
                  <Ionicons name="trending-down" size={20} color="#DB2777" />
                </View>
                <Text style={[styles.statValue, { color: '#EC4899' }]}>
                  {summary?.totalDeficit || 0}
                </Text>
                <Text style={styles.statLabel}>累计缺口（千卡）</Text>
                <Text style={styles.statHint}>
                  {goalCalorie}×{summary?.daysWithRecords || 0}天 - {summary?.avgCalorie || 0}×{summary?.daysWithRecords || 0}天
                </Text>
              </View>
            </View>

            {/* Calorie Trend Chart */}
            <View style={styles.chartCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>热量趋势</Text>
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.legendText}>实际摄入</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#EF4444', borderStyle: 'dashed' }]} />
                    <Text style={styles.legendText}>目标线</Text>
                  </View>
                </View>
              </View>
              {renderChart()}
            </View>

            {/* Nutrition Average */}
            <View style={styles.nutritionCard}>
              <Text style={styles.sectionTitle}>
                营养摄入平均
                <Text style={styles.sectionSub}>
                  {' '}（{summary?.daysWithRecords || 0} 天平均）
                </Text>
              </Text>
              <NutritionBar
                label="碳水化合物"
                current={summary?.avgCarb || 0}
                goal={user?.daily_carb_goal || 250}
                color="#10B981"
                unit="g"
              />
              <NutritionBar
                label="蛋白质"
                current={summary?.avgProtein || 0}
                goal={user?.daily_protein_goal || 80}
                color="#6366F1"
                unit="g"
              />
              <NutritionBar
                label="脂肪"
                current={summary?.avgFat || 0}
                goal={user?.daily_fat_goal || 60}
                color="#F59E0B"
                unit="g"
              />
            </View>

            {/* Tips */}
            <View style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>健康提示</Text>
              <Text style={styles.tipsText}>
                {!summary || summary.daysWithRecords === 0
                  ? '开始记录你的饮食吧！坚持记录才能更好地了解自己的饮食习惯。'
                  : summary.achievementRate >= 80
                  ? '太棒了！你很好地控制了每日热量摄入，继续保持！'
                  : summary.achievementRate >= 50
                  ? '不错！大部分时间都在控制范围内，继续加油！'
                  : '你的热量摄入需要多加留意，建议适当减少高热量食物的份量。'}
              </Text>
            </View>

            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  modeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    gap: 8,
  },
  loadingContainer: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ====== Stats Summary Grid ======
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    width: (SCREEN_WIDTH - 56) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#10B981',
  },
  statLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    marginTop: 2,
  },
  statHint: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  // ====== Chart Card ======
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  sectionSub: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
  },
  emptyChart: {
    height: 210,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  emptyChartSubText: {
    fontSize: 12,
    color: '#D1D5DB',
    marginTop: 4,
  },
  // ====== Nutrition Card ======
  nutritionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  // ====== Tips ======
  tipsCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
});