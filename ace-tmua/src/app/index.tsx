import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  DAILY_GOAL_MINUTES,
  WEEKLY_GOAL_MINUTES,
  loadHomeDashboard,
} from "@/components/home/home-data";
import type { HomeDashboardData } from "@/components/home/home-data";
import type { Lesson } from "@/components/lesson/types";
import { Colors, Shadow } from "@/constants/theme";
import localTestStorage from "@/data/localTestStorage.json";

interface UserProfile {
  name: string;
  targetUni: string;
  targetScore: number;
}

const USER = localTestStorage.userData as UserProfile;
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function resultPercentage(result: HomeDashboardData["latestResult"]) {
  if (!result || result.maxScore === 0) return 0;
  return Math.round((result.score / result.maxScore) * 100);
}

function formatMinutes(minutes: number) {
  if (minutes === 0) return "0 min";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

export default function HomeScreen() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<HomeDashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      void loadHomeDashboard()
        .then((nextDashboard) => {
          if (!active) return;
          setDashboard(nextDashboard);
          setLoadFailed(false);
        })
        .catch((error) => {
          console.error("Could not load the home dashboard:", error);
          if (active) setLoadFailed(true);
        });

      return () => {
        active = false;
      };
    }, []),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setDashboard(await loadHomeDashboard());
      setLoadFailed(false);
    } catch (error) {
      console.error("Could not refresh the home dashboard:", error);
      setLoadFailed(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const openLesson = (lesson: Lesson) => {
    router.push({
      pathname: "/lesson/[lessonId]",
      params: { lessonId: lesson.id },
    });
  };

  if (!dashboard && !loadFailed) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Building your study plan…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!dashboard) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingState}>
          <View style={styles.errorIcon}>
            <Ionicons name="cloud-offline-outline" size={27} color={Colors.primary} />
          </View>
          <Text style={styles.errorTitle}>Your dashboard did not load</Text>
          <Text style={styles.errorText}>
            Your saved progress is still on this device. Try loading it again.
          </Text>
          <Pressable onPress={() => void refresh()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const startedTopics = dashboard.topicProgress.filter(
    (topic) => topic.completed > 0,
  ).length;
  const masteredTopics = dashboard.topicProgress.filter(
    (topic) => topic.total > 0 && topic.completed === topic.total,
  ).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>ACE TMUA</Text>
            <Text style={styles.greeting}>
              {getGreeting()}, {USER.name.split(" ")[0]}
            </Text>
            <Text style={styles.headerSubtext}>
              {dashboard.primarySession
                ? "Your saved paper is ready when you are."
                : dashboard.completedLessonCount > 0
                  ? "Keep the momentum with one focused session."
                  : "Start small, build consistency, then add exam pressure."}
            </Text>
          </View>

          <Pressable
            accessibilityLabel="Open profile"
            accessibilityRole="button"
            onPress={() => router.push("/profile")}
            style={({ pressed }) => [
              styles.avatar,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.avatarText}>{getInitials(USER.name)}</Text>
          </Pressable>
        </View>

        <PrimaryActionCard
          dashboard={dashboard}
          onPress={() => {
            if (dashboard.primarySession) {
              router.push({
                pathname: "/practice/[testId]/test",
                params: { testId: dashboard.primarySession.testId },
              });
            } else if (dashboard.nextLesson) {
              openLesson(dashboard.nextLesson);
            } else {
              router.push("/questions");
            }
          }}
        />

        <View style={styles.habitRow}>
          <StreakCard
            streak={dashboard.streak}
            activeWeekdays={dashboard.activeWeekdays}
          />
          <DailyGoalCard
            minutes={dashboard.todayMinutes}
            progress={dashboard.dailyGoalPercent}
            onPress={() => {
              if (dashboard.primarySession) {
                router.push({
                  pathname: "/practice/[testId]/test",
                  params: { testId: dashboard.primarySession.testId },
                });
              } else if (dashboard.nextLesson) {
                openLesson(dashboard.nextLesson);
              } else {
                router.push("/questions");
              }
            }}
          />
        </View>

        <SectionHeading
          eyebrow="YOUR COURSE"
          title="See the path ahead"
          action="Open roadmap"
          onPress={() => router.push("/learn")}
        />

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/learn")}
          style={({ pressed }) => [
            styles.courseCard,
            pressed && styles.buttonPressed,
          ]}
        >
          <View style={styles.courseHeader}>
            <View>
              <Text style={styles.courseNumber}>
                {dashboard.courseProgressPercent}%
              </Text>
              <Text style={styles.courseLabel}>foundation complete</Text>
            </View>
            <View style={styles.courseCountPill}>
              <Text style={styles.courseCountText}>
                {dashboard.completedLessonCount}/{dashboard.totalLessonCount} lessons
              </Text>
            </View>
          </View>

          <View style={styles.largeProgressTrack}>
            <View
              style={[
                styles.largeProgressFill,
                { width: `${dashboard.courseProgressPercent}%` },
              ]}
            />
          </View>

          <View style={styles.topicDots}>
            {dashboard.topicProgress.map((topic) => {
              const progress = topic.total
                ? (topic.completed / topic.total) * 100
                : 0;
              return (
                <View key={topic.id} style={styles.topicDotColumn}>
                  <View style={[styles.topicDotTrack, { backgroundColor: topic.softColor }]}>
                    <View
                      style={[
                        styles.topicDotFill,
                        { backgroundColor: topic.color, height: `${progress}%` },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.courseFooter}>
            <CourseStat value={`${startedTopics}`} label="topics started" />
            <View style={styles.courseDivider} />
            <CourseStat value={`${masteredTopics}`} label="topics mastered" />
            <View style={styles.courseArrow}>
              <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
            </View>
          </View>
        </Pressable>

        <SectionHeading
          eyebrow="SMART NEXT STEP"
          title={dashboard.weakArea ? "Focus where it matters" : "Build your baseline"}
        />

        <RecommendationCard
          dashboard={dashboard}
          onPress={() => {
            if (dashboard.weakArea?.lesson) {
              openLesson(dashboard.weakArea.lesson);
            } else {
              router.push({
                pathname: "/practice/[testId]/instructions",
                params: { testId: "starter-diagnostic-1" },
              });
            }
          }}
        />

        {dashboard.latestResult ? (
          <LatestResultCard
            dashboard={dashboard}
            onPress={() => {
              const result = dashboard.latestResult;
              if (!result) return;
              router.push({
                pathname: "/practice/[testId]/results",
                params: { testId: result.testId, attemptId: result.id },
              });
            }}
          />
        ) : null}

        <SectionHeading eyebrow="THIS WEEK" title="Your momentum" />
        <MomentumCard dashboard={dashboard} />

        <View style={styles.quickActions}>
          <QuickAction
            icon="git-network-outline"
            title="Browse lessons"
            subtitle="Choose a topic"
            onPress={() => router.push("/learn")}
          />
          <QuickAction
            icon="timer-outline"
            title="Exam practice"
            subtitle="Timed or untimed"
            onPress={() => router.push("/questions")}
          />
        </View>

        <View style={styles.targetNote}>
          <Ionicons name="flag-outline" size={18} color={Colors.primary} />
          <Text style={styles.targetNoteText}>
            Targeting {USER.targetScore}% for {USER.targetUni}
          </Text>
          <Pressable onPress={() => router.push("/profile")} hitSlop={10}>
            <Ionicons name="chevron-forward" size={18} color={Colors.muted} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PrimaryActionCard({
  dashboard,
  onPress,
}: {
  dashboard: HomeDashboardData;
  onPress: () => void;
}) {
  const session = dashboard.primarySession;
  const nextLesson = dashboard.nextLesson;
  const answered = session ? Object.keys(session.answers).length : 0;
  const totalQuestions = dashboard.primarySessionQuestionCount ?? 20;
  const progress = session
    ? Math.min(100, Math.round((answered / Math.max(1, totalQuestions)) * 100))
    : dashboard.nextLessonTopic
      ? Math.round(
          ((dashboard.topicProgress.find(
            (topic) => topic.id === dashboard.nextLessonTopic?.id,
          )?.completed ?? 0) /
            Math.max(
              1,
              dashboard.topicProgress.find(
                (topic) => topic.id === dashboard.nextLessonTopic?.id,
              )?.total ?? 1,
            )) *
            100,
        )
      : 0;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.primaryCard, pressed && styles.buttonPressed]}
    >
      <View style={styles.primaryGlowLarge} />
      <View style={styles.primaryGlowSmall} />

      <View style={styles.primaryTopRow}>
        <View style={styles.primaryIcon}>
          <Ionicons
            name={session ? "bookmark" : nextLesson ? "play" : "timer"}
            size={23}
            color={Colors.primary}
          />
        </View>
        <View style={styles.primaryTimePill}>
          <Ionicons
            name={session ? "save-outline" : "time-outline"}
            size={13}
            color="#FFFFFF"
          />
          <Text style={styles.primaryTimeText}>
            {session ? `${answered} answered` : nextLesson ? "10–15 min" : "30 min"}
          </Text>
        </View>
      </View>

      <Text style={styles.primaryEyebrow}>
        {session
          ? "PICK UP WHERE YOU LEFT OFF"
          : nextLesson
            ? "YOUR NEXT BEST STEP"
            : "READY FOR EXAM PRACTICE"}
      </Text>
      <Text style={styles.primaryTitle}>
        {session
          ? dashboard.primarySessionTitle
          : nextLesson?.title ?? "Start a practice paper"}
      </Text>
      <Text style={styles.primarySubtitle}>
        {session
          ? `Question ${session.currentIndex + 1} · Your answers are saved`
          : dashboard.nextLessonTopic?.title ??
            "Use a timed or untimed set to keep improving"}
      </Text>

      <View style={styles.primaryProgressTrack}>
        <View style={[styles.primaryProgressFill, { width: `${progress}%` }]} />
      </View>

      <View style={styles.primaryActionRow}>
        <Text style={styles.primaryActionText}>
          {session ? "Resume paper" : nextLesson ? "Start lesson" : "Choose practice"}
        </Text>
        <View style={styles.primaryArrow}>
          <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
        </View>
      </View>
    </Pressable>
  );
}

function StreakCard({
  streak,
  activeWeekdays,
}: {
  streak: number;
  activeWeekdays: boolean[];
}) {
  return (
    <View style={styles.streakCard}>
      <View style={styles.streakHeader}>
        <View style={styles.streakIcon}>
          <Ionicons name="flame" size={22} color={Colors.primary} />
        </View>
        <View>
          <Text style={styles.statEyebrow}>STREAK</Text>
          <Text style={styles.streakValue}>
            {streak} <Text style={styles.streakUnit}>{streak === 1 ? "day" : "days"}</Text>
          </Text>
        </View>
      </View>
      <View style={styles.streakDays}>
        {DAY_LABELS.map((day, index) => (
          <View key={`${day}-${index}`} style={styles.streakDayColumn}>
            <View
              style={[
                styles.streakDayDot,
                activeWeekdays[index] && styles.streakDayDotActive,
              ]}
            />
            <Text style={styles.streakDayLabel}>{day}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function DailyGoalCard({
  minutes,
  progress,
  onPress,
}: {
  minutes: number;
  progress: number;
  onPress: () => void;
}) {
  const complete = progress >= 100;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.goalCard, pressed && styles.buttonPressed]}
    >
      <View style={styles.goalTopRow}>
        <Text style={styles.statEyebrow}>{"TODAY'S GOAL"}</Text>
        <Ionicons
          name={complete ? "checkmark-circle" : "arrow-forward-circle"}
          size={22}
          color={Colors.primary}
        />
      </View>
      <Text style={styles.goalValue}>{formatMinutes(minutes)}</Text>
      <Text style={styles.goalLabel}>of {DAILY_GOAL_MINUTES} focused minutes</Text>
      <View style={styles.goalProgressTrack}>
        <View style={[styles.goalProgressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.goalHint}>
        {complete ? "Daily goal complete" : `${Math.max(0, DAILY_GOAL_MINUTES - minutes)} min to go`}
      </Text>
    </Pressable>
  );
}

function SectionHeading({
  eyebrow,
  title,
  action,
  onPress,
}: {
  eyebrow: string;
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionHeadingText}>
        <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action && onPress ? (
        <Pressable onPress={onPress} hitSlop={10}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function CourseStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.courseStat}>
      <Text style={styles.courseStatValue}>{value}</Text>
      <Text style={styles.courseStatLabel}>{label}</Text>
    </View>
  );
}

function RecommendationCard({
  dashboard,
  onPress,
}: {
  dashboard: HomeDashboardData;
  onPress: () => void;
}) {
  const weakArea = dashboard.weakArea;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.recommendationCard,
        pressed && styles.buttonPressed,
      ]}
    >
      <View
        style={[
          styles.recommendationIcon,
          weakArea?.topic
            ? { backgroundColor: weakArea.topic.softColor }
            : undefined,
        ]}
      >
        <Ionicons
          name={weakArea ? "analytics-outline" : "sparkles-outline"}
          size={25}
          color={weakArea?.topic?.color ?? Colors.primary}
        />
      </View>

      <View style={styles.recommendationBody}>
        <Text style={styles.recommendationEyebrow}>
          {weakArea ? "BASED ON YOUR PRACTICE" : "PERSONALISED AFTER ONE SET"}
        </Text>
        <Text style={styles.recommendationTitle}>
          {weakArea ? `Strengthen ${weakArea.title}` : "Take the starter diagnostic"}
        </Text>
        <Text style={styles.recommendationText}>
          {weakArea
            ? weakArea.lesson
              ? `${weakArea.percentage}% so far · Next lesson: ${weakArea.lesson.title}`
              : `${weakArea.percentage}% so far · Use another practice set to improve`
            : "Ten mixed questions will reveal the topics that deserve your attention first."}
        </Text>
      </View>

      <View style={styles.recommendationArrow}>
        <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
      </View>
    </Pressable>
  );
}

function LatestResultCard({
  dashboard,
  onPress,
}: {
  dashboard: HomeDashboardData;
  onPress: () => void;
}) {
  const result = dashboard.latestResult;
  if (!result) return null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.resultCard, pressed && styles.buttonPressed]}
    >
      <View style={styles.resultHeading}>
        <View>
          <Text style={styles.resultEyebrow}>LATEST PRACTICE</Text>
          <Text style={styles.resultTitle}>Review your last attempt</Text>
        </View>
        <View style={styles.resultScorePill}>
          <Text style={styles.resultScore}>{resultPercentage(result)}%</Text>
        </View>
      </View>

      <View style={styles.resultStats}>
        <ResultStat
          label="Score"
          value={`${result.score}/${result.maxScore}`}
        />
        <View style={styles.resultDivider} />
        <ResultStat
          label="Personal best"
          value={`${dashboard.bestPracticePercent ?? 0}%`}
        />
        <View style={styles.resultDivider} />
        <ResultStat
          label="Questions done"
          value={`${dashboard.totalPracticeQuestions}`}
        />
      </View>

      <View style={styles.resultAction}>
        <Text style={styles.resultActionText}>See answers and explanations</Text>
        <Ionicons name="arrow-forward" size={17} color={Colors.primary} />
      </View>
    </Pressable>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.resultStat}>
      <Text style={styles.resultStatValue}>{value}</Text>
      <Text style={styles.resultStatLabel}>{label}</Text>
    </View>
  );
}

function MomentumCard({ dashboard }: { dashboard: HomeDashboardData }) {
  const peak = Math.max(...dashboard.dailyMinutes, DAILY_GOAL_MINUTES);

  return (
    <View style={styles.momentumCard}>
      <View style={styles.momentumHeader}>
        <View>
          <Text style={styles.momentumValue}>
            {formatMinutes(dashboard.weeklyMinutes)}
          </Text>
          <Text style={styles.momentumLabel}>focused this week</Text>
        </View>
        <View style={styles.momentumPill}>
          <Text style={styles.momentumPillText}>
            {dashboard.weeklySessions} {dashboard.weeklySessions === 1 ? "session" : "sessions"}
          </Text>
        </View>
      </View>

      <View style={styles.chart}>
        {dashboard.dailyMinutes.map((minutes, index) => {
          const height = Math.max(7, Math.round((minutes / peak) * 100));
          return (
            <View key={`${DAY_LABELS[index]}-${index}`} style={styles.chartColumn}>
              <View style={styles.chartTrack}>
                <View
                  style={[
                    styles.chartBar,
                    minutes > 0 && styles.chartBarActive,
                    { height: `${height}%` },
                  ]}
                />
              </View>
              <Text style={styles.chartLabel}>{DAY_LABELS[index]}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.momentumFooter}>
        <Text style={styles.momentumFooterText}>
          Weekly goal · {WEEKLY_GOAL_MINUTES} min
        </Text>
        <Text style={styles.momentumFooterStrong}>
          {Math.min(100, Math.round((dashboard.weeklyMinutes / WEEKLY_GOAL_MINUTES) * 100))}%
        </Text>
      </View>
    </View>
  );
}

function QuickAction({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.quickAction, pressed && styles.buttonPressed]}
    >
      <View style={styles.quickActionIcon}>
        <Ionicons name={icon} size={21} color={Colors.primary} />
      </View>
      <Text style={styles.quickActionTitle}>{title}</Text>
      <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 138,
  },
  loadingState: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 13,
    color: Colors.muted,
    fontSize: 14,
    fontWeight: "800",
  },
  errorIcon: {
    width: 58,
    height: 58,
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: "#FFF0D3",
    justifyContent: "center",
    alignItems: "center",
  },
  errorTitle: {
    color: Colors.ink,
    fontSize: 21,
    fontWeight: "900",
    textAlign: "center",
  },
  errorText: {
    maxWidth: 310,
    marginTop: 8,
    color: Colors.muted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
    textAlign: "center",
  },
  retryButton: {
    minHeight: 48,
    marginTop: 18,
    paddingHorizontal: 25,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: "center",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  header: {
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  greeting: {
    marginTop: 4,
    color: Colors.ink,
    fontSize: 29,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: -1,
  },
  headerSubtext: {
    maxWidth: 290,
    marginTop: 4,
    color: Colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  avatar: {
    width: 51,
    height: 51,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: "#FFE9C7",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 5,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  buttonPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.96,
  },
  primaryCard: {
    minHeight: 282,
    padding: 22,
    overflow: "hidden",
    borderRadius: 30,
    backgroundColor: Colors.primary,
    ...Shadow.streak,
  },
  primaryGlowLarge: {
    position: "absolute",
    top: -105,
    right: -70,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(255, 205, 124, 0.31)",
  },
  primaryGlowSmall: {
    position: "absolute",
    bottom: -70,
    left: -30,
    width: 145,
    height: 145,
    borderRadius: 73,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  primaryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  primaryIcon: {
    width: 49,
    height: 49,
    borderRadius: 17,
    backgroundColor: "#FFF4DE",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryTimePill: {
    minHeight: 31,
    paddingHorizontal: 11,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  primaryTimeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },
  primaryEyebrow: {
    marginTop: 20,
    color: "#FFE6C0",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  primaryTitle: {
    maxWidth: 330,
    marginTop: 5,
    color: "#FFFFFF",
    fontSize: 26,
    lineHeight: 31,
    fontWeight: "900",
    letterSpacing: -0.7,
  },
  primarySubtitle: {
    marginTop: 6,
    color: "rgba(255,255,255,0.84)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  primaryProgressTrack: {
    height: 7,
    marginTop: 18,
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  primaryProgressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  primaryActionRow: {
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  primaryArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  habitRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 12,
  },
  streakCard: {
    flex: 1,
    minHeight: 157,
    padding: 15,
    borderRadius: 24,
    backgroundColor: "#FFF0D3",
    borderWidth: 1,
    borderColor: "#F6D9A9",
  },
  streakHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  streakIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  statEyebrow: {
    color: Colors.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  streakValue: {
    marginTop: 1,
    color: Colors.ink,
    fontSize: 21,
    fontWeight: "900",
  },
  streakUnit: {
    fontSize: 11,
    color: Colors.muted,
  },
  streakDays: {
    marginTop: 19,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  streakDayColumn: {
    alignItems: "center",
    gap: 5,
  },
  streakDayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E8D9C3",
  },
  streakDayDotActive: {
    backgroundColor: Colors.primary,
  },
  streakDayLabel: {
    color: Colors.muted,
    fontSize: 8,
    fontWeight: "900",
  },
  goalCard: {
    flex: 1,
    minHeight: 157,
    padding: 15,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    ...Shadow.card,
  },
  goalTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  goalValue: {
    marginTop: 13,
    color: Colors.ink,
    fontSize: 23,
    fontWeight: "900",
  },
  goalLabel: {
    marginTop: 1,
    color: Colors.muted,
    fontSize: 10,
    fontWeight: "700",
  },
  goalProgressTrack: {
    height: 7,
    marginTop: 13,
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: "#F2E8D8",
  },
  goalProgressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  goalHint: {
    marginTop: 8,
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "900",
  },
  sectionHeading: {
    marginTop: 31,
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionHeadingText: {
    flex: 1,
  },
  sectionEyebrow: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.25,
  },
  sectionTitle: {
    marginTop: 3,
    color: Colors.ink,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  sectionAction: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "900",
  },
  courseCard: {
    padding: 20,
    borderRadius: 27,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    ...Shadow.card,
  },
  courseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  courseNumber: {
    color: Colors.ink,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    letterSpacing: -1,
  },
  courseLabel: {
    color: Colors.muted,
    fontSize: 11,
    fontWeight: "800",
  },
  courseCountPill: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "#FFF0D3",
  },
  courseCountText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "900",
  },
  largeProgressTrack: {
    height: 10,
    marginTop: 19,
    overflow: "hidden",
    borderRadius: 5,
    backgroundColor: "#F2E8D8",
  },
  largeProgressFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  topicDots: {
    height: 37,
    marginTop: 16,
    flexDirection: "row",
    gap: 7,
  },
  topicDotColumn: {
    flex: 1,
  },
  topicDotTrack: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 5,
    justifyContent: "flex-end",
  },
  topicDotFill: {
    width: "100%",
    minHeight: 3,
    borderRadius: 5,
  },
  courseFooter: {
    minHeight: 52,
    marginTop: 17,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    flexDirection: "row",
    alignItems: "center",
  },
  courseStat: {
    flex: 1,
  },
  courseStatValue: {
    color: Colors.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  courseStatLabel: {
    marginTop: 1,
    color: Colors.muted,
    fontSize: 9,
    fontWeight: "800",
  },
  courseDivider: {
    width: 1,
    height: 31,
    marginHorizontal: 13,
    backgroundColor: Colors.line,
  },
  courseArrow: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: "#FFF0D3",
    justifyContent: "center",
    alignItems: "center",
  },
  recommendationCard: {
    padding: 17,
    borderRadius: 25,
    backgroundColor: "#2D2824",
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  recommendationIcon: {
    width: 49,
    height: 49,
    borderRadius: 17,
    backgroundColor: "#FFF0D3",
    justifyContent: "center",
    alignItems: "center",
  },
  recommendationBody: {
    flex: 1,
  },
  recommendationEyebrow: {
    color: "#FFD68C",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.9,
  },
  recommendationTitle: {
    marginTop: 3,
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "900",
  },
  recommendationText: {
    marginTop: 4,
    color: "rgba(255,255,255,0.66)",
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "700",
  },
  recommendationArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  resultCard: {
    marginTop: 13,
    padding: 18,
    borderRadius: 25,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    ...Shadow.card,
  },
  resultHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  resultEyebrow: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  resultTitle: {
    marginTop: 3,
    color: Colors.ink,
    fontSize: 17,
    fontWeight: "900",
  },
  resultScorePill: {
    minWidth: 58,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: "#FFF0D3",
    alignItems: "center",
  },
  resultScore: {
    color: Colors.primary,
    fontSize: 17,
    fontWeight: "900",
  },
  resultStats: {
    marginTop: 19,
    flexDirection: "row",
    alignItems: "center",
  },
  resultStat: {
    flex: 1,
    alignItems: "center",
  },
  resultStatValue: {
    color: Colors.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  resultStatLabel: {
    marginTop: 2,
    color: Colors.muted,
    fontSize: 8,
    fontWeight: "800",
    textAlign: "center",
  },
  resultDivider: {
    width: 1,
    height: 31,
    backgroundColor: Colors.line,
  },
  resultAction: {
    marginTop: 17,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultActionText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "900",
  },
  momentumCard: {
    padding: 19,
    borderRadius: 27,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    ...Shadow.card,
  },
  momentumHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  momentumValue: {
    color: Colors.ink,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  momentumLabel: {
    marginTop: 1,
    color: Colors.muted,
    fontSize: 10,
    fontWeight: "800",
  },
  momentumPill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 13,
    backgroundColor: "#FFF0D3",
  },
  momentumPillText: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: "900",
  },
  chart: {
    height: 112,
    marginTop: 20,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  chartColumn: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    gap: 7,
  },
  chartTrack: {
    flex: 1,
    width: "100%",
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: "#F3ECE2",
    justifyContent: "flex-end",
  },
  chartBar: {
    width: "100%",
    minHeight: 5,
    borderRadius: 8,
    backgroundColor: "#E2D6C7",
  },
  chartBarActive: {
    backgroundColor: Colors.primary,
  },
  chartLabel: {
    color: Colors.muted,
    fontSize: 9,
    fontWeight: "900",
  },
  momentumFooter: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  momentumFooterText: {
    color: Colors.muted,
    fontSize: 10,
    fontWeight: "800",
  },
  momentumFooterStrong: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "900",
  },
  quickActions: {
    marginTop: 14,
    flexDirection: "row",
    gap: 12,
  },
  quickAction: {
    flex: 1,
    minHeight: 132,
    padding: 16,
    borderRadius: 23,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    marginBottom: 13,
    borderRadius: 14,
    backgroundColor: "#FFF0D3",
    justifyContent: "center",
    alignItems: "center",
  },
  quickActionTitle: {
    color: Colors.ink,
    fontSize: 14,
    fontWeight: "900",
  },
  quickActionSubtitle: {
    marginTop: 3,
    color: Colors.muted,
    fontSize: 10,
    fontWeight: "700",
  },
  targetNote: {
    minHeight: 52,
    marginTop: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#FFF0D3",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  targetNoteText: {
    flex: 1,
    color: Colors.ink,
    fontSize: 11,
    fontWeight: "800",
  },
});
