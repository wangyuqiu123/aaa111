import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox, View, ActivityIndicator, Text } from 'react-native';
import { useEffect } from 'react';
import Toast from 'react-native-toast-message';
import { Provider } from '@/components/Provider';
import { useAuth } from '@/contexts/AuthContext';

import '../global.css';

LogBox.ignoreLogs([
  "TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found",
]);

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const rootState = useRootNavigationState();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!rootState?.key || isLoading) return;

    const inAuthPage = segments[0] === 'login' || segments[0] === 'register';

    if (!isAuthenticated && !inAuthPage) {
      router.replace('/login');
    }
  }, [rootState?.key, isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' }}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 14 }}>加载中...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <Provider>
      <StatusBar style="dark" />
      <AuthGuard>
        <Stack
          screenOptions={{
            animation: 'slide_from_right',
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            headerShown: false
          }}
        >
          <Stack.Screen name="(tabs)" options={{ title: "" }} />
          <Stack.Screen name="search-food" options={{ title: "搜索食物" }} />
          <Stack.Screen name="add-food" options={{ title: "添加食物" }} />
          <Stack.Screen name="goal-settings" options={{ title: "目标设置" }} />
          <Stack.Screen name="food-manage" options={{ title: "食物管理" }} />
          <Stack.Screen name="login" options={{ title: "登录" }} />
          <Stack.Screen name="register" options={{ title: "注册" }} />
        </Stack>
      </AuthGuard>
      <Toast />
    </Provider>
  );
}
