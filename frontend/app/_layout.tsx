import '../global.css';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../src/store/useAuthStore';
import { useAppStore } from '../src/store/useAppStore';
import { waitForBackend } from '../src/core/api/client';
import { BackendSplash } from '../src/components/BackendSplash';
import { View, TouchableOpacity } from 'react-native';
import { AppText } from '../src/components/AppText';
import { Ionicons } from '@expo/vector-icons';

export default function RootLayout() {
  const { initialize, user, isLoading } = useAuthStore();
  const { isOnboardingComplete } = useAppStore();
  const segments = useSegments() as string[];
  const router = useRouter();

  const [isBackendReady, setIsBackendReady] = useState(false);
  const [backendError, setBackendError] = useState<Error | null>(null);
  const [isCheckingBackend, setIsCheckingBackend] = useState(true);

  const checkBackend = useCallback(async () => {
    let mounted = true;
    setIsCheckingBackend(true);
    setBackendError(null);
    try {
      await waitForBackend();
      if (mounted) {
        setIsBackendReady(true);
        setIsCheckingBackend(false);
      }
    } catch (error) {
      console.error('Backend failed to wake up:', error);
      if (mounted) {
        setBackendError(error instanceof Error ? error : new Error('Unknown error'));
        setIsBackendReady(false);
        setIsCheckingBackend(false);
      }
    }
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const cleanup = checkBackend();
    return () => {
      cleanup.then((fn) => fn());
    };
  }, [checkBackend]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    // Wait until both the backend is confirmed alive and auth is initialized
    if (!isBackendReady || isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isOnboardingComplete && segments[1] !== 'onboarding') {
      router.replace('/(auth)/onboarding');
      return;
    }

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup && segments[1] !== 'onboarding') {
      router.replace('/(main)/home');
    }
  }, [user, isLoading, segments, isOnboardingComplete, router, isBackendReady]);

  if (backendError && !isCheckingBackend) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <StatusBar style="dark" />
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#FEF2F2',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <Ionicons name="cloud-offline" size={36} color="#DC2626" />
        </View>
        <AppText variant="h2" style={{ textAlign: 'center', marginBottom: 12 }}>
          Server Unavailable
        </AppText>
        <AppText color="muted" style={{ textAlign: 'center', marginBottom: 32, lineHeight: 24 }}>
          We're having trouble waking up the AI servers. They might be resting or temporarily
          unavailable.
        </AppText>
        <TouchableOpacity
          onPress={checkBackend}
          style={{
            backgroundColor: '#2563EB',
            paddingHorizontal: 24,
            paddingVertical: 14,
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
          <AppText style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 16 }}>Try Again</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isBackendReady) {
    return (
      <>
        <StatusBar style="dark" />
        <BackendSplash />
      </>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(main)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
