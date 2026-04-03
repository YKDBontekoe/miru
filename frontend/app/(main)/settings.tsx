import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { AppText } from '../../src/components/AppText';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useAppStore } from '../../src/store/useAppStore';
import { useMemoryStore } from '@/store/useMemoryStore';
import { useProductivityStore } from '@/store/useProductivityStore';
import { useChatStore } from '@/store/useChatStore';
import { Memory } from '../../src/core/models';
import { ScalePressable } from '@/components/ScalePressable';
import { DESIGN_TOKENS } from '@/core/design/tokens';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: DESIGN_TOKENS.colors.pageBg,
  surface: DESIGN_TOKENS.colors.surface,
  surfaceHigh: DESIGN_TOKENS.colors.surfaceSoft,
  border: DESIGN_TOKENS.colors.border,
  text: DESIGN_TOKENS.colors.text,
  muted: DESIGN_TOKENS.colors.muted,
  faint: DESIGN_TOKENS.colors.faint,
  primary: DESIGN_TOKENS.colors.primary,
  primarySurface: DESIGN_TOKENS.colors.primarySoft,
  destructive: DESIGN_TOKENS.colors.destructive,
  destructiveSurface: DESIGN_TOKENS.colors.destructiveSurface,
  destructiveBorder: DESIGN_TOKENS.colors.destructiveBorder,
};

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'nl', label: 'Dutch', nativeLabel: 'Nederlands' },
];

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

const MemoryItem = React.memo(function MemoryItem({
  memory,
  onDelete,
}: {
  memory: Memory;
  onDelete: () => void;
}) {
  const { i18n } = useTranslation();
  const date = React.useMemo(() => {
    return new Intl.DateTimeFormat(i18n.language, {
      month: 'short',
      day: 'numeric',
    }).format(new Date(memory.created_at));
  }, [i18n.language, memory.created_at]);
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
      <ScalePressable
        onPress={onDelete}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{ marginStart: 8 }}
      >
        <Ionicons name="close" size={16} color={C.faint} />
      </ScalePressable>
    </View>
  );
});

// ─── Language picker modal ────────────────────────────────────────────────────
function LanguagePickerModal({
  visible,
  currentLang,
  onSelect,
  onClose,
}: {
  visible: boolean;
  currentLang: string;
  onSelect: (code: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View
          style={{
            backgroundColor: C.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 24,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <AppText variant="h2" style={{ color: C.text }}>
              {t('settings.items.language')}
            </AppText>
            <ScalePressable onPress={onClose}>
              <Ionicons name="close-circle" size={26} color={C.faint} />
            </ScalePressable>
          </View>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = currentLang.startsWith(lang.code);
            return (
              <ScalePressable
                key={lang.code}
                onPress={() => onSelect(lang.code)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isSelected ? C.primarySurface : C.surfaceHigh,
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: isSelected ? `${C.primary}40` : C.border,
                }}
              >
                <View style={{ flex: 1 }}>
                  <AppText
                    style={{
                      fontSize: 15,
                      fontWeight: '600',
                      color: isSelected ? C.primary : C.text,
                    }}
                  >
                    {lang.nativeLabel}
                  </AppText>
                  <AppText style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                    {lang.label}
                  </AppText>
                </View>
                {isSelected && <Ionicons name="checkmark-circle" size={22} color={C.primary} />}
              </ScalePressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { signOut, user } = useAuthStore();
  const {
    language,
    setLanguage,
    appearanceMode,
    setAppearanceMode,
    notifications,
    setNotificationSetting,
  } = useAppStore();
  const { memories, isLoading: isLoadingMemories, fetchMemories, deleteMemory } = useMemoryStore();
  const { notes, tasks, fetchNotes, fetchTasks, deleteNote, deleteTask } = useProductivityStore();
  const { rooms } = useChatStore();
  const [privacyMode, setPrivacyMode] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const currentLang = language ?? i18n.language ?? 'en';
  const currentLangLabel =
    SUPPORTED_LANGUAGES.find((l) => currentLang.startsWith(l.code))?.nativeLabel ?? 'English';

  useEffect(() => {
    const controller = new AbortController();
    const loadData = async () => {
      await Promise.all([
        fetchMemories(controller.signal),
        fetchNotes(controller.signal),
        fetchTasks(controller.signal),
      ]);
    };
    loadData().catch(() => {});
    return () => {
      controller.abort();
    };
  }, [fetchMemories, fetchNotes, fetchTasks]);

  const handleDeleteMemory = React.useCallback(
    (memory: Memory) => {
      Alert.alert(
        t('settings.actions.forget_memory_title'),
        `${t('settings.actions.forget_memory_confirm')}\n\n"${memory.content}"`,
        [
          { text: t('settings.actions.cancel'), style: 'cancel' },
          {
            text: t('settings.actions.forget'),
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteMemory(memory.id);
              } catch {
                Alert.alert(
                  t('settings.actions.error'),
                  t('settings.actions.delete_memory_failed')
                );
              }
            },
          },
        ]
      );
    },
    [t, deleteMemory]
  );

  const renderMemoryItem = React.useCallback(
    ({ item }: { item: Memory }) => (
      <MemoryItem memory={item} onDelete={() => handleDeleteMemory(item)} />
    ),
    [handleDeleteMemory]
  );

  const handleSelectLanguage = React.useCallback(
    (code: string) => {
      setLanguage(code);
      i18n.changeLanguage(code);
      setShowLanguagePicker(false);
    },
    [setLanguage]
  );

  const handleSignOut = () => {
    Alert.alert(
      t('settings.actions.sign_out_confirm_title'),
      t('settings.actions.sign_out_confirm_desc'),
      [
        { text: t('settings.actions.cancel'), style: 'cancel' },
        { text: t('settings.items.sign_out'), style: 'destructive', onPress: () => signOut() },
      ]
    );
  };

  const handleExportData = async () => {
    const payload = {
      exported_at: new Date().toISOString(),
      profile: { email: user?.email ?? null, language: currentLang, appearance: appearanceMode },
      stats: {
        memories: memories.length,
        notes: notes.length,
        tasks: tasks.length,
        chats: rooms.length,
      },
      memories,
      notes,
      tasks,
    };
    try {
      await Share.share({
        message: JSON.stringify(payload, null, 2),
      });
    } catch {
      Alert.alert(t('settings.actions.error'), t('settings.actions.exportError'));
    }
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      t('settings.deleteAllTitle'),
      t('settings.deleteAllMessage'),
      [
        { text: t('settings.actions.cancel'), style: 'cancel' },
        {
          text: t('settings.actions.delete') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const results = await Promise.allSettled([
                ...memories.map((memory) => deleteMemory(memory.id)),
                ...notes.map((note) => deleteNote(note.id)),
                ...tasks.map((task) => deleteTask(task.id)),
              ]);
              await Promise.all([fetchMemories(), fetchNotes(), fetchTasks()]);
              const failed = results
                .map((result, index) => ({ result, index }))
                .filter((entry) => entry.result.status === 'rejected')
                .map((entry) => {
                  const memoryCount = memories.length;
                  const noteCount = notes.length;
                  if (entry.index < memoryCount) return memories[entry.index]?.id ?? 'memory';
                  if (entry.index < memoryCount + noteCount) {
                    return notes[entry.index - memoryCount]?.id ?? 'note';
                  }
                  return tasks[entry.index - memoryCount - noteCount]?.id ?? 'task';
                });
              if (failed.length === 0) {
                Alert.alert(t('settings.actions.done'), t('settings.actions.removedAllData'));
                return;
              }
              Alert.alert(
                t('settings.actions.error'),
                `${t('settings.actions.removeDataFailed')} (${failed.length})\n${failed.join(', ')}`
              );
            } catch {
              Alert.alert(t('settings.actions.error'), t('settings.actions.removeDataFailed'));
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 }}>
        <AppText
          variant="h1"
          style={{ fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.5 }}
        >
          {t('settings.title')}
        </AppText>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 40 + (Platform.OS === 'ios' ? 32 : 16) + 64,
        }}
      >
        {/* ── Account ─────────────────────────────── */}
        <SectionHeader title={t('settings.sections.account')} />

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
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.03,
            shadowRadius: 3,
            elevation: 1,
          }}
        >
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
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
              {user?.email ?? t('settings.items.signed_in')}
            </AppText>
            <AppText variant="caption" style={{ color: C.muted, fontSize: 12 }}>
              {t('settings.items.signed_in_with_magic_link')}
            </AppText>
          </View>
        </View>

        <SettingRow
          icon="log-out-outline"
          title={t('settings.items.sign_out')}
          subtitle={t('settings.items.sign_out_desc')}
          onPress={handleSignOut}
          destructive
        />

        {/* ── Personal Memories ────────────────────── */}
        <View style={{ marginTop: 16 }}>
          <SectionHeader title={t('settings.items.personal_memories')} />

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
                {t('settings.items.no_memories')}
              </AppText>
            </View>
          ) : (
            <FlatList
              data={memories}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={renderMemoryItem}
              ListFooterComponent={
                <ScalePressable
                  onPress={() => {
                    fetchMemories().catch(() => {});
                  }}
                  style={{ alignItems: 'center', paddingVertical: 8 }}
                >
                  <AppText style={{ color: C.primary, fontSize: 13, fontWeight: '600' }}>
                    {t('settings.actions.refresh')}
                  </AppText>
                </ScalePressable>
              }
            />
          )}
        </View>

        {/* ── Preferences ─────────────────────────── */}
        <View style={{ marginTop: 16 }}>
          <SectionHeader title={t('settings.sections.preferences')} />

          <SettingRow
            icon="language-outline"
            iconColor={C.primary}
            title={t('settings.items.language')}
            subtitle={currentLangLabel}
            onPress={() => setShowLanguagePicker(true)}
          />
          <SettingRow
            icon="shield-checkmark-outline"
            iconColor="#8B5CF6"
            title={t('settings.items.privacy_mode')}
            subtitle={t('settings.items.privacy_desc')}
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
            icon="contrast-outline"
            iconColor={C.primary}
            title={t('settings.appearance.title')}
            subtitle={
              appearanceMode === 'system'
                ? t('settings.appearance.follow_system')
                : appearanceMode === 'dark'
                  ? t('settings.appearance.dark')
                  : t('settings.appearance.light')
            }
            rightElement={
              <View style={{ flexDirection: 'row' }}>
                {(['system', 'light', 'dark'] as const).map((mode) => (
                  <ScalePressable
                    key={mode}
                    onPress={() => setAppearanceMode(mode)}
                    style={{
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: appearanceMode === mode ? C.primary : C.border,
                      backgroundColor: appearanceMode === mode ? C.primarySurface : C.surfaceHigh,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      marginLeft: 6,
                    }}
                  >
                    <AppText
                      variant="caption"
                      style={{
                        color: appearanceMode === mode ? C.primary : C.muted,
                        fontWeight: '700',
                      }}
                    >
                      {mode === 'system'
                        ? t('settings.appearance.auto')
                        : mode === 'dark'
                          ? t('settings.appearance.dark')
                          : t('settings.appearance.light')}
                    </AppText>
                  </ScalePressable>
                ))}
              </View>
            }
          />
          <SettingRow
            icon="notifications-outline"
            iconColor="#F59E0B"
            title={t('settings.items.notifications')}
            subtitle={t('settings.items.notifications_desc')}
            rightElement={
              <Switch
                value={notifications.longRunningTasks}
                onValueChange={(value) => setNotificationSetting('longRunningTasks', value)}
                trackColor={{ false: C.border, true: `${C.primary}40` }}
                thumbColor={notifications.longRunningTasks ? C.primary : C.faint}
              />
            }
          />
          <SettingRow
            icon="calendar-outline"
            iconColor={C.primary}
            title={t('settings.dailySummary.title')}
            subtitle={t('settings.dailySummary.desc')}
            rightElement={
              <Switch
                value={notifications.dailySummary}
                onValueChange={(value) => setNotificationSetting('dailySummary', value)}
                trackColor={{ false: C.border, true: `${C.primary}40` }}
                thumbColor={notifications.dailySummary ? C.primary : C.faint}
              />
            }
          />
          <SettingRow
            icon="at-outline"
            iconColor={C.primary}
            title={t('settings.mentions.title')}
            subtitle={t('settings.mentions.desc')}
            rightElement={
              <Switch
                value={notifications.mentions}
                onValueChange={(value) => setNotificationSetting('mentions', value)}
                trackColor={{ false: C.border, true: `${C.primary}40` }}
                thumbColor={notifications.mentions ? C.primary : C.faint}
              />
            }
          />
        </View>

        <View style={{ marginTop: 16 }}>
          <SectionHeader title={t('settings.data')} />
          <SettingRow
            icon="download-outline"
            iconColor={C.primary}
            title={t('settings.export.title')}
            subtitle={t('settings.export.desc')}
            onPress={handleExportData}
          />
          <SettingRow
            icon="trash-outline"
            title={t('settings.deleteAll.title')}
            subtitle={t('settings.deleteAll.desc')}
            onPress={handleDeleteAllData}
            destructive
          />
        </View>

        {/* ── About ───────────────────────────────── */}
        <View style={{ marginTop: 16 }}>
          <SectionHeader title={t('settings.sections.about')} />
          <SettingRow
            icon="information-circle-outline"
            iconColor={C.primary}
            title={t('settings.items.version')}
            subtitle={t('settings.items.version_value')}
          />
          <SettingRow
            icon="code-slash-outline"
            iconColor="#10B981"
            title={t('settings.items.tech_stack')}
            subtitle={t('settings.items.tech_desc')}
          />
        </View>
      </ScrollView>

      <LanguagePickerModal
        visible={showLanguagePicker}
        currentLang={currentLang}
        onSelect={handleSelectLanguage}
        onClose={() => setShowLanguagePicker(false)}
      />
    </SafeAreaView>
  );
}
