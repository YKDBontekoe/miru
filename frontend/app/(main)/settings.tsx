import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../src/components/AppText';
import { useAuthStore } from '../../src/store/useAuthStore';
import { ApiService } from '../../src/core/api/ApiService';
import { Memory } from '../../src/core/models';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Light mode palette ───────────────────────────────────────────────────────
const C = {
  bg: '#F8F8FC',
  surface: '#FFFFFF',
  surfaceHigh: '#F0F0F6',
  border: '#E0E0EC',
  text: '#12121A',
  muted: '#6E6E80',
  faint: '#C0C0D0',
  primary: '#2563EB',
  primarySurface: '#EFF6FF',
  destructive: '#DC2626',
  destructiveSurface: '#FEF2F2',
  destructiveBorder: '#FECACA',
};

function SectionHeader({ title }: { title: string }) {
  return (
    <AppText
      style={{
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        fontSize: 11,
        fontWeight: '700',
        color: C.muted,
        marginBottom: 10,
        marginTop: 8,
      }}
    >
      {title}
    </AppText>
  );
}

function SettingRow({
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
  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { onPress, activeOpacity: 0.75 } : {};

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

function MemoryItem({ memory, onDelete }: { memory: Memory; onDelete: () => void }) {
  const { t, i18n } = useTranslation();
  const date = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(memory.created_at));
  return (
    <View
      style={{
        backgroundColor: C.surface,
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: C.border,
        flexDirection: 'row',
        alignItems: 'flex-start',
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: C.primary,
          marginTop: 6,
          marginEnd: 12,
        }}
      />
      <View style={{ flex: 1 }}>
        <AppText style={{ lineHeight: 20, fontSize: 14, color: C.text }}>{memory.content}</AppText>
        <AppText variant="caption" style={{ color: C.muted, marginTop: 4, fontSize: 11 }}>
          {date}
        </AppText>
      </View>
      <TouchableOpacity
        onPress={onDelete}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{ marginStart: 8 }}
      >
        <Ionicons name="close" size={16} color={C.faint} />
      </TouchableOpacity>
    </View>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { signOut, user } = useAuthStore();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoadingMemories, setIsLoadingMemories] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    setIsLoadingMemories(true);
    try {
      const data = await ApiService.getMemories();
      setMemories(data);
    } catch {
      /* Non-fatal */
    } finally {
      setIsLoadingMemories(false);
    }
  };

  const handleDeleteMemory = (memory: Memory) => {
    Alert.alert('Forget memory?', `Should Miru forget this?\n\n"${memory.content}"`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Forget',
        style: 'destructive',
        onPress: async () => {
          try {
            await ApiService.deleteMemory(memory.id);
            setMemories((prev) => prev.filter((m) => m.id !== memory.id));
          } catch {
            Alert.alert('Error', 'Failed to delete memory.');
          }
        },
      },
    ]);
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'You will need to sign in again to use Miru.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
        <AppText variant="h1" style={{ fontSize: 28, fontWeight: '700', color: C.text }}>
          {t('settings.title', 'Settings')}
        </AppText>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {/* ── Account ─────────────────────────────── */}
        <SectionHeader title={t('settings.sections.account', 'Account')} />

        <View
          style={{
            backgroundColor: C.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: C.border,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: C.primarySurface,
              borderWidth: 1,
              borderColor: `${C.primary}25`,
              alignItems: 'center',
              justifyContent: 'center',
              marginEnd: 14,
            }}
          >
            <Ionicons name="person" size={22} color={C.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText style={{ fontWeight: '600', fontSize: 15, color: C.text }} numberOfLines={1}>
              {user?.email ?? t('settings.items.signed_in', 'Signed in')}
            </AppText>
            <AppText variant="caption" style={{ color: C.muted, fontSize: 12 }}>
              Signed in with magic link
            </AppText>
          </View>
        </View>

        <SettingRow
          icon="log-out-outline"
          title={t('settings.items.sign_out', 'Sign Out')}
          subtitle={t('settings.items.sign_out_desc', 'Sign out of your Miru account')}
          onPress={handleSignOut}
          destructive
        />

        {/* ── Personal Memories ────────────────────── */}
        <View style={{ marginTop: 16 }}>
          <SectionHeader title={t('settings.items.personal_memories', 'Personal Memories')} />

          {isLoadingMemories ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <ActivityIndicator color={C.primary} />
            </View>
          ) : memories.length === 0 ? (
            <View
              style={{
                backgroundColor: C.surface,
                borderRadius: 14,
                padding: 16,
                borderWidth: 1,
                borderColor: C.border,
                alignItems: 'center',
              }}
            >
              <Ionicons
                name="sparkles-outline"
                size={28}
                color={C.faint}
                style={{ marginBottom: 8 }}
              />
              <AppText style={{ textAlign: 'center', fontSize: 13, color: C.muted }}>
                {t(
                  'settings.items.no_memories',
                  'No memories yet. As you talk to Miru, she will learn more about you.'
                )}
              </AppText>
            </View>
          ) : (
            <>
              {memories.map((memory) => (
                <MemoryItem
                  key={memory.id}
                  memory={memory}
                  onDelete={() => handleDeleteMemory(memory)}
                />
              ))}
              <TouchableOpacity
                onPress={loadMemories}
                style={{ alignItems: 'center', paddingVertical: 8 }}
              >
                <AppText style={{ color: C.primary, fontSize: 13, fontWeight: '600' }}>
                  {t('settings.actions.refresh', 'Refresh')}
                </AppText>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ── Preferences ─────────────────────────── */}
        <View style={{ marginTop: 16 }}>
          <SectionHeader title={t('settings.sections.preferences', 'Preferences')} />

          <SettingRow
            icon="shield-checkmark-outline"
            iconColor="#8B5CF6"
            title={t('settings.items.privacy_mode', 'Privacy Mode')}
            subtitle={t('settings.items.privacy_desc', 'Minimize data logging for sessions')}
            rightElement={
              <Switch
                value={privacyMode}
                onValueChange={setPrivacyMode}
                trackColor={{ false: C.border, true: `${C.primary}40` }}
                thumbColor={privacyMode ? C.primary : C.faint}
              />
            }
          />
          <SettingRow
            icon="notifications-outline"
            iconColor="#F59E0B"
            title={t('settings.items.notifications', 'Notifications')}
            subtitle={t('settings.items.notifications_desc', 'Get alerts for long-running tasks')}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: C.border, true: `${C.primary}40` }}
                thumbColor={notificationsEnabled ? C.primary : C.faint}
              />
            }
          />
        </View>

        {/* ── About ───────────────────────────────── */}
        <View style={{ marginTop: 16 }}>
          <SectionHeader title={t('settings.sections.about', 'About')} />
          <SettingRow
            icon="information-circle-outline"
            iconColor={C.primary}
            title={t('settings.items.version', 'Version')}
            subtitle={t('settings.items.version_value', '1.0.0 (Beta)')}
          />
          <SettingRow
            icon="code-slash-outline"
            iconColor="#10B981"
            title={t('settings.items.tech_stack', 'Built with React Native')}
            subtitle={t('settings.items.tech_desc', 'Powered by Expo & NativeWind')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
