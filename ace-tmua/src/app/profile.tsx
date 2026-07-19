import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  loadHomeDashboard,
} from "@/components/home/home-data";
import type { HomeDashboardData } from "@/components/home/home-data";
import { Colors, Shadow } from "@/constants/theme";
import { useAccount } from "@/contexts/AccountContext";
import type { ExamSitting, StudyDay } from "@/services/account-storage";
import { isAppleAuthenticationCancellation } from "@/services/auth-service";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function examSittingLabel(sitting: ExamSitting) {
  if (sitting === "october") return "October sitting";
  if (sitting === "january") return "January sitting";
  return "Sitting undecided";
}

function tmuaScoreLabel(score: number) {
  return `${score.toFixed(1)} / 9.0`;
}

const SHORT_DAY_LABELS: Record<StudyDay, string> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  7: "Sun",
};

function studyPlanLabel(days: StudyDay[], time: string) {
  const dayList = days.map((day) => SHORT_DAY_LABELS[day]).join(", ");
  return `${dayList || "No days selected"} at ${time}`;
}

export default function ProfileScreen() {
  const router = useRouter();
  const {
    isPremium,
    isSignedIn,
    isSupabaseConfigured,
    isSyncing,
    profile,
    session,
    deleteAccount,
    openSubscriptionManagement,
    refreshAccount,
    signOut,
    syncError,
    updateProfile,
  } = useAccount();
  const [dashboard, setDashboard] = useState<HomeDashboardData | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [university, setUniversity] = useState(profile.targetUniversity);
  const [score, setScore] = useState(`${profile.targetScore}`);
  const [sitting, setSitting] = useState<ExamSitting>(profile.examSitting);
  const [saving, setSaving] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletionError, setDeletionError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void loadHomeDashboard().then((nextDashboard) => {
        if (active) setDashboard(nextDashboard);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const openEditor = () => {
    setName(profile.name);
    setUniversity(profile.targetUniversity);
    setScore(`${profile.targetScore}`);
    setSitting(profile.examSitting);
    setEditing(true);
  };

  const saveProfile = async () => {
    const numericScore = Number(score);
    if (!name.trim() || !Number.isFinite(numericScore) || numericScore < 1 || numericScore > 9) {
      Alert.alert("Check your details", "Add a name and a TMUA target between 1.0 and 9.0.");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        targetUniversity: university.trim(),
        targetScore: Math.round(numericScore * 10) / 10,
        examSitting: sitting,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const confirmSignOut = () => {
    Alert.alert(
      "Sign out?",
      "Your synced account data stays in Supabase. Progress on this device remains available in guest mode.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: () => void signOut(),
        },
      ],
    );
  };

  const openDeleteAccount = () => {
    setDeleteConfirmation("");
    setDeletionError(null);
    setDeleteModalVisible(true);
  };

  const manageSubscription = async () => {
    try {
      await openSubscriptionManagement();
    } catch (error) {
      Alert.alert(
        "Could not open subscriptions",
        error instanceof Error
          ? error.message
          : "Open your App Store or Google Play subscription settings manually.",
      );
    }
  };

  const completeAccountDeletion = async () => {
    if (deleteConfirmation.trim().toUpperCase() !== "DELETE") return;

    setIsDeleting(true);
    setDeletionError(null);
    try {
      const result = await deleteAccount();
      setDeleteModalVisible(false);
      setDeleteConfirmation("");

      const appleMessage =
        result.appleRevocation === "manual-required"
          ? " Apple could not revoke the sign-in token automatically. In iPhone Settings, open your Apple Account, then Sign-In & Security → Sign in with Apple → ACE TMUA → Stop Using Apple ID."
          : "";

      Alert.alert(
        "Account deleted",
        `Your profile, lesson progress, practice results and saved sessions have been permanently deleted.${appleMessage}`,
        [
          {
            text: "Continue",
            onPress: () => router.replace("/onboarding"),
          },
        ],
      );
    } catch (error) {
      if (isAppleAuthenticationCancellation(error)) {
        setDeletionError(
          "Apple account confirmation was cancelled. Your account has not been deleted.",
        );
      } else {
        setDeletionError(
          error instanceof Error
            ? error.message
            : "The account could not be deleted. Please try again.",
        );
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const hasAppleIdentity = Boolean(
    session?.user.identities?.some((identity) => identity.provider === "apple"),
  );

  const bestScore = dashboard?.bestPracticePercent;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeading}>
          <View>
            <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
            <Text style={styles.title}>Profile</Text>
          </View>
          <Pressable onPress={openEditor} style={styles.editButton}>
            <Ionicons name="create-outline" size={18} color={Colors.primary} />
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.decorativeCircleLarge} />
          <View style={styles.decorativeCircleSmall} />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(profile.name || "Student")}</Text>
          </View>
          <View style={styles.profileDetails}>
            <Text style={styles.name}>{profile.name || "TMUA student"}</Text>
            <Text style={styles.target}>
              {profile.targetUniversity
                ? `Target: ${profile.targetUniversity} · ${tmuaScoreLabel(profile.targetScore)}`
                : `Target score: ${tmuaScoreLabel(profile.targetScore)}`}
            </Text>
            <View style={styles.planPill}>
              <Ionicons
                name={isPremium ? "sparkles" : "leaf-outline"}
                size={12}
                color="#7A3E00"
              />
              <Text style={styles.planPillText}>{isPremium ? "PREMIUM" : "FREE PLAN"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statRow}>
          <StatCard icon="flame-outline" label="Current streak" value={`${dashboard?.streak ?? 0}d`} />
          <StatCard icon="book-outline" label="Lessons" value={`${dashboard?.completedLessonCount ?? 0}`} />
          <StatCard icon="trophy-outline" label="Best score" value={bestScore === null || bestScore === undefined ? "—" : `${bestScore}%`} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>ACCOUNT</Text>
          <Text style={styles.sectionTitle}>Progress backup</Text>
        </View>

        {isSignedIn ? (
          <View style={styles.accountCard}>
            <View style={styles.accountIconConnected}>
              {isSyncing ? (
                <ActivityIndicator size="small" color="#2D835A" />
              ) : (
                <Ionicons name="cloud-done" size={24} color="#2D835A" />
              )}
            </View>
            <View style={styles.accountBody}>
              <Text style={styles.accountTitle}>{isSyncing ? "Syncing progress…" : "Account connected"}</Text>
              <Text style={styles.accountText}>{profile.email ?? "Signed in securely"}</Text>
            </View>
            <Pressable onPress={() => void refreshAccount()} hitSlop={10}>
              <Ionicons name="refresh" size={20} color={Colors.primary} />
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => router.push("/sign-in")} style={styles.accountCard}>
            <View style={styles.accountIcon}>
              <Ionicons name="cloud-upload-outline" size={24} color={Colors.primary} />
            </View>
            <View style={styles.accountBody}>
              <Text style={styles.accountTitle}>Back up your progress</Text>
              <Text style={styles.accountText}>
                {isSupabaseConfigured
                  ? "Sign in to restore this profile on another device."
                  : "Connect Supabase, then create or sign into an account."}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={19} color={Colors.primary} />
          </Pressable>
        )}

        {syncError ? (
          <View style={styles.syncWarning}>
            <Ionicons name="cloud-offline-outline" size={18} color="#A55A32" />
            <Text style={styles.syncWarningText}>
              Saved on this device. Cloud sync will retry when the setup or connection is available.
            </Text>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>YOUR GOAL</Text>
          <Text style={styles.sectionTitle}>Study target</Text>
        </View>

        <View style={styles.detailsCard}>
          <DetailRow icon="school-outline" label="Target university" value={profile.targetUniversity || "Not set"} />
          <View style={styles.divider} />
          <DetailRow icon="analytics-outline" label="Target score" value={tmuaScoreLabel(profile.targetScore)} />
          <View style={styles.divider} />
          <DetailRow icon="calendar-outline" label="Exam plan" value={examSittingLabel(profile.examSitting)} />
          <View style={styles.divider} />
          <DetailRow
            icon="time-outline"
            label="Study routine"
            value={studyPlanLabel(profile.studyDays, profile.studyTime)}
          />
          <View style={styles.divider} />
          <DetailRow
            icon="notifications-outline"
            label="Study reminders"
            value={profile.studyRemindersEnabled ? "On" : "Off"}
          />
        </View>

        <Pressable onPress={() => router.push("/premium")} style={styles.premiumCard}>
          <View style={styles.premiumIcon}>
            <Ionicons name="sparkles" size={22} color="#7A3E00" />
          </View>
          <View style={styles.premiumBody}>
            <Text style={styles.premiumEyebrow}>{isPremium ? "PREMIUM ACTIVE" : "ACE TMUA PREMIUM"}</Text>
            <Text style={styles.premiumTitle}>{isPremium ? "Your complete preparation plan" : "Unlock the complete exam pathway"}</Text>
          </View>
          <Ionicons name="arrow-forward" size={19} color="#7A3E00" />
        </Pressable>

        {isSignedIn ? (
          <>
            <Pressable onPress={confirmSignOut} style={styles.signOutButton}>
              <Ionicons name="log-out-outline" size={18} color="#A64A3E" />
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={openDeleteAccount}
              style={styles.dangerZone}
            >
              <View style={styles.dangerIcon}>
                <Ionicons name="trash-outline" size={19} color="#A43E36" />
              </View>
              <View style={styles.dangerBody}>
                <Text style={styles.dangerTitle}>Delete account</Text>
                <Text style={styles.dangerText}>
                  Permanently remove your account and all synced study data.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#A43E36" />
            </Pressable>
          </>
        ) : null}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <Modal animationType="slide" onRequestClose={() => setEditing(false)} transparent visible={editing}>
        <View style={styles.modalBackdrop}>
          <SafeAreaView style={styles.modalSheet} edges={["bottom"]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>YOUR DETAILS</Text>
                <Text style={styles.modalTitle}>Edit profile</Text>
              </View>
              <Pressable onPress={() => setEditing(false)} style={styles.modalClose}>
                <Ionicons name="close" size={22} color={Colors.ink} />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>NAME</Text>
            <TextInput onChangeText={setName} style={styles.input} value={name} />
            <Text style={styles.inputLabel}>TARGET UNIVERSITY</Text>
            <TextInput onChangeText={setUniversity} placeholder="Optional" placeholderTextColor="#A89587" style={styles.input} value={university} />
            <Text style={styles.inputLabel}>TARGET TMUA SCORE (1.0–9.0)</Text>
            <TextInput keyboardType="decimal-pad" maxLength={3} onChangeText={setScore} style={styles.input} value={score} />
            <Text style={styles.inputLabel}>EXAM SITTING</Text>
            <View style={styles.sittingRow}>
              {(["october", "january", "undecided"] as const).map((option) => (
                <Pressable key={option} onPress={() => setSitting(option)} style={[styles.sittingOption, sitting === option && styles.sittingOptionActive]}>
                  <Text style={[styles.sittingText, sitting === option && styles.sittingTextActive]}>
                    {option === "undecided" ? "Not sure" : option[0].toUpperCase() + option.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable disabled={saving} onPress={() => void saveProfile()} style={styles.saveButton}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save changes</Text>}
            </Pressable>
          </SafeAreaView>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={() => {
          if (!isDeleting) setDeleteModalVisible(false);
        }}
        transparent
        visible={deleteModalVisible}
      >
        <View style={styles.modalBackdrop}>
          <SafeAreaView style={styles.deleteSheet} edges={["bottom"]}>
            <View style={styles.modalHandle} />
            <ScrollView
              contentContainerStyle={styles.deleteContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.deleteHeader}>
                <View style={styles.deleteHeaderIcon}>
                  <Ionicons
                    name="warning-outline"
                    size={24}
                    color="#A43E36"
                  />
                </View>
                <View style={styles.deleteHeaderText}>
                  <Text style={styles.deleteEyebrow}>PERMANENT ACTION</Text>
                  <Text style={styles.deleteTitle}>Delete your account?</Text>
                </View>
                <Pressable
                  disabled={isDeleting}
                  onPress={() => setDeleteModalVisible(false)}
                  style={styles.modalClose}
                >
                  <Ionicons name="close" size={22} color={Colors.ink} />
                </Pressable>
              </View>

              <Text style={styles.deleteIntro}>
                This cannot be undone. ACE TMUA will permanently remove:
              </Text>
              <DeletionItem text="Your profile and study preferences" />
              <DeletionItem text="Lesson progress and activity history" />
              <DeletionItem text="Practice results and saved test sessions" />
              <DeletionItem text="Your Premium entitlement record in ACE TMUA" />

              <View style={styles.subscriptionWarning}>
                <Ionicons name="card-outline" size={21} color="#8A591E" />
                <View style={styles.subscriptionWarningBody}>
                  <Text style={styles.subscriptionWarningTitle}>
                    Your subscription will not be cancelled
                  </Text>
                  <Text style={styles.subscriptionWarningText}>
                    Apple or Google controls billing. Cancel there first if you
                    do not want your subscription to renew.
                  </Text>
                </View>
              </View>

              <Pressable
                disabled={isDeleting}
                onPress={() => void manageSubscription()}
                style={styles.manageSubscriptionButton}
              >
                <Ionicons name="open-outline" size={17} color={Colors.primary} />
                <Text style={styles.manageSubscriptionText}>
                  Manage subscription
                </Text>
              </Pressable>

              {hasAppleIdentity ? (
                <Text style={styles.providerConfirmationText}>
                  Apple will also ask you to confirm your identity so ACE TMUA
                  can revoke its Sign in with Apple access.
                </Text>
              ) : null}

              <Text style={styles.deleteInputLabel}>
                TYPE DELETE TO CONFIRM
              </Text>
              <TextInput
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!isDeleting}
                onChangeText={setDeleteConfirmation}
                placeholder="DELETE"
                placeholderTextColor="#B7A79A"
                style={styles.deleteInput}
                value={deleteConfirmation}
              />

              {deletionError ? (
                <View style={styles.deletionError}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={17}
                    color="#A43E36"
                  />
                  <Text style={styles.deletionErrorText}>{deletionError}</Text>
                </View>
              ) : null}

              <Pressable
                disabled={
                  isDeleting ||
                  deleteConfirmation.trim().toUpperCase() !== "DELETE"
                }
                onPress={() => void completeAccountDeletion()}
                style={({ pressed }) => [
                  styles.deleteAccountButton,
                  deleteConfirmation.trim().toUpperCase() !== "DELETE" &&
                    styles.deleteAccountButtonDisabled,
                  pressed && !isDeleting && styles.deleteAccountButtonPressed,
                ]}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.deleteAccountButtonText}>
                      Permanently delete account
                    </Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DeletionItem({ text }: { text: string }) {
  return (
    <View style={styles.deletionItem}>
      <View style={styles.deletionItemDot} />
      <Text style={styles.deletionItemText}>{text}</Text>
    </View>
  );
}

function StatCard({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={18} color={Colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}><Ionicons name={icon} size={19} color={Colors.primary} /></View>
      <View style={styles.detailText}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.cream },
  container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 130 },
  pageHeading: { marginBottom: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  eyebrow: { color: Colors.primary, fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  title: { marginTop: 3, color: Colors.ink, fontSize: 32, fontWeight: "900", letterSpacing: -1 },
  editButton: { minHeight: 41, paddingHorizontal: 13, borderRadius: 15, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: Colors.line, flexDirection: "row", alignItems: "center", gap: 5 },
  editButtonText: { color: Colors.primary, fontSize: 11, fontWeight: "900" },
  profileCard: { minHeight: 137, overflow: "hidden", padding: 21, flexDirection: "row", alignItems: "center", gap: 15, backgroundColor: Colors.primary, borderRadius: 28, ...Shadow.streak },
  decorativeCircleLarge: { position: "absolute", top: -62, right: -32, width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(255,255,255,0.16)" },
  decorativeCircleSmall: { position: "absolute", bottom: -48, right: 73, width: 95, height: 95, borderRadius: 48, backgroundColor: "rgba(255,255,255,0.09)" },
  avatar: { zIndex: 1, width: 64, height: 64, borderRadius: 32, backgroundColor: "#FFF4DC", borderWidth: 3, borderColor: "rgba(255,255,255,0.7)", justifyContent: "center", alignItems: "center" },
  avatarText: { color: Colors.primary, fontSize: 20, fontWeight: "900" },
  profileDetails: { zIndex: 1, flex: 1 },
  name: { color: "#FFFFFF", fontSize: 21, fontWeight: "900" },
  target: { marginTop: 4, color: "rgba(255,255,255,0.84)", fontSize: 11, lineHeight: 16, fontWeight: "700" },
  planPill: { alignSelf: "flex-start", marginTop: 9, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 12, backgroundColor: "#FFD98F", flexDirection: "row", alignItems: "center", gap: 4 },
  planPillText: { color: "#7A3E00", fontSize: 8, fontWeight: "900", letterSpacing: 0.7 },
  statRow: { marginTop: 14, flexDirection: "row", gap: 9 },
  statCard: { flex: 1, minHeight: 105, padding: 10, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: Colors.line, justifyContent: "center", alignItems: "center" },
  statValue: { marginTop: 5, color: Colors.ink, fontSize: 20, fontWeight: "900" },
  statLabel: { marginTop: 2, color: Colors.muted, fontSize: 8, fontWeight: "800", textAlign: "center" },
  sectionHeader: { marginTop: 27, marginBottom: 11 },
  sectionEyebrow: { color: Colors.primary, fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  sectionTitle: { marginTop: 3, color: Colors.ink, fontSize: 20, fontWeight: "900" },
  accountCard: { minHeight: 82, padding: 15, borderRadius: 22, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: Colors.line, flexDirection: "row", alignItems: "center", gap: 12, ...Shadow.card },
  accountIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: "#FFF0D3", justifyContent: "center", alignItems: "center" },
  accountIconConnected: { width: 46, height: 46, borderRadius: 16, backgroundColor: "#E9F7F0", justifyContent: "center", alignItems: "center" },
  accountBody: { flex: 1 },
  accountTitle: { color: Colors.ink, fontSize: 14, fontWeight: "900" },
  accountText: { marginTop: 3, color: Colors.muted, fontSize: 10, lineHeight: 15, fontWeight: "700" },
  syncWarning: { marginTop: 10, padding: 12, borderRadius: 16, backgroundColor: "#FFF0E6", flexDirection: "row", alignItems: "center", gap: 8 },
  syncWarningText: { flex: 1, color: "#8A5539", fontSize: 9, lineHeight: 14, fontWeight: "700" },
  detailsCard: { padding: 17, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: Colors.line, borderRadius: 22, ...Shadow.card },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  detailIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: "#FFF0D3", justifyContent: "center", alignItems: "center" },
  detailText: { flex: 1 },
  detailLabel: { color: Colors.muted, fontSize: 9, fontWeight: "800" },
  detailValue: { marginTop: 2, color: Colors.ink, fontSize: 14, fontWeight: "900" },
  divider: { height: 1, marginVertical: 13, backgroundColor: Colors.line },
  premiumCard: { minHeight: 85, marginTop: 17, padding: 15, borderRadius: 22, backgroundColor: "#FFD98F", flexDirection: "row", alignItems: "center", gap: 12 },
  premiumIcon: { width: 47, height: 47, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.6)", justifyContent: "center", alignItems: "center" },
  premiumBody: { flex: 1 },
  premiumEyebrow: { color: "#9A5208", fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  premiumTitle: { marginTop: 3, color: "#5B3107", fontSize: 13, lineHeight: 17, fontWeight: "900" },
  signOutButton: { minHeight: 50, marginTop: 15, borderRadius: 18, backgroundColor: "#FFF0EC", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 7 },
  signOutText: { color: "#A64A3E", fontSize: 12, fontWeight: "900" },
  dangerZone: { minHeight: 76, marginTop: 11, padding: 14, borderRadius: 20, borderWidth: 1, borderColor: "#E9C8C2", backgroundColor: "#FFF9F7", flexDirection: "row", alignItems: "center", gap: 11 },
  dangerIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#FBE7E3", justifyContent: "center", alignItems: "center" },
  dangerBody: { flex: 1 },
  dangerTitle: { color: "#8E302A", fontSize: 13, fontWeight: "900" },
  dangerText: { marginTop: 3, color: "#9B6C66", fontSize: 9, lineHeight: 13, fontWeight: "700" },
  bottomSpacing: { height: 20 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(45,36,31,0.42)", justifyContent: "flex-end" },
  modalSheet: { padding: 20, paddingTop: 11, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: Colors.cream },
  modalHandle: { width: 45, height: 5, marginBottom: 16, borderRadius: 3, backgroundColor: "#D9C9B7", alignSelf: "center" },
  modalHeader: { marginBottom: 19, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { marginTop: 2, color: Colors.ink, fontSize: 24, fontWeight: "900" },
  modalClose: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#FFFFFF", justifyContent: "center", alignItems: "center" },
  inputLabel: { marginTop: 11, marginBottom: 6, color: Colors.muted, fontSize: 8, fontWeight: "900", letterSpacing: 0.9 },
  input: { height: 49, paddingHorizontal: 14, borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: Colors.line, color: Colors.ink, fontSize: 14, fontWeight: "800" },
  sittingRow: { flexDirection: "row", gap: 7 },
  sittingOption: { flex: 1, minHeight: 41, borderRadius: 13, backgroundColor: "#F1E7D8", justifyContent: "center", alignItems: "center" },
  sittingOptionActive: { backgroundColor: "#FFF0D3", borderWidth: 1, borderColor: Colors.primary },
  sittingText: { color: Colors.muted, fontSize: 9, fontWeight: "900" },
  sittingTextActive: { color: Colors.primary },
  saveButton: { minHeight: 54, marginTop: 20, borderRadius: 17, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  saveButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  deleteSheet: { maxHeight: "94%", padding: 20, paddingTop: 11, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: Colors.cream },
  deleteContent: { paddingBottom: 4 },
  deleteHeader: { flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 16 },
  deleteHeaderIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: "#FBE7E3", justifyContent: "center", alignItems: "center" },
  deleteHeaderText: { flex: 1 },
  deleteEyebrow: { color: "#A43E36", fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  deleteTitle: { marginTop: 2, color: Colors.ink, fontSize: 22, fontWeight: "900" },
  deleteIntro: { marginBottom: 9, color: Colors.muted, fontSize: 11, lineHeight: 17, fontWeight: "700" },
  deletionItem: { minHeight: 25, flexDirection: "row", alignItems: "center", gap: 9 },
  deletionItemDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#C75B50" },
  deletionItemText: { flex: 1, color: Colors.ink, fontSize: 10, lineHeight: 15, fontWeight: "800" },
  subscriptionWarning: { marginTop: 13, padding: 13, borderRadius: 17, backgroundColor: "#FFF0D3", flexDirection: "row", alignItems: "flex-start", gap: 10 },
  subscriptionWarningBody: { flex: 1 },
  subscriptionWarningTitle: { color: "#754512", fontSize: 11, fontWeight: "900" },
  subscriptionWarningText: { marginTop: 3, color: "#8A6B49", fontSize: 9, lineHeight: 14, fontWeight: "700" },
  manageSubscriptionButton: { minHeight: 44, marginTop: 9, borderRadius: 14, borderWidth: 1, borderColor: Colors.line, backgroundColor: "#FFFFFF", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 7 },
  manageSubscriptionText: { color: Colors.primary, fontSize: 11, fontWeight: "900" },
  providerConfirmationText: { marginTop: 11, color: Colors.muted, fontSize: 9, lineHeight: 14, fontWeight: "700" },
  deleteInputLabel: { marginTop: 14, marginBottom: 6, color: "#8E302A", fontSize: 8, fontWeight: "900", letterSpacing: 0.9 },
  deleteInput: { height: 49, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: "#E2B6AF", backgroundColor: "#FFFFFF", color: Colors.ink, fontSize: 14, fontWeight: "900", letterSpacing: 1 },
  deletionError: { marginTop: 9, padding: 10, borderRadius: 13, backgroundColor: "#FBE7E3", flexDirection: "row", alignItems: "flex-start", gap: 7 },
  deletionErrorText: { flex: 1, color: "#8E302A", fontSize: 9, lineHeight: 14, fontWeight: "700" },
  deleteAccountButton: { minHeight: 54, marginTop: 13, borderRadius: 17, backgroundColor: "#A43E36", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  deleteAccountButtonDisabled: { backgroundColor: "#D5B5B0" },
  deleteAccountButtonPressed: { opacity: 0.84 },
  deleteAccountButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
});
