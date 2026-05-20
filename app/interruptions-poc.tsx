import { InterruptionsPOCScreen } from "@/components/InterruptionsPOCScreen";
import { Stack } from "expo-router";

export default function InterruptionsPocRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Acciones",
          headerStyle: { backgroundColor: "#0c0c0f" },
          headerTintColor: "#fafafa",
        }}
      />
      <InterruptionsPOCScreen />
    </>
  );
}
