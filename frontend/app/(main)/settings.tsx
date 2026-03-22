import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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

// Performance Log: Extracted styles to StyleSheet and memoized components.
const styles = StyleSheet.create({
  sectionHeader: {
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 11,
    fontWeight: '700',
    color: C.muted,
    marginBottom: 10,
    marginTop: 8,
  },
  settingRowWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  settingRowIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingRowTitle: { fontSize: 15, fontWeight: '500' },
  settingRowSubtitle: { color: C.muted, marginTop: 2, fontSize: 12 },
  memoryItemWrapper: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  memoryItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.primary,
    marginTop: 6,
    marginRight: 12,
  },
  memoryItemContent: { lineHeight: 20, fontSize: 14, color: C.text },
  memoryItemDate: { color: C.muted, marginTop: 4, fontSize: 11 },
  memoryItemDeleteButton: { marginLeft: 8 },
});

const SectionHeader = React.memo(function SectionHeader({ title }: { title: string }) {
  return <AppText style={styles.sectionHeader}>{title}</AppText>;
});

const SettingRow = React.memo(function SettingRow({
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
      style={[
        styles.settingRowWrapper,
        {
          backgroundColor: destructive ? C.destructiveSurface : C.surface,
          borderColor: destructive ? C.destructiveBorder : C.border,
        },
      ]}
    >
      <View
        style={[
          styles.settingRowIconWrapper,
          {
            backgroundColor: destructive ? C.destructiveSurface : C.surfaceHigh,
            borderColor: destructive ? C.destructiveBorder : C.border,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={destructive ? C.destructive : (iconColor ?? C.muted)}
        />
      </View>
      <View style={{ flex: 1 }}>
        <AppText style={[styles.settingRowTitle, { color: destructive ? C.destructive : C.text }]}>
          {title}
        </AppText>
        {subtitle && (
          <AppText variant="caption" style={styles.settingRowSubtitle}>
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
});

const MemoryItem = React.memo(function MemoryItem({
  memory,
  onDelete,
}: {
  memory: Memory;
  onDelete: (id: string) => void;
}) {
  const date = new Date(memory.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const handleDelete = useCallback(() => onDelete(memory.id), [memory.id, onDelete]);
  return (
    <View style={styles.memoryItemWrapper}>
      <View style={styles.memoryItemDot} />
      <View style={{ flex: 1 }}>
        <AppText style={styles.memoryItemContent}>{memory.content}</AppText>
        <AppText variant="caption" style={styles.memoryItemDate}>
          {date}
        </AppText>
      </View>
      <TouchableOpacity
        onPress={handleDelete}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.memoryItemDeleteButton}
      >
        <Ionicons name="close" size={16} color={C.faint} />
      </TouchableOpacity>
    </View>
  );
});

export default function SettingsScreen() {
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

  const handleDeleteMemory = useCallback(
    (id: string) => {
      const memory = memories.find((m) => m.id === id);
      if (!memory) return;
      Alert.alert('Forget memory?', `Should Miru forget this?\n\n"${memory.content}"`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Forget',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.deleteMemory(id);
              setMemories((prev) => prev.filter((m) => m.id !== id));
            } catch {
              Alert.alert('Error', 'Failed to delete memory.');
            }
          },
        },
      ]);
    },
    [memories]
  );

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
          Settings
        </AppText>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {/* ── Account ─────────────────────────────── */}
        <SectionHeader title="Account" />

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
              marginRight: 14,
            }}
          >
            <Ionicons name="person" size={22} color={C.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText style={{ fontWeight: '600', fontSize: 15, color: C.text }} numberOfLines={1}>
              {user?.email ?? 'Signed in'}
            </AppText>
            <AppText variant="caption" style={{ color: C.muted, fontSize: 12 }}>
              Signed in with magic link
            </AppText>
          </View>
        </View>

        <SettingRow
          icon="log-out-outline"
          title="Sign Out"
          subtitle="Sign out of your Miru account"
          onPress={handleSignOut}
          destructive
        />

        {/* ── Personal Memories ────────────────────── */}
        <View style={{ marginTop: 16 }}>
          <SectionHeader title="Personal Memories" />

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
                No memories yet. As you talk to Miru, she will learn more about you.
              </AppText>
            </View>
          ) : (
            <>
              {memories.map((memory) => (
                <MemoryItem key={memory.id} memory={memory} onDelete={handleDeleteMemory} />
              ))}
              <TouchableOpacity
                onPress={loadMemories}
                style={{ alignItems: 'center', paddingVertical: 8 }}
              >
                <AppText style={{ color: C.primary, fontSize: 13, fontWeight: '600' }}>
                  Refresh
                </AppText>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ── Preferences ─────────────────────────── */}
        <View style={{ marginTop: 16 }}>
          <SectionHeader title="Preferences" />

          <SettingRow
            icon="shield-checkmark-outline"
            iconColor="#8B5CF6"
            title="Privacy Mode"
            subtitle="Minimize data logging for sessions"
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
            title="Notifications"
            subtitle="Get alerts for long-running tasks"
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
          <SectionHeader title="About" />
          <SettingRow
            icon="information-circle-outline"
            iconColor={C.primary}
            title="Version"
            subtitle="1.0.0 (Beta)"
          />
          <SettingRow
            icon="code-slash-outline"
            iconColor="#10B981"
            title="Built with React Native"
            subtitle="Powered by Expo & NativeWind"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
