import { Stack } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { registerAndroidForegroundFcm } from "@/lib/poc/androidMessaging";
import { subscribeAndroidWhispAlertNavigationFromNotifee } from "@/lib/poc/androidNotifeeAlertNavigation";
import {
  setupCallKeepEventListeners,
  setupCallKeepPoc,
  teardownCallKeepEventListeners,
} from "@/lib/poc/iosCallKeep";
import {
  setupVoipTokenListener,
  teardownVoipTokenListener,
} from "@/lib/poc/iosVoipPush";

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== "ios") {
      return;
    }
    setupVoipTokenListener();
    setupCallKeepEventListeners();
    setupCallKeepPoc().catch((err) => {
      console.warn("[poc:ios] CallKeep.setup falló:", err);
    });

    return () => {
      teardownVoipTokenListener();
      teardownCallKeepEventListeners();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }
    const unsubFcm = registerAndroidForegroundFcm();
    const unsubNotifee = subscribeAndroidWhispAlertNavigationFromNotifee();
    return () => {
      unsubFcm();
      unsubNotifee();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <Stack />
    </SafeAreaProvider>
  );
}
