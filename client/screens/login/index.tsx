import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useAuth } from '@/contexts/AuthContext';

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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* App Icon */}
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <Image
              source={{ uri: APP_ICON }}
              style={{ width: 72, height: 72, borderRadius: 16 }}
            />
          </View>

          {/* App Name */}
          <Text style={{
            textAlign: 'center',
            fontSize: 24,
            fontWeight: '700',
            color: '#111827',
            marginBottom: 40,
          }}>
            FitTrack
          </Text>

          {/* Error Message */}
          {errorMsg ? (
            <View style={{
              backgroundColor: '#FEF2F2',
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
            }}>
              <Text style={{ color: '#DC2626', fontSize: 14, textAlign: 'center' }}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Email Input */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            paddingHorizontal: 16,
            height: 52,
            justifyContent: 'center',
            marginBottom: 12,
          }}>
            <TextInput
              placeholder="邮箱"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={{ fontSize: 16, color: '#111827' }}
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
            marginBottom: 24,
          }}>
            <TextInput
              placeholder="密码"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={{ flex: 1, fontSize: 16, color: '#111827' }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 8 }}>
              <Text style={{ color: '#6B7280', fontSize: 14 }}>
                {showPassword ? '隐藏' : '显示'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={{
              backgroundColor: '#10B981',
              borderRadius: 12,
              height: 52,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>登录</Text>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <TouchableOpacity
            onPress={() => router.push('/register')}
            style={{ alignItems: 'center', padding: 8 }}
          >
            <Text style={{ color: '#6B7280', fontSize: 14 }}>
              还没有账号？<Text style={{ color: '#10B981', fontWeight: '500' }}>去注册</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}