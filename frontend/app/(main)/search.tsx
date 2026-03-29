import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppText } from '../../src/components/AppText';
import { ApiService } from '../../src/core/api/ApiService';
import { SearchResultItem } from '../../src/core/models';
import { useTheme } from '../../src/hooks/useTheme';
import { theme } from '../../src/core/theme';

const S = theme.spacing;
const R = theme.borderRadius;

const SOURCE_META: Record<string, { icon: string; label: string; color: string }> = {
  memory: { icon: 'brain-outline', label: 'Memory', color: '#8B5CF6' },
  note: { icon: 'document-text-outline', label: 'Note', color: '#14B8A6' },
  task: { icon: 'checkmark-circle-outline', label: 'Task', color: '#F59E0B' },
  chat: { icon: 'chatbubble-outline', label: 'Message', color: '#3B82F6' },
};

export default function SearchScreen() {
  const { C } = useTheme();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await ApiService.search(q.trim());
      setResults(res.results);
      setHasSearched(true);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text), 400);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: S.lg,
          paddingVertical: S.md,
          gap: S.sm,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          backgroundColor: C.surface,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={26} color={C.text} />
        </TouchableOpacity>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: C.surfaceHigh,
            borderRadius: R.xl,
            borderWidth: 1,
            borderColor: C.border,
            paddingHorizontal: S.md,
            gap: S.sm,
          }}
        >
          <Ionicons name="search-outline" size={18} color={C.muted} />
          <TextInput
            value={query}
            onChangeText={handleChange}
            placeholder="Search notes, tasks, memories, messages…"
            placeholderTextColor={C.faint}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => runSearch(query)}
            style={{
              flex: 1,
              color: C.text,
              fontSize: 15,
              paddingVertical: Platform.OS === 'ios' ? 10 : 8,
            }}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={C.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {isSearching ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.source}-${item.id}`}
          contentContainerStyle={{
            paddingHorizontal: S.lg,
            paddingTop: S.lg,
            paddingBottom: 40,
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            hasSearched ? (
              <View
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 64 }}
              >
                <Ionicons
                  name="search-outline"
                  size={48}
                  color={C.faint}
                  style={{ marginBottom: 12 }}
                />
                <AppText
                  style={{ color: C.muted, fontSize: 16, fontWeight: '600', marginBottom: 4 }}
                >
                  No results found
                </AppText>
                <AppText style={{ color: C.faint, fontSize: 14, textAlign: 'center' }}>
                  Try a different search term
                </AppText>
              </View>
            ) : !query.trim() ? (
              <View
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 64 }}
              >
                <Ionicons
                  name="search-outline"
                  size={48}
                  color={C.faint}
                  style={{ marginBottom: 12 }}
                />
                <AppText
                  style={{ color: C.muted, fontSize: 16, fontWeight: '600', marginBottom: 4 }}
                >
                  Search everything
                </AppText>
                <AppText style={{ color: C.faint, fontSize: 14, textAlign: 'center' }}>
                  Notes, tasks, memories, and messages
                </AppText>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const meta = SOURCE_META[item.source] ?? {
              icon: 'ellipse-outline',
              label: item.source,
              color: C.muted,
            };
            return (
              <View
                style={{
                  backgroundColor: C.surface,
                  borderRadius: R.lg,
                  borderWidth: 1,
                  borderColor: C.border,
                  padding: S.lg,
                  marginBottom: S.md,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: S.md,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: `${meta.color}18`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  <Ionicons name={meta.icon as any} size={18} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 3,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: `${meta.color}18`,
                        borderRadius: 6,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                      }}
                    >
                      <AppText
                        style={{
                          fontSize: 10,
                          fontWeight: '700',
                          color: meta.color,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        {meta.label}
                      </AppText>
                    </View>
                    {item.score != null && (
                      <AppText style={{ fontSize: 10, color: C.faint }}>
                        {Math.round(item.score * 100)}% match
                      </AppText>
                    )}
                  </View>
                  {item.title && (
                    <AppText
                      style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: C.text,
                        marginBottom: 3,
                      }}
                      numberOfLines={2}
                    >
                      {item.title}
                    </AppText>
                  )}
                  {item.content && (
                    <AppText
                      style={{ fontSize: 13, color: C.muted, lineHeight: 18 }}
                      numberOfLines={3}
                    >
                      {item.content}
                    </AppText>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
