import { Audio, type AVPlaybackStatus } from "expo-av";

/**
 * TODO: Sustituir por un asset en `assets/sounds/` (require) para evitar depender de red
 * y cumplir políticas de almacenamiento en producción.
 */
const LOOP_SAMPLE_URI =
  "https://actions.google.com/sounds/v1/alarms/beep_short.ogg";

let currentSound: Audio.Sound | null = null;

function logStatus(status: AVPlaybackStatus) {
  if (!status.isLoaded) return;
  console.log("[poc:audio] status", {
    isPlaying: status.isPlaying,
    positionMillis: status.positionMillis,
  });
}

export async function playLoopSound(): Promise<void> {
  await stopSound();

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    staysActiveInBackground: true,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
  });

  const { sound } = await Audio.Sound.createAsync(
    { uri: LOOP_SAMPLE_URI },
    { isLooping: true, shouldPlay: true, volume: 0.5 },
    (s) => {
      if (s.isLoaded) logStatus(s);
    },
  );

  currentSound = sound;
  console.log("[poc:audio] loop started", { uri: LOOP_SAMPLE_URI });
}

export async function stopSound(): Promise<void> {
  if (!currentSound) {
    console.log("[poc:audio] stop — no active sound");
    return;
  }
  try {
    await currentSound.stopAsync();
  } catch {
    // ignore
  }
  try {
    await currentSound.unloadAsync();
  } catch {
    // ignore
  }
  currentSound = null;
  console.log("[poc:audio] stopped and unloaded");
}
