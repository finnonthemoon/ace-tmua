/**
 * Home screen — mirrors <section id="home"> from index.html exactly.
 *
 * Cards in order:
 *  1. .home__header          — eyebrow + greeting + avatar
 *  2. .streak-card           — fire icon, streak number, day pills
 *  3. .today-card            — today's practice + progress bar + CTA
 *  4. .home__next-card       — continue learning
 *  5. .home-insight-card--week   — weekly momentum bar chart
 *  6. .home-insight-card--forecast — dark trajectory card + SVG line
 */

import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Line,
  Path,
  Circle,
  Text as SvgText,
} from "react-native-svg";
import { Colors, Radius, Shadow } from "../constants/theme";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// ─── Hardcoded seed data (mirrors localTestStorage.json / userData defaults) ──

const USER = {
  name: "Tony Prescott",
  targetUni: "Manchester",
  targetScore: 85,
  streak: 4,
};

const STUDY_DATA = {
  weeklyMinutes: 42,
  weeklyGoalMinutes: 90,
  weeklySessions: 3,
  targetSessions: 5,
  // Minutes per day Mon–Sun
  dailyMinutes: [12, 18, 0, 12, 0, 0, 0],
};

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
// Which days have the streak dot active (mirrors the HTML's .streak-day.active)
const STREAK_ACTIVE = [true, true, true, true, true, true, false];

// ─── Sub-components ───────────────────────────────────────────────────────────

/** .home__header */
function HomeHeader() {
  const firstName = USER.name.split(" ")[0];
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        {/* <p class="home__eyebrow">ACE TMUA</p> */}
        <Text style={styles.eyebrow}>ACE TMUA</Text>
        {/* <h1 id="home-greeting"> */}
        <Text style={styles.greeting}>
          {getGreeting()}, {firstName}!
        </Text>
        {/* <p class="home__subtext"> */}
        <Text style={styles.subtext}>
          A little practice today goes a long way!
        </Text>
      </View>
      {/* <div class="home__avatar"> — gradient circle with initials */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(USER.name)}</Text>
      </View>
    </View>
  );
}

/** .streak-card — orange gradient card with fire icon + day pills */
function StreakCard() {
  return (
    <View style={styles.streakCard}>
      {/* .streak-card__icon */}
      <View style={styles.streakIcon}>
        <Ionicons name="flame" size={29} color={Colors.primary} />
      </View>

      {/* .streak-card__content */}
      <View style={styles.streakContent}>
        <Text style={styles.streakLabel}>Current streak</Text>
        <Text style={styles.streakNumber}>
          {USER.streak} <Text style={styles.streakUnit}>days</Text>
        </Text>
        <Text style={styles.streakMessage}>
          Keep it going — practise today!
        </Text>
      </View>

      {/* .streak-card__days — seven day pills */}
      <View style={styles.streakDays}>
        {DAY_LABELS.map((day, i) => (
          <View
            key={i}
            style={[
              styles.streakDay,
              STREAK_ACTIVE[i] && styles.streakDayActive,
            ]}
          >
            <Text
              style={[
                styles.streakDayText,
                STREAK_ACTIVE[i] && styles.streakDayTextActive,
              ]}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** .today-card — today's practice with progress bar */
function TodayCard({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.todayCard}>
      {/* .today-card__top */}
      <View style={styles.todayTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>{"TODAY'S PRACTICE"}</Text>
          <Text style={styles.todayTitle}>Quadratics: mixed practice</Text>
        </View>
        {/* .today-card__time */}
        <View style={styles.todayTimeBadge}>
          <Ionicons name="time-outline" size={13} color={Colors.primary} />
          <Text style={styles.todayTimeText}>12 min</Text>
        </View>
      </View>

      {/* .today-card__progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>Daily goal</Text>
          <Text style={styles.progressLabel}>0 / 10 questions</Text>
        </View>
        <View style={styles.progressTrack}>
          {/* width: '0%' = no progress yet */}
          <View style={[styles.progressFill, { width: "0%" }]} />
        </View>
      </View>

      {/* <a class="today-card__button"> */}
      <TouchableOpacity
        style={styles.todayButton}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Text style={styles.todayButtonText}>Start practice</Text>
        <Ionicons name="arrow-forward" size={16} color="white" />
      </TouchableOpacity>
    </View>
  );
}

/** .home__next-card — continue learning */
function ContinueCard({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.nextCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.eyebrow}>CONTINUE LEARNING</Text>
        <Text style={styles.nextTitle}>Algebra and Functions</Text>
        <Text style={styles.nextSub}>Next up: Quadratics and Inequalities</Text>
      </View>
      {/* <a class="home__continue-button"> */}
      <TouchableOpacity
        style={styles.continueButton}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
        <Ionicons name="arrow-forward" size={14} color="white" />
      </TouchableOpacity>
    </View>
  );
}

/** .home-insight-card--week — bar chart of daily minutes */
function MomentumCard() {
  const {
    dailyMinutes,
    weeklyMinutes,
    weeklyGoalMinutes,
    weeklySessions,
    targetSessions,
  } = STUDY_DATA;
  const peak = Math.max(...dailyMinutes, 20);

  return (
    <View style={styles.insightCard}>
      {/* heading row */}
      <View style={styles.insightHeading}>
        <View>
          <Text style={styles.eyebrow}>THIS WEEK</Text>
          <Text style={styles.insightTitle}>Your momentum</Text>
        </View>
        {/* .home-insight-card__badge */}
        <View style={styles.insightBadge}>
          <Ionicons name="time-outline" size={12} color="#ef7b37" />
          <Text style={styles.insightBadgeText}>{weeklyMinutes} min</Text>
        </View>
      </View>

      {/* .weekly-chart — 7 bars */}
      <View style={styles.weeklyChart}>
        {dailyMinutes.map((mins, i) => {
          const heightPct = Math.max(10, Math.round((mins / peak) * 100));
          const isActive = mins > 0;
          return (
            <View key={i} style={styles.chartDay}>
              <View style={styles.chartBarWrap}>
                <View
                  style={[
                    styles.chartBar,
                    isActive && styles.chartBarActive,
                    { height: `${heightPct}%` as any },
                  ]}
                />
              </View>
              <Text style={styles.chartDayLabel}>{DAY_LABELS[i]}</Text>
            </View>
          );
        })}
      </View>

      {/* .home-insight-card__footer */}
      <View style={styles.insightFooter}>
        <Text style={styles.insightFooterText}>
          <Text style={styles.insightFooterBold}>
            {weeklySessions} / {targetSessions}
          </Text>
          {" sessions"}
        </Text>
        <Text style={styles.insightFooterText}>
          {"Goal: "}
          <Text style={styles.insightFooterBold}>{weeklyGoalMinutes}</Text>
          {" min"}
        </Text>
      </View>
    </View>
  );
}

/**
 * .home-insight-card--forecast — dark card with SVG trajectory line.
 * The SVG path is taken directly from the HTML.
 */
function ForecastCard() {
  const projectedSessions = Math.round(STUDY_DATA.weeklySessions * 12); // ~12 weeks
  const message =
    STUDY_DATA.weeklySessions >= 4
      ? `At this pace, you could complete around ${projectedSessions} more study sessions before TMUA.`
      : `Add one more session this week to build a stronger run-up to TMUA.`;

  return (
    <View style={styles.forecastCard}>
      {/* heading */}
      <View style={styles.insightHeading}>
        <View>
          <Text style={styles.forecastEyebrow}>YOUR TRAJECTORY</Text>
          <Text style={styles.forecastTitle}>Keep this pace</Text>
        </View>
        <View style={styles.forecastIcon}>
          <Ionicons name="trending-up-outline" size={18} color="#2f2925" />
        </View>
      </View>

      {/* forecast message */}
      <Text style={styles.forecastMessage}>{message}</Text>

      {/* SVG chart — same path data as the HTML */}
      <View style={styles.forecastChartWrap}>
        <View style={styles.forecastChartLabels}>
          <Text style={styles.forecastChartLabel}>Now</Text>
          <Text style={styles.forecastChartLabel}>TMUA</Text>
        </View>

        <Svg width="100%" height={115} viewBox="0 0 300 115">
          <Defs>
            <LinearGradient id="grad" x1="0" x2="1" y1="0" y2="0">
              <Stop offset="0%" stopColor="#f6a44d" />
              <Stop offset="100%" stopColor="#ffd783" />
            </LinearGradient>
          </Defs>

          {/* Grid lines */}
          <Line
            x1="12"
            y1="88"
            x2="288"
            y2="88"
            stroke="rgba(255,255,255,0.13)"
            strokeWidth="1"
            strokeDasharray="3,4"
          />
          <Line
            x1="12"
            y1="58"
            x2="288"
            y2="58"
            stroke="rgba(255,255,255,0.13)"
            strokeWidth="1"
            strokeDasharray="3,4"
          />
          <Line
            x1="12"
            y1="28"
            x2="288"
            y2="28"
            stroke="rgba(255,255,255,0.13)"
            strokeWidth="1"
            strokeDasharray="3,4"
          />

          {/* Area fill */}
          <Path
            d="M 14 92 C 62 88, 82 78, 112 73 S 170 57, 204 43 S 255 25, 286 16 L 286 102 L 14 102 Z"
            fill="rgba(246,164,77,0.16)"
          />

          {/* Line */}
          <Path
            d="M 14 92 C 62 88, 82 78, 112 73 S 170 57, 204 43 S 255 25, 286 16"
            fill="none"
            stroke="url(#grad)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dots */}
          <Circle
            cx="14"
            cy="92"
            r="5"
            fill="#f6a44d"
            stroke="#2f2925"
            strokeWidth="3"
          />
          <Circle
            cx="286"
            cy="16"
            r="5"
            fill="#ffd783"
            stroke="#2f2925"
            strokeWidth="3"
          />

          {/* Labels */}
          <SvgText
            x="14"
            y="112"
            fill="rgba(255,255,255,0.58)"
            fontSize="10"
            fontWeight="800"
          >
            Today
          </SvgText>
          <SvgText
            x="286"
            y="112"
            fill="rgba(255,255,255,0.58)"
            fontSize="10"
            fontWeight="800"
            textAnchor="end"
          >
            Exam
          </SvgText>
        </Svg>

        {/* Milestone labels below SVG */}
        <View style={styles.forecastMilestones}>
          <Text style={styles.forecastMilestone}>Foundations</Text>
          <Text style={styles.forecastMilestone}>Mixed practice</Text>
          <Text style={styles.forecastMilestone}>Exam-ready</Text>
        </View>
      </View>

      {/* summary row */}
      <View style={styles.forecastSummary}>
        <View style={styles.forecastSummaryLeft}>
          <Text style={styles.forecastBigNum}>{projectedSessions}</Text>
          <Text style={styles.forecastSummaryLabel}>
            possible sessions{"\n"}before TMUA
          </Text>
        </View>
        <Text style={styles.forecastSummaryRight}>
          Build your first{"\n"}learning streak
        </Text>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader />
        <StreakCard />
        <TodayCard onPress={() => router.push("/questions")} />
        <ContinueCard onPress={() => router.push("/learn")} />
        <MomentumCard />
        <ForecastCard />
        {/* Padding so content clears the floating tab bar */}
        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    // Cream background + the radial gradient is approximated — React Native
    // doesn't support CSS radial-gradient on View. For the glow effect you
    // can add expo-linear-gradient later. Plain cream looks clean for now.
    backgroundColor: Colors.cream,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // ── .home__header ──────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
    marginTop: 8,
    gap: 12,
  },
  headerText: { flex: 1 },
  eyebrow: {
    // .home__eyebrow
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  greeting: {
    // .home__header h1
    color: Colors.ink,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
    marginBottom: 4,
    lineHeight: 32,
  },
  subtext: {
    // .home__subtext
    color: Colors.muted,
    fontSize: 14,
    fontWeight: "600",
  },
  avatar: {
    // .home__avatar — gradient circle
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary, // gradient approximated
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff4dc",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 5,
  },
  avatarText: {
    color: "white",
    fontWeight: "900",
    fontSize: 15,
  },

  // ── .streak-card ───────────────────────────────────────────────────────────
  streakCard: {
    // background: linear-gradient(135deg, #ff8b3d, #ff671f)
    backgroundColor: "#ff7d2e",
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 12,
    ...Shadow.streak,
  },
  streakIcon: {
    // .streak-card__icon
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#fff2d5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  streakContent: { marginBottom: 12 },
  streakLabel: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  streakNumber: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34,
  },
  streakUnit: { fontSize: 14, fontWeight: "700" },
  streakMessage: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 12,
    fontWeight: "700",
  },
  streakDays: {
    // .streak-card__days
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  streakDay: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.36)",
    justifyContent: "center",
    alignItems: "center",
  },
  streakDayActive: {
    backgroundColor: "white",
    borderColor: "white",
  },
  streakDayText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    fontWeight: "900",
  },
  streakDayTextActive: { color: Colors.primary },

  // ── .today-card ────────────────────────────────────────────────────────────
  todayCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.line,
    ...Shadow.card,
  },
  todayTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  todayTitle: {
    color: Colors.ink,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 4,
    lineHeight: 22,
  },
  todayTimeBadge: {
    // .today-card__time
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff2dc",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  todayTimeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  progressSection: { marginBottom: 14 },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  progressTrack: {
    // .today-card__bar
    height: 9,
    backgroundColor: "#f5ead8",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 999,
  },
  todayButton: {
    // .today-card__button
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  todayButtonText: {
    color: "white",
    fontWeight: "900",
    fontSize: 15,
  },

  // ── .home__next-card ───────────────────────────────────────────────────────
  nextCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.line,
    ...Shadow.card,
  },
  nextTitle: {
    color: Colors.ink,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 4,
    marginBottom: 4,
  },
  nextSub: {
    color: Colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  continueButton: {
    // .home__continue-button
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  continueButtonText: {
    color: "white",
    fontWeight: "900",
    fontSize: 13,
  },

  // ── .home-insight-card (shared white card base) ────────────────────────────
  insightCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f0dfc9",
    shadowColor: "#4a2f19",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 4,
    overflow: "hidden",
  },
  insightHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 4,
  },
  insightTitle: {
    color: "#24211f",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 22,
    marginTop: 3,
  },
  insightBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff1e5",
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  insightBadgeText: {
    color: "#ef7b37",
    fontSize: 11,
    fontWeight: "900",
  },

  // ── .weekly-chart ──────────────────────────────────────────────────────────
  weeklyChart: {
    flexDirection: "row",
    height: 110,
    marginVertical: 16,
    gap: 7,
    alignItems: "flex-end",
  },
  chartDay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    height: "100%",
  },
  chartBarWrap: {
    // .weekly-chart__bar-wrap
    width: "100%",
    flex: 1,
    backgroundColor: "#f5eee7",
    borderRadius: 999,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  chartBar: {
    // .weekly-chart__bar
    width: "100%",
    minHeight: 8,
    backgroundColor: "#e7dcd2",
    borderRadius: 999,
  },
  chartBarActive: {
    backgroundColor: "#ef7b37",
  },
  chartDayLabel: {
    color: "#8f8176",
    fontSize: 10,
    fontWeight: "900",
  },
  insightFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0dfc9",
  },
  insightFooterText: {
    color: "#8f8176",
    fontSize: 11,
    fontWeight: "800",
  },
  insightFooterBold: {
    color: "#24211f",
    fontWeight: "900",
  },

  // ── .home-insight-card--forecast (dark card) ───────────────────────────────
  forecastCard: {
    backgroundColor: "#2f2925",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2f2925",
    overflow: "hidden",
  },
  forecastEyebrow: {
    color: "#ffd783",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  forecastTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 22,
    marginTop: 3,
  },
  forecastIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "#ffd783",
    justifyContent: "center",
    alignItems: "center",
  },
  forecastMessage: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginVertical: 14,
  },
  forecastChartWrap: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    padding: 12,
  },
  forecastChartLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  forecastChartLabel: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 10,
    fontWeight: "800",
  },
  forecastMilestones: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  forecastMilestone: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 8,
    fontWeight: "800",
  },
  forecastSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 14,
    gap: 12,
  },
  forecastSummaryLeft: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
  },
  forecastBigNum: {
    color: "#ffd783",
    fontSize: 26,
    fontWeight: "900",
  },
  forecastSummaryLabel: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 14,
  },
  forecastSummaryRight: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 14,
    textAlign: "right",
    maxWidth: 110,
  },
});
