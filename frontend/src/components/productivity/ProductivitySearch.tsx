import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const T = {
  background: { light: DESIGN_TOKENS.colors.pageBg },
  border: { light: DESIGN_TOKENS.colors.border },
  onSurface: {
    light: DESIGN_TOKENS.colors.text,
    mutedLight: DESIGN_TOKENS.colors.muted,
  },
};
const S = theme.spacing;
const R = theme.borderRadius;

type ProductivitySearchProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
};

export function ProductivitySearch({ searchQuery, setSearchQuery }: ProductivitySearchProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color={T.onSurface.mutedLight} style={styles.searchIcon} />
      <TextInput
        placeholder={t('productivity.search') || 'Search notes, tasks, events...'}
        placeholderTextColor={T.onSurface.mutedLight}
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
        clearButtonMode="while-editing"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.background.light,
    borderRadius: R.lg,
    paddingHorizontal: S.md,
    height: 44,
    borderWidth: 1,
    borderColor: T.border.light,
  },
  searchIcon: {
    marginRight: S.sm,
  },
  searchInput: {
    flex: 1,
    color: T.onSurface.light,
    fontSize: 16,
    height: '100%',
  },
});
