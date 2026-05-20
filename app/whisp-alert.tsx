import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WhispAlertScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    title?: string;
    body?: string;
    msgId?: string;
    source?: string;
  }>();

  const title = params.title ?? "Whisp Alert";
  const body = params.body ?? "(sin cuerpo)";
  const msgId = params.msgId ?? "(sin msgId)";
  const source = params.source ?? "(sin source)";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
          animation: "fade",
        }}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Whisp Alert</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>

        <View style={styles.logBox}>
          <Text style={styles.logLabel}>notification.data (POC)</Text>
          <Text style={styles.logLine}>title: {title}</Text>
          <Text style={styles.logLine}>body: {body}</Text>
          <Text style={styles.logLine}>msgId: {msgId}</Text>
          <Text style={styles.logLine}>source: {source}</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.btnPrimary, pressed && styles.pressed]}
          onPress={() => {
            router.push("/interruptions-poc");
          }}
        >
          <Text style={styles.btnText}>Responder ahora</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.btnSecondary, pressed && styles.pressed]}
          onPress={() => {
            router.replace("/");
          }}
        >
          <Text style={styles.btnTextMuted}>Cerrar POC</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#020617" },
  scroll: {
    flexGrow: 1,
    padding: 24,
    gap: 16,
    justifyContent: "center",
  },
  heading: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#f8fafc",
  },
  body: {
    fontSize: 17,
    lineHeight: 24,
    color: "#cbd5e1",
  },
  logBox: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
    gap: 6,
  },
  logLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: 4,
  },
  logLine: { fontSize: 13, color: "#e2e8f0", fontFamily: "monospace" },
  btnPrimary: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  btnSecondary: {
    backgroundColor: "#1e293b",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  pressed: { opacity: 0.9 },
  btnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  btnTextMuted: { color: "#e2e8f0", fontSize: 16, fontWeight: "600" },
});
