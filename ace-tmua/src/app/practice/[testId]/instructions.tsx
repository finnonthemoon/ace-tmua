import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

import { Colors, Shadow } from "@/constants/theme";
import {
  getPracticeTest,
  selectQuestionIdsForTest,
} from "@/components/practice/practice-data";
import {
  clearActiveSession,
  createPracticeSession,
  getActiveSession,
  saveActiveSession,
} from "@/components/practice/practice-storage";
import type {
  PracticeMode,
  PracticeSession,
} from "@/components/practice/types";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function PracticeInstructionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ testId?: string | string[] }>();
  const testId = firstParam(params.testId);
  const test = getPracticeTest(testId);
  const [mode, setMode] = useState<PracticeMode>("timed");
  const [activeSession, setActiveSession] = useState<
    PracticeSession | null | undefined
  >(undefined);

  useEffect(() => {
    if (!test) return;

    let active = true;
    void getActiveSession(test.id).then((session) => {
      if (active) setActiveSession(session);
    });

    return () => {
      active = false;
    };
  }, [test]);

  if (!test) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorState}>
          <Text style={styles.errorTitle}>Practice set not found</Text>
          <Pressable onPress={() => router.replace("/questions")}>
            <Text style={styles.errorLink}>Back to practice</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (activeSession === undefined) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorState}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const openRunner = () => {
    router.replace({
      pathname: "/practice/[testId]/test",
      params: { testId: test.id },
    });
  };

  const startNewSession = async () => {
    await clearActiveSession(test.id);
    const questionIds = selectQuestionIdsForTest(test);
    const session = createPracticeSession(test, mode, questionIds);
    await saveActiveSession(session);
    openRunner();
  };

  const handleStart = () => {
    if (!activeSession) {
      void startNewSession();
      return;
    }

    Alert.alert(
      "Start a new attempt?",
      "Your saved answers from the current attempt will be replaced.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start again",
          style: "destructive",
          onPress: () => void startNewSession(),
        },
      ],
    );
  };

  const answeredCount = activeSession
    ? Object.keys(activeSession.answers).length
    : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Back to practice"
          accessibilityRole="button"
          onPress={() => router.replace("/questions")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={23} color={Colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Before you begin</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="document-text-outline" size={29} color="#FFFFFF" />
          </View>
          <Text style={styles.eyebrow}>
            {test.premium ? "PREMIUM MOCK" : "PRACTICE SET"}
          </Text>
          <Text style={styles.title}>{test.title}</Text>
          <Text style={styles.subtitle}>{test.subtitle}</Text>
          <Text style={styles.description}>{test.description}</Text>

          <View style={styles.metaRow}>
            <MetaItem
              icon="help-circle-outline"
              value={`${test.questionCount}`}
              label="questions"
            />
            <View style={styles.metaDivider} />
            <MetaItem
              icon="time-outline"
              value={`${test.durationMinutes}`}
              label="minutes"
            />
            <View style={styles.metaDivider} />
            <MetaItem icon="trophy-outline" value="1" label="mark each" />
          </View>
        </View>

        {activeSession ? (
          <View style={styles.resumeCard}>
            <View style={styles.resumeIcon}>
              <Ionicons name="bookmark" size={20} color={Colors.primary} />
            </View>
            <View style={styles.resumeBody}>
              <Text style={styles.resumeTitle}>Attempt in progress</Text>
              <Text style={styles.resumeText}>
                {answeredCount} of {test.questionCount} answered · Question{" "}
                {activeSession.currentIndex + 1}
              </Text>
            </View>
            <Pressable onPress={openRunner} style={styles.resumeButton}>
              <Text style={styles.resumeButtonText}>Resume</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>CHOOSE YOUR MODE</Text>
          <Text style={styles.sectionTitle}>How would you like to practise?</Text>
        </View>

        <View style={styles.modeRow}>
          <ModeCard
            active={mode === "timed"}
            icon="timer-outline"
            title="Timed"
            description={`${test.durationMinutes}-minute countdown`}
            onPress={() => setMode("timed")}
          />
          <ModeCard
            active={mode === "untimed"}
            icon="infinite-outline"
            title="Untimed"
            description="Work at your own pace"
            onPress={() => setMode("untimed")}
          />
        </View>

        <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>Practice rules</Text>
          <RuleItem
            icon="calculator-outline"
            text={test.calculatorAllowed ? "Calculator allowed" : "No calculator"}
          />
          <RuleItem
            icon="book-outline"
            text={
              test.formulaBookletAllowed
                ? "Formula booklet provided"
                : "No formula booklet"
            }
          />
          <RuleItem
            icon="remove-circle-outline"
            text={
              test.negativeMarking
                ? "Incorrect answers lose marks"
                : "No negative marking"
            }
          />
          <RuleItem
            icon="flag-outline"
            text="Flag questions and return to them before submitting"
          />
          {test.selectionBlueprint ? (
            <RuleItem
              icon="sparkles-outline"
              text="A fresh balanced question mix is generated for each new attempt"
            />
          ) : null}
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={22} color={Colors.primary} />
          <Text style={styles.tipText}>
            Aim to answer every question. If one is taking too long, flag it and
            move on—there is no penalty for a wrong answer.
          </Text>
        </View>

        <Pressable onPress={handleStart} style={styles.startButton}>
          <Text style={styles.startButtonText}>
            {activeSession ? "Start a new attempt" : `Start ${mode} practice`}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaItem({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={17} color={Colors.primary} />
      <Text style={styles.metaValue}>{value}</Text>
      <Text style={styles.metaLabel}>{label}</Text>
    </View>
  );
}

function ModeCard({
  active,
  icon,
  title,
  description,
  onPress,
}: {
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      onPress={onPress}
      style={[styles.modeCard, active && styles.modeCardActive]}
    >
      <View style={[styles.modeIcon, active && styles.modeIconActive]}>
        <Ionicons
          name={icon}
          size={23}
          color={active ? "#FFFFFF" : Colors.primary}
        />
      </View>
      <Text style={styles.modeTitle}>{title}</Text>
      <Text style={styles.modeDescription}>{description}</Text>
      <View style={[styles.radio, active && styles.radioActive]}>
        {active ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

function RuleItem({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.ruleRow}>
      <View style={styles.ruleIcon}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <Text style={styles.ruleText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: Colors.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 36,
  },
  heroCard: {
    padding: 22,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    ...Shadow.card,
  },
  heroIcon: {
    width: 54,
    height: 54,
    marginBottom: 17,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  eyebrow: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  title: {
    marginTop: 6,
    color: Colors.ink,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: -0.9,
  },
  subtitle: {
    marginTop: 8,
    color: Colors.muted,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
  },
  description: {
    marginTop: 12,
    color: Colors.muted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },
  metaRow: {
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    flexDirection: "row",
    alignItems: "center",
  },
  metaItem: {
    flex: 1,
    alignItems: "center",
  },
  metaValue: {
    marginTop: 4,
    color: Colors.ink,
    fontSize: 15,
    fontWeight: "900",
  },
  metaLabel: {
    marginTop: 1,
    color: Colors.muted,
    fontSize: 10,
    fontWeight: "700",
  },
  metaDivider: {
    width: 1,
    height: 37,
    backgroundColor: Colors.line,
  },
  resumeCard: {
    marginTop: 15,
    padding: 14,
    borderRadius: 21,
    backgroundColor: "#FFF0D3",
    borderWidth: 1,
    borderColor: "#FFD59A",
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  resumeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  resumeBody: {
    flex: 1,
  },
  resumeTitle: {
    color: Colors.ink,
    fontSize: 14,
    fontWeight: "900",
  },
  resumeText: {
    marginTop: 2,
    color: Colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  resumeButton: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    justifyContent: "center",
  },
  resumeButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  sectionHeader: {
    marginTop: 29,
    marginBottom: 13,
  },
  sectionEyebrow: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  sectionTitle: {
    marginTop: 4,
    color: Colors.ink,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  modeRow: {
    flexDirection: "row",
    gap: 11,
  },
  modeCard: {
    minHeight: 153,
    flex: 1,
    padding: 15,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.line,
  },
  modeCardActive: {
    borderColor: Colors.primary,
    backgroundColor: "#FFF8ED",
  },
  modeIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFF0D3",
    justifyContent: "center",
    alignItems: "center",
  },
  modeIconActive: {
    backgroundColor: Colors.primary,
  },
  modeTitle: {
    marginTop: 13,
    color: Colors.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  modeDescription: {
    marginTop: 3,
    paddingRight: 10,
    color: Colors.muted,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
  },
  radio: {
    position: "absolute",
    top: 15,
    right: 15,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.line,
    justifyContent: "center",
    alignItems: "center",
  },
  radioActive: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  rulesCard: {
    marginTop: 24,
    padding: 18,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    gap: 13,
  },
  rulesTitle: {
    marginBottom: 2,
    color: Colors.ink,
    fontSize: 17,
    fontWeight: "900",
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  ruleIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#FFF0D3",
    justifyContent: "center",
    alignItems: "center",
  },
  ruleText: {
    flex: 1,
    color: Colors.muted,
    fontSize: 13,
    fontWeight: "800",
  },
  tipCard: {
    marginTop: 15,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#FFF0D3",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
  },
  tipText: {
    flex: 1,
    color: Colors.muted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  startButton: {
    minHeight: 58,
    marginTop: 22,
    paddingHorizontal: 20,
    borderRadius: 29,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  errorState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  errorTitle: {
    color: Colors.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  errorLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "900",
  },
});
