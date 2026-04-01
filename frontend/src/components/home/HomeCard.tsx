import React from 'react';
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';

export function HomeCard({ children }: { children: React.ReactNode }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      className={`rounded-3xl p-6 mb-4 shadow-md shadow-primary-DEFAULT ${
        isDark ? 'bg-surface-dark' : 'bg-surface-light'
      }`}
    >
      {children}
    </View>
  );
}
