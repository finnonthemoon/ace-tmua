import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { practiceTests } from "@/components/practice/practice-data";
import {
  getActiveSessions,
  getPracticeResults,
} from "@/components/practice/practice-storage";
import { TMUA_PAPER_FORMAT } from "@/components/practice/types";
import type {
  PracticeResult,
  PracticeSession,
  PracticeTestDefinition,
} from "@/components/practice/types";
import { Colors, Shadow } from "@/constants/theme";
import { useAccount } from "@/contexts/AccountContext";

export default function QuestionsScreen() {
  const router = useRouter();
  const { isPremium } = useAccount();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [results, setResults] = useState<PracticeResult[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      void Promise.all([
        getActiveSessions(practiceTests.map((test) => test.id)),
        getPracticeResults(),
      ]).then(([savedSessions, savedResults]) => {
        if (!active) return;
        setSessions(savedSessions);
        setResults(savedResults);
      });

      return () => {
        active = false;
      };
    }, []),
  );

  const openTest = (test: PracticeTestDefinition) => {
    if (test.premium && !isPremium) {
      router.push("/premium");
      return;
    }

    router.push({
      pathname: "/practice/[testId]/instructions",
      params: { testId: test.id },
    });
  };

  return (
    <SafeAreaView collapsable={false} style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>EXAM PRACTICE</Text>
          <Text style={styles.title}>Turn knowledge into marks</Text>
          <Text style={styles.intro}>
            Build accuracy first, then practise making decisions under real
            TMUA time pressure.
          </Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <View style={styles.heroIcon}>
            <Ionicons name="timer-outline" size={30} color="#FFFFFF" />
          </View>
          <Text style={styles.heroEyebrow}>BUILT FOR EXAM CONDITIONS</Text>
          <Text style={styles.heroTitle}>Practise the whole process</Text>
          <Text style={styles.heroText}>
            Choose timed or untimed mode, flag difficult questions, review the
            paper before submitting, then see explanations and topic scores.
          </Text>
          <View style={styles.heroFeatures}>
            <FeaturePill icon="flag-outline" text="Flag and review" />
            <FeaturePill icon="analytics-outline" text="Topic insights" />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>START HERE</Text>
            <Text style={styles.sectionTitle}>Practice sets</Text>
          </View>
          {results.length > 0 ? (
            <Text style={styles.attemptCount}>
              {results.length} {results.length === 1 ? "attempt" : "attempts"}
            </Text>
          ) : null}
        </View>

        <View style={styles.testList}>
          {practiceTests.filter((test) => !test.premium).map((test) => {
            const session = sessions.find((item) => item.testId === test.id);
            const testResults = results.filter(
              (result) => result.testId === test.id,
            );
            const best = testResults.reduce<PracticeResult | null>(
              (current, result) =>
                !current || result.score > current.score ? result : current,
              null,
            );

            return (
              <PracticeTestCard
                key={test.id}
                bestResult={best}
                session={session}
                test={test}
                onPress={() => openTest(test)}
              />
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>FULL MOCK FORMAT</Text>
            <Text style={styles.sectionTitle}>Complete papers</Text>
          </View>
        </View>

        <Text style={styles.sectionIntro}>
          The mock-paper framework matches the published structure: 20
          questions in 75 minutes, one mark per question and no negative
          marking.
        </Text>

        <View style={styles.mockList}>
          {practiceTests.filter((test) => test.premium).map((test) => {
            const session = sessions.find((item) => item.testId === test.id);
            const testResults = results.filter(
              (result) => result.testId === test.id,
            );
            const best = testResults.reduce<PracticeResult | null>(
              (current, result) =>
                !current || result.score > current.score ? result : current,
              null,
            );

            return (
              <PracticeTestCard
                key={test.id}
                bestResult={best}
                session={session}
                test={test}
                onPress={() => openTest(test)}
              />
            );
          })}
        </View>

        <View style={styles.formatCard}>
          <Text style={styles.formatEyebrow}>PAPER FORMAT</Text>
          <View style={styles.formatRow}>
            <FormatStat
              value={`${TMUA_PAPER_FORMAT.questionsPerPaper}`}
              label="questions"
            />
            <View style={styles.formatDivider} />
            <FormatStat
              value={`${TMUA_PAPER_FORMAT.durationMinutes}`}
              label="minutes"
            />
            <View style={styles.formatDivider} />
            <FormatStat value="0" label="negative marks" />
          </View>
          <Text style={styles.formatNote}>
            No calculator · No formula booklet
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PracticeTestCard({
  test,
  session,
  bestResult,
  onPress,
}: {
  test: PracticeTestDefinition;
  session: PracticeSession | undefined;
  bestResult: PracticeResult | null;
  onPress: () => void;
}) {
  const answeredCount = session ? Object.keys(session.answers).length : 0;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.testCard,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.testCardHeader}>
        <View style={styles.testIcon}>
          <Ionicons name="sparkles-outline" size={24} color={Colors.primary} />
        </View>
        <View style={styles.freePill}>
          <Text style={styles.freePillText}>
            {test.premium ? "PREMIUM" : "FREE"}
          </Text>
        </View>
      </View>
      <Text style={styles.testTitle}>{test.title}</Text>
      <Text style={styles.testSubtitle}>{test.subtitle}</Text>

      <View style={styles.testMeta}>
        <TestMeta
          icon="help-circle-outline"
          text={`${test.questionCount} questions`}
        />
        <TestMeta icon="time-outline" text={`${test.durationMinutes} min`} />
        <TestMeta
          icon={test.paperStyle === "mixed" ? "shuffle-outline" : "document-outline"}
          text={
            test.paperStyle === "paper-1"
              ? "Paper 1"
              : test.paperStyle === "paper-2"
                ? "Paper 2"
                : "Mixed"
          }
        />
        {test.selectionBlueprint ? (
          <TestMeta icon="sparkles-outline" text="Fresh mix" />
        ) : null}
      </View>

      {session ? (
        <View style={styles.savedAttempt}>
          <View style={styles.savedProgressTrack}>
            <View
              style={[
                styles.savedProgressFill,
                {
                  width: `${(answeredCount / test.questionCount) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.savedAttemptText}>
            Resume · {answeredCount} answered
          </Text>
        </View>
      ) : bestResult ? (
        <Text style={styles.bestScore}>
          Best score · {bestResult.score}/{bestResult.maxScore}
        </Text>
      ) : (
        <Text style={styles.bestScore}>No attempts yet</Text>
      )}

      <View style={styles.testAction}>
        <Text style={styles.testActionText}>
          {session ? "Continue" : "View set"}
        </Text>
        <Ionicons name="arrow-forward" size={19} color={Colors.primary} />
      </View>
    </Pressable>
  );
}

function FeaturePill({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.featurePill}>
      <Ionicons name={icon} size={14} color="#FFFFFF" />
      <Text style={styles.featurePillText}>{text}</Text>
    </View>
  );
}

function TestMeta({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.testMetaItem}>
      <Ionicons name={icon} size={14} color={Colors.muted} />
      <Text style={styles.testMetaText}>{text}</Text>
    </View>
  );
}

function FormatStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.formatStat}>
      <Text style={styles.formatValue}>{value}</Text>
      <Text style={styles.formatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 130,
  },
  header: {
    marginBottom: 23,
  },
  eyebrow: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  title: {
    maxWidth: 340,
    marginTop: 7,
    color: Colors.ink,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    letterSpacing: -1.2,
  },
  intro: {
    maxWidth: 350,
    marginTop: 10,
    color: Colors.muted,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
  },
  heroCard: {
    minHeight: 246,
    padding: 22,
    overflow: "hidden",
    borderRadius: 28,
    backgroundColor: Colors.primary,
    ...Shadow.streak,
  },
  heroGlow: {
    position: "absolute",
    width: 230,
    height: 230,
    right: -90,
    top: -85,
    borderRadius: 115,
    backgroundColor: "rgba(255, 196, 111, 0.38)",
  },
  heroIcon: {
    width: 52,
    height: 52,
    marginBottom: 17,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.32)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroEyebrow: {
    color: "#FFF0D7",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  heroTitle: {
    marginTop: 5,
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  heroText: {
    marginTop: 8,
    maxWidth: 325,
    color: "#FFF4E5",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
  },
  heroFeatures: {
    marginTop: 17,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  featurePill: {
    minHeight: 31,
    paddingHorizontal: 11,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.16)",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  featurePillText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  sectionHeader: {
    marginTop: 33,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  sectionEyebrow: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  sectionTitle: {
    marginTop: 3,
    color: Colors.ink,
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  attemptCount: {
    color: Colors.muted,
    fontSize: 11,
    fontWeight: "800",
  },
  testList: {
    gap: 14,
  },
  testCard: {
    padding: 19,
    borderRadius: 26,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    ...Shadow.card,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
  },
  testCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  testIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#FFF0D3",
    justifyContent: "center",
    alignItems: "center",
  },
  freePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 13,
    backgroundColor: "#FFF0D3",
  },
  freePillText: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  testTitle: {
    marginTop: 16,
    color: Colors.ink,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  testSubtitle: {
    marginTop: 4,
    color: Colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  testMeta: {
    marginTop: 15,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 13,
  },
  testMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  testMetaText: {
    color: Colors.muted,
    fontSize: 10,
    fontWeight: "800",
  },
  savedAttempt: {
    marginTop: 16,
  },
  savedProgressTrack: {
    height: 6,
    overflow: "hidden",
    borderRadius: 3,
    backgroundColor: "#F2E8D8",
  },
  savedProgressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  savedAttemptText: {
    marginTop: 6,
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "900",
  },
  bestScore: {
    marginTop: 16,
    color: Colors.muted,
    fontSize: 11,
    fontWeight: "800",
  },
  testAction: {
    marginTop: 17,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  testActionText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "900",
  },
  sectionIntro: {
    marginTop: -5,
    marginBottom: 14,
    color: Colors.muted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
  },
  mockList: {
    gap: 11,
  },
  formatCard: {
    marginTop: 15,
    padding: 17,
    borderRadius: 22,
    backgroundColor: "#FFF0D3",
    borderWidth: 1,
    borderColor: "#FFD8A0",
  },
  formatEyebrow: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    textAlign: "center",
  },
  formatRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  formatStat: {
    flex: 1,
    alignItems: "center",
  },
  formatValue: {
    color: Colors.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  formatLabel: {
    marginTop: 1,
    color: Colors.muted,
    fontSize: 9,
    fontWeight: "700",
  },
  formatDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#EAC999",
  },
  formatNote: {
    marginTop: 14,
    color: Colors.muted,
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },
});
