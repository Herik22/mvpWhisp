import { Platform } from "react-native";
import VoipPushNotification from "react-native-voip-push-notification";

let isSetup = false;

export function setupVoipTokenListener() {
  if (Platform.OS !== "ios") return;
  if (isSetup) return;
  isSetup = true;

  VoipPushNotification.addEventListener("register", (token) => {
    console.log("[VoIP] token:", token);
  });

  VoipPushNotification.addEventListener("notification", (notification) => {
    console.log("[VoIP] notification:", notification);
  });

  VoipPushNotification.addEventListener("didLoadWithEvents", (events) => {
    console.log("[VoIP] didLoadWithEvents:", events);
  });

  VoipPushNotification.registerVoipToken();
}

export function teardownVoipTokenListener() {
  if (Platform.OS !== "ios") return;
  VoipPushNotification.removeEventListener("register");
  VoipPushNotification.removeEventListener("notification");
  VoipPushNotification.removeEventListener("didLoadWithEvents");
  isSetup = false;
}
