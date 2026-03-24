import '../global.css';
import '../src/core/i18n'; // initialize i18n before any screens render
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Linking } from 'react-native';
import i18n from 'i18next';
import { supabase } from '../src/core/services/supabase';
import { useAuthStore } from '../src/store/useAuthStore';
import { useAppStore } from '../src/store/useAppStore';
import { waitForBackend } from '../src/core/api/client';
import { BackendSplash } from '../src/components/BackendSplash';
import { View, TouchableOpacity } from 'react-native';
import { AppText } from '../src/components/AppText';
import { Ionicons } from '@expo/vector-icons';

export default function RootLayout() {
  const { initialize, user, isLoading } = useAuthStore();
  const { isOnboardingComplete, language } = useAppStore();
  const segments = useSegments() as string[];
  const router = useRouter();

  const [isBackendReady, setIsBackendReady] = useState(false);
  const [backendError, setBackendError] = useState<Error | null>(null);
  const [isCheckingBackend, setIsCheckingBackend] = useState(true);

  const mountedRef = useRef(true);

  const checkBackend = useCallback(async () => {
    setIsCheckingBackend(true);
    setBackendError(null);
    try {
      await waitForBackend();
      if (mountedRef.current) {
        setIsBackendReady(true);
        setIsCheckingBackend(false);
      }
    } catch (error) {
      console.error('Backend failed to wake up:', error);
      if (mountedRef.current) {
        setBackendError(error instanceof Error ? error : new Error('Unknown error'));
        setIsBackendReady(false);
        setIsCheckingBackend(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    checkBackend();
    return () => {
      mountedRef.current = false;
    };
  }, [checkBackend]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Handle magic link deep links (miru://login-callback?...)
  useEffect(() => {
    const handleUrl = async (url: string) => {
      if (!url) return;
      // Supabase appends #access_token=... or ?code=... to the redirect URL
      const sanitized = url.replace('#', '?');
      const params = new URLSearchParams(sanitized.split('?')[1] ?? '');
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const code = params.get('code');

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      } else if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
    };

    // App opened from a deep link while closed
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    // App foregrounded via deep link
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

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
      <View className="flex-1 bg-white items-center justify-center p-6">
        <StatusBar style="dark" />
        <View className="w-20 h-20 rounded-full bg-red-50 items-center justify-center mb-6">
          <Ionicons name="cloud-offline" size={36} color="#DC2626" />
        </View>
        <AppText variant="h2" className="text-center mb-3">
          Server Unavailable
        </AppText>
        <AppText color="muted" className="text-center mb-8 leading-6">
          We're having trouble waking up the AI servers. They might be resting or temporarily
          unavailable.
        </AppText>
        <TouchableOpacity
          onPress={checkBackend}
          className="bg-blue-600 px-6 py-3.5 rounded-2xl flex-row items-center gap-2"
        >
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
          <AppText className="text-white font-semibold text-base">Try Again</AppText>
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
