import { useCallback, useState, type ReactNode } from "react";
import {
  Alert,
  Linking,
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

import {
  createFullScreenChannelPoc,
  requestNotificationPermissionPoc,
  showLocalFullScreenNotificationPoc,
  startVibrationLoopPoc,
  stopVibrationPoc
} from "@/lib/poc/androidInterruption";
import { getAndroidFcmTokenForPoc } from "@/lib/poc/androidMessaging";
import { playLoopSound, stopSound } from "@/lib/poc/audio";
import {
  TEST_ACTION_DOC_PATH,
  useFirestoreTestActionPoc,
} from "@/lib/poc/firestoreTestAction";
import { AppBlockerPocCard } from "@/components/AppBlockerPocCard";
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
        <Text style={styles.title}>Whisp</Text>
        <Text style={styles.subtitle}>Acciones</Text>

        <Card title="0) Conexión remota (Firestore)">
          (
          <>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Escuchar</Text>
              <Switch
                value={firestoreListen}
                onValueChange={setFirestoreListen}
                trackColor={{ false: "#3f3f46", true: "#2563eb" }}
                thumbColor="#fafafa"
              />
            </View>
            <Text style={styles.meta}>
              {firestoreStatus.kind === "listening"
                ? "Activo"
                : firestoreStatus.kind === "idle"
                  ? "Inactivo"
                  : `Error: ${firestoreStatus.message}`}
            </Text>
            {firestoreLastTrigger ? (
              <Text style={styles.meta}>Último: {firestoreLastTrigger}</Text>
            ) : null}
            {false && (
              <SecondaryButton
                label="Ver qué documento modificar"
                onPress={() => {
                  Alert.alert(
                    "Firestore (testAction)",
                    `Documento:\n${TEST_ACTION_DOC_PATH}\n\nCampos booleanos:\n- runAndroid\n- runIos\n\nDispara cambiando false → true (y vuelve a false antes del próximo).`,
                  );
                }}
              />
            )}
          </>
          )
        </Card>

        <Card title="1) Básico">
          <PrimaryButton
            label="1) Reproducir sonido"
            onPress={() =>
              run("Play loop sound", async () => {
                await playLoopSound();
              })
            }
          />
          <SecondaryButton
            label="2) Detener sonido"
            onPress={() =>
              run("Stop sound", async () => {
                await stopSound();
              })
            }
          />
          <SecondaryButton
            label="3) Mostrar alerta en la app"
            onPress={() => {
              console.log("[poc] action: Open in-app alert screen");
              setInAppAlertOpen(true);
            }}
          />
        </Card>

        {Platform.OS === "android" && (
          <Card title="2) Android">
            (
            <>
              <PrimaryButton
                label="1) Permitir notificaciones"
                onPress={() =>
                  run(
                    "Request notification permissions",
                    requestNotificationPermissionPoc,
                  )
                }
              />
              <SecondaryButton
                label="2) Crear canal pantalla completa"
                onPress={() =>
                  run("Create full-screen channel", createFullScreenChannelPoc)
                }
              />
              <SecondaryButton
                label="3) Mostrar pantalla completa"
                onPress={() =>
                  run(
                    "Show local full-screen intent",
                    showLocalFullScreenNotificationPoc,
                  )
                }
              />
              <SecondaryButton
                label="4) Iniciar vibración"
                onPress={() => {
                  console.log("[poc] action: Start vibration loop");
                  try {
                    startVibrationLoopPoc();
                  } catch (e) {
                    handleError("Start vibration loop", e);
                  }
                }}
              />
              <SecondaryButton
                label="5) Detener vibración"
                onPress={() => {
                  console.log("[poc] action: Stop vibration");
                  try {
                    stopVibrationPoc();
                  } catch (e) {
                    handleError("Stop vibration", e);
                  }
                }}
              />
              <SecondaryButton
                label="6) Obtener token FCM (ver consola)"
                onPress={() =>
                  run("FCM getToken", async () => {
                    const token = await getAndroidFcmTokenForPoc();
                    if (token) {
                      console.log(
                        "[poc:android:fcm] TOKEN (copiar para script):\n",
                        token,
                      );
                      Alert.alert(
                        "Token FCM",
                        "Está en la consola de Metro (texto largo). Úsalo en tu backend / script FCM HTTP v1 para Android.",
                      );
                    } else {
                      throw new Error(
                        "Sin token (¿permisos o build sin Messaging?)",
                      );
                    }
                  })
                }
              />
              <SecondaryButton
                label="7) Abrir ajustes de Whisp (permisos)"
                onPress={() => {
                  void Linking.openSettings();
                }}
              />
              <Text style={styles.note}>
                Push: solo data + priority HIGH (FCM v1). El banner arriba es
                normal con otra app al frente y pantalla desbloqueada; el FSI
                depende del sistema. Prueba con pantalla bloqueada. Canal
                Notifee whisp_poc_fullscreen_v4: tras cambiar el id, pulsa
                «Crear canal» o reinstala. En Android 14+ usa el botón 8 y
                activa pantalla completa para Whisp. Si añadiste módulos nativos
                (p. ej. expo-intent-launcher), ejecuta npx expo run:android para
                que funcione el botón 8. Si en consola ves OK pero no ves aviso,
                mira el log [poc:android:notifee:DIAG] tras el push (canal
                bloqueado o DENIED) y usa el botón 9.
              </Text>
            </>
            )
          </Card>
        )}

        {Platform.OS === "ios" && (
          <Card title="3) iOS">
            (
            <>
              <PrimaryButton
                label="1) Configurar llamadas (CallKeep)"
                onPress={() => run("Setup CallKeep", setupCallKeepPoc)}
              />
              <SecondaryButton
                label="2) Simular llamada entrante"
                onPress={() => {
                  console.log("[poc] action: Show incoming CallKeep alert");
                  try {
                    showIncomingCallKeepPoc();
                  } catch (e) {
                    handleError("Show incoming CallKeep alert", e);
                  }
                }}
              />
              <SecondaryButton
                label="3) Finalizar llamada activa"
                onPress={() => {
                  console.log("[poc] action: End CallKeep call");
                  try {
                    endActiveCallKeepPoc();
                  } catch (e) {
                    handleError("End CallKeep call", e);
                  }
                }}
              />
              <SecondaryButton
                label="4) Permitir + mostrar notif. time-sensitive"
                onPress={() =>
                  run(
                    "Show local time-sensitive notification",
                    scheduleTimeSensitiveNotificationPoc,
                  )
                }
              />
            </>
            )
          </Card>
        )}

        {Platform.OS !== "web" && <AppBlockerPocCard run={run} />}
      </ScrollView>

      <Modal
        visible={inAppAlertOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setInAppAlertOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Alerta</Text>
            <Text style={styles.modalBody}>Mensaje de ejemplo.</Text>
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

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

function BaseButton({
  label,
  onPress,
  variant,
}: {
  label: string;
  onPress: () => void;
  variant: "primary" | "secondary";
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        variant === "primary" ? styles.btnPrimary : styles.btnSecondary,
        pressed && styles.btnPressed,
      ]}
      onPress={onPress}
    >
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

function PrimaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return <BaseButton label={label} onPress={onPress} variant="primary" />;
}

function SecondaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return <BaseButton label={label} onPress={onPress} variant="secondary" />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0c0c0f" },
  scroll: { padding: 20, paddingBottom: 40, gap: 12 },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#f4f4f5",
  },
  subtitle: { fontSize: 14, color: "#a1a1aa", marginBottom: 10 },
  note: { fontSize: 13, color: "#71717a" },
  meta: { fontSize: 12, color: "#a1a1aa" },
  card: {
    backgroundColor: "#111114",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#27272a",
    padding: 14,
    gap: 10,
  },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#d4d4d8" },
  cardBody: { gap: 10 },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  btnPrimary: { backgroundColor: "#2563eb", borderColor: "#1d4ed8" },
  btnSecondary: { backgroundColor: "#18181b", borderColor: "#3f3f46" },
  btnPressed: { opacity: 0.85 },
  btnText: { color: "#fafafa", fontSize: 16, fontWeight: "600" },
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
    paddingVertical: 2,
  },
  rowLabel: { fontSize: 15, color: "#e4e4e7", fontWeight: "600" },
});
