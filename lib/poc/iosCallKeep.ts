import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type RNCallKeepType from "react-native-callkeep";

/**
 * iOS (ver `app.json`):
 * - `UIBackgroundModes`: audio + voip (llamadas / audio en segundo plano; voip para PushKit más adelante).
 * - `NSMicrophoneUsageDescription` (CallKit / audio de llamada).
 * - Entitlement time-sensitive para notificaciones `interruptionLevel: "timeSensitive"`:
 *   activar también en developer.apple.com → Identifiers → tu App ID → Time Sensitive Notifications.
 *
 * CallKit no funciona en simulador: solo dispositivo físico.
 * Push VoIP real requiere más pasos (PushKit, report new incoming call, etc.) — fuera de este POC.
 */

let callKeepModule: typeof RNCallKeepType | null = null;

function getCallKeep(): typeof RNCallKeepType {
  if (Platform.OS !== "ios") {
    throw new Error("CallKeep POC solo está pensado para iOS en este proyecto.");
  }
  if (!callKeepModule) {
    const mod = require("react-native-callkeep")
      .default as typeof RNCallKeepType;
    callKeepModule = mod;
  }
  return callKeepModule;
}

let activeCallUuid: string | null = null;

function randomUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function setupCallKeepPoc(): Promise<void> {
  const ck = getCallKeep();
  const ok = await ck.setup({
    ios: {
      appName: "Whisp",
    },
    android: {
      alertTitle: "Whisp",
      alertDescription: "POC — permisos de llamada (no usado en este POC iOS-only)",
      cancelButton: "Cancelar",
      okButton: "OK",
      additionalPermissions: [],
    },
  });
  ck.setReachable();
  console.log("[poc:ios] CallKeep.setup + setReachable", { ok });
}

export function showIncomingCallKeepPoc(): void {
  const ck = getCallKeep();
  const uuid = randomUuid();
  activeCallUuid = uuid;
  ck.displayIncomingCall(
    uuid,
    "Family urgent message",
    "Whisp Alert",
    "generic",
    false,
  );
  console.log("[poc:ios] displayIncomingCall", {
    uuid,
    handle: "Family urgent message",
    localizedCallerName: "Whisp Alert",
  });
}

export function endActiveCallKeepPoc(): void {
  const ck = getCallKeep();
  if (!activeCallUuid) {
    console.log("[poc:ios] endCall — no active uuid");
    return;
  }
  ck.endCall(activeCallUuid);
  console.log("[poc:ios] endCall", { uuid: activeCallUuid });
  activeCallUuid = null;
}

export async function scheduleTimeSensitiveNotificationPoc(): Promise<void> {
  if (Platform.OS !== "ios") {
    console.log("[poc:ios] time-sensitive notification omitida (no iOS)");
    return;
  }

  const perm = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  console.log("[poc:ios] notifications permission", perm);

  const content: Notifications.NotificationContentInput = {
    title: "Whisp — time sensitive",
    body: "Prueba de interrupción local (timeSensitive)",
    sound: "default",
    // iOS 15+ — requiere capability / configuración en prebuild; ver plugin expo-notifications.
    interruptionLevel: "timeSensitive",
  };

  const id = await Notifications.scheduleNotificationAsync({
    content,
    trigger: null,
  });
  console.log("[poc:ios] scheduleNotificationAsync timeSensitive", { id });
}
