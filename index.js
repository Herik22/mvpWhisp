/**
 * Punto de entrada: registrar FCM background handler en Android ANTES de expo-router.
 * @see https://rnfirebase.io/messaging/usage#background--quit-state-messages
 */
import notifee, { EventType } from "@notifee/react-native";
import messaging from "@react-native-firebase/messaging";
import { Platform } from "react-native";

import { handleAndroidFcmBackground } from "./lib/poc/androidFcmBackground";
import {
  registerAndroidNotifeeAlertListenersEarly,
  stashWhispAlertNotificationIfApplicable,
} from "./lib/poc/androidNotifeeAlertNavigation";

if (Platform.OS === "android") {
  messaging().setBackgroundMessageHandler(handleAndroidFcmBackground);
}

if (Platform.OS === "android") {
  registerAndroidNotifeeAlertListenersEarly();
}

/** @see https://notifee.app/react-native/docs/events#background-events */
if (Platform.OS === "android") {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    try {
      if (type === EventType.PRESS && detail.notification) {
        stashWhispAlertNotificationIfApplicable(detail.notification);
      }
    } catch (e) {
      console.error("[poc:android:notifee] index onBackgroundEvent ERROR", e);
    }
  });
}

// Debe ir al final: registra handlers nativos antes de montar Expo Router.
// eslint-disable-next-line import/first
import "expo-router/entry";
