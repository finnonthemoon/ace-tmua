import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors, Shadow } from "@/constants/theme";
import { PlainOrHtml } from "@/components/lesson/MathText";

import type { PracticeQuestionData } from "./types";

interface Props {
  question: PracticeQuestionData;
  questionNumber: number;
  selectedAnswer: number | undefined;
  onSelectAnswer: (answerIndex: number) => void;
}

const optionLetters = "ABCDEFGH";

export default function PracticeQuestion({
  question,
  questionNumber,
  selectedAnswer,
  onSelectAnswer,
}: Props) {
  return (
    <View>
      <View style={styles.metaRow}>
        <Text style={styles.eyebrow}>QUESTION {questionNumber}</Text>
        <Text style={styles.topic}>{question.topicTitle}</Text>
      </View>

      <PlainOrHtml html={question.question} style={styles.question} />

      {question.prompt ? (
        <View style={styles.promptCard}>
          <Text style={styles.promptLabel}>THINK ABOUT</Text>
          <PlainOrHtml html={question.prompt} style={styles.promptText} />
        </View>
      ) : null}

      <View style={styles.options}>
        {question.options.map((option, index) => {
          const selected = selectedAnswer === index;

          return (
            <Pressable
              accessibilityLabel={`Option ${optionLetters[index]}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              key={`${question.id}-option-${index}`}
              onPress={() => onSelectAnswer(index)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}
            >
              <View
                style={[
                  styles.optionLetter,
                  selected && styles.optionLetterSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionLetterText,
                    selected && styles.optionLetterTextSelected,
                  ]}
                >
                  {optionLetters[index]}
                </Text>
              </View>
              <View style={styles.optionBody}>
                <PlainOrHtml html={option} style={styles.optionText} />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  eyebrow: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  topic: {
    flexShrink: 1,
    color: Colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
  },
  question: {
    color: Colors.ink,
    fontSize: 27,
    lineHeight: 36,
    fontWeight: "900",
    letterSpacing: -0.7,
  },
  promptCard: {
    marginTop: 20,
    padding: 15,
    borderRadius: 18,
    backgroundColor: "#FFF1D8",
    borderWidth: 1,
    borderColor: "#FFD9A2",
  },
  promptLabel: {
    marginBottom: 5,
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  promptText: {
    color: Colors.muted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  options: {
    marginTop: 26,
    gap: 12,
  },
  option: {
    minHeight: 74,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    ...Shadow.card,
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#FFF8EC",
  },
  optionPressed: {
    transform: [{ scale: 0.99 }],
  },
  optionLetter: {
    width: 42,
    height: 42,
    flexShrink: 0,
    borderRadius: 21,
    backgroundColor: "#FFF0D3",
    justifyContent: "center",
    alignItems: "center",
  },
  optionLetterSelected: {
    backgroundColor: Colors.primary,
  },
  optionLetterText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "900",
  },
  optionLetterTextSelected: {
    color: "#FFFFFF",
  },
  optionBody: {
    flex: 1,
  },
  optionText: {
    color: Colors.ink,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "800",
  },
});
