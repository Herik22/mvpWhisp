import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function Index() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>mvpWhisp</Text>
      <Link href="/interruptions-poc" asChild>
        <Pressable style={styles.link}>
          <Text style={styles.linkText}>Abrir Interruption POC</Text>
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
    gap: 16,
  },
  hint: { color: "#71717a", fontSize: 14 },
  link: {
    backgroundColor: "#27272a",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3f3f46",
  },
  linkText: { color: "#fafafa", fontSize: 16, fontWeight: "600" },
});
