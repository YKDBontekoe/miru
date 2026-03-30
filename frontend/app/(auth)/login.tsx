import React, { useState, useMemo } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../src/components/AppText';
import { AppButton } from '../../src/components/AppButton';
import { ScalePressable } from '../../src/components/ScalePressable';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useTheme } from '../../src/hooks/useTheme';

type AuthMode = 'magic-link' | 'password' | 'passkey';

function ErrorBanner({ message }: { message: string }) {
  const { C } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: C.dangerSurface,
      borderColor: C.danger,
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
    },
    icon: {
      marginTop: 1,
    },
    text: {
      flex: 1,
      marginLeft: 4,
      color: C.danger,
    }
  }), [C]);

  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={16} color={C.danger} style={styles.icon} />
      <AppText variant="caption" style={styles.text}>
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

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      gap: 4,
      borderRadius: 6,
      backgroundColor: active ? C.primary : 'transparent',
    },
    text: {
      color: active ? '#FFFFFF' : C.muted,
      fontWeight: active ? '600' : 'normal',
    }
  }), [C, active]);

  return (
    <ScalePressable onPress={onPress} style={styles.container}>
      <Ionicons name={icon as any} size={14} color={active ? '#FFFFFF' : C.muted} />
      <AppText variant="caption" style={styles.text}>
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

  const styles = useMemo(() => StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: C.bg,
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    contentPadding: {
      paddingHorizontal: 20,
      paddingVertical: 20,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
    logoCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: C.primarySurface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    title: {
      marginBottom: 4,
    },
    subtitle: {
      textAlign: 'center',
      lineHeight: 22,
    },
    modeSelector: {
      flexDirection: 'row',
      backgroundColor: C.surfaceHigh,
      borderRadius: 8,
      padding: 4,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: C.border,
    },
    formCard: {
      backgroundColor: C.surfaceHigh,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.border,
      padding: 16,
      marginBottom: 16,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.05,
          shadowRadius: 8,
        },
        android: {
          elevation: isDark ? 4 : 2,
        },
      }),
    },
    inputLabel: {
      marginBottom: 6,
      marginLeft: 4,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 48,
      backgroundColor: C.bg,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: C.border,
      paddingHorizontal: 12,
      marginBottom: 16, // tighter grouping
    },
    inputContainerFocused: {
      borderColor: C.primary,
      backgroundColor: C.surface,
    },
    textInput: {
      flex: 1,
      marginLeft: 8,
      color: C.text,
      fontSize: 15,
      ...Platform.select({
        web: {
          outlineWidth: 0,
        },
      }),
    },
    passkeyHint: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: C.primarySurface,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    passkeyHintIcon: {
      marginTop: 1,
    },
    passkeyHintText: {
      flex: 1,
      marginLeft: 4,
      color: C.primary,
      lineHeight: 18,
    },
    footerNote: {
      textAlign: 'center',
      lineHeight: 18,
    },
    magicLinkIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: C.primarySurface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    magicLinkTitle: {
        marginBottom: 8,
        textAlign: 'center',
    },
    magicLinkBody: {
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    magicLinkEmail: {
        fontWeight: '600',
    }
  }), [C, isDark]);

  if (magicLinkSent) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.magicLinkIconContainer}>
            <Ionicons name="mail-outline" size={32} color={C.primary} />
          </View>
          <AppText variant="h2" style={styles.magicLinkTitle}>
            Check your email
          </AppText>
          <AppText variant="body" color="muted" style={styles.magicLinkBody}>
            We sent a magic link to{'\n'}
            <AppText variant="body" style={styles.magicLinkEmail}>
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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentPadding}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="sparkles" size={28} color={C.primary} />
              </View>
              <AppText variant="h1" style={styles.title}>
                Miru
              </AppText>
              <AppText variant="body" color="muted" style={styles.subtitle}>
                {mode === 'magic-link' && 'Sign in with a one-time link sent to your email.'}
                {mode === 'password' && 'Sign in with your email and password.'}
                {mode === 'passkey' && 'Sign in with your biometrics or security key.'}
              </AppText>
            </View>

            {/* Mode selector */}
            <View style={styles.modeSelector}>
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
            <View style={styles.formCard}>
              {/* Email */}
              <AppText variant="caption" color="muted" style={styles.inputLabel}>
                Email address
              </AppText>
              <View style={[styles.inputContainer, focusedInput === 'email' && styles.inputContainerFocused]}>
                <Ionicons name="mail-outline" size={18} color={focusedInput === 'email' ? C.primary : C.muted} />
                <TextInput
                  style={styles.textInput}
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
                  onSubmitEditing={mode === 'magic-link' ? handleMagicLink : undefined}
                />
              </View>

              {/* Password field (password mode only) */}
              {mode === 'password' && (
                <>
                  <AppText variant="caption" color="muted" style={styles.inputLabel}>
                    Password
                  </AppText>
                  <View style={[styles.inputContainer, focusedInput === 'password' && styles.inputContainerFocused]}>
                    <Ionicons name="lock-closed-outline" size={18} color={focusedInput === 'password' ? C.primary : C.muted} />
                    <TextInput
                      style={styles.textInput}
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
                    <ScalePressable onPress={() => setShowPassword((s) => !s)} style={{ padding: 4 }}>
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
                <View style={styles.passkeyHint}>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={C.primary}
                    style={styles.passkeyHintIcon}
                  />
                  <AppText variant="caption" style={styles.passkeyHintText}>
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
            <AppText variant="caption" color="muted" style={styles.footerNote}>
              By signing in you agree to keep your account secure.{'\n'}
              Magic links expire after 1 hour.
            </AppText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
