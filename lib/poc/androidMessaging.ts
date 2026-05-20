import messaging from "@react-native-firebase/messaging";
import { Platform } from "react-native";

import {
  createFullScreenChannelPoc,
  showFcmFullScreenNotificationPoc,
} from "@/lib/poc/androidInterruption";

/**
 * Mensajes con la app en primer plano (onMessage no muestra bandeja sola).
 */
export function registerAndroidForegroundFcm(): () => void {
  if (Platform.OS !== "android") {
    return () => {};
  }

  const unsub = messaging().onMessage(async (remoteMessage) => {
    console.log("[poc:android:fcm] foreground", remoteMessage.messageId);
    const data = remoteMessage.data ?? {};
    const title =
      typeof data.title === "string" && data.title.length > 0
        ? data.title
        : "Whisp — remoto";
    const body =
      typeof data.body === "string" && data.body.length > 0
        ? data.body
        : "Push (app abierta)";
    const notifId =
      typeof data.msgId === "string" && data.msgId.length > 0
        ? data.msgId
        : `whisp_fcm_fg_${Date.now()}`;

    try {
      await createFullScreenChannelPoc();
      await showFcmFullScreenNotificationPoc(title, body, notifId);
    } catch (e) {
      console.error("[poc:android:fcm] foreground display error", e);
    }
  });

  return unsub;
}

export async function getAndroidFcmTokenForPoc(): Promise<string | null> {
  if (Platform.OS !== "android") {
    return null;
  }
  try {
    const token = await messaging().getToken();
    return token || null;
  } catch (e) {
    console.error("[poc:android:fcm] getToken failed", e);
    return null;
  }
}
