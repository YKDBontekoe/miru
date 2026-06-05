import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { DESIGN_TOKENS } from '@/core/design/tokens';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const C = {
  muted: DESIGN_TOKENS.colors.muted,
  faint: DESIGN_TOKENS.colors.faint,
  destructive: DESIGN_TOKENS.colors.destructive,
};

export const SettingRow = ({
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
}) => {
  const content = (
    <>
      <View
        className={`w-9 h-9 rounded-[10px] border items-center justify-center mr-3 ${
          destructive
            ? 'bg-destructiveSurface border-destructiveBorder'
            : 'bg-surfaceSoft border-border'
        }`}
      >
        <Ionicons
          name={icon}
          size={18}
          color={destructive ? C.destructive : (iconColor ?? C.muted)}
        />
      </View>
      <View className="flex-1">
        <AppText
          className={`text-[15px] font-medium ${destructive ? 'text-destructive' : 'text-text'}`}
        >
          {title}
        </AppText>
        {subtitle && (
          <AppText variant="caption" className="text-muted mt-0.5 text-xs">
            {subtitle}
          </AppText>
        )}
      </View>
      {rightElement ??
        (onPress && !destructive ? (
          <Ionicons name="chevron-forward" size={16} color={C.faint} />
        ) : null)}
    </>
  );

  const containerClasses = `flex-row items-center rounded-[14px] p-3.5 mb-2 border shadow-sm shadow-black/5 elevation-sm ${
    destructive ? 'bg-destructiveSurface border-destructiveBorder' : 'bg-surface border-border'
  }`;

  if (onPress) {
    return (
      <ScalePressable onPress={onPress} className={containerClasses}>
        {content}
      </ScalePressable>
    );
  }

  return <View className={containerClasses}>{content}</View>;
};
