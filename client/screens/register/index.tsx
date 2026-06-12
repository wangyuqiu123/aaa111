import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Dimensions, Image } from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const APP_ICON = require('@/assets/diet-calorie-app-icon-log.png');

export default function RegisterScreen() {
  const router = useSafeRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async () => {
    setErrorMsg('');
    if (!email.trim()) {
      setErrorMsg('请输入邮箱');
      return;
    }
    if (!password) {
      setErrorMsg('请输入密码');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('密码长度不能少于6位');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('两次密码输入不一致');
      return;
    }

    setLoading(true);
    try {
      await register(email.trim(), password);
      router.replace('/');
    } catch (err: any) {
      setErrorMsg(err.message || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      {/* ===== Background Decorations ===== */}
      {/* Top-left semi-circle */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 200,
        height: 200,
        borderBottomRightRadius: 200,
        backgroundColor: 'rgba(16,185,129,0.07)',
      }} />
      {/* Bottom-right leaf shapes */}
      <View style={{
        position: 'absolute',
        bottom: 40,
        right: -10,
        width: 120,
        height: 160,
        borderTopLeftRadius: 120,
        backgroundColor: 'rgba(16,185,129,0.05)',
        transform: [{ rotate: '-10deg' }],
      }} />
      <View style={{
        position: 'absolute',
        bottom: 20,
        right: 40,
        width: 100,
        height: 140,
        borderTopLeftRadius: 100,
        backgroundColor: 'rgba(16,185,129,0.04)',
        transform: [{ rotate: '5deg' }],
      }} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ===== Brand Area ===== */}
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            {/* Logo Icon */}
            <View style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              backgroundColor: '#FFFFFF',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#10B981',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 12,
              elevation: 6,
              overflow: 'hidden',
            }}>
              <Image source={APP_ICON} style={{ width: 68, height: 68, borderRadius: 16 }} />
            </View>

            <Text style={{
              fontSize: 26,
              fontWeight: '700',
              color: '#111827',
              marginTop: 10,
              letterSpacing: 1,
            }}>
              FitTrack
            </Text>
            <Text style={{
              fontSize: 13,
              color: '#9CA3AF',
              marginTop: 2,
              letterSpacing: 0.5,
            }}>
              记录饮食 · 健康生活
            </Text>
          </View>

          {/* ===== Title Area ===== */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 24,
              fontWeight: '700',
              color: '#111827',
            }}>
              创建账号
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#9CA3AF',
              marginTop: 4,
            }}>
              注册后即可同步数据到云端
            </Text>
          </View>

          {/* ===== Form Card ===== */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            paddingVertical: 24,
            paddingHorizontal: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 16,
            elevation: 4,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.03)',
          }}>
            {/* Error Message */}
            {errorMsg ? (
              <View style={{
                backgroundColor: '#FEF2F2',
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text style={{ color: '#DC2626', fontSize: 14, flex: 1 }}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Email Input */}
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              paddingHorizontal: 16,
              height: 52,
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}>
              <Ionicons name="mail-outline" size={20} color="#10B981" style={{ marginRight: 10 }} />
              <TextInput
                placeholder="邮箱地址"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={{ flex: 1, fontSize: 16, color: '#111827' }}
              />
            </View>

            {/* Password Input */}
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              paddingHorizontal: 16,
              height: 52,
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}>
              <Ionicons name="lock-closed-outline" size={20} color="#10B981" style={{ marginRight: 10 }} />
              <TextInput
                placeholder="密码（至少6位）"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={{ flex: 1, fontSize: 16, color: '#111827' }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Confirm Password Input */}
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              paddingHorizontal: 16,
              height: 52,
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 24,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}>
              <Ionicons name="lock-closed-outline" size={20} color="#10B981" style={{ marginRight: 10 }} />
              <TextInput
                placeholder="确认密码"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                style={{ flex: 1, fontSize: 16, color: '#111827' }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
              style={{
                backgroundColor: '#059669',
                borderRadius: 12,
                height: 52,
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'row',
                shadowColor: '#059669',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
                elevation: 6,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '600' }}>注册</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* ===== Footer ===== */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 24,
            marginBottom: 40,
          }}>
            <Text style={{ color: '#9CA3AF', fontSize: 15 }}>已有账号？</Text>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ paddingVertical: 4 }}>
              <Text style={{ color: '#10B981', fontWeight: '600', fontSize: 15, marginLeft: 4 }}>
                立即登录
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}