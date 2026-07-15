import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { PlainOrHtml } from "@/components/lesson/MathText";
import { Colors, Shadow } from "@/constants/theme";

import { formatDuration } from "./TestTimer";
import type { PracticeResult, PracticeTestData } from "./types";

interface Props {
  test: PracticeTestData;
  result: PracticeResult;
  onDone: () => void;
  onRetake: () => void;
}

const optionLetters = "ABCDEFGH";

export default function TestResults({
  test,
  result,
  onDone,
  onRetake,
}: Props) {
  const percentage = Math.round((result.score / result.maxScore) * 100);
  const answeredCount = Object.keys(result.answers).length;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={styles.completeIcon}>
          <Ionicons name="checkmark" size={30} color="#FFFFFF" />
        </View>
        <Text style={styles.eyebrow}>
          {result.timeExpired ? "TIME EXPIRED" : "PRACTICE COMPLETE"}
        </Text>
        <Text style={styles.title}>{test.title}</Text>

        <View style={styles.scoreRow}>
          <Text style={styles.score}>{result.score}</Text>
          <Text style={styles.scoreDivider}>/{result.maxScore}</Text>
        </View>
        <Text style={styles.percentage}>{percentage}% correct</Text>

        <View style={styles.statsRow}>
          <ResultStat
            icon="stopwatch-outline"
            label="Time"
            value={formatDuration(result.elapsedSeconds)}
          />
          <View style={styles.statDivider} />
          <ResultStat
            icon="checkbox-outline"
            label="Answered"
            value={`${answeredCount}/${test.questions.length}`}
          />
          <View style={styles.statDivider} />
          <ResultStat
            icon="options-outline"
            label="Mode"
            value={result.mode === "timed" ? "Timed" : "Untimed"}
          />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionEyebrow}>TOPIC BREAKDOWN</Text>
        <Text style={styles.sectionTitle}>Where to focus next</Text>
      </View>

      <View style={styles.topicCard}>
        {result.topicResults.map((topic) => {
          const topicPercentage = Math.round((topic.correct / topic.total) * 100);

          return (
            <View key={topic.topicId} style={styles.topicRow}>
              <View style={styles.topicLabels}>
                <Text style={styles.topicTitle}>{topic.topicTitle}</Text>
                <Text style={styles.topicScore}>
                  {topic.correct}/{topic.total}
                </Text>
              </View>
              <View style={styles.topicTrack}>
                <View
                  style={[styles.topicFill, { width: `${topicPercentage}%` }]}
                />
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionEyebrow}>QUESTION REVIEW</Text>
        <Text style={styles.sectionTitle}>Answers and explanations</Text>
      </View>

      <View style={styles.reviewList}>
        {test.questions.map((question, index) => {
          const selectedIndex = result.answers[question.id];
          const correct = selectedIndex === question.answerIndex;
          const unanswered = selectedIndex === undefined;

          return (
            <View key={question.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View
                  style={[
                    styles.reviewStatus,
                    correct
                      ? styles.reviewStatusCorrect
                      : styles.reviewStatusIncorrect,
                  ]}
                >
                  <Ionicons
                    name={correct ? "checkmark" : "close"}
                    size={17}
                    color={correct ? "#2C7A50" : "#B3483D"}
                  />
                </View>
                <View style={styles.reviewHeadingText}>
                  <Text style={styles.reviewQuestion}>Question {index + 1}</Text>
                  <Text style={styles.reviewTopic}>{question.topicTitle}</Text>
                </View>
              </View>

              <PlainOrHtml html={question.question} style={styles.reviewPrompt} />

              <View style={styles.answerBox}>
                <Text style={styles.answerLabel}>
                  {correct ? "CORRECT" : "YOUR ANSWER"}
                </Text>
                <View style={styles.answerContent}>
                  <Text style={styles.answerLetter}>
                    {unanswered ? "—" : optionLetters[selectedIndex]}
                  </Text>
                  <View style={styles.answerTextWrap}>
                    <PlainOrHtml
                      html={
                        unanswered
                          ? "Not answered"
                          : question.options[selectedIndex]
                      }
                      style={styles.answerText}
                    />
                  </View>
                </View>
              </View>

              {!correct ? (
                <View style={[styles.answerBox, styles.correctAnswerBox]}>
                  <Text style={[styles.answerLabel, styles.correctAnswerLabel]}>
                    CORRECT ANSWER
                  </Text>
                  <View style={styles.answerContent}>
                    <Text style={[styles.answerLetter, styles.correctAnswerLetter]}>
                      {optionLetters[question.answerIndex]}
                    </Text>
                    <View style={styles.answerTextWrap}>
                      <PlainOrHtml
                        html={question.options[question.answerIndex]}
                        style={styles.answerText}
                      />
                    </View>
                  </View>
                </View>
              ) : null}

              <View style={styles.explanation}>
                <Text style={styles.explanationLabel}>EXPLANATION</Text>
                <PlainOrHtml
                  html={question.explanation}
                  style={styles.explanationText}
                />
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.actions}>
        <Pressable onPress={onRetake} style={styles.secondaryButton}>
          <Ionicons name="refresh" size={19} color={Colors.primary} />
          <Text style={styles.secondaryButtonText}>Try again</Text>
        </Pressable>
        <Pressable onPress={onDone} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Back to practice</Text>
          <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
        </Pressable>
      </View>
    </ScrollView>
  );
}

function ResultStat({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={18} color={Colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 44,
  },
  hero: {
    paddingHorizontal: 20,
    paddingVertical: 26,
    borderRadius: 30,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: "center",
    ...Shadow.card,
  },
  completeIcon: {
    width: 58,
    height: 58,
    marginBottom: 15,
    borderRadius: 29,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  eyebrow: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  title: {
    marginTop: 7,
    color: Colors.ink,
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.7,
  },
  scoreRow: {
    marginTop: 17,
    flexDirection: "row",
    alignItems: "baseline",
  },
  score: {
    color: Colors.ink,
    fontSize: 58,
    lineHeight: 64,
    fontWeight: "900",
    letterSpacing: -2,
  },
  scoreDivider: {
    color: Colors.muted,
    fontSize: 26,
    fontWeight: "900",
  },
  percentage: {
    color: Colors.muted,
    fontSize: 15,
    fontWeight: "800",
  },
  statsRow: {
    width: "100%",
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    flexDirection: "row",
    alignItems: "center",
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    marginTop: 5,
    color: Colors.ink,
    fontSize: 14,
    fontWeight: "900",
  },
  statLabel: {
    marginTop: 2,
    color: Colors.muted,
    fontSize: 10,
    fontWeight: "800",
  },
  statDivider: {
    width: 1,
    height: 42,
    backgroundColor: Colors.line,
  },
  sectionHeader: {
    marginTop: 34,
    marginBottom: 14,
  },
  sectionEyebrow: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  sectionTitle: {
    marginTop: 4,
    color: Colors.ink,
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  topicCard: {
    padding: 18,
    gap: 17,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  topicRow: {
    gap: 7,
  },
  topicLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  topicTitle: {
    flex: 1,
    color: Colors.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  topicScore: {
    color: Colors.muted,
    fontSize: 13,
    fontWeight: "900",
  },
  topicTrack: {
    height: 8,
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: "#F2E9DB",
  },
  topicFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  reviewList: {
    gap: 16,
  },
  reviewCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  reviewStatus: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  reviewStatusCorrect: {
    backgroundColor: "#E7F5EC",
  },
  reviewStatusIncorrect: {
    backgroundColor: "#FCEBE8",
  },
  reviewHeadingText: {
    flex: 1,
  },
  reviewQuestion: {
    color: Colors.ink,
    fontSize: 15,
    fontWeight: "900",
  },
  reviewTopic: {
    marginTop: 1,
    color: Colors.muted,
    fontSize: 11,
    fontWeight: "800",
  },
  reviewPrompt: {
    marginTop: 16,
    color: Colors.ink,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "800",
  },
  answerBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#FFF7EC",
  },
  correctAnswerBox: {
    backgroundColor: "#EDF8F1",
  },
  answerLabel: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  correctAnswerLabel: {
    color: "#2C7A50",
  },
  answerContent: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  answerLetter: {
    width: 24,
    color: Colors.primary,
    fontSize: 15,
    fontWeight: "900",
  },
  correctAnswerLetter: {
    color: "#2C7A50",
  },
  answerTextWrap: {
    flex: 1,
  },
  answerText: {
    color: Colors.ink,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
  },
  explanation: {
    marginTop: 16,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  explanationLabel: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  explanationText: {
    marginTop: 6,
    color: Colors.muted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
  },
  actions: {
    marginTop: 28,
    gap: 11,
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 27,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: "900",
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
});
