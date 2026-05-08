import { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { playLoopSound, stopSound } from "@/lib/poc/audio";
import {
  createFullScreenChannelPoc,
  requestNotificationPermissionPoc,
  showLocalFullScreenNotificationPoc,
  startVibrationLoopPoc,
  stopVibrationPoc,
} from "@/lib/poc/androidInterruption";
import {
  TEST_ACTION_DOC_PATH,
  useFirestoreTestActionPoc,
} from "@/lib/poc/firestoreTestAction";
import {
  endActiveCallKeepPoc,
  scheduleTimeSensitiveNotificationPoc,
  setupCallKeepPoc,
  showIncomingCallKeepPoc,
} from "@/lib/poc/iosCallKeep";

function handleError(action: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[poc] ${action} failed`, err);
  Alert.alert("Error en POC", `${action}:\n${message}`);
}

export function InterruptionsPOCScreen() {
  const [inAppAlertOpen, setInAppAlertOpen] = useState(false);
  const [firestoreListen, setFirestoreListen] = useState(true);
  const { status: firestoreStatus, lastTrigger: firestoreLastTrigger } =
    useFirestoreTestActionPoc(firestoreListen && Platform.OS !== "web");
  const osLabel = Platform.OS === "ios" ? "iOS" : "Android";

  const run = useCallback(async (label: string, fn: () => Promise<void>) => {
    console.log(`[poc] action: ${label}`);
    try {
      await fn();
    } catch (e) {
      handleError(label, e);
    }
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Whisp Interruption POC</Text>
        <Text style={styles.sub}>
          Sistema operativo: <Text style={styles.bold}>{osLabel}</Text>
        </Text>

        <Section title="Firestore remoto (testAction)" />
        {Platform.OS === "web" ? (
          <Text style={styles.muted}>
            Listener desactivado en web; usa iOS o Android con dev client.
          </Text>
        ) : (
          <>
            <Text style={styles.hint}>
              Crea el documento{" "}
              <Text style={styles.bold}>{TEST_ACTION_DOC_PATH}</Text> con campos
              booleanos <Text style={styles.bold}>runAndroid</Text> y{" "}
              <Text style={styles.bold}>runIos</Text>. Solo reacciona cuando el
              valor pasa de <Text style={styles.bold}>false</Text> a{" "}
              <Text style={styles.bold}>true</Text> (vuelve a poner{" "}
              <Text style={styles.bold}>false</Text> antes de otro disparo).
              Reglas de Firestore: en desarrollo puedes permitir lectura/escritura
              temporal para esta colección.
            </Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Escuchar Firestore</Text>
              <Switch
                value={firestoreListen}
                onValueChange={setFirestoreListen}
                trackColor={{ false: "#3f3f46", true: "#2563eb" }}
                thumbColor="#fafafa"
              />
            </View>
            <Text style={styles.mono}>
              Estado:{" "}
              {firestoreStatus.kind === "listening"
                ? "escuchando"
                : firestoreStatus.kind === "idle"
                  ? "inactivo"
                  : `error: ${firestoreStatus.message}`}
            </Text>
            {firestoreLastTrigger ? (
              <Text style={styles.mono}>Último disparo: {firestoreLastTrigger}</Text>
            ) : null}
          </>
        )}

        <Section title="Common tests" />
        <PocButton
          label="Play loop sound"
          onPress={() =>
            run("Play loop sound", async () => {
              await playLoopSound();
            })
          }
        />
        <PocButton
          label="Stop sound"
          onPress={() =>
            run("Stop sound", async () => {
              await stopSound();
            })
          }
        />
        <PocButton
          label="Open in-app alert screen"
          onPress={() => {
            console.log("[poc] action: Open in-app alert screen");
            setInAppAlertOpen(true);
          }}
        />

        <Section title="Android tests" />
        {Platform.OS === "android" ? (
          <>
            <PocButton
              label="Request notification permissions"
              onPress={() =>
                run("Request notification permissions", requestNotificationPermissionPoc)
              }
            />
            <PocButton
              label="Create full-screen channel"
              onPress={() =>
                run("Create full-screen channel", createFullScreenChannelPoc)
              }
            />
            <PocButton
              label="Show local full-screen intent"
              onPress={() =>
                run(
                  "Show local full-screen intent",
                  showLocalFullScreenNotificationPoc,
                )
              }
            />
            <Text style={styles.hint}>
              Full-screen: con la app abierta suele ser solo heads-up. Prueba con
              la app en segundo plano o pantalla bloqueada. En Android 14+:
              Ajustes → Apps → Whisp → permitir notificación a pantalla
              completa. Tras cambiar permisos en app.json, recompila el dev
              client.
            </Text>
            <PocButton
              label="Start vibration loop"
              onPress={() => {
                console.log("[poc] action: Start vibration loop");
                try {
                  startVibrationLoopPoc();
                } catch (e) {
                  handleError("Start vibration loop", e);
                }
              }}
            />
            <PocButton
              label="Stop vibration"
              onPress={() => {
                console.log("[poc] action: Stop vibration");
                try {
                  stopVibrationPoc();
                } catch (e) {
                  handleError("Stop vibration", e);
                }
              }}
            />
          </>
        ) : (
          <Text style={styles.muted}>No disponible en esta plataforma.</Text>
        )}

        <Section title="iOS tests" />
        {Platform.OS === "ios" ? (
          <>
            <Text style={styles.hint}>
              CallKit solo en iPhone físico (no simulador). Si el build firma mal por
              time-sensitive, habilita la capability en el App ID de Apple Developer.
            </Text>
            <PocButton
              label="Setup CallKeep"
              onPress={() => run("Setup CallKeep", setupCallKeepPoc)}
            />
            <PocButton
              label="Show incoming CallKeep alert"
              onPress={() => {
                console.log("[poc] action: Show incoming CallKeep alert");
                try {
                  showIncomingCallKeepPoc();
                } catch (e) {
                  handleError("Show incoming CallKeep alert", e);
                }
              }}
            />
            <PocButton
              label="End CallKeep call"
              onPress={() => {
                console.log("[poc] action: End CallKeep call");
                try {
                  endActiveCallKeepPoc();
                } catch (e) {
                  handleError("End CallKeep call", e);
                }
              }}
            />
            <PocButton
              label="Show local time-sensitive notification"
              onPress={() =>
                run(
                  "Show local time-sensitive notification",
                  scheduleTimeSensitiveNotificationPoc,
                )
              }
            />
          </>
        ) : (
          <Text style={styles.muted}>No disponible en esta plataforma.</Text>
        )}
      </ScrollView>

      <Modal
        visible={inAppAlertOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setInAppAlertOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Alerta en la app</Text>
            <Text style={styles.modalBody}>
              Esto simula un modal de alerta dentro de Whisp (sin sistema).
            </Text>
            <Pressable
              style={styles.modalBtn}
              onPress={() => {
                console.log("[poc] in-app alert dismissed");
                setInAppAlertOpen(false);
              }}
            >
              <Text style={styles.modalBtnText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Section({ title }: { title: string }) {
  return <Text style={styles.section}>{title}</Text>;
}

function PocButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
      onPress={onPress}
    >
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0c0c0f" },
  scroll: { padding: 20, paddingBottom: 40, gap: 10 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#f4f4f5",
    marginBottom: 6,
  },
  sub: { fontSize: 15, color: "#a1a1aa", marginBottom: 16 },
  bold: { fontWeight: "700", color: "#e4e4e7" },
  section: {
    fontSize: 13,
    fontWeight: "600",
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 18,
    marginBottom: 6,
  },
  muted: { fontSize: 14, color: "#52525b", fontStyle: "italic" },
  hint: {
    fontSize: 12,
    color: "#71717a",
    lineHeight: 17,
    marginTop: -4,
    marginBottom: 4,
  },
  btn: {
    backgroundColor: "#27272a",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3f3f46",
  },
  btnPressed: { opacity: 0.85 },
  btnText: { color: "#fafafa", fontSize: 16 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#18181b",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#3f3f46",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fafafa",
    marginBottom: 8,
  },
  modalBody: { fontSize: 15, color: "#a1a1aa", marginBottom: 16 },
  modalBtn: {
    alignSelf: "flex-end",
    backgroundColor: "#3b82f6",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  modalBtnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  rowLabel: { fontSize: 16, color: "#e4e4e7" },
  mono: {
    fontSize: 12,
    color: "#a1a1aa",
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
});
