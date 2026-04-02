import React, { useState, useRef, useMemo } from 'react';
import { View, FlatList, useWindowDimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/hooks/useTheme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];


// Helper to determine text color based on background color luminance
function getContrastingColor(hex: string) {
  // Remove hash if present
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#12121A' : '#FFFFFF';
}

export default function OnboardingScreen() {

  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const setOnboardingComplete = useAppStore((state) => state.setOnboardingComplete);
  const router = useRouter();

  const { C, isDark } = useTheme();

  const PAGES = useMemo(
    () => [
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
    ],
    [C, isDark]
  );

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
  const ctaForegroundColor = getContrastingColor(page.accent);

  const renderItem = ({ item }: { item: (typeof PAGES)[0] }) => (
    <View className="px-xxxl pt-lg" style={{ width }}>
      {/* Illustration */}
      <View className="items-center justify-center mb-huge">
        {/* Outer ring */}
        <View
          className="w-full max-w-[200px] aspect-square rounded-full items-center justify-center"
          style={{ backgroundColor: item.accentBg }}
        >
          {/* Middle ring */}
          <View
            className="w-[74%] aspect-square rounded-full items-center justify-center"
            style={{ backgroundColor: `${item.accent}18` }}
          >
            {/* Inner circle */}
            <View
              className="w-[67%] aspect-square rounded-full items-center justify-center"
              style={{ backgroundColor: `${item.accent}25` }}
            >
              <Ionicons name={item.icon} size={48} color={item.accent} />
            </View>
          </View>
        </View>
      </View>

      {/* Text */}
      <AppText
        variant="caption"
        className="font-bold tracking-[1.4px] uppercase mb-sm text-center"
        style={{ color: item.accent }}
      >
        {item.subtitle}
      </AppText>
      <AppText variant="h1" className="text-center mb-lg text-[32px] tracking-[-0.5px]">
        {item.title}
      </AppText>
      <AppText variant="body" color="muted" className="text-center leading-[26px]">
        {item.description}
      </AppText>
    </View>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.bg }}>
      {/* Skip */}
      <View className="items-end px-xl pt-sm pb-xs">
        <ScalePressable onPress={finish} hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}>
          <AppText color="muted" className="text-[15px] font-medium">
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
        className="flex-1"
      />

      {/* Bottom controls */}
      <View className="px-avatar pb-xxl gap-xxl">
        {/* Dot indicators */}
        <View className="flex-row justify-center gap-sm">
          {PAGES.map((p, i) => (
            <View
              key={i}
              className="h-2 rounded-sm"
              style={{
                width: i === currentIndex ? 28 : 8,
                backgroundColor: i === currentIndex ? page.accent : C.faint,
              }}
            />
          ))}
        </View>

        {/* Next / Get Started */}
        <ScalePressable
          onPress={handleNext}
          className="h-14 rounded-2xl items-center justify-center flex-row gap-sm"
          style={{ backgroundColor: page.accent }}
        >
          <AppText style={{ color: ctaForegroundColor }} className="font-bold text-[17px]">
            {currentIndex === PAGES.length - 1 ? 'Get Started' : 'Continue'}
          </AppText>
          <Ionicons
            name={currentIndex === PAGES.length - 1 ? 'sparkles' : 'arrow-forward'}
            size={18}
            color={ctaForegroundColor}
          />
        </ScalePressable>

        {/* Page counter */}
        <AppText variant="caption" color="muted" className="text-center">
          {currentIndex + 1} of {PAGES.length}
        </AppText>
      </View>
    </SafeAreaView>
  );
}
