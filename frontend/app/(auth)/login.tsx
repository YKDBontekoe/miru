import React, { useState, useRef } from 'react';
import { View, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { AppButton } from '@/components/AppButton';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/hooks/useTheme';
import { ScalePressable } from '@/components/ScalePressable';

type AuthMode = 'magic-link' | 'password' | 'passkey';

function ErrorBanner({ message }: { message: string }) {
  const { C } = useTheme();

  return (
    <View
      className="flex-row items-start border rounded-lg p-md mb-md"
      style={{ backgroundColor: C.dangerSurface, borderColor: C.danger }}
    >
      <Ionicons name="alert-circle-outline" size={16} color={C.danger} style={{ marginTop: 1 }} />
      <AppText variant="caption" className="flex-1 ml-xs" style={{ color: C.danger }}>
        {message}
      </AppText>
    </View>
  );
}

function ModeTab({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: string;
  active: boolean;
  onPress: () => void;
}) {
  const { C } = useTheme();

  return (
    <ScalePressable
      onPress={onPress}
      className="flex-1 flex-row items-center justify-center py-sm gap-xs rounded-md"
      style={{ backgroundColor: active ? C.primary : 'transparent' }}
    >
      <Ionicons name={icon as any} size={14} color={active ? '#FFFFFF' : C.muted} />
      <AppText
        variant="caption"
        style={{ color: active ? '#FFFFFF' : C.muted, fontWeight: active ? '600' : 'normal' }}
      >
        {label}
      </AppText>
    </ScalePressable>
  );
}

export default function LoginScreen() {
  const [mode, setMode] = useState<AuthMode>('magic-link');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null);
  const passwordRef = useRef<TextInput>(null);

  const { signInWithMagicLink, signInWithPassword, signInWithPasskey } = useAuthStore();
  const { isDark, C } = useTheme();

  const validateEmail = () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleMagicLink = async () => {
    if (!validateEmail()) return;
    setIsLoading(true);
    setError(null);
    try {
      await signInWithMagicLink(email.trim());
      setMagicLinkSent(true);
    } catch (e: any) {
      setError(e.message || 'Failed to send magic link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePassword = async () => {
    if (!validateEmail()) return;
    if (!password) {
      setError('Please enter your password');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await signInWithPassword(email.trim(), password);
    } catch (e: any) {
      setError(e?.message || 'Incorrect email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskey = async () => {
    if (!validateEmail()) return;
    setIsLoading(true);
    setError(null);
    try {
      await signInWithPasskey(email.trim());
    } catch (e: any) {
      setError(e.message || 'Passkey authentication failed. Please try another method.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setMagicLinkSent(false);
  };

  const formCardShadow = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 8,
    },
    android: {
      elevation: isDark ? 4 : 2,
    },
  });

  const textInputPlatformStyles = Platform.select({
    web: { outlineWidth: 0 },
    default: {},
  });

  if (magicLinkSent) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: C.bg }}>
        <View className="flex-1 justify-center items-center px-xl">
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-xl"
            style={{ backgroundColor: C.primarySurface }}
          >
            <Ionicons name="mail-outline" size={32} color={C.primary} />
          </View>
          <AppText variant="h2" className="mb-sm text-center">
            Check your email
          </AppText>
          <AppText
            variant="body"
            color="muted"
            className="text-center mb-xxxl"
            style={{ lineHeight: 24 }}
          >
            We sent a magic link to{'\n'}
            <AppText variant="body" className="font-semibold">
              {email.trim()}
            </AppText>
            {'\n\n'}
            Tap the link in the email to sign in. It will expire in 1 hour.
          </AppText>
          <AppButton
            label="Use a different email"
            variant="outline"
            onPress={() => {
              setMagicLinkSent(false);
              setError(null);
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-xl py-xl">
            {/* Logo */}
            <View className="items-center mb-xxxl">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-lg"
                style={{ backgroundColor: C.primarySurface }}
              >
                <Ionicons name="sparkles" size={28} color={C.primary} />
              </View>
              <AppText variant="h1" className="mb-xs">
                Miru
              </AppText>
              <AppText
                variant="body"
                color="muted"
                className="text-center"
                style={{ lineHeight: 22 }}
              >
                {mode === 'magic-link' && 'Sign in with a one-time link sent to your email.'}
                {mode === 'password' && 'Sign in with your email and password.'}
                {mode === 'passkey' && 'Sign in with your biometrics or security key.'}
              </AppText>
            </View>

            {/* Mode selector */}
            <View
              className="flex-row rounded-lg p-xs mb-xl border"
              style={{ backgroundColor: C.surfaceHigh, borderColor: C.border }}
            >
              <ModeTab
                label="Magic Link"
                icon="mail-outline"
                active={mode === 'magic-link'}
                onPress={() => switchMode('magic-link')}
              />
              <ModeTab
                label="Password"
                icon="lock-closed-outline"
                active={mode === 'password'}
                onPress={() => switchMode('password')}
              />
              <ModeTab
                label="Passkey"
                icon="finger-print-outline"
                active={mode === 'passkey'}
                onPress={() => switchMode('passkey')}
              />
            </View>

            {/* Form card */}
            <View
              className="rounded-xl border p-lg mb-lg"
              style={[{ backgroundColor: C.surfaceHigh, borderColor: C.border }, formCardShadow]}
            >
              {/* Email */}
              <AppText variant="caption" color="muted" className="mb-xs ml-xs">
                Email address
              </AppText>
              <View
                className="flex-row items-center h-[48px] rounded-lg border px-md mb-lg"
                style={{
                  backgroundColor: focusedInput === 'email' ? C.surface : C.bg,
                  borderColor: focusedInput === 'email' ? C.primary : C.border,
                }}
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={focusedInput === 'email' ? C.primary : C.muted}
                />
                <TextInput
                  className="flex-1 ml-sm text-[15px]"
                  style={[{ color: C.text }, textInputPlatformStyles]}
                  placeholder="you@example.com"
                  placeholderTextColor={C.muted}
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    setError(null);
                  }}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  returnKeyType={mode === 'password' ? 'next' : 'done'}
                  onSubmitEditing={() => {
                    if (mode === 'magic-link') {
                      handleMagicLink();
                    } else if (mode === 'password') {
                      passwordRef.current?.focus();
                    }
                  }}
                />
              </View>

              {/* Password field (password mode only) */}
              {mode === 'password' && (
                <>
                  <AppText variant="caption" color="muted" className="mb-xs ml-xs">
                    Password
                  </AppText>
                  <View
                    className="flex-row items-center h-[48px] rounded-lg border px-md mb-lg"
                    style={{
                      backgroundColor: focusedInput === 'password' ? C.surface : C.bg,
                      borderColor: focusedInput === 'password' ? C.primary : C.border,
                    }}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={focusedInput === 'password' ? C.primary : C.muted}
                    />
                    <TextInput
                      ref={passwordRef}
                      className="flex-1 ml-sm text-[15px]"
                      style={[{ color: C.text }, textInputPlatformStyles]}
                      placeholder="Enter your password"
                      placeholderTextColor={C.muted}
                      value={password}
                      onChangeText={(t) => {
                        setPassword(t);
                        setError(null);
                      }}
                      onFocus={() => setFocusedInput('password')}
                      onBlur={() => setFocusedInput(null)}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      returnKeyType="done"
                      onSubmitEditing={handlePassword}
                    />
                    <ScalePressable onPress={() => setShowPassword((s) => !s)} className="p-xs">
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={C.muted}
                      />
                    </ScalePressable>
                  </View>
                </>
              )}

              {/* Passkey hint */}
              {mode === 'passkey' && (
                <View
                  className="flex-row items-start rounded-lg p-md mb-lg"
                  style={{ backgroundColor: C.primarySurface }}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={C.primary}
                    style={{ marginTop: 1 }}
                  />
                  <AppText
                    variant="caption"
                    className="flex-1 ml-xs"
                    style={{ color: C.primary, lineHeight: 18 }}
                  >
                    Your device will prompt you to authenticate with Face ID, Touch ID, or a
                    security key.
                  </AppText>
                </View>
              )}

              {/* Error */}
              {error && <ErrorBanner message={error} />}

              {/* Submit */}
              <AppButton
                label={
                  mode === 'magic-link'
                    ? 'Send magic link'
                    : mode === 'password'
                      ? 'Sign in'
                      : 'Sign in with passkey'
                }
                onPress={
                  mode === 'magic-link'
                    ? handleMagicLink
                    : mode === 'password'
                      ? handlePassword
                      : handlePasskey
                }
                isLoading={isLoading}
              />
            </View>

            {/* Footer note */}
            <AppText
              variant="caption"
              color="muted"
              className="text-center"
              style={{ lineHeight: 18 }}
            >
              By signing in you agree to keep your account secure.{'\n'}
              Magic links expire after 1 hour.
            </AppText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
