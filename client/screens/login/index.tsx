import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image, Dimensions } from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const APP_ICON = 'https://coze-coding-project.tos.coze.site/gen_project_icon/2026-06-10/7649589566105747490_1781060132.png?sign=4903205883-e3ef16590b-0-41f88161035c43f33fc42167c97f563c2791dfe0667db5d0ea0ee8faaaf0ba0e';

export default function LoginScreen() {
  const router = useSafeRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    setErrorMsg('');
    if (!email.trim()) {
      setErrorMsg('请输入邮箱');
      return;
    }
    if (!password) {
      setErrorMsg('请输入密码');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/');
    } catch (err: any) {
      setErrorMsg(err.message || '登录失败，请重试');
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
            backgroundColor: '#10B981',
            height: 260,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            paddingTop: Platform.OS === 'ios' ? 60 : 40,
            paddingHorizontal: 24,
            overflow: 'hidden',
          }}>
            {/* Decorative circles */}
            <View style={{
              position: 'absolute',
              top: -40,
              right: -30,
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: 'rgba(255,255,255,0.08)',
            }} />
            <View style={{
              position: 'absolute',
              top: 30,
              right: 60,
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(255,255,255,0.06)',
            }} />
            <View style={{
              position: 'absolute',
              bottom: 40,
              left: -20,
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: 'rgba(255,255,255,0.06)',
            }} />

            {/* App icon + name */}
            <View style={{ alignItems: 'center', marginTop: 10 }}>
              <Image
                source={{ uri: APP_ICON }}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.3)',
                }}
              />
              <Text style={{
                color: '#FFFFFF',
                fontSize: 28,
                fontWeight: '700',
                marginTop: 12,
                letterSpacing: 0.5,
              }}>
                FitTrack
              </Text>
              <Text style={{
                color: 'rgba(255,255,255,0.75)',
                fontSize: 14,
                marginTop: 4,
              }}>
                健康饮食，从记录开始
              </Text>
            </View>
          </View>

          {/* ===== Form Card ===== */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            marginHorizontal: 20,
            marginTop: -40,
            paddingVertical: 32,
            paddingHorizontal: 24,
            shadowColor: '#10B981',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.1,
            shadowRadius: 24,
            elevation: 8,
          }}>
            {/* Welcome */}
            <Text style={{
              fontSize: 22,
              fontWeight: '700',
              color: '#111827',
              marginBottom: 4,
            }}>
              欢迎回来
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#6B7280',
              marginBottom: 24,
            }}>
              登录以同步你的饮食数据
            </Text>

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
              marginBottom: 28,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}>
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
              <TextInput
                placeholder="密码"
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

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
              style={{
                backgroundColor: '#10B981',
                borderRadius: 14,
                height: 52,
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'row',
                shadowColor: '#10B981',
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
                  <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '600' }}>登录</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* ===== Footer ===== */}
          <View style={{ alignItems: 'center', marginTop: 28, marginBottom: 40 }}>
            <TouchableOpacity
              onPress={() => router.push('/register')}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}
            >
              <Text style={{ color: '#6B7280', fontSize: 15 }}>
                还没有账号？
              </Text>
              <Text style={{ color: '#10B981', fontWeight: '600', fontSize: 15, marginLeft: 4 }}>
                立即注册
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#10B981" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}