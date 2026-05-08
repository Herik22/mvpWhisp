import firestore, {
  type FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import {
  createFullScreenChannelPoc,
  showLocalFullScreenNotificationPoc,
} from "@/lib/poc/androidInterruption";
import {
  setupCallKeepPoc,
  showIncomingCallKeepPoc,
} from "@/lib/poc/iosCallKeep";

/** Colección y documento que debes crear en Firestore (campos `runIos`, `runAndroid`). */
export const TEST_ACTION_COLLECTION = "testAction";
export const TEST_ACTION_DOC_ID = "control";

export const TEST_ACTION_DOC_PATH = `${TEST_ACTION_COLLECTION}/${TEST_ACTION_DOC_ID}`;

export type TestActionDoc = {
  runIos?: boolean;
  runAndroid?: boolean;
};

function parseTestAction(
  data: FirebaseFirestoreTypes.DocumentData | undefined,
): { runIos: boolean; runAndroid: boolean } {
  return {
    runIos: data?.runIos === true,
    runAndroid: data?.runAndroid === true,
  };
}

export type FirestoreTestActionStatus =
  | { kind: "idle" }
  | { kind: "listening" }
  | { kind: "error"; message: string };

/**
 * Escucha `testAction/control`. Dispara acciones solo en flanco ascendente (false → true)
 * para no repetir mientras el doc siga en `true`.
 */
export function useFirestoreTestActionPoc(enabled: boolean): {
  status: FirestoreTestActionStatus;
  lastTrigger: string | null;
} {
  const [status, setStatus] = useState<FirestoreTestActionStatus>({ kind: "idle" });
  const [lastTrigger, setLastTrigger] = useState<string | null>(null);
  const prevRef = useRef<{ runIos: boolean; runAndroid: boolean } | null>(null);
  const iosSetupDoneRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setStatus({ kind: "idle" });
      return;
    }

    if (Platform.OS === "web") {
      setStatus({
        kind: "error",
        message: "Firestore POC: no disponible en web (usa dev client iOS/Android).",
      });
      return;
    }

    const ref = firestore()
      .collection(TEST_ACTION_COLLECTION)
      .doc(TEST_ACTION_DOC_ID);

    setStatus({ kind: "listening" });

    const unsub = ref.onSnapshot(
      (snap) => {
        if (!snap.exists) {
          setStatus({
            kind: "error",
            message: `Falta el documento ${TEST_ACTION_DOC_PATH} en Firestore.`,
          });
          return;
        }

        const { runIos, runAndroid } = parseTestAction(snap.data());
        const prev = prevRef.current;
        prevRef.current = { runIos, runAndroid };

        if (!prev) {
          return;
        }

        const androidRising = runAndroid && !prev.runAndroid;
        const iosRising = runIos && !prev.runIos;

        if (Platform.OS === "android" && androidRising) {
          void (async () => {
            try {
              await createFullScreenChannelPoc();
              await showLocalFullScreenNotificationPoc();
              setLastTrigger(`Android @ ${new Date().toISOString()}`);
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              console.error("[poc:firestore] Android remoto falló", e);
              setStatus({ kind: "error", message: msg });
            }
          })();
        }

        if (Platform.OS === "ios" && iosRising) {
          void (async () => {
            try {
              if (!iosSetupDoneRef.current) {
                await setupCallKeepPoc();
                iosSetupDoneRef.current = true;
              }
              showIncomingCallKeepPoc();
              setLastTrigger(`iOS @ ${new Date().toISOString()}`);
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              console.error("[poc:firestore] iOS remoto falló", e);
              setStatus({ kind: "error", message: msg });
            }
          })();
        }
      },
      (err) => {
        const msg = err.message ?? String(err);
        console.error("[poc:firestore] onSnapshot error", err);
        setStatus({ kind: "error", message: msg });
      },
    );

    return () => {
      unsub();
      prevRef.current = null;
    };
  }, [enabled]);

  return { status, lastTrigger };
}
