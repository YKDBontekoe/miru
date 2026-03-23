import '../global.css';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../src/store/useAuthStore';
import { useAppStore } from '../src/store/useAppStore';
import { waitForBackend } from '../src/core/api/client';
import { BackendSplash } from '../src/components/BackendSplash';

export default function RootLayout() {
  const { initialize, user, isLoading } = useAuthStore();
  const { isOnboardingComplete } = useAppStore();
  const segments = useSegments() as string[];
  const router = useRouter();

  const [isBackendReady, setIsBackendReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkBackend = async () => {
      try {
        await waitForBackend();
        if (mounted) setIsBackendReady(true);
      } catch (error) {
        console.error('Backend failed to wake up:', error);
        // We still set it to true to let the app try, or handle the error gracefully elsewhere
        if (mounted) setIsBackendReady(true);
      }
    };

    checkBackend();

    return () => {
      mounted = false;
    };
  }, []);

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
