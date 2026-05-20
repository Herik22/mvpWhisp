import {
  clearAllBlocks,
  configureAndroid,
  getBlockConfiguration,
  getBlockedApps,
  getInstalledApps,
  getPermissionStatus,
  openOverlaySettings,
  openUsageStatsSettings,
  requestPermissions,
  setBlockConfiguration,
  setBlockedApps,
  startMonitoring,
  stopMonitoring,
  type FamilyActivityPickerSelectionEvent,
  type PermissionStatus,
} from "expo-app-blocker";
import { Platform } from "react-native";

export const WHISP_APP_BLOCKER_GROUP = "group.com.mvpwhisp.blocker";

/** Paquetes habituales para prueba rápida en Android (si están instalados). */
const ANDROID_DEMO_PACKAGES = [
  "com.android.chrome",
  "com.google.android.youtube",
  "com.instagram.android",
];

export function formatAppBlockerPermissionStatus(
  status: PermissionStatus,
): string {
  if (status.details.platform === "android") {
    const { overlay, usageStats, notifications } = status.details;
    return [
      status.allGranted ? "Todo OK" : "Faltan permisos",
      `Overlay: ${overlay ? "sí" : "no"}`,
      `Uso: ${usageStats ? "sí" : "no"}`,
      `Notif.: ${notifications ? "sí" : "no"}`,
    ].join(" · ");
  }
  const { authorized, status: iosStatus } = status.details;
  return authorized
    ? `Screen Time autorizado (${iosStatus})`
    : `Sin autorización Screen Time (${iosStatus})`;
}

export async function refreshAppBlockerPermissionStatusPoc(): Promise<PermissionStatus> {
  const status = await getPermissionStatus();
  console.log("[poc:app-blocker] permission status", status);
  return status;
}

export async function requestAppBlockerPermissionsPoc(): Promise<PermissionStatus> {
  const status = await requestPermissions();
  console.log("[poc:app-blocker] requestPermissions", status);
  return status;
}

export function openAppBlockerUsageStatsSettingsPoc(): void {
  openUsageStatsSettings();
}

export function openAppBlockerOverlaySettingsPoc(): void {
  openOverlaySettings();
}

/** Textos del overlay Android (POC Whisp). */
export function applyWhispAndroidBlockerConfigPoc(): void {
  if (Platform.OS !== "android") {
    return;
  }
  configureAndroid({
    overlayTitle: "Whisp",
    overlayText: "{appName} está bloqueada en este POC.",
    overlayBackgroundColor: "#0c0c0f",
    overlayTitleColor: "#fafafa",
    overlayTextColor: "#a1a1aa",
    notificationTitle: "Whisp — app bloqueada",
    notificationText: "{appName} está bloqueada. Toca para volver a Whisp.",
  });
  console.log("[poc:app-blocker] configureAndroid (POC)");
}

export async function blockFirstAvailableDemoAppPoc(): Promise<string> {
  const apps = await getInstalledApps();
  const pick =
    ANDROID_DEMO_PACKAGES.map((pkg) => apps.find((a) => a.packageName === pkg))
      .find(Boolean) ?? apps[0];

  if (!pick) {
    throw new Error("No hay apps instaladas para bloquear.");
  }

  setBlockedApps([pick.packageName]);
  console.log("[poc:app-blocker] setBlockedApps", pick);
  return `${pick.name} (${pick.packageName})`;
}

export function startAppBlockerMonitoringPoc(): void {
  startMonitoring();
  console.log("[poc:app-blocker] startMonitoring");
}

export function stopAppBlockerMonitoringPoc(): void {
  stopMonitoring();
  console.log("[poc:app-blocker] stopMonitoring");
}

export function clearAndroidBlockedAppsPoc(): void {
  setBlockedApps([]);
  console.log("[poc:app-blocker] setBlockedApps []");
}

export function getAndroidBlockedAppsPoc(): string[] {
  return getBlockedApps();
}

export async function applyIosBlockerSelectionPoc(
  event: FamilyActivityPickerSelectionEvent,
): Promise<number> {
  const items = event.items.filter((i) => (i.type as string) !== "summary");
  if (items.length === 0) {
    clearAllBlocks();
    console.log("[poc:app-blocker] clearAllBlocks (sin selección)");
    return 0;
  }
  await setBlockConfiguration({ blockedItems: items, isActive: true });
  console.log("[poc:app-blocker] setBlockConfiguration", {
    count: items.length,
    totalApps: event.totalApps,
  });
  return items.length;
}

export function clearIosBlocksPoc(): void {
  clearAllBlocks();
  console.log("[poc:app-blocker] clearAllBlocks");
}

export function getIosBlockConfigurationSummaryPoc(): string {
  const config = getBlockConfiguration();
  if (!config?.blockedItems?.length) {
    return "Sin apps bloqueadas";
  }
  return `${config.blockedItems.length} ítem(s), activo=${config.isActive ?? true}`;
}
