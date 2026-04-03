import React from 'react';
import { Platform, ScrollView, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { DESIGN_TOKENS } from '@/core/design/tokens';

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
      style={[
        {
          backgroundColor: DESIGN_TOKENS.colors.surface,
          borderRadius: DESIGN_TOKENS.radius.xl,
          borderWidth: 1,
          borderColor: DESIGN_TOKENS.colors.border,
          padding: 16,
          marginBottom: 14,
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
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}
    >
      <AppText variant="h3" style={{ color: DESIGN_TOKENS.colors.text, fontWeight: '700' }}>
        {title}
      </AppText>
      {action ?? null}
    </View>
  );
};

function PageHeader({
  title,
  subtitle,
  right,
}: Pick<PageShellProps, 'title' | 'subtitle' | 'right'>) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <AppText
            variant="h1"
            style={{ color: DESIGN_TOKENS.colors.text, fontSize: 28, fontWeight: '800' }}
          >
            {title}
          </AppText>
          {subtitle ? (
            <AppText style={{ color: DESIGN_TOKENS.colors.muted, marginTop: 2, fontSize: 13 }}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {right ?? null}
      </View>
    </View>
  );
}

export function PageShell({
  title,
  subtitle,
  right,
  children,
  scroll = true,
  contentStyle,
}: PageShellProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DESIGN_TOKENS.colors.pageBg }}>
      <PageHeader title={title} subtitle={subtitle} right={right} />

      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 40 + (Platform.OS === 'ios' ? 32 : 16) + 64,
            ...(contentStyle ?? {}),
          }}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1, paddingHorizontal: 16 }, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
