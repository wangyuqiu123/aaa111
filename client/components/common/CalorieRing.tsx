import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

interface CalorieRingProps {
  consumed: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
}

export function CalorieRing({ 
  consumed, 
  goal, 
  size = 200, 
  strokeWidth = 20 
}: CalorieRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(consumed / goal, 1.5); // 允许超过100%显示
  const strokeDashoffset = circumference * (1 - Math.min(percentage, 1));
  
  const remaining = Math.max(goal - consumed, 0);
  const isOverGoal = consumed > goal;
  
  // 颜色根据完成度变化
  let progressColor = '#10B981'; // 绿色
  if (percentage > 0.9) progressColor = '#F59E0B'; // 黄色警告
  if (percentage > 1) progressColor = '#EF4444'; // 红色超标

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* 背景圆环 */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* 进度圆环 */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      
      {/* 中心文字 */}
      <View style={styles.centerContent}>
        <Text style={styles.consumedText}>{consumed}</Text>
        <Text style={styles.unitText}>千卡</Text>
        <Text style={styles.remainingText}>
          {isOverGoal ? '超出' : '剩余'} {isOverGoal ? consumed - goal : remaining}
        </Text>
      </View>
    </View>
  );
}

interface NutritionRingProps {
  label: string;
  current: number;
  goal: number;
  color: string;
  size?: number;
}

export function NutritionRing({ 
  label, 
  current, 
  goal, 
  color,
  size = 80 
}: NutritionRingProps) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(current / goal, 1);
  const strokeDashoffset = circumference * (1 - percentage);

  return (
    <View style={[styles.nutritionItem, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={styles.nutritionCenter}>
        <Text style={[styles.nutritionValue, { color }]}>{current}g</Text>
        <Text style={styles.nutritionLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  consumedText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
  },
  unitText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  remainingText: {
    fontSize: 14,
    color: '#10B981',
    marginTop: 8,
    fontWeight: '500',
  },
  nutritionItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  nutritionCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  nutritionLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
});
