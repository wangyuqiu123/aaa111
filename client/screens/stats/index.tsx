import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { TabButton, NutritionBar } from '@/components/common';
import { useUser } from '@/contexts/UserContext';
import { api, TrendData } from '@/utils/api';
import Svg, { Path, Circle, Line, Text as SvgText, G } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ViewMode = 'week' | 'month';

interface ChartData {
  date: string;
  value: number;
  goal: number;
}

export default function StatsScreen() {
  const { user } = useUser();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    try {
      const days = viewMode === 'week' ? 7 : 30;
      const data = await api.getTrendData(user.id, days);
      setTrendData(data);
    } catch (error) {
      console.error('Error fetching trend data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, viewMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // 计算统计数据
  const stats = {
    avgCalorie: trendData.length > 0 
      ? Math.round(trendData.reduce((sum, d) => sum + d.total_calorie, 0) / trendData.length)
      : 0,
    totalDays: trendData.length,
    achievedDays: trendData.filter(d => d.total_calorie <= (d.daily_calorie_goal || 1800)).length,
    totalCarb: trendData.reduce((sum, d) => sum + d.total_carb, 0) / Math.max(trendData.length, 1),
    totalProtein: trendData.reduce((sum, d) => sum + d.total_protein, 0) / Math.max(trendData.length, 1),
    totalFat: trendData.reduce((sum, d) => sum + d.total_fat, 0) / Math.max(trendData.length, 1),
  };

  const goal = user?.daily_calorie_goal || 1800;
  const achieveRate = stats.totalDays > 0 ? Math.round((stats.achievedDays / stats.totalDays) * 100) : 0;

  // 渲染热量趋势图表
  const renderChart = () => {
    if (trendData.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartText}>暂无数据</Text>
        </View>
      );
    }

    const chartWidth = SCREEN_WIDTH - 64;
    const chartHeight = 200;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const innerWidth = chartWidth - paddingLeft - paddingRight;
    const innerHeight = chartHeight - paddingTop - paddingBottom;

    const maxValue = Math.max(...trendData.map(d => Math.max(d.total_calorie, d.daily_calorie_goal || 1800))) * 1.1;
    const minValue = 0;

    const getX = (index: number) => paddingLeft + (index / Math.max(trendData.length - 1, 1)) * innerWidth;
    const getY = (value: number) => paddingTop + innerHeight - ((value - minValue) / (maxValue - minValue)) * innerHeight;

    // 生成路径
    const linePath = trendData.map((d, i) => {
      const x = getX(i);
      const y = getY(d.total_calorie);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(' ');

    // 目标线
    const goalY = getY(goal);

    // 数据点
    const dots = trendData.map((d, i) => {
      const x = getX(i);
      const y = getY(d.total_calorie);
      return { x, y, date: d.stat_date };
    });

    return (
      <Svg width={chartWidth} height={chartHeight}>
        {/* Y轴网格线 */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = paddingTop + innerHeight * (1 - ratio);
          const value = Math.round(minValue + (maxValue - minValue) * ratio);
          return (
            <G key={i}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
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
                {value}
              </SvgText>
            </G>
          );
        })}

        {/* 目标线 */}
        <Line
          x1={paddingLeft}
          y1={goalY}
          x2={chartWidth - paddingRight}
          y2={goalY}
          stroke="#10B981"
          strokeWidth={2}
          strokeDasharray="6,4"
        />
        <SvgText
          x={chartWidth - paddingRight}
          y={goalY - 6}
          fontSize={10}
          fill="#10B981"
          textAnchor="end"
        >
          目标
        </SvgText>

        {/* 折线 */}
        <Path
          d={linePath}
          fill="none"
          stroke="#10B981"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 数据点 */}
        {dots.map((dot, i) => (
          <Circle
            key={i}
            cx={dot.x}
            cy={dot.y}
            r={5}
            fill="#FFFFFF"
            stroke="#10B981"
            strokeWidth={2}
          />
        ))}

        {/* X轴标签 */}
        {trendData.map((d, i) => {
          const x = getX(i);
          const date = new Date(d.stat_date);
          const label = `${date.getMonth() + 1}/${date.getDate()}`;
          return (
            <SvgText
              key={i}
              x={x}
              y={chartHeight - 6}
              fontSize={10}
              fill="#9CA3AF"
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>
    );
  };

  return (
    <Screen style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>数据统计</Text>
        </View>

        {/* View Mode Selector */}
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

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.avgCalorie}</Text>
            <Text style={styles.statLabel}>日均摄入</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{achieveRate}%</Text>
            <Text style={styles.statLabel}>目标达成</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.achievedDays}</Text>
            <Text style={styles.statLabel}>达标天数</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>
              {Math.max(0, goal - stats.avgCalorie)}
            </Text>
            <Text style={styles.statLabel}>日均缺口</Text>
          </View>
        </View>

        {/* Calorie Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>热量趋势</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10B981" />
            </View>
          ) : (
            renderChart()
          )}
        </View>

        {/* Nutrition Average */}
        <View style={styles.nutritionCard}>
          <Text style={styles.sectionTitle}>营养摄入平均</Text>
          <NutritionBar
            label="碳水化合物"
            current={Math.round(stats.totalCarb)}
            goal={user?.daily_carb_goal || 250}
            color="#10B981"
          />
          <NutritionBar
            label="蛋白质"
            current={Math.round(stats.totalProtein)}
            goal={user?.daily_protein_goal || 80}
            color="#6366F1"
          />
          <NutritionBar
            label="脂肪"
            current={Math.round(stats.totalFat)}
            goal={user?.daily_fat_goal || 60}
            color="#F59E0B"
          />
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>健康提示</Text>
          <Text style={styles.tipsText}>
            {achieveRate >= 70 
              ? '太棒了！继续保持当前的饮食习惯，你正在稳步向目标迈进。'
              : achieveRate >= 40
              ? '不错！适当调整饮食结构，减少高热量食物的摄入，效果会更好。'
              : '建议关注每日热量摄入，减少油炸食品和甜食的摄入量。'}
          </Text>
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
  modeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    gap: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    width: (SCREEN_WIDTH - 56) / 2,
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
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#10B981',
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  nutritionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tipsCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    marginHorizontal: 16,
    padding: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
});
