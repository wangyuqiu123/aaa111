import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ===== Hero Header ===== */}
          <View style={{
            backgroundColor: '#059669',
            height: 220,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            paddingTop: Platform.OS === 'ios' ? 60 : 40,
            paddingHorizontal: 24,
            overflow: 'hidden',
          }}>
            {/* Decorative circles */}
            <View style={{
              position: 'absolute',
              top: -30,
              right: -20,
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: 'rgba(255,255,255,0.08)',
            }} />
            <View style={{
              position: 'absolute',
              bottom: 20,
              right: 80,
              width: 70,
              height: 70,
              borderRadius: 35,
              backgroundColor: 'rgba(255,255,255,0.06)',
            }} />
            <View style={{
              position: 'absolute',
              bottom: 60,
              left: -30,
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: 'rgba(255,255,255,0.05)',
            }} />

            {/* Header content */}
            <View style={{ alignItems: 'center', marginTop: 10 }}>
              <View style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                backgroundColor: 'rgba(255,255,255,0.2)',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Ionicons name="person-add" size={30} color="#FFFFFF" />
              </View>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 26,
                fontWeight: '700',
                marginTop: 12,
              }}>
                创建账号
              </Text>
              <Text style={{
                color: 'rgba(255,255,255,0.75)',
                fontSize: 14,
                marginTop: 4,
              }}>
                注册后即可同步数据到云端
              </Text>
            </View>
          </View>

          {/* ===== Form Card ===== */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            marginHorizontal: 20,
            marginTop: -36,
            paddingVertical: 28,
            paddingHorizontal: 24,
            shadowColor: '#059669',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.08,
            shadowRadius: 24,
            elevation: 8,
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
              backgroundColor: '#F9FAFB',
              borderRadius: 14,
              paddingHorizontal: 16,
              height: 52,
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}>
              <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
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
              backgroundColor: '#F9FAFB',
              borderRadius: 14,
              paddingHorizontal: 16,
              height: 52,
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}>
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
              <TextInput
                placeholder="密码（至少6位）"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={{ flex: 1, fontSize: 16, color: '#111827' }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Confirm Password Input */}
            <View style={{
              backgroundColor: '#F9FAFB',
              borderRadius: 14,
              paddingHorizontal: 16,
              height: 52,
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 28,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}>
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
              <TextInput
                placeholder="确认密码"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                style={{ flex: 1, fontSize: 16, color: '#111827' }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
              style={{
                backgroundColor: '#059669',
                borderRadius: 14,
                height: 52,
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'row',
                shadowColor: '#059669',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
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
          <View style={{ alignItems: 'center', marginTop: 28, marginBottom: 40 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}
            >
              <Ionicons name="chevron-back" size={18} color="#6B7280" />
              <Text style={{ color: '#6B7280', fontSize: 15, marginLeft: 2 }}>
                已有账号？
              </Text>
              <Text style={{ color: '#10B981', fontWeight: '600', fontSize: 15, marginLeft: 4 }}>
                去登录
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}