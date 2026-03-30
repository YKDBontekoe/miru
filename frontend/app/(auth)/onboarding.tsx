import React, { useState, useRef, useMemo } from 'react';
import { View, FlatList, Dimensions, Animated, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../src/components/AppText';
import { ScalePressable } from '../../src/components/ScalePressable';
import { useAppStore } from '../../src/store/useAppStore';
import { useTheme } from '../../src/hooks/useTheme';

const { width } = Dimensions.get('window');

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const setOnboardingComplete = useAppStore((state) => state.setOnboardingComplete);
  const router = useRouter();

  const { C, isDark } = useTheme();

  const PAGES = useMemo(() => [
    {
      icon: 'sparkles' as IoniconsName,
      accent: C.primary,
      accentBg: C.primarySurface,
      title: 'Meet Miru',
      subtitle: 'Your personal AI companion',
      description:
        "Miru learns from every conversation, remembers what matters to you, and gets smarter over time \u2014 like a brilliant friend who's always there.",
    },
    {
      icon: 'people' as IoniconsName,
      accent: isDark ? '#A78BFA' : '#8B5CF6',
      accentBg: isDark ? '#2E1065' : '#F5F3FF',
      title: 'Multiple Personas',
      subtitle: 'The right expert for every task',
      description:
        'Create AI agents with distinct personalities and expertise. A creative writer, a data analyst, a life coach — all working together for you.',
    },
    {
      icon: 'shield-checkmark' as IoniconsName,
      accent: C.success,
      accentBg: C.successSurface,
      title: 'Your Privacy First',
      subtitle: 'You stay in control',
      description:
        'Your data is yours. Miru is built with privacy at the core — you decide what it remembers and what it forgets.',
    },
  ], [C, isDark]);

  const finish = () => {
    setOnboardingComplete(true);
    router.replace('/(auth)/login');
  };

  const handleNext = () => {
    if (currentIndex < PAGES.length - 1) {
      const next = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentIndex(next);
    } else {
      finish();
    }
  };

  const page = PAGES[currentIndex];

  const styles = useMemo(() => StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: C.bg,
    },
    skipContainer: {
      alignItems: 'flex-end',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 4,
    },
    skipText: {
      fontSize: 15,
      fontWeight: '500',
    },
    pageContainer: {
      width,
      paddingHorizontal: 32,
      paddingTop: 16,
    },
    illustrationContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 40,
    },
    outerRing: {
      width: '100%',
      aspectRatio: 1,
      maxWidth: 200,
      borderRadius: 100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    middleRing: {
      width: '74%',
      aspectRatio: 1,
      borderRadius: 100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    innerRing: {
      width: '67%',
      aspectRatio: 1,
      borderRadius: 100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    subtitle: {
      fontWeight: '700',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      marginBottom: 8,
      textAlign: 'center',
    },
    title: {
      textAlign: 'center',
      marginBottom: 16,
      fontSize: 32,
      letterSpacing: -0.5,
    },
    description: {
      textAlign: 'center',
      lineHeight: 26,
    },
    list: {
      flex: 1,
    },
    bottomControls: {
      paddingHorizontal: 28,
      paddingBottom: 24,
      gap: 24,
    },
    dotsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    dot: {
      height: 8,
      borderRadius: 4,
    },
    button: {
      height: 56,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    buttonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 17,
    },
    pageCounter: {
      textAlign: 'center',
    },
  }), [C, width]);

  const renderItem = ({ item }: { item: (typeof PAGES)[0] }) => (
    <View style={styles.pageContainer}>
      {/* Illustration */}
      <View style={styles.illustrationContainer}>
        {/* Outer ring */}
        <View style={[styles.outerRing, { backgroundColor: item.accentBg }]}>
          {/* Middle ring */}
          <View style={[styles.middleRing, { backgroundColor: `${item.accent}18` }]}>
            {/* Inner circle */}
            <View style={[styles.innerRing, { backgroundColor: `${item.accent}25` }]}>
              <Ionicons name={item.icon} size={48} color={item.accent} />
            </View>
          </View>
        </View>
      </View>

      {/* Text */}
      <AppText variant="caption" style={[styles.subtitle, { color: item.accent }]}>
        {item.subtitle}
      </AppText>
      <AppText variant="h1" style={styles.title}>
        {item.title}
      </AppText>
      <AppText variant="body" color="muted" style={styles.description}>
        {item.description}
      </AppText>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Skip */}
      <View style={styles.skipContainer}>
        <ScalePressable onPress={finish} hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}>
          <AppText color="muted" style={styles.skipText}>
            Skip
          </AppText>
        </ScalePressable>
      </View>

      {/* Pages */}
      <FlatList
        ref={flatListRef}
        data={PAGES}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        keyExtractor={(_, i) => i.toString()}
        style={styles.list}
      />

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        {/* Dot indicators */}
        <View style={styles.dotsContainer}>
          {PAGES.map((p, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: i === currentIndex ? 28 : 8,
                  backgroundColor: i === currentIndex ? page.accent : C.faint,
                },
              ]}
            />
          ))}
        </View>

        {/* Next / Get Started */}
        <ScalePressable
          onPress={handleNext}
          style={[styles.button, { backgroundColor: page.accent }]}
        >
          <AppText style={styles.buttonText}>
            {currentIndex === PAGES.length - 1 ? 'Get Started' : 'Continue'}
          </AppText>
          <Ionicons
            name={currentIndex === PAGES.length - 1 ? 'sparkles' : 'arrow-forward'}
            size={18}
            color="#FFFFFF"
          />
        </ScalePressable>

        {/* Page counter */}
        <AppText variant="caption" color="muted" style={styles.pageCounter}>
          {currentIndex + 1} of {PAGES.length}
        </AppText>
      </View>
    </SafeAreaView>
  );
}
