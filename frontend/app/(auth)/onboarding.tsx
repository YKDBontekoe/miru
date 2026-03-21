import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppText } from '../../src/components/AppText';
import { AppButton } from '../../src/components/AppButton';
import { useAppStore } from '../../src/store/useAppStore';

const { width } = Dimensions.get('window');

const ONBOARDING_PAGES = [
  {
    title: 'Meet Miru',
    description: 'Your personal AI assistant that remembers you and grows with you.',
    icon: '✨',
    color: '#2563EB',
  },
  {
    title: 'Context Aware',
    description: 'Miru understands your past conversations to provide better help.',
    icon: '🧠',
    color: '#34D399',
  },
  {
    title: 'Privacy First',
    description: 'Your data is yours. Miru is designed with security and privacy in mind.',
    icon: '🛡️',
    color: '#60A5FA',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const setOnboardingComplete = useAppStore((state) => state.setOnboardingComplete);
  const router = useRouter();

  const handleNext = () => {
    if (currentIndex < ONBOARDING_PAGES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      setOnboardingComplete(true);
      router.replace('/(auth)/login');
    }
  };

  const renderItem = ({ item }: { item: (typeof ONBOARDING_PAGES)[0] }) => (
    <View style={{ width }} className="px-xl items-center justify-center">
      <View
        className="w-40 h-40 rounded-full items-center justify-center mb-xxxl"
        style={{ backgroundColor: `${item.color}20` }}
      >
        <AppText className="text-6xl">{item.icon}</AppText>
      </View>
      <AppText variant="h1" className="text-center mb-md">
        {item.title}
      </AppText>
      <AppText variant="body" color="muted" className="text-center px-lg">
        {item.description}
      </AppText>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-1">
        <FlatList
          ref={flatListRef}
          data={ONBOARDING_PAGES}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentIndex(index);
          }}
          keyExtractor={(_, index) => index.toString()}
        />

        <View className="px-xl pb-xl">
          <View className="flex-row justify-center mb-xl">
            {ONBOARDING_PAGES.map((_, index) => (
              <View
                key={index}
                className={`h-2 rounded-full mx-1 ${index === currentIndex ? 'w-6 bg-primary' : 'w-2 bg-onSurface-disabledDark'}`}
              />
            ))}
          </View>

          <AppButton
            label={currentIndex === ONBOARDING_PAGES.length - 1 ? 'Get Started' : 'Next'}
            onPress={handleNext}
          />

          <TouchableOpacity
            onPress={() => {
              setOnboardingComplete(true);
              router.replace('/(auth)/login');
            }}
            className="mt-md items-center"
          >
            <AppText color="muted">Skip</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
