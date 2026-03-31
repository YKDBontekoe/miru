import React from 'react';
import { View } from 'react-native';
import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';

const C = {
  text: '#0A0E2E',
  primary: '#2563EB',
};

export function HomeSectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}
    >
      <AppText
        style={{
          fontSize: 15,
          fontWeight: '700',
          color: C.text,
          letterSpacing: -0.2,
        }}
      >
        {title}
      </AppText>
      {actionLabel && onAction && (
        <ScalePressable onPress={onAction}>
          <AppText style={{ fontSize: 13, color: C.primary, fontWeight: '600' }}>
            {actionLabel}
          </AppText>
        </ScalePressable>
      )}
    </View>
  );
}
