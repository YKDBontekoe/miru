import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { AppText } from '../../src/components/AppText';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useAppStore } from '../../src/store/useAppStore';
import { ApiService } from '../../src/core/api/ApiService';
import { Memory } from '../../src/core/models';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: '#F4F4F8',
  surface: '#FFFFFF',
  surfaceHigh: '#F0F0F6',
  border: '#E4E4EF',
  text: '#0F0F1A',
  muted: '#6E6E80',
  faint: '#C0C0D0',
  primary: '#2563EB',
  primarySurface: '#EFF6FF',
  destructive: '#DC2626',
  destructiveSurface: '#FEF2F2',
  destructiveBorder: '#FECACA',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  sectionHeader: {
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 11,
    fontWeight: '700',
    color: C.muted,
    marginBottom: 10,
    marginTop: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  settingRowIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 12,
  },
  settingRowContent: { flex: 1 },
  settingRowTitle: { fontSize: 15, fontWeight: '500' },
  settingRowSubtitle: { color: C.muted, marginTop: 2, fontSize: 12 },
  memoryItemContainer: {
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
    marginEnd: 12,
  },
  memoryItemContent: { flex: 1 },
  memoryItemText: { lineHeight: 20, fontSize: 14, color: C.text },
  memoryItemDate: { color: C.muted, marginTop: 4, fontSize: 11 },
  memoryItemClose: { marginStart: 8 },
  langModalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  langModalContent: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
  },
  langModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  langModalTitle: { color: C.text },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  langRowContent: { flex: 1 },
  langRowNativeLabel: { fontSize: 15, fontWeight: '600' },
  langRowLabel: { fontSize: 12, color: C.muted, marginTop: 2 },
  accountContainer: {
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
  },
  accountAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.primarySurface,
    borderWidth: 1,
    borderColor: `${C.primary}25`,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 14,
  },
  accountContent: { flex: 1 },
  accountEmail: { fontWeight: '600', fontSize: 15, color: C.text },
  accountSubtitle: { color: C.muted, fontSize: 12 },
  noMemoriesContainer: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  noMemoriesIcon: { marginBottom: 8 },
  noMemoriesText: { textAlign: 'center', fontSize: 13, color: C.muted },
  refreshButton: { alignItems: 'center', paddingVertical: 8 },
  refreshButtonText: { color: C.primary, fontSize: 13, fontWeight: '600' },
  sectionContainer: { marginTop: 16 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 40 },
});

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'nl', label: 'Dutch', nativeLabel: 'Nederlands' },
];

const SectionHeader = React.memo(({ title }: { title: string }) => (
  <AppText style={styles.sectionHeader}>{title}</AppText>
));

const SettingRow = React.memo(
  ({
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
    const Wrapper = onPress ? TouchableOpacity : View;
    const wrapperProps = onPress ? { onPress, activeOpacity: 0.75 } : {};

    return (
      <Wrapper
        {...(wrapperProps as any)}
        style={[
          styles.settingRow,
          {
            backgroundColor: destructive ? C.destructiveSurface : C.surface,
            borderColor: destructive ? C.destructiveBorder : C.border,
          },
        ]}
      >
        <View
          style={[
            styles.settingRowIconContainer,
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
        <View style={styles.settingRowContent}>
          <AppText
            style={[styles.settingRowTitle, { color: destructive ? C.destructive : C.text }]}
          >
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
  }
);

const MemoryItem = React.memo(
  ({ memory, onDelete }: { memory: Memory; onDelete: (memory: Memory) => void }) => {
    const { i18n } = useTranslation();
    const date = new Intl.DateTimeFormat(i18n.language, {
      month: 'short',
      day: 'numeric',
    }).format(new Date(memory.created_at));

    const handleDelete = useCallback(() => onDelete(memory), [memory, onDelete]);

    return (
      <View style={styles.memoryItemContainer}>
        <View style={styles.memoryItemDot} />
        <View style={styles.memoryItemContent}>
          <AppText style={styles.memoryItemText}>{memory.content}</AppText>
          <AppText variant="caption" style={styles.memoryItemDate}>
            {date}
          </AppText>
        </View>
        <TouchableOpacity
          onPress={handleDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.memoryItemClose}
        >
          <Ionicons name="close" size={16} color={C.faint} />
        </TouchableOpacity>
      </View>
    );
  }
);

const LangRow = React.memo(
  ({
    lang,
    isSelected,
    onSelect,
  }: {
    lang: (typeof SUPPORTED_LANGUAGES)[0];
    isSelected: boolean;
    onSelect: (code: string) => void;
  }) => {
    const handleSelect = useCallback(() => onSelect(lang.code), [lang.code, onSelect]);

    return (
      <TouchableOpacity
        onPress={handleSelect}
        activeOpacity={0.75}
        style={[
          styles.langRow,
          {
            backgroundColor: isSelected ? C.primarySurface : C.surfaceHigh,
            borderColor: isSelected ? `${C.primary}40` : C.border,
          },
        ]}
      >
        <View style={styles.langRowContent}>
          <AppText style={[styles.langRowNativeLabel, { color: isSelected ? C.primary : C.text }]}>
            {lang.nativeLabel}
          </AppText>
          <AppText style={styles.langRowLabel}>{lang.label}</AppText>
        </View>
        {isSelected && <Ionicons name="checkmark-circle" size={22} color={C.primary} />}
      </TouchableOpacity>
    );
  }
);

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

  const renderItem = useCallback(
    ({ item }: { item: (typeof SUPPORTED_LANGUAGES)[0] }) => (
      <LangRow lang={item} isSelected={currentLang.startsWith(item.code)} onSelect={onSelect} />
    ),
    [currentLang, onSelect]
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.langModalOverlay}>
        <View style={styles.langModalContent}>
          <View style={styles.langModalHeader}>
            <AppText variant="h2" style={styles.langModalTitle}>
              {t('settings.items.language')}
            </AppText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={26} color={C.faint} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={SUPPORTED_LANGUAGES}
            keyExtractor={(item) => item.code}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { signOut, user } = useAuthStore();
  const { language, setLanguage } = useAppStore();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoadingMemories, setIsLoadingMemories] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const currentLang = language ?? i18n.language ?? 'en';
  const currentLangLabel = useMemo(
    () => SUPPORTED_LANGUAGES.find((l) => currentLang.startsWith(l.code))?.nativeLabel ?? 'English',
    [currentLang]
  );

  const loadMemories = useCallback(async () => {
    setIsLoadingMemories(true);
    try {
      const data = await ApiService.getMemories();
      setMemories(data);
    } catch {
      /* Non-fatal */
    } finally {
      setIsLoadingMemories(false);
    }
  }, []);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  const handleDeleteMemory = useCallback(
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
                await ApiService.deleteMemory(memory.id);
                setMemories((prev) => prev.filter((m) => m.id !== memory.id));
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
    [t]
  );

  const handleSignOut = useCallback(() => {
    Alert.alert(
      t('settings.actions.sign_out_confirm_title'),
      t('settings.actions.sign_out_confirm_desc'),
      [
        { text: t('settings.actions.cancel'), style: 'cancel' },
        { text: t('settings.items.sign_out'), style: 'destructive', onPress: () => signOut() },
      ]
    );
  }, [t, signOut]);

  const handleSelectLanguage = useCallback(
    (code: string) => {
      setLanguage(code);
      i18n.changeLanguage(code);
      setShowLanguagePicker(false);
    },
    [setLanguage]
  );

  const renderMemoryItem = useCallback(
    ({ item }: { item: Memory }) => <MemoryItem memory={item} onDelete={handleDeleteMemory} />,
    [handleDeleteMemory]
  );

  const ListHeaderComponent = useMemo(
    () => (
      <>
        <SectionHeader title={t('settings.sections.account')} />
        <View style={styles.accountContainer}>
          <View style={styles.accountAvatar}>
            <Ionicons name="person" size={22} color={C.primary} />
          </View>
          <View style={styles.accountContent}>
            <AppText style={styles.accountEmail} numberOfLines={1}>
              {user?.email ?? t('settings.items.signed_in')}
            </AppText>
            <AppText variant="caption" style={styles.accountSubtitle}>
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

        <View style={styles.sectionContainer}>
          <SectionHeader title={t('settings.items.personal_memories')} />
          {isLoadingMemories && (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <ActivityIndicator color={C.primary} />
            </View>
          )}
        </View>
      </>
    ),
    [t, user?.email, handleSignOut, isLoadingMemories]
  );

  const ListEmptyComponent = useMemo(() => {
    if (isLoadingMemories) return null;
    return (
      <View style={styles.noMemoriesContainer}>
        <Ionicons name="sparkles-outline" size={28} color={C.faint} style={styles.noMemoriesIcon} />
        <AppText style={styles.noMemoriesText}>{t('settings.items.no_memories')}</AppText>
      </View>
    );
  }, [isLoadingMemories, t]);

  const ListFooterComponent = useMemo(
    () => (
      <>
        {!isLoadingMemories && memories.length > 0 && (
          <TouchableOpacity onPress={loadMemories} style={styles.refreshButton}>
            <AppText style={styles.refreshButtonText}>{t('settings.actions.refresh')}</AppText>
          </TouchableOpacity>
        )}

        {/* ── Preferences ─────────────────────────── */}
        <View style={styles.sectionContainer}>
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
            icon="notifications-outline"
            iconColor="#F59E0B"
            title={t('settings.items.notifications')}
            subtitle={t('settings.items.notifications_desc')}
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
        <View style={styles.sectionContainer}>
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
      </>
    ),
    [
      isLoadingMemories,
      memories.length,
      loadMemories,
      t,
      currentLangLabel,
      privacyMode,
      notificationsEnabled,
    ]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <AppText variant="h1" style={styles.headerTitle}>
          {t('settings.title')}
        </AppText>
      </View>

      <FlatList
        data={memories}
        keyExtractor={(item) => item.id}
        renderItem={renderMemoryItem}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <LanguagePickerModal
        visible={showLanguagePicker}
        currentLang={currentLang}
        onSelect={handleSelectLanguage}
        onClose={() => setShowLanguagePicker(false)}
      />
    </SafeAreaView>
  );
}

// --- Auto-added display names ---
SectionHeader.displayName = 'SectionHeader';
SettingRow.displayName = 'SettingRow';
MemoryItem.displayName = 'MemoryItem';
LangRow.displayName = 'LangRow';
