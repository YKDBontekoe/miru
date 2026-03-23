import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { apiClient } from '../../core/api/client';
import { useAuthStore } from '../../store/useAuthStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!user) return;

    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);

        // Use Platform.OS to let the backend know how to format Azure Hub messages
        const platformStr = Platform.OS === 'ios' ? 'ios' : 'android';

        apiClient
          .post('/api/v1/notifications/device-tokens', {
            token,
            platform: platformStr,
          })
          .catch((err: unknown) => {
            console.error('Failed to register device token with backend:', err);
          });
      }
    });

    // Foreground notification listener
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      // We can update local state here if needed
      console.log('Push Notification Received:', notification);
    });

    // Notification tap listener (background or foreground tap)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data && data.roomId) {
        // Deep link to the chat room
        router.push(`/rooms/${data.roomId}`);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user, router]);

  return { expoPushToken };
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return null;
    }

    // Azure Notification Hub supports sending natively to APNs and FCM using the native device token
    try {
      const tokenData = await Notifications.getDevicePushTokenAsync();
      token = tokenData.data;
    } catch (_e) {
      // Fallback for expo go
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '62363c9b-9555-4eb9-92ff-96612d1bb1d5',
      });
      token = tokenData.data;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
