// TopBar.tsx

import { View, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "./shared";

interface Props {
  progressPercent: number;
  onExit: () => void;
}

export default function TopBar({ progressPercent, onExit }: Props) {
  return (
    <View style={styles.container}>
      <Pressable onPress={onExit} hitSlop={8}>
        <Ionicons name="close" size={28} color={C.ink} />
      </Pressable>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.max(0, Math.min(progressPercent, 100))}%`,
            },
          ]}
        />
      </View>

      {/* Spacer so the progress bar stays centered */}
      <View style={{ width: 28 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  track: {
    flex: 1,
    height: 8,
    backgroundColor: "#E8E3D8",
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: C.primary,
    borderRadius: 999,
  },
});
