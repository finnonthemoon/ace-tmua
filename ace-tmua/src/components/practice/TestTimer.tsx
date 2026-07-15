import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/theme";

interface Props {
  seconds: number;
  mode: "timed" | "untimed";
}

export function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function TestTimer({ seconds, mode }: Props) {
  const isUrgent = mode === "timed" && seconds <= 5 * 60;

  return (
    <View style={[styles.container, isUrgent && styles.containerUrgent]}>
      <Ionicons
        name={mode === "timed" ? "timer-outline" : "stopwatch-outline"}
        size={18}
        color={isUrgent ? "#C73B2F" : Colors.ink}
      />
      <Text style={[styles.value, isUrgent && styles.valueUrgent]}>
        {mode === "timed" ? formatDuration(seconds) : "Untimed"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 84,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#FFF0D3",
    borderWidth: 1,
    borderColor: "#FFD69C",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  containerUrgent: {
    backgroundColor: "#FFF0EE",
    borderColor: "#F5B9B1",
  },
  value: {
    color: Colors.ink,
    fontSize: 14,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  valueUrgent: {
    color: "#C73B2F",
  },
});
