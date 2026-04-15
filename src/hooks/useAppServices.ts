import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import messaging, { AuthorizationStatus } from '@react-native-firebase/messaging';
import Geolocation, {
  GeolocationConfiguration,
  GeolocationResponse,
} from 'react-native-geolocation-service';

export type AppLocation = {
  latitude: number;
  longitude: number;
};

const geoConfig: GeolocationConfiguration = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 10000,
  distanceFilter: 0,
};

const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location access required',
        message: 'We use your location to surface nearby loan requests.',
        buttonPositive: 'Allow',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  Geolocation.requestAuthorization('whenInUse');
  return true;
};

export type AppServicesResponse = {
  location: AppLocation | null;
  notification: string | null;
  fcmToken: string | null;
};

export const useAppServices = (): AppServicesResponse => {
  const [location, setLocation] = useState<AppLocation | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  const handleMessage = useCallback((remoteMessage: any) => {
    if (remoteMessage?.notification?.body) {
      setNotification(remoteMessage.notification.body);
    }
  }, []);

  useEffect(() => {
    const fetchLocation = async () => {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        return;
      }

      Geolocation.getCurrentPosition(
        (position: GeolocationResponse) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Location fetch failed', error);
        },
        geoConfig,
      );
    };

    fetchLocation();
  }, []);

  useEffect(() => {
    let unsubscribeMessage: (() => void) | null = null;
    let unsubscribeToken: (() => void) | null = null;

    const initMessaging = async () => {
      try {
        await messaging().registerDeviceForRemoteMessages();
        const authStatus = await messaging().requestPermission();
        if (
          authStatus === AuthorizationStatus.AUTHORIZED ||
          authStatus === AuthorizationStatus.PROVISIONAL
        ) {
          const token = await messaging().getToken();
          setFcmToken(token);
        } else {
          Alert.alert('Notifications disabled', 'Enable notifications to stay updated.');
        }
        unsubscribeMessage = messaging().onMessage(handleMessage);
        unsubscribeToken = messaging().onTokenRefresh((token) => setFcmToken(token));
      } catch (error) {
        console.warn('FCM init failure', error);
      }
    };

    initMessaging();

    return () => {
      unsubscribeMessage?.();
      unsubscribeToken?.();
    };
  }, [handleMessage]);

  return {
    location,
    notification,
    fcmToken,
  };
};
