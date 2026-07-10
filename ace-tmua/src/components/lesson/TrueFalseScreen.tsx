import { useState } from "react";
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
import type { TrueFalseScreen } from "./types";

interface Props {
  screen: TrueFalseScreen;
  progressPercent: number;
  onNext: () => void;
  onExit: () => void;
  onAnswer: (correct: boolean) => void;
}

type AnswerState = "unanswered" | "correct" | "wrong" | "neutral";

export default function TrueFalseScreenView({
  screen,
  progressPercent,
  onNext,
  onExit,
  onAnswer,
}: Props) {
  const [chosen, setChosen] = useState<boolean | null>(null);

  const hasAnswered = chosen !== null;
  const isCorrect = hasAnswered && chosen === screen.answer;

  function handleAnswer(answer: boolean) {
    if (hasAnswered) {
      return;
    }

    const answerIsCorrect = answer === screen.answer;

    setChosen(answer);
    onAnswer(answerIsCorrect);
  }

  function getAnswerState(answer: boolean): AnswerState {
    if (!hasAnswered) {
      return "unanswered";
    }

    if (answer === screen.answer) {
      return "correct";
    }

    if (answer === chosen) {
      return "wrong";
    }

    return "neutral";
  }

  function getOptionStyle(answer: boolean) {
    const state = getAnswerState(answer);

    return [
      styles.option,
      state === "correct" && styles.optionCorrect,
      state === "wrong" && styles.optionWrong,
      state === "neutral" && styles.optionDimmed,
    ];
  }

  function getOptionTextStyle(answer: boolean) {
    const state = getAnswerState(answer);

    return [
      styles.optionText,
      state === "correct" && styles.optionTextCorrect,
      state === "wrong" && styles.optionTextWrong,
    ];
  }

  function getIconColor(answer: boolean) {
    const state = getAnswerState(answer);

    if (state === "correct") {
      return C.correctText;
    }

    if (state === "wrong") {
      return C.wrongText;
    }

    return C.primary;
  }

  return (
    <SafeAreaView style={shared.safeArea} edges={["top", "bottom"]}>
      <View style={shared.screen}>
        <TopBar progressPercent={progressPercent} onExit={onExit} />

        <ScrollView
          style={shared.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={shared.eyebrow}>{screen.eyebrow || "QUICK CHECK"}</Text>

          <PlainOrHtml html={screen.question} style={styles.question} />

          <View style={styles.options}>
            <TouchableOpacity
              style={getOptionStyle(true)}
              onPress={() => handleAnswer(true)}
              disabled={hasAnswered}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{
                disabled: hasAnswered,
                selected: chosen === true,
              }}
              accessibilityLabel="True"
            >
              <Ionicons name="checkmark" size={29} color={getIconColor(true)} />

              <Text style={getOptionTextStyle(true)}>True</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={getOptionStyle(false)}
              onPress={() => handleAnswer(false)}
              disabled={hasAnswered}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{
                disabled: hasAnswered,
                selected: chosen === false,
              }}
              accessibilityLabel="False"
            >
              <Ionicons name="close" size={29} color={getIconColor(false)} />

              <Text style={getOptionTextStyle(false)}>False</Text>
            </TouchableOpacity>
          </View>

          {hasAnswered && (
            <View
              style={[
                shared.feedbackCard,
                isCorrect ? shared.feedbackCorrect : shared.feedbackWrong,
              ]}
            >
              <Text
                style={[
                  shared.feedbackHeading,
                  {
                    color: isCorrect ? C.correctText : C.wrongText,
                  },
                ]}
              >
                {isCorrect ? "Correct." : "Not quite."}
              </Text>

              <PlainOrHtml
                html={
                  isCorrect ? screen.correctFeedback : screen.incorrectFeedback
                }
                style={shared.feedbackBody}
              />

              <TouchableOpacity
                style={shared.primaryButtonInline}
                onPress={onNext}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Continue"
              >
                <Text style={shared.primaryButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 24,
  },

  question: {
    color: C.ink,
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 34,
    letterSpacing: -1,
  },

  options: {
    marginTop: 28,
    flexDirection: "row",
    gap: 13,
  },

  option: {
    flex: 1,
    minHeight: 112,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,

    shadowColor: "#6F4619",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },

  optionCorrect: {
    backgroundColor: C.correctBackground,
    borderColor: C.correctBorder,
  },

  optionWrong: {
    backgroundColor: C.wrongBackground,
    borderColor: C.wrongBorder,
  },

  optionDimmed: {
    opacity: 0.55,
  },

  optionText: {
    color: C.ink,
    fontSize: 17,
    fontWeight: "900",
  },

  optionTextCorrect: {
    color: C.correctText,
  },

  optionTextWrong: {
    color: C.wrongText,
  },
});
