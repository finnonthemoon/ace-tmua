import { Ionicons } from "@expo/vector-icons";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";

import type { PracticeQuestionData } from "./types";

interface Props {
  visible: boolean;
  questions: PracticeQuestionData[];
  currentIndex: number;
  answers: Record<string, number>;
  flaggedQuestionIds: string[];
  onSelectQuestion: (index: number) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export default function QuestionNavigator({
  visible,
  questions,
  currentIndex,
  answers,
  flaggedQuestionIds,
  onSelectQuestion,
  onClose,
  onSubmit,
}: Props) {
  const answeredCount = questions.filter(
    (question) => answers[question.id] !== undefined,
  ).length;

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={visible}
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>QUESTION OVERVIEW</Text>
            <Text style={styles.title}>
              {answeredCount} of {questions.length} answered
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Close question overview"
            accessibilityRole="button"
            onPress={onClose}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color={Colors.ink} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.grid}>
            {questions.map((question, index) => {
              const answered = answers[question.id] !== undefined;
              const flagged = flaggedQuestionIds.includes(question.id);
              const current = index === currentIndex;

              return (
                <Pressable
                  accessibilityLabel={`Go to question ${index + 1}`}
                  accessibilityRole="button"
                  key={question.id}
                  onPress={() => onSelectQuestion(index)}
                  style={[
                    styles.gridButton,
                    answered && styles.gridButtonAnswered,
                    current && styles.gridButtonCurrent,
                  ]}
                >
                  <Text
                    style={[
                      styles.gridButtonText,
                      answered && styles.gridButtonTextAnswered,
                      current && styles.gridButtonTextCurrent,
                    ]}
                  >
                    {index + 1}
                  </Text>
                  {flagged ? (
                    <Ionicons
                      name="flag"
                      size={11}
                      color={current ? "#FFFFFF" : Colors.primary}
                      style={styles.flagIcon}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.legend}>
            <LegendItem color={Colors.primary} label="Current" />
            <LegendItem color="#FFE1B5" label="Answered" />
            <LegendItem icon="flag" label="Flagged" />
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Before submitting</Text>
            <Text style={styles.summaryBody}>
              Unanswered questions receive no mark. There is no negative
              marking, so it is worth attempting every question.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable onPress={onSubmit} style={styles.submitButton}>
            <Text style={styles.submitButtonText}>Review and submit</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function LegendItem({
  color,
  icon,
  label,
}: {
  color?: string;
  icon?: "flag";
  label: string;
}) {
  return (
    <View style={styles.legendItem}>
      {icon ? (
        <Ionicons name={icon} size={13} color={Colors.primary} />
      ) : (
        <View style={[styles.legendDot, { backgroundColor: color }]} />
      )}
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyebrow: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  title: {
    marginTop: 4,
    color: Colors.ink,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridButton: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.line,
    justifyContent: "center",
    alignItems: "center",
  },
  gridButtonAnswered: {
    backgroundColor: "#FFE9C8",
    borderColor: "#FFD69C",
  },
  gridButtonCurrent: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  gridButtonText: {
    color: Colors.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  gridButtonTextAnswered: {
    color: Colors.primary,
  },
  gridButtonTextCurrent: {
    color: "#FFFFFF",
  },
  flagIcon: {
    position: "absolute",
    right: 5,
    top: 5,
  },
  legend: {
    marginTop: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 11,
    height: 11,
    borderRadius: 4,
  },
  legendText: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  summaryCard: {
    marginTop: 28,
    padding: 18,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  summaryTitle: {
    color: Colors.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  summaryBody: {
    marginTop: 6,
    color: Colors.muted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  submitButton: {
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
});
