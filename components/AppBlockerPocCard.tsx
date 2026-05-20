import {
  addPendingUnlockListener,
  checkAndClearPendingUnlock,
  FamilyActivityPickerView,
  type FamilyActivityPickerSelectionEvent,
} from "expo-app-blocker";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  applyIosBlockerSelectionPoc,
  applyWhispAndroidBlockerConfigPoc,
  blockFirstAvailableDemoAppPoc,
  clearAndroidBlockedAppsPoc,
  clearIosBlocksPoc,
  formatAppBlockerPermissionStatus,
  getAndroidBlockedAppsPoc,
  getIosBlockConfigurationSummaryPoc,
  openAppBlockerOverlaySettingsPoc,
  openAppBlockerUsageStatsSettingsPoc,
  refreshAppBlockerPermissionStatusPoc,
  requestAppBlockerPermissionsPoc,
  startAppBlockerMonitoringPoc,
  stopAppBlockerMonitoringPoc,
} from "@/lib/poc/appBlocker";

function handleError(action: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[poc:app-blocker] ${action} failed`, err);
  Alert.alert("App blocker POC", `${action}:\n${message}`);
}

type BtnProps = { label: string; onPress: () => void; primary?: boolean };

function PocButton({ label, onPress, primary }: BtnProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        primary ? styles.btnPrimary : styles.btnSecondary,
        pressed && styles.btnPressed,
      ]}
      onPress={onPress}
    >
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

export function AppBlockerPocCard({
  run,
}: {
  run: (label: string, fn: () => Promise<void>) => Promise<void>;
}) {
  const [permLine, setPermLine] = useState("—");
  const [iosSelectionData, setIosSelectionData] = useState("");
  const [iosSummary, setIosSummary] = useState("");
  const [androidBlocked, setAndroidBlocked] = useState("");

  const refreshStatus = useCallback(async () => {
    const status = await refreshAppBlockerPermissionStatusPoc();
    setPermLine(formatAppBlockerPermissionStatus(status));
    if (Platform.OS === "ios") {
      setIosSummary(getIosBlockConfigurationSummaryPoc());
    }
    if (Platform.OS === "android") {
      const blocked = getAndroidBlockedAppsPoc();
      setAndroidBlocked(
        blocked.length ? blocked.join(", ") : "Ninguna",
      );
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }
    applyWhispAndroidBlockerConfigPoc();
    void refreshStatus();

    if (Platform.OS === "ios") {
      if (checkAndClearPendingUnlock()) {
        Alert.alert(
          "Shield",
          "El usuario tocó el botón del shield (app estaba cerrada).",
        );
      }
      const sub = addPendingUnlockListener(() => {
        Alert.alert(
          "Shield",
          "Botón del shield pulsado. En producto irías a un flujo de desbloqueo.",
        );
      });
      return () => sub?.remove();
    }
  }, [refreshStatus]);

  const onIosSelectionChange = useCallback(
    async (event: FamilyActivityPickerSelectionEvent) => {
      setIosSelectionData(event.selectionData);
      try {
        const count = await applyIosBlockerSelectionPoc(event);
        setIosSummary(getIosBlockConfigurationSummaryPoc());
        Alert.alert(
          "iOS",
          count > 0
            ? `Bloqueo activo (${count} selección). Abre esa app fuera de Whisp.`
            : "Bloqueos quitados.",
        );
      } catch (e) {
        handleError("Aplicar selección iOS", e);
      }
    },
    [],
  );

  if (Platform.OS === "web") {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>4) App blocker (POC)</Text>
      <Text style={styles.meta}>{permLine}</Text>
      {Platform.OS === "android" ? (
        <Text style={styles.meta}>Bloqueadas: {androidBlocked}</Text>
      ) : (
        <Text style={styles.meta}>{iosSummary}</Text>
      )}

      <PocButton
        label="Actualizar estado permisos"
        onPress={() => run("Refresh app blocker status", refreshStatus)}
      />

      {Platform.OS === "android" && (
        <>
          <PocButton
            label="Abrir ajustes: acceso de uso"
            onPress={() =>
              run("Open usage stats settings", async () => {
                openAppBlockerUsageStatsSettingsPoc();
              })
            }
          />
          <PocButton
            label="Abrir ajustes: mostrar encima"
            onPress={() =>
              run("Open overlay settings", async () => {
                openAppBlockerOverlaySettingsPoc();
              })
            }
          />
          <PocButton
            primary
            label="Bloquear Chrome/YouTube/IG (o 1ª app)"
            onPress={() =>
              run("Block demo app", async () => {
                const label = await blockFirstAvailableDemoAppPoc();
                setAndroidBlocked(getAndroidBlockedAppsPoc().join(", "));
                Alert.alert("Android", `Bloqueada: ${label}`);
              })
            }
          />
          <PocButton
            primary
            label="Iniciar monitoreo (foreground)"
            onPress={() =>
              run("Start monitoring", async () => {
                startAppBlockerMonitoringPoc();
                Alert.alert(
                  "Android",
                  "Monitoreo activo. Sal de Whisp y abre la app bloqueada.",
                );
              })
            }
          />
          <PocButton
            label="Quitar bloqueos Android"
            onPress={() =>
              run("Clear Android blocks", async () => {
                clearAndroidBlockedAppsPoc();
                setAndroidBlocked("Ninguna");
              })
            }
          />
          <PocButton
            label="Detener monitoreo"
            onPress={() =>
              run("Stop monitoring", async () => {
                stopAppBlockerMonitoringPoc();
              })
            }
          />
        </>
      )}

      {Platform.OS === "ios" && (
        <>
          <PocButton
            primary
            label="Autorizar Screen Time"
            onPress={() =>
              run("Request Screen Time", async () => {
                await requestAppBlockerPermissionsPoc();
                await refreshStatus();
              })
            }
          />
          <View style={styles.pickerWrap}>
            <FamilyActivityPickerView
              initialSelection={iosSelectionData}
              onSelectionChange={onIosSelectionChange}
              theme="dark"
              style={{ height: 360 }}
            />
          </View>
          <PocButton
            label="Quitar bloqueos iOS"
            onPress={() =>
              run("Clear iOS blocks", async () => {
                clearIosBlocksPoc();
                setIosSelectionData("");
                setIosSummary(getIosBlockConfigurationSummaryPoc());
              })
            }
          />
        </>
      )}

      <Text style={styles.note}>
        Requiere rebuild nativo (expo prebuild + run:ios/android). iOS: registro
        de 4 App IDs + App Group en Apple Developer. Tras bloquear, prueba en
        dispositivo físico saliendo de Whisp.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#111114",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#27272a",
    padding: 14,
    gap: 10,
  },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#d4d4d8" },
  meta: { fontSize: 12, color: "#a1a1aa" },
  note: { fontSize: 12, color: "#71717a", lineHeight: 18 },
  pickerWrap: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#3f3f46",
  },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  btnPrimary: { backgroundColor: "#2563eb", borderColor: "#1d4ed8" },
  btnSecondary: { backgroundColor: "#18181b", borderColor: "#3f3f46" },
  btnPressed: { opacity: 0.85 },
  btnText: { color: "#fafafa", fontSize: 15, fontWeight: "600" },
});
