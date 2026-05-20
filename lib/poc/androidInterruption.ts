import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidLaunchActivityFlag,
  AndroidVisibility,
  AuthorizationStatus,
} from "@notifee/react-native";
import Constants from "expo-constants";
import { Linking, PermissionsAndroid, Platform, Vibration } from "react-native";

/** Notifee espera el nombre de clase de la Activity launcher (no el literal "default"). */
function androidMainActivityClassForNotifee(): string {
  const pkg = Constants.expoConfig?.android?.package;
  if (pkg && typeof pkg === "string") {
    return `${pkg}.MainActivity`;
  }
  return "com.mvpwhisp.app.MainActivity";
}

const NOTIFEE_LAUNCH_ACTIVITY = androidMainActivityClassForNotifee();

/** Nuevo id de canal (Android no actualiza importancia de canales ya creados). */
export const WHISP_FULLSCREEN_CHANNEL_ID = "whisp_poc_fullscreen_v4";

const LAUNCH_FLAGS = [
  AndroidLaunchActivityFlag.NEW_TASK,
  AndroidLaunchActivityFlag.SINGLE_TOP,
];

let vibrationLoopOn = false;

export async function requestNotificationPermissionPoc(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  if (Platform.Version >= 33) {
    const post = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    console.log("[poc:android] PermissionsAndroid POST_NOTIFICATIONS", post);
  }

  const settings = await notifee.requestPermission();
  console.log("[poc:android] notifee.requestPermission", settings);
}

export async function createFullScreenChannelPoc(): Promise<void> {
  const id = await notifee.createChannel({
    id: WHISP_FULLSCREEN_CHANNEL_ID,
    name: "Whisp — full-screen POC",
    importance: AndroidImportance.HIGH,
    sound: "default",
    bypassDnd: true,
  });
  console.log("[poc:android] createChannel", { id, importance: "HIGH" });
}

/**
 * Android 14+ (API 34): pantalla del sistema para permitir intents de pantalla completa a esta app.
 * En API menor a 34 abre los ajustes generales de la app (no existe esa pantalla).
 */
export async function openAndroidFullScreenIntentSettingsPoc(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }
  const pkg =
    (Constants.expoConfig?.android?.package as string | undefined) ??
    "com.mvpwhisp.app";
  try {
    if (Platform.Version >= 34) {
      const IntentLauncher = await import("expo-intent-launcher");
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.MANAGE_APP_USE_FULL_SCREEN_INTENT,
        { data: `package:${pkg}` },
      );
      console.log("[poc:android] openAndroidFullScreenIntentSettingsPoc OK", {
        pkg,
      });
    } else {
      await Linking.openSettings();
      console.log(
        "[poc:android] openAndroidFullScreenIntentSettingsPoc → Linking.openSettings (API < 34)",
      );
    }
  } catch (e) {
    console.warn(
      "[poc:android] openAndroidFullScreenIntentSettingsPoc fallback",
      e,
    );
    await Linking.openSettings();
  }
}

/**
 * Tras un push FCM: ayuda a ver si el sistema bloqueó el canal o silenció alertas.
 * Si `authorizationStatus` es DENIED o el canal `blocked`/importancia baja, no verás heads-up.
 */
export async function logAndroidPocPushNotificationDiagnostics(
  notificationId: string,
): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }
  try {
    const settings = await notifee.getNotificationSettings();
    const channelBlocked = await notifee.isChannelBlocked(
      WHISP_FULLSCREEN_CHANNEL_ID,
    );
    const channel = await notifee.getChannel(WHISP_FULLSCREEN_CHANNEL_ID);
    const displayed = await notifee.getDisplayedNotifications();
    const visible = displayed.some(
      (d) => d.notification.id === notificationId,
    );
    console.log("[poc:android:notifee:DIAG] tras push FCM", {
      notificationId,
      authorizationStatus:
        settings.authorizationStatus === AuthorizationStatus.AUTHORIZED
          ? "AUTHORIZED"
          : settings.authorizationStatus === AuthorizationStatus.DENIED
            ? "DENIED"
            : settings.authorizationStatus,
      channelId: WHISP_FULLSCREEN_CHANNEL_ID,
      isChannelBlocked: channelBlocked,
      channelFromSystem: channel
        ? {
            importance: channel.importance,
            blocked: channel.blocked,
          }
        : null,
      listedInDisplayedNotifications: visible,
      displayedTotal: displayed.length,
    });
  } catch (e) {
    console.warn("[poc:android:notifee:DIAG] error", e);
  }
}

/** Ajustes del canal POC (revisa que no esté en «Silenciar» / importancia mínima). */
export async function openAndroidPocNotificationChannelSettingsPoc(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }
  await notifee.openNotificationSettings(WHISP_FULLSCREEN_CHANNEL_ID);
}

export async function showFcmFullScreenNotificationPoc(
  title: string,
  body: string,
  notificationId?: string,
): Promise<string> {
  const id = notificationId ?? `whisp_fcm_${Date.now()}`;
  const payload = {
    id,
    title,
    body,
    data: {
      url: "/whisp-alert",
      title,
      body,
      msgId: id,
      source: "fcm_fullscreen_poc",
    },
    android: {
      channelId: WHISP_FULLSCREEN_CHANNEL_ID,
      category: AndroidCategory.CALL,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      sound: "default",
      ongoing: true,
      autoCancel: false,
      lightUpScreen: true,
      pressAction: {
        id: "poc_fcm_press",
        launchActivity: NOTIFEE_LAUNCH_ACTIVITY,
        launchActivityFlags: LAUNCH_FLAGS,
      },
      fullScreenAction: {
        id: "poc_fcm_full_screen",
        launchActivity: NOTIFEE_LAUNCH_ACTIVITY,
        launchActivityFlags: LAUNCH_FLAGS,
      },
    },
  };
  console.log(
    "[poc:android] displayNotification payload (FCM)",
    JSON.stringify(payload, null, 2),
  );
  const notificationIdOut = await notifee.displayNotification(payload);
  console.log("[poc:android] displayNotification (FCM)", {
    notificationId: notificationIdOut,
    id,
  });
  return notificationIdOut;
}

export async function showLocalFullScreenNotificationPoc(): Promise<void> {
  const localId = "whisp_poc_fullscreen_notif";
  const notificationId = await notifee.displayNotification({
    id: localId,
    title: "Whisp — full-screen intent",
    body: "Prueba FSI: mejor con app en segundo plano o bloqueo",
    data: {
      url: "/whisp-alert",
      title: "Whisp — full-screen intent",
      body: "Prueba FSI: mejor con app en segundo plano o bloqueo",
      msgId: localId,
      source: "fcm_fullscreen_poc",
    },
    android: {
      channelId: WHISP_FULLSCREEN_CHANNEL_ID,
      category: AndroidCategory.CALL,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      sound: "default",
      ongoing: true,
      autoCancel: false,
      lightUpScreen: true,
      pressAction: {
        id: "poc_press_default",
        launchActivity: NOTIFEE_LAUNCH_ACTIVITY,
        launchActivityFlags: LAUNCH_FLAGS,
      },
      fullScreenAction: {
        id: "poc_full_screen",
        launchActivity: NOTIFEE_LAUNCH_ACTIVITY,
        launchActivityFlags: LAUNCH_FLAGS,
      },
    },
  });
  console.log("[poc:android] displayNotification full-screen-ish", {
    notificationId,
    channelId: WHISP_FULLSCREEN_CHANNEL_ID,
    note: "Si solo ves heads-up, pon la app en background o bloquea el móvil; revisa permiso FSI en A14+",
  });
}

const VIBE_PATTERN_MS = [0, 400, 250, 400];

export function startVibrationLoopPoc(): void {
  Vibration.vibrate(VIBE_PATTERN_MS, true);
  vibrationLoopOn = true;
  console.log("[poc:android] vibration loop started", {
    pattern: VIBE_PATTERN_MS,
  });
}

export function stopVibrationPoc(): void {
  const wasLooping = vibrationLoopOn;
  Vibration.cancel();
  vibrationLoopOn = false;
  console.log("[poc:android] vibration cancelled", { wasLooping });
}
