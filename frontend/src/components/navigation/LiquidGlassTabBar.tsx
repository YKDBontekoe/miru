import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Dimensions, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps, BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<string, { default: IoniconsName; active: IoniconsName }> = {
  home: { default: 'home-outline', active: 'home' },
  chat: { default: 'chatbubbles-outline', active: 'chatbubbles' },
  agents: { default: 'people-outline', active: 'people' },
  productivity: { default: 'checkmark-circle-outline', active: 'checkmark-circle' },
  settings: { default: 'settings-outline', active: 'settings' },
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const BAR_SIDE_MARGIN = 24;
const BAR_WIDTH = SCREEN_WIDTH - BAR_SIDE_MARGIN * 2;

function TabItem({
  route,
  isFocused,
  onPress,
  onLongPress,
}: {
  route: BottomTabBarProps['state']['routes'][0];
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: isFocused ? 1.08 : 1,
        useNativeDriver: true,
        tension: 200,
        friction: 12,
      }),
      Animated.timing(glowOpacity, {
        toValue: isFocused ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFocused]);

  const icons = ICONS[route.name] ?? { default: 'ellipse-outline', active: 'ellipse' };
  const iconName = isFocused ? icons.active : icons.default;
  const iconColor = isFocused ? '#FFFFFF' : 'rgba(0,0,0,0.40)';

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabItem}
      activeOpacity={0.7}
    >
      {/* Active pill background */}
      <Animated.View style={[styles.activePill, { opacity: glowOpacity }]} />
      <Animated.View
        style={{ transform: [{ scale }], alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name={iconName} size={22} color={iconColor} />
      </Animated.View>
    </TouchableOpacity>
  );
}

export function LiquidGlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 12);

  return (
    <View style={[styles.outerContainer, { bottom: bottomPadding }]}>
      {/* Outer glow / shadow layer */}
      <View style={styles.glowLayer} />

      {Platform.OS === 'ios' ? (
        <BlurView intensity={60} tint="systemMaterial" style={styles.blurContainer}>
          <View style={styles.glassOverlay} />
          <View style={styles.topHighlight} />
          <TabRow state={state} descriptors={descriptors} navigation={navigation} insets={insets} />
        </BlurView>
      ) : (
        /* Android fallback — semi-transparent dark pill */
        <View style={[styles.blurContainer, styles.androidFallback]}>
          <View style={styles.glassOverlay} />
          <View style={styles.topHighlight} />
          <TabRow state={state} descriptors={descriptors} navigation={navigation} insets={insets} />
        </View>
      )}
    </View>
  );
}

function TabRow({ state, descriptors, navigation }: BottomTabBarProps) {
  const visibleRoutes = state.routes.filter((route) => {
    const opts = descriptors[route.key]?.options;
    // expo-router sets tabBarButton to () => null for href: null screens
    if (typeof opts?.tabBarButton === 'function') {
      try {
        const result = (opts.tabBarButton as (p: object) => React.ReactNode)({});
        if (result === null || result === undefined) return false;
      } catch {
        return false;
      }
    }
    return true;
  });

  return (
    <View style={styles.tabRow}>
      {visibleRoutes.map((route) => {
        const isFocused = state.index === state.routes.indexOf(route);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <TabItem
            key={route.key}
            route={route}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: BAR_SIDE_MARGIN,
    right: BAR_SIDE_MARGIN,
    width: BAR_WIDTH,
    alignSelf: 'center',
    borderRadius: 32,
    // Lift it above page content
    zIndex: 100,
  },
  glowLayer: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 38,
    backgroundColor: 'transparent',
    // Soft drop shadow to simulate floating
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  blurContainer: {
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  androidFallback: {
    backgroundColor: 'rgba(240, 240, 248, 0.92)',
  },
  // Thin white layer reinforces the glass feel
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.30)',
    borderRadius: 32,
  },
  // Specular highlight along the top edge
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.70)',
    borderRadius: 1,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minHeight: 44,
  },
  activePill: {
    position: 'absolute',
    width: 44,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(37, 99, 235, 0.75)', // primary blue, translucent
    // Inner glow
    ...Platform.select({
      ios: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
      },
    }),
  },
});
