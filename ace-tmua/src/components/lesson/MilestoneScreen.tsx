import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { PlainOrHtml } from "./MathText";
import shared, { C } from "./shared";
import TopBar from "./TopBar";
import type { MilestoneScreen } from "./types";

interface Props {
  screen: MilestoneScreen;
  progressPercent: number;
  onNext: () => void;
  onExit: () => void;
}

export default function MilestoneScreenView({
  screen,
  progressPercent,
  onNext,
  onExit,
}: Props) {
  return (
    <SafeAreaView style={shared.safeArea} edges={["top", "bottom"]}>
      <View style={shared.screen}>
        <TopBar progressPercent={progressPercent} onExit={onExit} />

        <ScrollView
          style={shared.content}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={require("../../../assets/images/excited-robot.png")}
            style={styles.mascot}
            resizeMode="contain"
            accessibilityLabel="TMUA study robot celebrating"
          />

          <Text style={styles.eyebrow}>{screen.eyebrow || "KEEP GOING"}</Text>

          <PlainOrHtml html={screen.title} style={styles.title} />

          <PlainOrHtml html={screen.body} style={styles.body} />
        </ScrollView>

        <TouchableOpacity
          style={shared.primaryButton}
          onPress={onNext}
          activeOpacity={0.85}
        >
          <Text style={shared.primaryButtonText}>
            {screen.buttonText || "Continue"}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
  },

  mascot: {
    width: 240,
    height: 240,
    marginBottom: 24,
  },

  eyebrow: {
    color: C.primary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 10,
  },

  title: {
    maxWidth: 320,
    color: C.ink,
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 33,
    letterSpacing: -1,
    textAlign: "center",
  },

  body: {
    maxWidth: 310,
    marginTop: 16,
    color: C.muted,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 23,
    textAlign: "center",
  },
});
