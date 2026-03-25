import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../src/components/AppText';
import { AppButton } from '../../src/components/AppButton';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useTranslation } from 'react-i18next';

type AuthMode = 'magic-link' | 'password' | 'passkey';

function ErrorBanner({ message }: { message: string }) {
  return (
    <View className="flex-row items-start bg-red-500/10 border border-red-500/30 rounded-lg p-md mb-md">
      <Ionicons name="alert-circle-outline" size={16} color="#EF4444" style={{ marginTop: 1 }} />
      <AppText variant="caption" className="flex-1 ms-xs text-red-400">
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
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-1 flex-row items-center justify-center py-sm gap-xs rounded-md ${
        active ? 'bg-primary' : 'bg-transparent'
      }`}
    >
      <Ionicons name={icon as any} size={14} color={active ? '#FFFFFF' : '#606070'} />
      <AppText variant="caption" className={active ? 'text-white font-semibold' : 'text-muted'}>
        {label}
      </AppText>
    </TouchableOpacity>
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

  const { signInWithMagicLink, signInWithPassword, signInWithPasskey } = useAuthStore();
  const { t } = useTranslation();

  const validateEmail = () => {
    if (!email.trim()) {
      setError(t('auth.errors.email_required'));
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t('auth.errors.email_invalid'));
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
      setError(e.message || t('auth.errors.magic_link_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePassword = async () => {
    if (!validateEmail()) return;
    if (!password) {
      setError(t('auth.errors.password_required'));
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await signInWithPassword(email.trim(), password);
    } catch (e: any) {
      setError(e?.message || t('auth.errors.incorrect_credentials'));
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
      setError(e.message || t('auth.errors.passkey_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setMagicLinkSent(false);
  };

  if (magicLinkSent) {
    return (
      <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
        <View className="flex-1 justify-center items-center px-xl">
          <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-xl">
            <Ionicons name="mail-outline" size={32} color="#2563EB" />
          </View>
          <AppText variant="h2" className="mb-sm text-center">
            Check your email
          </AppText>
          <AppText variant="body" color="muted" className="text-center mb-xxxl">
            {t('auth.magic_link_sent')}{'\n'}
            <AppText variant="body" className="font-semibold">
              {email.trim()}
            </AppText>
            {'\n\n'}
            {t('auth.magic_link_instruction')}
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
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
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
              <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-lg">
                <Ionicons name="sparkles" size={28} color="#2563EB" />
              </View>
              <AppText variant="h1" className="mb-xs">
                Miru
              </AppText>
              <AppText variant="body" color="muted" className="text-center">
                {mode === 'magic-link' && t('auth.desc_magic_link')}
                {mode === 'password' && t('auth.desc_password')}
                {mode === 'passkey' && t('auth.desc_passkey')}
              </AppText>
            </View>

            {/* Mode selector */}
            <View className="flex-row bg-surface-highLight dark:bg-surface-highDark rounded-lg p-xs mb-xl border border-border-light dark:border-border-dark">
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
            <View className="bg-surface-highLight dark:bg-surface-highDark rounded-xl border border-border-light dark:border-border-dark p-lg mb-lg">
              {/* Email */}
              <AppText variant="caption" color="muted" className="mb-xs ms-xs">
                {t('auth.email_label')}
              </AppText>
              <View className="flex-row items-center h-[48px] bg-background-light dark:bg-background-dark rounded-lg border border-border-light dark:border-border-dark px-md mb-lg">
                <Ionicons name="mail-outline" size={18} color="#606070" />
                <TextInput
                  className="flex-1 ms-sm text-onSurface-light dark:text-onSurface-dark text-[15px]"
                  placeholder="you@example.com"
                  placeholderTextColor="#606070"
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    setError(null);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  returnKeyType={mode === 'password' ? 'next' : 'done'}
                  onSubmitEditing={mode === 'magic-link' ? handleMagicLink : undefined}
                />
              </View>

              {/* Password field (password mode only) */}
              {mode === 'password' && (
                <>
                  <AppText variant="caption" color="muted" className="mb-xs ms-xs">
                    {t('auth.password_label')}
                  </AppText>
                  <View className="flex-row items-center h-[48px] bg-background-light dark:bg-background-dark rounded-lg border border-border-light dark:border-border-dark px-md mb-lg">
                    <Ionicons name="lock-closed-outline" size={18} color="#606070" />
                    <TextInput
                      className="flex-1 ms-sm text-onSurface-light dark:text-onSurface-dark text-[15px]"
                      placeholder="Enter your password"
                      placeholderTextColor="#606070"
                      value={password}
                      onChangeText={(t) => {
                        setPassword(t);
                        setError(null);
                      }}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      returnKeyType="done"
                      onSubmitEditing={handlePassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword((s) => !s)} className="p-xs">
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color="#606070"
                      />
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Passkey hint */}
              {mode === 'passkey' && (
                <View className="flex-row items-start bg-primary/5 rounded-lg p-md mb-lg">
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color="#2563EB"
                    style={{ marginTop: 1 }}
                  />
                  <AppText variant="caption" className="flex-1 ms-xs text-primary">
                    {t('auth.passkey_hint')}
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
            <AppText variant="caption" color="muted" className="text-center">
              {t('auth.footer_note')}
            </AppText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
