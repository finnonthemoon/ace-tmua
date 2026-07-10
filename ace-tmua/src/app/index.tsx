import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/theme";

export default function HomeScreen() {
  // Dummy data (We will replace this with your UserData context later)
  const user = {
    name: "Tony Prescott",
    initials: "TP",
    targetUni: "Manchester",
    targetScore: 85,
    streak: 4,
  };

  // Basic date math for the countdown
  const examDate = new Date("2026-10-15T09:00:00");
  const daysLeft = Math.max(
    0,
    Math.ceil(
      (examDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
    ),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ScrollView allows the user to scroll if the content exceeds the screen height */}
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER SECTION */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.initials}</Text>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>Hi, {user.name.split(" ")[0]}</Text>
            <Text style={styles.subGreeting}>
              Target: {user.targetUni} • Goal {user.targetScore}%
            </Text>
          </View>
        </View>

        {/* COUNTDOWN CARD */}
        <View style={[styles.card, styles.highlightCard]}>
          <View style={styles.cardHeaderRow}>
            <Ionicons
              name="calendar-outline"
              size={24}
              color={Colors.primary}
            />
            <Text style={styles.cardTitle}>TMUA Exam</Text>
          </View>
          <View style={styles.countdownRow}>
            <Text style={styles.countdownNumber}>{daysLeft}</Text>
            <Text style={styles.countdownLabel}>days left</Text>
          </View>
          <Text style={styles.examDateText}>15 October 2026</Text>
        </View>

        {/* MOMENTUM STATS */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <View style={styles.statIconWrapper}>
              <Ionicons name="flame-outline" size={20} color={Colors.primary} />
              <Text style={styles.statBoxLabel}>Streak</Text>
            </View>
            <Text style={styles.statBoxValue}>{user.streak} wks</Text>
          </View>

          <View style={styles.statBox}>
            <View style={styles.statIconWrapper}>
              <Ionicons name="flag-outline" size={20} color={Colors.primary} />
              <Text style={styles.statBoxLabel}>Target</Text>
            </View>
            <Text style={styles.statBoxValue}>{user.targetScore}%</Text>
          </View>
        </View>

        {/* STUDY PROGRESS (Fake bar chart for now) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Weekly Study</Text>
          <Text style={styles.studySubtext}>42 / 90 minutes completed</Text>

          <View style={styles.progressBarBackground}>
            {/* The width here controls the fill! */}
            <View style={[styles.progressBarFill, { width: "46%" }]} />
          </View>
        </View>

        {/* Add padding at bottom so the floating tab bar doesn't cover content */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  headerTextContainer: {
    marginLeft: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.ink,
  },
  subGreeting: {
    fontSize: 14,
    color: Colors.muted,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  highlightCard: {
    borderColor: Colors.line,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.ink,
    marginLeft: 8,
  },
  countdownRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  countdownNumber: {
    fontSize: 48,
    fontWeight: "900",
    color: Colors.primary,
  },
  countdownLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.muted,
    marginLeft: 8,
  },
  examDateText: {
    fontSize: 14,
    color: Colors.muted,
    marginTop: 8,
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statBox: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    width: "47%",
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  statIconWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statBoxLabel: {
    fontSize: 14,
    color: Colors.muted,
    marginLeft: 6,
    fontWeight: "600",
  },
  statBoxValue: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.ink,
  },
  studySubtext: {
    fontSize: 14,
    color: Colors.muted,
    marginBottom: 16,
    marginTop: 4,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: Colors.cream,
    borderRadius: 6,
    width: "100%",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 6,
  },
});
