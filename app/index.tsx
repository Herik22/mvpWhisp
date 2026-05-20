import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function Index() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Whisp</Text>
      <Text style={styles.subtitle}>MVP</Text>
      <Link href="/interruptions-poc" asChild>
        <Pressable style={styles.link}>
          <Text style={styles.linkText}>Abrir panel de acciones</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#0c0c0f",
    gap: 10,
  },
  title: { color: "#fafafa", fontSize: 34, fontWeight: "800" },
  subtitle: { color: "#a1a1aa", fontSize: 14, marginBottom: 10 },
  link: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1d4ed8",
  },
  linkText: { color: "#fafafa", fontSize: 16, fontWeight: "600" },
});
