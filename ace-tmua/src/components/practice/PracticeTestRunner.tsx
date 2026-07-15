import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useAccount } from "@/contexts/AccountContext";

import PracticeQuestion from "./PracticeQuestion";
import QuestionNavigator from "./QuestionNavigator";
import TestTimer from "./TestTimer";
import { resolvePracticeTest } from "./practice-data";
import {
  clearActiveSession,
  createPracticeResult,
  getActiveSession,
  getElapsedSeconds,
  getRemainingSeconds,
  saveActiveSession,
  savePracticeResult,
} from "./practice-storage";
import type { PracticeSession, PracticeTestDefinition } from "./types";

interface Props {
  test: PracticeTestDefinition;
}

export default function PracticeTestRunner({ test }: Props) {
  const router = useRouter();
  const { isPremium } = useAccount();
  const scrollRef = useRef<ScrollView>(null);
  const sessionRef = useRef<PracticeSession | null>(null);
  const submittingRef = useRef(false);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(0);
  const [navigatorVisible, setNavigatorVisible] = useState(false);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    let active = true;

    void getActiveSession(test.id).then((savedSession) => {
      if (!active) return;

      if (!savedSession) {
        router.replace({
          pathname: "/practice/[testId]/instructions",
          params: { testId: test.id },
        });
        return;
      }

      setNow(Date.now());
      setSession(savedSession);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [router, test.id]);

  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [session]);

  const finishTest = useCallback(
    async (timeExpired: boolean) => {
      const latestSession = sessionRef.current;
      if (!latestSession || submittingRef.current) return;

      submittingRef.current = true;

      try {
        const attemptTest = resolvePracticeTest(
          test,
          latestSession.questionIds,
        );
        const result = createPracticeResult(
          latestSession,
          attemptTest,
          timeExpired,
        );
        await savePracticeResult(result);
        await clearActiveSession(test.id);
        router.replace({
          pathname: "/practice/[testId]/results",
          params: { testId: test.id, attemptId: result.id },
        });
      } catch {
        submittingRef.current = false;
        Alert.alert(
          "Could not save your result",
          "Your attempt is still on this device. Please try submitting again.",
        );
      }
    },
    [router, test],
  );

  const remainingSeconds = session
    ? getRemainingSeconds(session, test, now)
    : test.durationMinutes * 60;

  useEffect(() => {
    if (
      session?.mode !== "timed" ||
      remainingSeconds !== 0 ||
      submittingRef.current
    ) {
      return;
    }

    const timeout = setTimeout(() => void finishTest(true), 0);
    return () => clearTimeout(timeout);
  }, [finishTest, remainingSeconds, session?.mode]);

  if (test.premium && !isPremium) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Premium access is required for this mock.</Text>
          <Pressable onPress={() => router.replace("/premium")}>
            <Text style={styles.premiumLink}>See Premium</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (loading || !session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading your attempt…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const attemptTest = resolvePracticeTest(test, session.questionIds);
  const currentQuestion = attemptTest.questions[session.currentIndex];
  const answeredCount = attemptTest.questions.filter(
    (question) => session.answers[question.id] !== undefined,
  ).length;
  const isFlagged = session.flaggedQuestionIds.includes(currentQuestion.id);
  const elapsedSeconds = getElapsedSeconds(session, now);

  const persist = (nextSession: PracticeSession) => {
    sessionRef.current = nextSession;
    setSession(nextSession);
    void saveActiveSession(nextSession);
  };

  const updateSession = (changes: Partial<PracticeSession>) => {
    persist({
      ...session,
      ...changes,
      updatedAt: new Date().toISOString(),
    });
  };

  const goToQuestion = (index: number) => {
    if (index < 0 || index >= attemptTest.questions.length) return;
    updateSession({ currentIndex: index });
    setNavigatorVisible(false);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const confirmExit = () => {
    Alert.alert(
      "Leave this practice?",
      session.mode === "timed"
        ? "Your answers will be saved, but the timer will continue while you are away."
        : "Your answers and place will be saved so you can resume later.",
      [
        { text: "Keep practising", style: "cancel" },
        {
          text: "Save and leave",
          onPress: () => {
            void saveActiveSession(session).finally(() => router.back());
          },
        },
      ],
    );
  };

  const confirmSubmit = () => {
    const unanswered = attemptTest.questions.length - answeredCount;
    Alert.alert(
      unanswered > 0 ? `${unanswered} unanswered` : "Submit your answers?",
      unanswered > 0
        ? "There is no negative marking. You can return and attempt the remaining questions, or submit now."
        : "You will see your score and full explanations next.",
      [
        { text: "Keep checking", style: "cancel" },
        {
          text: "Submit",
          style: unanswered > 0 ? "destructive" : "default",
          onPress: () => void finishTest(false),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Exit practice"
          accessibilityRole="button"
          onPress={confirmExit}
          style={styles.headerButton}
        >
          <Ionicons name="close" size={24} color={Colors.ink} />
        </Pressable>

        <View style={styles.headerCentre}>
          <Text style={styles.headerEyebrow}>{test.title.toUpperCase()}</Text>
          <Text style={styles.headerQuestion}>
            {session.currentIndex + 1} of {attemptTest.questions.length}
          </Text>
        </View>

        <TestTimer
          mode={session.mode}
          seconds={session.mode === "timed" ? remainingSeconds : elapsedSeconds}
        />
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${((session.currentIndex + 1) / attemptTest.questions.length) * 100}%`,
            },
          ]}
        />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.questionContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <PracticeQuestion
          question={currentQuestion}
          questionNumber={session.currentIndex + 1}
          selectedAnswer={session.answers[currentQuestion.id]}
          onSelectAnswer={(answerIndex) =>
            updateSession({
              answers: {
                ...session.answers,
                [currentQuestion.id]: answerIndex,
              },
            })
          }
        />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerTopRow}>
          <Pressable
            disabled={session.currentIndex === 0}
            onPress={() => goToQuestion(session.currentIndex - 1)}
            style={({ pressed }) => [
              styles.smallButton,
              session.currentIndex === 0 && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            <Ionicons name="chevron-back" size={20} color={Colors.ink} />
            <Text style={styles.smallButtonText}>Previous</Text>
          </Pressable>

          <Pressable
            accessibilityState={{ selected: isFlagged }}
            onPress={() =>
              updateSession({
                flaggedQuestionIds: isFlagged
                  ? session.flaggedQuestionIds.filter(
                      (id) => id !== currentQuestion.id,
                    )
                  : [...session.flaggedQuestionIds, currentQuestion.id],
              })
            }
            style={[styles.flagButton, isFlagged && styles.flagButtonActive]}
          >
            <Ionicons
              name={isFlagged ? "flag" : "flag-outline"}
              size={19}
              color={isFlagged ? Colors.primary : Colors.muted}
            />
          </Pressable>

          <Pressable
            onPress={() => {
              if (session.currentIndex === attemptTest.questions.length - 1) {
                setNavigatorVisible(true);
              } else {
                goToQuestion(session.currentIndex + 1);
              }
            }}
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.nextButtonText}>
              {session.currentIndex === attemptTest.questions.length - 1
                ? "Review"
                : "Next"}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <Pressable
          onPress={() => setNavigatorVisible(true)}
          style={styles.overviewButton}
        >
          <Ionicons name="grid-outline" size={17} color={Colors.muted} />
          <Text style={styles.overviewText}>
            {answeredCount} of {attemptTest.questions.length} answered
          </Text>
        </Pressable>
      </View>

      <QuestionNavigator
        answers={session.answers}
        currentIndex={session.currentIndex}
        flaggedQuestionIds={session.flaggedQuestionIds}
        onClose={() => setNavigatorVisible(false)}
        onSelectQuestion={goToQuestion}
        onSubmit={confirmSubmit}
        questions={attemptTest.questions}
        visible={navigatorVisible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: Colors.muted,
    fontSize: 14,
    fontWeight: "800",
  },
  premiumLink: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "900",
  },
  header: {
    minHeight: 66,
    paddingHorizontal: 16,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCentre: {
    flex: 1,
    alignItems: "center",
  },
  headerEyebrow: {
    color: Colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  headerQuestion: {
    marginTop: 2,
    color: Colors.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  progressTrack: {
    height: 4,
    backgroundColor: "#F1E3CE",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
  },
  questionContent: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 32,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    backgroundColor: "rgba(255, 247, 230, 0.98)",
  },
  footerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  smallButton: {
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: 25,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  smallButtonText: {
    color: Colors.ink,
    fontSize: 13,
    fontWeight: "900",
  },
  flagButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    justifyContent: "center",
    alignItems: "center",
  },
  flagButtonActive: {
    backgroundColor: "#FFF0D3",
    borderColor: "#FFD095",
  },
  nextButton: {
    minHeight: 50,
    flex: 1,
    paddingHorizontal: 17,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  buttonDisabled: {
    opacity: 0.35,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  overviewButton: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  overviewText: {
    color: Colors.muted,
    fontSize: 11,
    fontWeight: "800",
  },
});
