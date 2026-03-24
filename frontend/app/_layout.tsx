import '../global.css';
import '../src/core/i18n'; // initialize i18n before any screens render
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Linking } from 'react-native';
import i18n from 'i18next';
import { supabase } from '../src/core/services/supabase';
import { useAuthStore } from '../src/store/useAuthStore';
import { useAppStore } from '../src/store/useAppStore';

export default function RootLayout() {
  const { initialize, user, isLoading } = useAuthStore();
  const { isOnboardingComplete, language } = useAppStore();
  const segments = useSegments() as string[];
  const router = useRouter();

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
    if (isLoading) return;

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
  }, [user, isLoading, segments, isOnboardingComplete, router]);

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
