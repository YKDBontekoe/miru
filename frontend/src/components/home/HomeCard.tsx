import React from 'react';
import { View } from 'react-native';

export function HomeCard({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="bg-surface rounded-2xl p-5 mb-3 shadow-lg shadow-[#2563EB]/10 elevation-3"
    >
      {children}
    </View>
  );
}
