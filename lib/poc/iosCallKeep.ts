import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type RNCallKeepType from "react-native-callkeep";

let callKeepModule: typeof RNCallKeepType | null = null;

function getCallKeep(): typeof RNCallKeepType {
  if (Platform.OS !== "ios") {
    throw new Error(
      "CallKeep POC solo está pensado para iOS en este proyecto.",
    );
  }
  if (!callKeepModule) {
    const mod = require("react-native-callkeep")
      .default as typeof RNCallKeepType;
    callKeepModule = mod;
  }
  return callKeepModule;
}

let activeCallUuid: string | null = null;
let isSetupDone = false;
let areListenersAttached = false;

function randomUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function setupCallKeepPoc(): Promise<void> {
  if (isSetupDone) {
    console.log("[poc:ios] CallKeep.setup ya estaba hecho, skip");
    return;
  }
  const ck = getCallKeep();
  const ok = await ck.setup({
    ios: {
      appName: "Whisp",
      supportsVideo: false,
      maximumCallGroups: "1",
      maximumCallsPerCallGroup: "1",
    },
    android: {
      alertTitle: "Whisp",
      alertDescription:
        "POC — permisos de llamada (no usado en este POC iOS-only)",
      cancelButton: "Cancelar",
      okButton: "OK",
      additionalPermissions: [],
    },
  });
  ck.setReachable();
  isSetupDone = true;
  console.log("[poc:ios] CallKeep.setup + setReachable", { ok });
}

export function setupCallKeepEventListeners(): void {
  if (Platform.OS !== "ios") return;
  if (areListenersAttached) return;
  areListenersAttached = true;

  const ck = getCallKeep();

  ck.addEventListener("didDisplayIncomingCall", (event) => {
    console.log("[poc:ios] CallKeep didDisplayIncomingCall", event);
    if (event && typeof event === "object" && "callUUID" in event) {
      activeCallUuid = (event as { callUUID: string }).callUUID;
    }
  });

  ck.addEventListener("answerCall", ({ callUUID }) => {
    console.log("[poc:ios] CallKeep answerCall", { callUUID });
    activeCallUuid = callUUID;
  });

  ck.addEventListener("endCall", ({ callUUID }) => {
    console.log("[poc:ios] CallKeep endCall", { callUUID });
    if (activeCallUuid === callUUID) activeCallUuid = null;
  });

  ck.addEventListener("didActivateAudioSession", () => {
    console.log("[poc:ios] CallKeep didActivateAudioSession");
  });

  ck.addEventListener("didDeactivateAudioSession", () => {
    console.log("[poc:ios] CallKeep didDeactivateAudioSession");
  });

  ck.addEventListener("didPerformSetMutedCallAction", ({ muted, callUUID }) => {
    console.log("[poc:ios] CallKeep didPerformSetMutedCallAction", {
      muted,
      callUUID,
    });
  });

  console.log("[poc:ios] CallKeep listeners attached");
}

export function teardownCallKeepEventListeners(): void {
  if (Platform.OS !== "ios") return;
  if (!areListenersAttached) return;
  const ck = getCallKeep();
  ck.removeEventListener("didDisplayIncomingCall");
  ck.removeEventListener("answerCall");
  ck.removeEventListener("endCall");
  ck.removeEventListener("didActivateAudioSession");
  ck.removeEventListener("didDeactivateAudioSession");
  ck.removeEventListener("didPerformSetMutedCallAction");
  areListenersAttached = false;
  console.log("[poc:ios] CallKeep listeners removed");
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
    interruptionLevel: "timeSensitive",
  };

  const id = await Notifications.scheduleNotificationAsync({
    content,
    trigger: null,
  });
  console.log("[poc:ios] scheduleNotificationAsync timeSensitive", { id });
}
