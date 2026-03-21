import React, { useState } from 'react';
import { View, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../src/components/AppText';
import { AppButton } from '../../src/components/AppButton';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithMagicLink } = useAuthStore();

  const handleLogin = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setIsLoading(true);
    try {
      await signInWithMagicLink(email);
      Alert.alert('Success', 'Check your email for the login link!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred during sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-1 justify-center px-xl">
        <View className="items-center mb-xxxl">
          <AppText variant="h1" className="mb-sm">
            Welcome to Miru
          </AppText>
          <AppText variant="body" color="muted" className="text-center">
            Sign in or create an account to start chatting with your AI agents.
          </AppText>
        </View>

        <View className="mb-lg">
          <TextInput
            className="h-[44px] bg-surface-highLight dark:bg-surface-highDark text-onSurface-light dark:text-onSurface-dark px-md rounded-lg border border-border-light dark:border-border-dark mb-lg"
            placeholder="Enter your email"
            placeholderTextColor="#A0A0B0"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <AppButton label="Continue with Email" onPress={handleLogin} isLoading={isLoading} />
        </View>
      </View>
    </SafeAreaView>
  );
}
