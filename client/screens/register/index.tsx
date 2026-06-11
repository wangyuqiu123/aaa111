import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useAuth } from '@/contexts/AuthContext';

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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <Text style={{
            textAlign: 'center',
            fontSize: 28,
            fontWeight: '700',
            color: '#111827',
            marginBottom: 8,
          }}>
            创建账号
          </Text>
          <Text style={{
            textAlign: 'center',
            fontSize: 15,
            color: '#6B7280',
            marginBottom: 40,
          }}>
            注册后即可同步数据到云端
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

          {/* Email */}
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

          {/* Password */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            paddingHorizontal: 16,
            height: 52,
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
          }}>
            <TextInput
              placeholder="密码（至少6位）"
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

          {/* Confirm Password */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            paddingHorizontal: 16,
            height: 52,
            justifyContent: 'center',
            marginBottom: 24,
          }}>
            <TextInput
              placeholder="确认密码"
              placeholderTextColor="#9CA3AF"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              style={{ fontSize: 16, color: '#111827' }}
            />
          </View>

          {/* Register Button */}
          <TouchableOpacity
            onPress={handleRegister}
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
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>注册</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ alignItems: 'center', padding: 8 }}
          >
            <Text style={{ color: '#6B7280', fontSize: 14 }}>
              已有账号？<Text style={{ color: '#10B981', fontWeight: '500' }}>去登录</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}