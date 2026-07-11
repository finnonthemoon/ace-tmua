import {
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
import type { LessonSummaryScreen } from "./types";

interface Props {
  screen: LessonSummaryScreen;
  progressPercent: number;
  correctAnswers: number;
  totalAnswers: number;
  onNext: () => void;
  onExit: () => void;
}

export default function LessonSummaryScreenView({
  screen,
  progressPercent,
  correctAnswers,
  totalAnswers,
  onNext,
  onExit,
}: Props) {
  const accuracy =
    totalAnswers === 0
      ? null
      : Math.round((correctAnswers / totalAnswers) * 100);

  const keyPoints = screen.keyPoints ?? [];
  const reviewItems = screen.reviewItems ?? [];

  return (
    <SafeAreaView style={shared.safeArea} edges={["top", "bottom"]}>
      <View style={shared.screen}>
        <TopBar progressPercent={progressPercent} onExit={onExit} />

        <ScrollView
          style={shared.content}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={shared.eyebrow}>
            {screen.eyebrow || "LESSON SUMMARY"}
          </Text>

          <Text style={shared.title}>{screen.title || "Lesson summary"}</Text>

          <View style={styles.stats}>
            <View style={[styles.stat, shared.cardShadow]}>
              <Text style={styles.statValue}>
                {accuracy === null ? "—" : `${accuracy}%`}
              </Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>

            <View style={[styles.stat, shared.cardShadow]}>
              <Text style={styles.statValue}>
                {correctAnswers}/{totalAnswers}
              </Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
          </View>

          {keyPoints.length > 0 && (
            <View style={[styles.card, shared.cardShadow]}>
              <Text style={styles.cardHeading}>Key points</Text>

              <View style={styles.list}>
                {keyPoints.map((point, index) => (
                  <View key={`${index}-${point}`} style={styles.listItem}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={20}
                      color={C.primary}
                    />
                    <PlainOrHtml html={point} style={styles.listText} />
                  </View>
                ))}
              </View>
            </View>
          )}

          {reviewItems.length > 0 && (
            <View style={[styles.card, styles.reviewCard]}>
              <Text style={styles.cardHeading}>Review next</Text>

              <View style={styles.list}>
                {reviewItems.map((item, index) => (
                  <View key={`${index}-${item}`} style={styles.listItem}>
                    <Ionicons
                      name="refresh-outline"
                      size={20}
                      color={C.primary}
                    />
                    <PlainOrHtml html={item} style={styles.listText} />
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <TouchableOpacity
          style={shared.primaryButton}
          onPress={onNext}
          activeOpacity={0.85}
        >
          <Text style={shared.primaryButtonText}>
            {screen.buttonText || "Finish lesson"}
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
    paddingVertical: 24,
  },

  stats: {
    flexDirection: "row",
    gap: 14,
    marginTop: 4,
  },

  stat: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 18,
  },

  statValue: {
    color: C.primary,
    fontSize: 27,
    fontWeight: "900",
  },

  statLabel: {
    marginTop: 6,
    color: C.muted,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },

  card: {
    marginTop: 16,
    padding: 16,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 18,
  },

  reviewCard: {
    backgroundColor: "#FFF7E8",
    borderColor: "#FFE0AD",
  },

  cardHeading: {
    color: C.ink,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 12,
  },

  list: {
    gap: 11,
  },

  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },

  listText: {
    flex: 1,
    color: C.ink,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
});
