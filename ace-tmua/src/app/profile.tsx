import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import localTestStorage from "../data/localTestStorage.json";
import { Colors } from "../constants/theme";

interface UserProfile {
  userID: string;
  name: string;
  targetUni: string;
  targetScore: number;
  avatarUrl: string | null;
  streak: number;
}

const USER = localTestStorage.userData as UserProfile;

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.profileCard}>
          <View style={styles.decorativeCircleLarge} />
          <View style={styles.decorativeCircleSmall} />

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(USER.name)}</Text>
          </View>

          <View style={styles.profileDetails}>
            <Text style={styles.name}>{USER.name}</Text>
            <Text style={styles.target}>
              Target: {USER.targetUni} · Goal score {USER.targetScore}%
            </Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <StatCard
            icon="flame-outline"
            label="Streak"
            value={`${USER.streak} wks`}
            backgroundColor="#FFF0CA"
          />
          <StatCard
            icon="flag-outline"
            label="Target score"
            value={`${USER.targetScore}%`}
            backgroundColor="#FFF3D8"
          />
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.detailsHeading}>Study goal</Text>
          <DetailRow
            icon="school-outline"
            label="Target university"
            value={USER.targetUni}
          />
          <View style={styles.divider} />
          <DetailRow
            icon="analytics-outline"
            label="TMUA target"
            value={`${USER.targetScore}%`}
          />
        </View>

        <View style={styles.messageCard}>
          <Ionicons name="sunny-outline" size={21} color={Colors.primary} />
          <Text style={styles.message}>
            Small, consistent practice builds TMUA confidence.
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

interface StatCardProps {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  backgroundColor: string;
}

function StatCard({ icon, label, value, backgroundColor }: StatCardProps) {
  return (
    <View style={[styles.statCard, { backgroundColor }]}>
      <View style={styles.statLabelRow}>
        <Ionicons name={icon} size={17} color={Colors.primary} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

interface DetailRowProps {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={19} color={Colors.primary} />
      </View>
      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
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
    marginBottom: 24,
    color: Colors.ink,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1,
    textAlign: "center",
  },
  profileCard: {
    minHeight: 126,
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingVertical: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    backgroundColor: "#FF7324",
    borderRadius: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 8,
  },
  decorativeCircleLarge: {
    position: "absolute",
    top: -58,
    right: -35,
    width: 145,
    height: 145,
    borderRadius: 73,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  decorativeCircleSmall: {
    position: "absolute",
    bottom: -45,
    right: 68,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  avatar: {
    zIndex: 1,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFF4DC",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#75390C",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.18,
    shadowRadius: 15,
    elevation: 4,
  },
  avatarText: { color: Colors.primary, fontSize: 20, fontWeight: "900" },
  profileDetails: { zIndex: 1, flex: 1 },
  name: { color: "#FFFFFF", fontSize: 21, fontWeight: "900" },
  target: {
    marginTop: 5,
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  statRow: { marginTop: 16, flexDirection: "row", gap: 13 },
  statCard: {
    flex: 1,
    minHeight: 112,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F5DFB8",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6F4619",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
    elevation: 3,
  },
  statLabelRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  statLabel: { color: "#8D735F", fontSize: 12, fontWeight: "800" },
  statValue: {
    marginTop: 7,
    color: Colors.primary,
    fontSize: 25,
    fontWeight: "900",
  },
  detailsCard: {
    marginTop: 17,
    padding: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 20,
    shadowColor: "#6F4619",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 2,
  },
  detailsHeading: {
    marginBottom: 15,
    color: Colors.ink,
    fontSize: 17,
    fontWeight: "900",
  },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  detailIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFF0D3",
    justifyContent: "center",
    alignItems: "center",
  },
  detailText: { flex: 1 },
  detailLabel: { color: Colors.muted, fontSize: 11, fontWeight: "800" },
  detailValue: {
    marginTop: 2,
    color: Colors.ink,
    fontSize: 15,
    fontWeight: "900",
  },
  divider: { height: 1, marginVertical: 14, backgroundColor: Colors.line },
  messageCard: {
    marginTop: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFF6DF",
    borderWidth: 1,
    borderColor: "#F2DEB6",
    borderRadius: 18,
  },
  message: {
    flex: 1,
    color: "#8D735F",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  bottomSpacing: { height: 110 },
});
