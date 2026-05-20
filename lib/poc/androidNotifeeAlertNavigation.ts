import notifee, { EventType, type Notification } from "@notifee/react-native";
import {
  AppState,
  DeviceEventEmitter,
  InteractionManager,
  Platform,
  type EmitterSubscription,
} from "react-native";

export const WHISP_ALERT_SOURCE = "fcm_fullscreen_poc";

export const NOTIFEE_WHISP_ALERT_PRESS =
  "poc:notifee:whisp_alert_press" as const;

let pendingInitial: Notification | null = null;

export function isWhispAlertNotification(
  n: Notification | undefined | null,
): boolean {
  const d = n?.data;
  if (!d || typeof d !== "object") return false;
  const source = d.source;
  const url = d.url;
  return (
    source === WHISP_ALERT_SOURCE ||
    url === "/whisp-alert" ||
    url === "whisp-alert"
  );
}

function setPendingInitial(n: Notification): void {
  pendingInitial = n;
}

/** Para `onBackgroundEvent` (headless): guarda la notificación si aplica. */
export function stashWhispAlertNotificationIfApplicable(
  n: Notification | undefined | null,
): void {
  try {
    if (!n) {
      console.log("[poc:android:notifee] background PRESS sin notification");
      return;
    }
    if (!isWhispAlertNotification(n)) {
      console.log("[poc:android:notifee] background PRESS ignorada (no POC)", {
        keys: n.data && typeof n.data === "object" ? Object.keys(n.data) : [],
      });
      return;
    }
    setPendingInitial(n);
    console.log(
      "[poc:android:notifee] background PRESS → pending whisp-alert",
      {
        msgId:
          n.data && typeof n.data === "object"
            ? (n.data as { msgId?: string }).msgId
            : undefined,
      },
    );
    // Mismo camino que onForegroundEvent: si solo había pending, los timeouts 80/400 ms ya pasaron y nadie navegaba.
    queueMicrotask(() => {
      emitPress(n);
    });
  } catch (e) {
    console.error(
      "[poc:android:notifee] stashWhispAlertNotificationIfApplicable ERROR",
      e,
    );
  }
}

export function takePendingInitialWhispAlert(): Notification | null {
  const p = pendingInitial;
  pendingInitial = null;
  return p;
}

function emitPress(n: Notification): void {
  DeviceEventEmitter.emit(NOTIFEE_WHISP_ALERT_PRESS, n);
}

export function navigateToWhispAlert(n: Notification): void {
  try {
    if (!isWhispAlertNotification(n)) {
      console.warn(
        "[poc:android:notifee] navigateToWhispAlert: notificación no POC",
      );
      return;
    }
    const d = n.data ?? {};
    const title = typeof d.title === "string" ? d.title : "Whisp Alert";
    const body = typeof d.body === "string" ? d.body : "";
    const msgId = typeof d.msgId === "string" ? d.msgId : "";
    const source = typeof d.source === "string" ? d.source : WHISP_ALERT_SOURCE;

    console.log("[poc:android:notifee] navigateToWhispAlert → router.replace", {
      pathname: "/whisp-alert",
      titleLen: title.length,
      bodyLen: body.length,
      msgId,
      source,
    });

    const { router } =
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- evita cargar expo-router antes de entry
      require("expo-router") as typeof import("expo-router");
    router.replace({
      pathname: "/whisp-alert",
      params: { title, body, msgId, source },
    });
    console.log("[poc:android:notifee] navigateToWhispAlert OK");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : undefined;
    console.error("[poc:android:notifee] navigateToWhispAlert ERROR", {
      message: msg,
      stack,
      raw: e,
    });
  }
}

function scheduleNavigate(n: Notification): void {
  console.log("[poc:android:notifee] scheduleNavigate");
  InteractionManager.runAfterInteractions(() => {
    setTimeout(() => {
      try {
        navigateToWhispAlert(n);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[poc:android:notifee] scheduleNavigate inner ERROR", {
          message: msg,
          raw: e,
        });
      }
    }, 0);
  });
}

export function registerAndroidNotifeeAlertListenersEarly(): void {
  if (Platform.OS !== "android") {
    return;
  }

  void notifee
    .getInitialNotification()
    .then((initial) => {
      try {
        if (
          initial?.notification &&
          isWhispAlertNotification(initial.notification)
        ) {
          setPendingInitial(initial.notification);
          console.log(
            "[poc:android:notifee] getInitialNotification → pending POC",
          );
        } else if (initial?.notification) {
          console.log("[poc:android:notifee] getInitialNotification (no POC)", {
            keys:
              initial.notification.data &&
              typeof initial.notification.data === "object"
                ? Object.keys(initial.notification.data)
                : [],
          });
        } else {
          console.log("[poc:android:notifee] getInitialNotification vacío");
        }
      } catch (e) {
        console.error(
          "[poc:android:notifee] getInitialNotification handler ERROR",
          e,
        );
      }
    })
    .catch((e) => {
      console.error(
        "[poc:android:notifee] getInitialNotification promise ERROR",
        e,
      );
    });

  notifee.onForegroundEvent(({ type, detail }) => {
    try {
      if (type !== EventType.PRESS) {
        return;
      }
      const n = detail.notification;
      console.log("[poc:android:notifee] onForegroundEvent PRESS", {
        hasNotification: !!n,
        pressActionId: detail.pressAction?.id,
      });
      if (n && isWhispAlertNotification(n)) {
        emitPress(n);
      } else if (n) {
        console.log("[poc:android:notifee] PRESS no POC", {
          keys: n.data && typeof n.data === "object" ? Object.keys(n.data) : [],
        });
      }
    } catch (e) {
      console.error("[poc:android:notifee] onForegroundEvent ERROR", e);
    }
  });
}

/**
 * En RootLayout: drena pending + escucha toques con el router ya montado.
 */
export function subscribeAndroidWhispAlertNavigationFromNotifee(): () => void {
  if (Platform.OS !== "android") {
    return () => {};
  }

  console.log(
    "[poc:android:notifee] subscribeAndroidWhispAlertNavigationFromNotifee",
  );

  const tryPending = () => {
    try {
      const p = takePendingInitialWhispAlert();
      if (p) {
        console.log("[poc:android:notifee] tryPending → navegar");
        scheduleNavigate(p);
      }
    } catch (e) {
      console.error("[poc:android:notifee] tryPending ERROR", e);
    }
  };

  tryPending();
  const t1 = setTimeout(tryPending, 80);
  const t2 = setTimeout(tryPending, 400);
  const t3 = setTimeout(tryPending, 1200);

  const appStateSub = AppState.addEventListener("change", (state) => {
    if (state === "active") {
      console.log("[poc:android:notifee] AppState active → tryPending");
      tryPending();
    }
  });

  const sub: EmitterSubscription = DeviceEventEmitter.addListener(
    NOTIFEE_WHISP_ALERT_PRESS,
    (n: Notification) => {
      try {
        console.log("[poc:android:notifee] DeviceEventEmitter PRESS");
        if (isWhispAlertNotification(n)) {
          scheduleNavigate(n);
        }
      } catch (e) {
        console.error(
          "[poc:android:notifee] DeviceEventEmitter listener ERROR",
          e,
        );
      }
    },
  );

  return () => {
    clearTimeout(t1);
    clearTimeout(t2);
    clearTimeout(t3);
    appStateSub.remove();
    sub.remove();
  };
}
