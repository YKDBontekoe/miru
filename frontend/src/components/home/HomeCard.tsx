import React from 'react';
import { View } from 'react-native';

const C = {
  surface: '#FFFFFF',
};

export function HomeCard({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: C.surface,
        borderRadius: 24,
        padding: 20,
        marginBottom: 12,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.07,
        shadowRadius: 20,
        elevation: 3,
      }}
    >
      {children}
    </View>
  );
}
