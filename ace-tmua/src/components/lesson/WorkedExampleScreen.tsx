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
import type { WorkedExampleScreen } from "./types";

interface Props {
  screen: WorkedExampleScreen;
  progressPercent: number;
  revealIndex: number;
  onRevealNext: () => void;
  onNext: () => void;
  onExit: () => void;
}

export default function WorkedExampleScreenView({
  screen,
  progressPercent,
  revealIndex,
  onRevealNext,
  onNext,
  onExit,
}: Props) {
  // The browser implementation starts with zero visible steps.
  const visibleSteps = screen.steps.slice(0, revealIndex);
  const hasStarted = revealIndex > 0;
  const isFinished = revealIndex >= screen.steps.length;

  const buttonText = isFinished
    ? screen.buttonText || "Continue"
    : hasStarted
      ? "Show next step"
      : "Show reasoning";

  return (
    <SafeAreaView style={shared.safeArea} edges={["top", "bottom"]}>
      <View style={shared.screen}>
        <TopBar progressPercent={progressPercent} onExit={onExit} />

        <ScrollView
          style={shared.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={shared.eyebrow}>
            {screen.eyebrow || "WORKED EXAMPLE"}
          </Text>

          <PlainOrHtml html={screen.title} style={shared.title} />

          <View style={[styles.questionCard, shared.cardShadow]}>
            <PlainOrHtml html={screen.question} style={styles.question} />

            {!!screen.options?.length && (
              <View style={styles.options}>
                {screen.options.map((option, index) => {
                  const isAnswer = isFinished && index === screen.answerIndex;

                  return (
                    <View
                      key={`${index}-${option}`}
                      style={[styles.option, isAnswer && styles.correctOption]}
                    >
                      <View
                        style={[
                          styles.optionLetter,
                          isAnswer && styles.correctOptionLetter,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionLetterText,
                            isAnswer && styles.correctOptionLetterText,
                          ]}
                        >
                          {String.fromCharCode(65 + index)}
                        </Text>
                      </View>

                      <PlainOrHtml html={option} style={styles.optionText} />
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {hasStarted && (
            <View style={styles.steps}>
              {visibleSteps.map((step, index) => (
                <View key={`${index}-${step.title}`} style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>

                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <PlainOrHtml html={step.body} style={styles.stepBody} />
                  </View>
                </View>
              ))}
            </View>
          )}

          {isFinished && (
            <View style={styles.answerCard}>
              <Text style={styles.answerHeading}>
                Answer: {String.fromCharCode(65 + screen.answerIndex)}
              </Text>

              <PlainOrHtml
                html={screen.finalAnswer}
                style={styles.answerBody}
              />
            </View>
          )}
        </ScrollView>

        <TouchableOpacity
          style={shared.primaryButton}
          activeOpacity={0.85}
          onPress={isFinished ? onNext : onRevealNext}
        >
          <Text style={shared.primaryButtonText}>{buttonText}</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
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

  questionCard: {
    marginTop: 8,
    padding: 16,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 18,
  },

  question: {
    color: C.ink,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 24,
  },

  options: {
    gap: 10,
    marginTop: 16,
  },

  option: {
    minHeight: 54,
    padding: 12,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    backgroundColor: "#FFFDF8",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  correctOption: {
    backgroundColor: C.correctBackground,
    borderColor: C.correctBorder,
  },

  optionLetter: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: "#FFF0D3",
    justifyContent: "center",
    alignItems: "center",
  },

  correctOptionLetter: {
    backgroundColor: C.correctText,
  },

  optionLetterText: {
    color: C.primary,
    fontSize: 12,
    fontWeight: "900",
  },

  correctOptionLetterText: {
    color: "#FFFFFF",
  },

  optionText: {
    flex: 1,
    color: C.ink,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },

  steps: {
    gap: 12,
    marginTop: 16,
  },

  step: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFE0AD",
    borderRadius: 16,
    backgroundColor: "#FFF7E8",
    flexDirection: "row",
    gap: 14,
  },

  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  stepNumberText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  stepContent: {
    flex: 1,
  },

  stepTitle: {
    color: C.ink,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 4,
  },

  stepBody: {
    color: C.muted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
  },

  answerCard: {
    marginTop: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.correctBorder,
    borderRadius: 18,
    backgroundColor: C.correctBackground,
  },

  answerHeading: {
    color: C.correctText,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 6,
  },

  answerBody: {
    color: C.ink,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
  },
});
