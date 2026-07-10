import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import leaderboardData from "../data/leaderboard.json";
import { Colors } from "../constants/theme";

interface LeaderboardUser {
  name: string;
  targetUni: string;
  weeklyScore: string;
}

type SortKey = keyof LeaderboardUser;
type SortDirection = "ascending" | "descending";

const USERS = leaderboardData.users as LeaderboardUser[];

export default function LeaderboardScreen() {
  const [sortKey, setSortKey] = useState<SortKey>("weeklyScore");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("descending");

  const users = useMemo(() => {
    return [...USERS].sort((a, b) => {
      const comparison =
        sortKey === "weeklyScore"
          ? Number(a.weeklyScore) - Number(b.weeklyScore)
          : a[sortKey].localeCompare(b[sortKey]);

      return sortDirection === "ascending" ? comparison : -comparison;
    });
  }, [sortDirection, sortKey]);

  function updateSort(nextKey: SortKey) {
    if (nextKey === sortKey) {
      setSortDirection((current) =>
        current === "ascending" ? "descending" : "ascending",
      );
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === "weeklyScore" ? "descending" : "ascending");
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>THIS WEEK</Text>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>
          See how this week&apos;s TMUA practice scores compare.
        </Text>

        <View style={styles.table}>
          <View style={styles.headerRow}>
            <SortHeader
              label="Name"
              sortKey="name"
              activeKey={sortKey}
              direction={sortDirection}
              style={styles.nameCell}
              onPress={updateSort}
            />
            <SortHeader
              label="Target uni"
              sortKey="targetUni"
              activeKey={sortKey}
              direction={sortDirection}
              style={styles.universityCell}
              onPress={updateSort}
            />
            <SortHeader
              label="Score"
              sortKey="weeklyScore"
              activeKey={sortKey}
              direction={sortDirection}
              style={styles.scoreCell}
              onPress={updateSort}
              alignRight
            />
          </View>

          {users.map((user, index) => (
            <View
              key={`${user.name}-${user.weeklyScore}`}
              style={[
                styles.row,
                index % 2 === 1 && styles.alternateRow,
                index === users.length - 1 && styles.lastRow,
              ]}
            >
              <View style={[styles.nameCell, styles.nameContent]}>
                <View
                  style={[
                    styles.rank,
                    index < 3 && styles.topRank,
                    index === 0 && styles.firstRank,
                  ]}
                >
                  {index === 0 ? (
                    <Ionicons name="trophy" size={14} color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.rankText,
                        index < 3 && styles.topRankText,
                      ]}
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>
                <Text style={styles.name} numberOfLines={2}>
                  {user.name}
                </Text>
              </View>

              <Text
                style={[styles.cellText, styles.universityCell]}
                numberOfLines={2}
              >
                {user.targetUni}
              </Text>

              <Text style={[styles.score, styles.scoreCell]}>
                {Number(user.weeklyScore).toLocaleString("en-GB")}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="sparkles-outline" size={20} color={Colors.primary} />
          <Text style={styles.noteText}>
            Scores reflect practice completed during the current week.
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

interface SortHeaderProps {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  direction: SortDirection;
  style: object;
  alignRight?: boolean;
  onPress: (key: SortKey) => void;
}

function SortHeader({
  label,
  sortKey,
  activeKey,
  direction,
  style,
  alignRight,
  onPress,
}: SortHeaderProps) {
  const isActive = sortKey === activeKey;

  return (
    <TouchableOpacity
      style={[styles.headerCell, style, alignRight && styles.rightHeader]}
      onPress={() => onPress(sortKey)}
      activeOpacity={0.65}
      accessibilityRole="button"
      accessibilityLabel={`Sort by ${label}`}
    >
      <Text style={[styles.headerText, isActive && styles.activeHeaderText]}>
        {label}
      </Text>
      {isActive && (
        <Ionicons
          name={direction === "ascending" ? "chevron-up" : "chevron-down"}
          size={12}
          color={Colors.primary}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.cream },
  container: { paddingHorizontal: 16, paddingTop: 18 },
  eyebrow: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.3,
    textAlign: "center",
  },
  title: {
    marginTop: 4,
    color: Colors.ink,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 7,
    marginBottom: 24,
    color: Colors.muted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    textAlign: "center",
  },
  table: {
    overflow: "hidden",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 18,
    shadowColor: "#6F4619",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  headerRow: {
    minHeight: 52,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9EC",
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  headerCell: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  rightHeader: { justifyContent: "flex-end" },
  headerText: {
    color: Colors.muted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  activeHeaderText: { color: Colors.primary },
  row: {
    minHeight: 64,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  alternateRow: { backgroundColor: "#FFFAF0" },
  lastRow: { borderBottomWidth: 0 },
  nameCell: { flex: 1.45 },
  universityCell: { flex: 0.95 },
  scoreCell: { flex: 0.65, textAlign: "right" },
  nameContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  rank: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: "#F1E6D6",
    justifyContent: "center",
    alignItems: "center",
  },
  topRank: { backgroundColor: "#FFE2A8" },
  firstRank: { backgroundColor: Colors.primary },
  rankText: { color: Colors.muted, fontSize: 11, fontWeight: "900" },
  topRankText: { color: "#A86A10" },
  name: { flex: 1, color: Colors.ink, fontSize: 12, fontWeight: "900" },
  cellText: { color: Colors.muted, fontSize: 11, fontWeight: "700" },
  score: { color: Colors.primary, fontSize: 12, fontWeight: "900" },
  noteCard: {
    marginTop: 18,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFF6DF",
    borderWidth: 1,
    borderColor: "#F2DEB6",
    borderRadius: 18,
  },
  noteText: {
    flex: 1,
    color: "#8D735F",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  bottomSpacing: { height: 110 },
});
