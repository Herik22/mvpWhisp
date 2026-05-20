import type { FirebaseMessagingTypes } from "@react-native-firebase/messaging";

import {
  createFullScreenChannelPoc,
  logAndroidPocPushNotificationDiagnostics,
  showFcmFullScreenNotificationPoc,
} from "@/lib/poc/androidInterruption";

export async function handleAndroidFcmBackground(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
): Promise<void> {
  console.log("[poc:android:fcm] background handler start", {
    messageId: remoteMessage.messageId,
    dataKeys: remoteMessage.data ? Object.keys(remoteMessage.data) : [],
  });

  try {
    const data = remoteMessage.data ?? {};
    const action = data.action;
    if (action != null && action !== "" && action !== "fullscreen_alert") {
      console.log("[poc:android:fcm] background skip action=", action);
      return;
    }

    const title =
      typeof data.title === "string" && data.title.length > 0
        ? data.title
        : "Whisp — remoto";
    const body =
      typeof data.body === "string" && data.body.length > 0
        ? data.body
        : "Push recibido en segundo plano";

    const notifId =
      typeof data.msgId === "string" && data.msgId.length > 0
        ? data.msgId
        : `whisp_fcm_${Date.now()}`;

    await createFullScreenChannelPoc();
    await showFcmFullScreenNotificationPoc(title, body, notifId);
    await logAndroidPocPushNotificationDiagnostics(notifId);
    console.log("[poc:android:fcm] background OK Notifee mostrada", {
      notifId,
      messageId: remoteMessage.messageId,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : undefined;
    console.error("[poc:android:fcm] background handler ERROR", {
      message: msg,
      stack,
      raw: e,
    });
  }
}
