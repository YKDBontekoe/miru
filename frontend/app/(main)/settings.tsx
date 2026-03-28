import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
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

const MemoryItem = React.memo(function MemoryItem({ memory, onDelete }: { memory: Memory; onDelete: () => void }) {
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
      <TouchableOpacity
        onPress={onDelete}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{ marginStart: 8 }}
      >
        <Ionicons name="close" size={16} color={C.faint} />
      </TouchableOpacity>
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
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={26} color={C.faint} />
            </TouchableOpacity>
          </View>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = currentLang.startsWith(lang.code);
            return (
              <TouchableOpacity
                key={lang.code}
                onPress={() => onSelect(lang.code)}
                activeOpacity={0.75}
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
              </TouchableOpacity>
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
  const { language, setLanguage } = useAppStore();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoadingMemories, setIsLoadingMemories] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const currentLang = language ?? i18n.language ?? 'en';
  const currentLangLabel =
    SUPPORTED_LANGUAGES.find((l) => currentLang.startsWith(l.code))?.nativeLabel ?? 'English';

  const loadMemories = React.useCallback(async () => {
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

  const handleDeleteMemory = React.useCallback((memory: Memory) => {
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
              Alert.alert(t('settings.actions.error'), t('settings.actions.delete_memory_failed'));
            }
          },
        },
      ]
    );
  }, [t]);

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
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
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
                <TouchableOpacity
                  onPress={loadMemories}
                  style={{ alignItems: 'center', paddingVertical: 8 }}
                >
                  <AppText style={{ color: C.primary, fontSize: 13, fontWeight: '600' }}>
                    {t('settings.actions.refresh')}
                  </AppText>
                </TouchableOpacity>
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
