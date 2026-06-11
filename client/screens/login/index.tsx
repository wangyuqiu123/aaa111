import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image, Dimensions, Alert } from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const APP_ICON = 'https://coze-coding-project.tos.coze.site/coze_storage_7649592147167084584/image/generate_image_e912d092-db8f-4d9a-ab05-028d2ab36bf3.jpeg?sign=1812705693-67e08b61bf-0-270c30288a868fa8d62e3a9ee4326f4a2838fd4a57aae33842ec06cb1e86fb8a';

export default function LoginScreen() {
  const router = useSafeRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

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

  const handleForgotPassword = () => {
    Alert.alert('提示', '密码重置功能开发中，敬请期待');
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
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ===== Brand Section ===== */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Image
              source={{ uri: APP_ICON }}
              style={{ width: 72, height: 72, borderRadius: 18 }}
            />
            <Text style={{
              fontSize: 26,
              fontWeight: '700',
              color: '#111827',
              marginTop: 14,
              letterSpacing: 0.5,
            }}>
              FitTrack
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#9CA3AF',
              marginTop: 4,
            }}>
              记录饮食 · 健康生活
            </Text>
          </View>

          {/* ===== Welcome ===== */}
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
            color: '#9CA3AF',
            marginBottom: 28,
          }}>
            登录后继续记录你的健康饮食
          </Text>

          {/* ===== Error Message ===== */}
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

          {/* ===== Email Input ===== */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            paddingHorizontal: 16,
            height: 50,
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
              style={{ flex: 1, fontSize: 15, color: '#111827' }}
            />
          </View>

          {/* ===== Password Input ===== */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            paddingHorizontal: 16,
            height: 50,
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
            borderWidth: 1,
            borderColor: '#E5E7EB',
          }}>
            <Ionicons name="lock-closed-outline" size={20} color="#10B981" style={{ marginRight: 10 }} />
            <TextInput
              placeholder="密码"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={{ flex: 1, fontSize: 15, color: '#111827' }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* ===== Remember Me + Forgot Password ===== */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 28,
          }}>
            <TouchableOpacity
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                borderWidth: 1.5,
                borderColor: rememberMe ? '#10B981' : '#D1D5DB',
                backgroundColor: rememberMe ? '#10B981' : 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 8,
              }}>
                {rememberMe && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text style={{ fontSize: 14, color: '#111827' }}>记住登录</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleForgotPassword} activeOpacity={0.7}>
              <Text style={{ fontSize: 14, color: '#10B981', fontWeight: '500' }}>忘记密码？</Text>
            </TouchableOpacity>
          </View>

          {/* ===== Login Button ===== */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
            style={{
              backgroundColor: '#059669',
              borderRadius: 12,
              height: 50,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#059669',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>登录</Text>
            )}
          </TouchableOpacity>

          {/* ===== Divider ===== */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 28,
            marginBottom: 24,
          }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
            <Text style={{ marginHorizontal: 12, fontSize: 13, color: '#9CA3AF' }}>或</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
          </View>

          {/* ===== Register Link ===== */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#9CA3AF' }}>还没有账号？</Text>
            <TouchableOpacity onPress={() => router.push('/register')} activeOpacity={0.7}>
              <Text style={{ fontSize: 14, color: '#10B981', fontWeight: '600', marginLeft: 4 }}>
                立即注册
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}