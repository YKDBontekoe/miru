import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';
import { DESIGN_TOKENS } from '@/core/design/tokens';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const C = {
  surface: DESIGN_TOKENS.colors.surface,
  surfaceHigh: DESIGN_TOKENS.colors.surfaceSoft,
  border: DESIGN_TOKENS.colors.border,
  text: DESIGN_TOKENS.colors.text,
  muted: DESIGN_TOKENS.colors.muted,
  faint: DESIGN_TOKENS.colors.faint,
  destructive: DESIGN_TOKENS.colors.destructive,
  destructiveSurface: DESIGN_TOKENS.colors.destructiveSurface,
  destructiveBorder: DESIGN_TOKENS.colors.destructiveBorder,
};

export function SettingRow({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
  rightElement,
  destructive,
}: {
  icon: IoniconsName;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
}) {
  const Wrapper = onPress ? ScalePressable : View;
  const wrapperProps = onPress ? { onPress } : {};

  return (
    <Wrapper
      {...(wrapperProps as any)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: destructive ? C.destructiveSurface : C.surface,
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: destructive ? C.destructiveBorder : C.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
        elevation: 1,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: destructive ? C.destructiveSurface : C.surfaceHigh,
          borderWidth: 1,
          borderColor: destructive ? C.destructiveBorder : C.border,
          alignItems: 'center',
          justifyContent: 'center',
          marginEnd: 12,
        }}
      >
        <Ionicons
          name={icon}
          size={18}
          color={destructive ? C.destructive : (iconColor ?? C.muted)}
        />
      </View>
      <View style={{ flex: 1 }}>
        <AppText
          style={{ fontSize: 15, fontWeight: '500', color: destructive ? C.destructive : C.text }}
        >
          {title}
        </AppText>
        {subtitle && (
          <AppText variant="caption" style={{ color: C.muted, marginTop: 2, fontSize: 12 }}>
            {subtitle}
          </AppText>
        )}
      </View>
      {rightElement ??
        (onPress && !destructive ? (
          <Ionicons name="chevron-forward" size={16} color={C.faint} />
        ) : null)}
    </Wrapper>
  );
}
