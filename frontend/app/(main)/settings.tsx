import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../src/components/AppText';
import { AppButton } from '../../src/components/AppButton';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function SettingsScreen() {
  const { signOut, user } = useAuthStore();

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-1 items-center justify-center px-lg">
        <AppText variant="h2" className="mb-md">
          Settings
        </AppText>
        <AppText variant="body" color="muted" className="text-center mb-xl">
          Signed in as {user?.email}
        </AppText>

        <AppButton label="Sign Out" variant="outline" onPress={() => signOut()} />
      </View>
    </SafeAreaView>
  );
}
