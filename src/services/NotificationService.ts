import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {Alert} from 'react-native';

export async function requestNotificationPermission(): Promise<boolean> {
  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

export async function saveFCMToken(): Promise<void> {
  const user = auth().currentUser;
  if (!user) return;

  try {
    const token = await messaging().getToken();
    await firestore()
      .collection('users')
      .doc(user.uid)
      .set({fcmToken: token}, {merge: true});

    messaging().onTokenRefresh(async newToken => {
      await firestore()
        .collection('users')
        .doc(user.uid)
        .set({fcmToken: newToken}, {merge: true});
    });
  } catch (_) {}
}

export function setupForegroundNotifications(): () => void {
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    Alert.alert(
      remoteMessage.notification?.title || 'Notification',
      remoteMessage.notification?.body || '',
    );
  });
  return unsubscribe;
}

export function setupBackgroundNotificationHandler(): void {
  messaging().setBackgroundMessageHandler(async () => {});
}
