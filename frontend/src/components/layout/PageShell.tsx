import React from 'react';
import { ScrollView, View, ViewStyle } from 'react-native';
import { SafeAreaInsetsContext, SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { useTheme } from '@/hooks/useTheme';

interface PageShellProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
}

export const PageSectionCard = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) => {
  return (
    <View
      className="rounded-3xl border p-4 mb-3.5"
      style={[
        {
          backgroundColor: DESIGN_TOKENS.colors.surface,
          borderColor: DESIGN_TOKENS.colors.border,
          ...DESIGN_TOKENS.shadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export const PageSectionHeader = ({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) => {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <AppText variant="h3" className="font-bold" style={{ color: DESIGN_TOKENS.colors.text }}>
        {title}
      </AppText>
      {action ?? null}
    </View>
  );
};

const PageHeader = ({
  title,
  subtitle,
  right,
}: Pick<PageShellProps, 'title' | 'subtitle' | 'right'>) => {
  return (
    <View className="px-4 pt-3 pb-2.5">
      <View className="flex-row justify-between items-center">
        <View className="flex-1 pe-2">
          <AppText variant="h1" className="text-[28px] font-extrabold" style={{ color: DESIGN_TOKENS.colors.text }}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText className="mt-0.5 text-[13px]" style={{ color: DESIGN_TOKENS.colors.muted }}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {right ?? null}
      </View>
    </View>
  );
};

export const PageShell = ({
  title,
  subtitle,
  right,
  children,
  scroll = true,
  contentStyle,
}: PageShellProps) => {
  const { C } = useTheme();
  const insets = React.useContext(SafeAreaInsetsContext);
  const baseBottomPadding = 40 + (insets?.bottom ?? 0) + 64;
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.bg }}>
      <PageHeader title={title} subtitle={subtitle} right={right} />

      {scroll ? (
        <ScrollView
          className="px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[{ paddingBottom: baseBottomPadding }, contentStyle]}
        >
          {children}
        </ScrollView>
      ) : (
        <View className="flex-1 px-4" style={contentStyle}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
};
