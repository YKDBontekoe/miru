import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, FlatList, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../src/components/AppText';
import { useAppStore } from '../../src/store/useAppStore';

const { width } = Dimensions.get('window');

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const PAGES = [
  {
    icon: 'sparkles' as IoniconsName,
    accent: '#2563EB',
    accentBg: '#EFF6FF',
    title: 'Meet Miru',
    subtitle: 'Your personal AI companion',
    description:
      "Miru learns from every conversation, remembers what matters to you, and gets smarter over time \u2014 like a brilliant friend who's always there.",
  },
  {
    icon: 'people' as IoniconsName,
    accent: '#8B5CF6',
    accentBg: '#F5F3FF',
    title: 'Multiple Personas',
    subtitle: 'The right expert for every task',
    description:
      'Create AI agents with distinct personalities and expertise. A creative writer, a data analyst, a life coach — all working together for you.',
  },
  {
    icon: 'shield-checkmark' as IoniconsName,
    accent: '#059669',
    accentBg: '#F0FDF4',
    title: 'Your Privacy First',
    subtitle: 'You stay in control',
    description:
      'Your data is yours. Miru is built with privacy at the core — you decide what it remembers and what it forgets.',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dataConsent, setDataConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const setOnboardingComplete = useAppStore((state) => state.setOnboardingComplete);
  const router = useRouter();

  const finish = () => {
    if (currentIndex === PAGES.length - 1 && !dataConsent) {
      alert('Please agree to the Data Processing Terms to use AI features.');
      return;
    }
    useAppStore.getState().setPendingConsents({ dataConsent, marketingConsent });
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

  const renderItem = ({ item }: { item: (typeof PAGES)[0] }) => (
    <View style={{ width, paddingHorizontal: 32, paddingTop: 16 }}>
      {/* Illustration */}
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 40,
        }}
      >
        {/* Outer ring */}
        <View
          style={{
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: item.accentBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Middle ring */}
          <View
            style={{
              width: 148,
              height: 148,
              borderRadius: 74,
              backgroundColor: `${item.accent}18`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Inner circle */}
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: `${item.accent}25`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={item.icon} size={48} color={item.accent} />
            </View>
          </View>
        </View>
      </View>

      {/* Text */}
      <AppText
        variant="caption"
        style={{
          color: item.accent,
          fontWeight: '700',
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        {item.subtitle}
      </AppText>
      <AppText
        variant="h1"
        style={{ textAlign: 'center', marginBottom: 16, fontSize: 32, letterSpacing: -0.5 }}
      >
        {item.title}
      </AppText>
      <AppText variant="body" color="muted" style={{ textAlign: 'center', lineHeight: 26 }}>
        {item.description}
      </AppText>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Skip */}
      <View
        style={{ alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}
      >
        <TouchableOpacity onPress={finish} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}>
          <AppText color="muted" style={{ fontSize: 15, fontWeight: '500' }}>
            Skip
          </AppText>
        </TouchableOpacity>
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
        style={{ flex: 1 }}
      />

      {/* Bottom controls */}
      <View style={{ paddingHorizontal: 28, paddingBottom: 24, gap: 24 }}>
        {/* Dot indicators */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          {PAGES.map((p, i) => (
            <View
              key={i}
              style={{
                height: 8,
                width: i === currentIndex ? 28 : 8,
                borderRadius: 4,
                backgroundColor: i === currentIndex ? page.accent : '#D8D8E4',
              }}
            />
          ))}
        </View>

        {/* Consent Tracking on Last Page */}
        {currentIndex === PAGES.length - 1 && (
          <View style={{ marginBottom: 16 }}>
            <AppText
              variant="caption"
              color="muted"
              style={{ textAlign: 'center', marginBottom: 16 }}
            >
              Before we begin, please review our privacy settings:
            </AppText>

            <TouchableOpacity
              onPress={() => setDataConsent(!dataConsent)}
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: dataConsent ? '#8B5CF6' : '#D8D8E4',
                  backgroundColor: dataConsent ? '#8B5CF6' : 'transparent',
                  marginRight: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {dataConsent && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </View>
              <AppText variant="caption" style={{ flex: 1 }}>
                I agree to the Data Processing Terms (required for AI features).
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMarketingConsent(!marketingConsent)}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: marketingConsent ? '#8B5CF6' : '#D8D8E4',
                  backgroundColor: marketingConsent ? '#8B5CF6' : 'transparent',
                  marginRight: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {marketingConsent && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </View>
              <AppText variant="caption" style={{ flex: 1 }}>
                I consent to receiving marketing and product updates.
              </AppText>
            </TouchableOpacity>
          </View>
        )}

        {/* Next / Get Started */}
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.85}
          style={{
            height: 56,
            borderRadius: 16,
            backgroundColor: page.accent,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
          }}
        >
          <AppText style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 17 }}>
            {currentIndex === PAGES.length - 1 ? 'Get Started' : 'Continue'}
          </AppText>
          <Ionicons
            name={currentIndex === PAGES.length - 1 ? 'sparkles' : 'arrow-forward'}
            size={18}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        {/* Page counter */}
        <AppText variant="caption" color="muted" style={{ textAlign: 'center' }}>
          {currentIndex + 1} of {PAGES.length}
        </AppText>
      </View>
    </SafeAreaView>
  );
}
