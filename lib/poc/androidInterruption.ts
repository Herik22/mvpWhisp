import notifee, {
  AndroidCategory,
  AndroidImportance,
} from "@notifee/react-native";
import { PermissionsAndroid, Platform, Vibration } from "react-native";

/** ID fijo compartido por el canal y la notificación de prueba. */
/** Bump version si cambias importancia/canal y Android ya lo creó. */
export const WHISP_FULLSCREEN_CHANNEL_ID = "whisp_poc_fullscreen_v2";

let vibrationLoopOn = false;

/**
 * Android 13+ (API 33): el diálogo de notificaciones es `POST_NOTIFICATIONS` (PermissionsAndroid).
 * Notifee.requestPermission() no sustituye ese flujo y puede devolver “authorized” sin UI.
 *
 * Full-screen intent: exige `USE_FULL_SCREEN_INTENT` en el manifiesto (ver `app.json`).
 * Con la app en primer plano el sistema casi nunca abre UI a pantalla completa (solo heads-up).
 * Android 14+: Ajustes → Apps → Whisp → “Pantalla completa” / full-screen intent.
 */
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

export async function showLocalFullScreenNotificationPoc(): Promise<void> {
  const notificationId = await notifee.displayNotification({
    id: "whisp_poc_fullscreen_notif",
    title: "Whisp — full-screen intent",
    body: "Prueba FSI: mejor con app en segundo plano o bloqueo",
    android: {
      channelId: WHISP_FULLSCREEN_CHANNEL_ID,
      category: AndroidCategory.CALL,
      importance: AndroidImportance.HIGH,
      sound: "default",
      ongoing: true,
      autoCancel: false,
      lightUpScreen: true,
      pressAction: { id: "poc_press_default" },
      fullScreenAction: { id: "poc_full_screen" },
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
  console.log("[poc:android] vibration loop started", { pattern: VIBE_PATTERN_MS });
}

export function stopVibrationPoc(): void {
  const wasLooping = vibrationLoopOn;
  Vibration.cancel();
  vibrationLoopOn = false;
  console.log("[poc:android] vibration cancelled", { wasLooping });
}
