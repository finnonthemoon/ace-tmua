import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AuthPanel from "@/components/auth/AuthPanel";
import { useAccount } from "@/contexts/AccountContext";
import { Colors, Shadow } from "@/constants/theme";
import type { ExamSitting } from "@/services/account-storage";

const TOTAL_STEPS = 5;

export default function OnboardingScreen() {
  const router = useRouter();
  const {
    continueAsGuest,
    finishOnboarding,
    isSignedIn,
    presentPremiumPaywall,
    profile,
    updateProfile,
  } = useAccount();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile.name);
  const [targetUniversity, setTargetUniversity] = useState(
    profile.targetUniversity,
  );
  const [targetScore, setTargetScore] = useState(`${profile.targetScore}`);
  const [examSitting, setExamSitting] = useState<ExamSitting>(
    profile.examSitting,
  );
  const [selectedPlan, setSelectedPlan] = useState<"free" | "premium">(
    "premium",
  );
  const [saving, setSaving] = useState(false);

  const goBack = () => setStep((current) => Math.max(0, current - 1));

  const saveName = async () => {
    if (!name.trim()) {
      Alert.alert("What should we call you?", "Enter your first name to continue.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name: name.trim() });
      setStep(2);
    } finally {
      setSaving(false);
    }
  };

  const saveGoals = async () => {
    const numericScore = Number(targetScore);
    if (!Number.isFinite(numericScore) || numericScore < 1 || numericScore > 100) {
      Alert.alert("Check your target", "Enter a target score between 1 and 100.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        targetUniversity: targetUniversity.trim(),
        targetScore: Math.round(numericScore),
        examSitting,
      });
      setStep(3);
    } finally {
      setSaving(false);
    }
  };

  const finish = async () => {
    setSaving(true);
    try {
      if (selectedPlan === "premium") {
        try {
          const result = await presentPremiumPaywall();
          if (result === "not-presented") {
            Alert.alert(
              "Premium checkout is not ready",
              "You can continue for free and open Premium again from your Profile when the offering is available.",
            );
          }
        } catch (error) {
          Alert.alert(
            "Premium checkout unavailable",
            error instanceof Error
              ? error.message
              : "You can continue for free and upgrade later from Profile.",
          );
        }
      }
      await finishOnboarding(selectedPlan === "premium");
      router.replace("/");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        {step > 0 ? (
          <View style={styles.topBar}>
            <Pressable
              accessibilityLabel="Previous onboarding step"
              onPress={goBack}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={22} color={Colors.ink} />
            </Pressable>
            <View style={styles.stepDots}>
              {Array.from({ length: TOTAL_STEPS - 1 }, (_, index) => (
                <View
                  key={index}
                  style={[
                    styles.stepDot,
                    index <= step - 1 && styles.stepDotActive,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.stepCount}>{step}/{TOTAL_STEPS - 1}</Text>
          </View>
        ) : null}

        <ScrollView
          contentContainerStyle={[
            styles.content,
            step === 0 && styles.welcomeContent,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 0 ? (
            <WelcomeStep onNext={() => setStep(1)} />
          ) : null}

          {step === 1 ? (
            <View style={styles.stepContent}>
              <StepHeading
                eyebrow="MAKE IT YOURS"
                title="First, what should we call you?"
                body="We use this to make your study plan feel personal—not to fill your inbox."
              />
              <View style={styles.formCard}>
                <Text style={styles.inputLabel}>YOUR NAME</Text>
                <TextInput
                  autoCapitalize="words"
                  autoComplete="name"
                  autoFocus
                  onChangeText={setName}
                  onSubmitEditing={() => void saveName()}
                  placeholder="e.g. Finn"
                  placeholderTextColor="#A89587"
                  returnKeyType="next"
                  style={styles.input}
                  value={name}
                />
                <View style={styles.reassuranceRow}>
                  <Ionicons name="lock-closed-outline" size={15} color={Colors.primary} />
                  <Text style={styles.reassuranceText}>
                    You can change this later in Profile.
                  </Text>
                </View>
              </View>
              <PrimaryButton
                busy={saving}
                label="Continue"
                onPress={() => void saveName()}
              />
            </View>
          ) : null}

          {step === 2 ? (
            <View style={styles.stepContent}>
              <StepHeading
                eyebrow="YOUR TARGET"
                title="Give every session a purpose"
                body="Your goal helps us frame progress and choose the right next step."
              />

              <View style={styles.formCard}>
                <Text style={styles.inputLabel}>TARGET UNIVERSITY</Text>
                <TextInput
                  autoCapitalize="words"
                  onChangeText={setTargetUniversity}
                  placeholder="e.g. Cambridge"
                  placeholderTextColor="#A89587"
                  style={styles.input}
                  value={targetUniversity}
                />

                <Text style={[styles.inputLabel, styles.fieldSpacing]}>
                  TARGET SCORE (%)
                </Text>
                <TextInput
                  keyboardType="number-pad"
                  maxLength={3}
                  onChangeText={setTargetScore}
                  placeholder="70"
                  placeholderTextColor="#A89587"
                  style={styles.input}
                  value={targetScore}
                />

                <Text style={[styles.inputLabel, styles.fieldSpacing]}>
                  TMUA SITTING
                </Text>
                <View style={styles.sittingOptions}>
                  <SittingOption
                    active={examSitting === "october"}
                    label="October"
                    onPress={() => setExamSitting("october")}
                  />
                  <SittingOption
                    active={examSitting === "january"}
                    label="January"
                    onPress={() => setExamSitting("january")}
                  />
                  <SittingOption
                    active={examSitting === "undecided"}
                    label="Not sure"
                    onPress={() => setExamSitting("undecided")}
                  />
                </View>
              </View>

              <PrimaryButton
                busy={saving}
                label="Build my plan"
                onPress={() => void saveGoals()}
              />
            </View>
          ) : null}

          {step === 3 ? (
            <View style={styles.stepContent}>
              <StepHeading
                eyebrow="KEEP YOUR PROGRESS"
                title="Study on any device"
                body="Create an account to back up lessons, practice scores and your streak. Guest mode still works on this device."
              />

              {isSignedIn ? (
                <View style={styles.signedInCard}>
                  <View style={styles.signedInIcon}>
                    <Ionicons name="cloud-done" size={27} color="#2D835A" />
                  </View>
                  <View style={styles.signedInBody}>
                    <Text style={styles.signedInTitle}>Your account is connected</Text>
                    <Text style={styles.signedInText}>
                      Your progress will sync whenever Supabase is available.
                    </Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={24} color="#2D835A" />
                </View>
              ) : (
                <AuthPanel
                  defaultMode="create"
                  onComplete={(requiresConfirmation) => {
                    if (requiresConfirmation) {
                      Alert.alert(
                        "Check your inbox",
                        "We sent a confirmation link. You can finish onboarding now and your account will connect when you confirm it.",
                      );
                    }
                    setStep(4);
                  }}
                  onGuest={() =>
                    void continueAsGuest().then(() => setStep(4))
                  }
                  showGuest
                />
              )}

              {isSignedIn ? (
                <PrimaryButton label="Continue" onPress={() => setStep(4)} />
              ) : null}
            </View>
          ) : null}

          {step === 4 ? (
            <View style={styles.stepContent}>
              <StepHeading
                eyebrow="CHOOSE YOUR EXPERIENCE"
                title="Turn preparation into an advantage"
                body="Start free, or choose Premium for the complete exam-preparation system."
              />

              <Pressable
                onPress={() => setSelectedPlan("premium")}
                style={[
                  styles.premiumCard,
                  selectedPlan === "premium" && styles.premiumCardSelected,
                ]}
              >
                <View style={styles.bestValuePill}>
                  <Ionicons name="sparkles" size={13} color="#7A3E00" />
                  <Text style={styles.bestValueText}>BEST FOR SERIOUS PREP</Text>
                </View>
                <View style={styles.planHeadingRow}>
                  <View>
                    <Text style={styles.premiumEyebrow}>ACE TMUA PREMIUM</Text>
                    <Text style={styles.premiumTitle}>Everything between you and exam day</Text>
                  </View>
                  <PlanCheck active={selectedPlan === "premium"} />
                </View>

                <View style={styles.premiumBenefits}>
                  <PremiumBenefit text="The complete lesson pathway" />
                  <PremiumBenefit text="Fresh full-length Paper 1 and Paper 2 mocks" />
                  <PremiumBenefit text="Detailed topic insights and explanations" />
                  <PremiumBenefit text="Unlimited attempts as your score improves" />
                </View>

                <View style={styles.premiumPromise}>
                  <Ionicons name="shield-checkmark-outline" size={17} color="#FFFFFF" />
                  <Text style={styles.premiumPromiseText}>
                    Secure Apple or Google checkout. Cancel or restore through your store account.
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => setSelectedPlan("free")}
                style={[
                  styles.freeCard,
                  selectedPlan === "free" && styles.freeCardSelected,
                ]}
              >
                <View style={styles.freePlanBody}>
                  <Text style={styles.freeTitle}>Start free</Text>
                  <Text style={styles.freeText}>
                    Core lessons and the starter diagnostic, with no payment details.
                  </Text>
                </View>
                <PlanCheck active={selectedPlan === "free"} />
              </Pressable>

              <PrimaryButton
                busy={saving}
                label={
                  selectedPlan === "premium"
                    ? "Choose Premium"
                    : "Start learning free"
                }
                onPress={() => void finish()}
              />
              <Text style={styles.planFootnote}>
                Tap Choose Premium to view the available plans before purchasing. You can continue free if you change your mind.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <View style={styles.welcome}>
      <View style={styles.logoMark}>
        <Ionicons name="chevron-up" size={52} color="#FFFFFF" />
      </View>

      <Text style={styles.welcomeEyebrow}>ACE TMUA</Text>
      <Text style={styles.welcomeTitle}>A clearer route to your best score.</Text>
      <Text style={styles.welcomeBody}>
        Learn the ideas, practise under pressure and always know what to do next.
      </Text>

      <View style={styles.valueCards}>
        <WelcomeValue
          icon="git-network-outline"
          text="A structured path through every core topic"
        />
        <WelcomeValue
          icon="timer-outline"
          text="Exam-style practice with real timing and review"
        />
        <WelcomeValue
          icon="analytics-outline"
          text="Progress that turns results into your next step"
        />
      </View>

      <PrimaryButton label="Create my study plan" onPress={onNext} />
      <Text style={styles.welcomeFootnote}>Takes about one minute</Text>
    </View>
  );
}

function StepHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.stepHeading}>
      <Text style={styles.stepEyebrow}>{eyebrow}</Text>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepBody}>{body}</Text>
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  busy = false,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
}) {
  return (
    <Pressable
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        busy && styles.primaryButtonDisabled,
        pressed && styles.buttonPressed,
      ]}
    >
      {busy ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          <Text style={styles.primaryButtonText}>{label}</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </>
      )}
    </Pressable>
  );
}

function SittingOption({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.sittingOption, active && styles.sittingOptionActive]}
    >
      <Text
        style={[
          styles.sittingOptionText,
          active && styles.sittingOptionTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function WelcomeValue({
  icon,
  text,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  text: string;
}) {
  return (
    <View style={styles.welcomeValue}>
      <View style={styles.welcomeValueIcon}>
        <Ionicons name={icon} size={21} color={Colors.primary} />
      </View>
      <Text style={styles.welcomeValueText}>{text}</Text>
    </View>
  );
}

function PlanCheck({ active }: { active: boolean }) {
  return (
    <View style={[styles.planCheck, active && styles.planCheckActive]}>
      {active ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
    </View>
  );
}

function PremiumBenefit({ text }: { text: string }) {
  return (
    <View style={styles.premiumBenefit}>
      <View style={styles.premiumBenefitIcon}>
        <Ionicons name="checkmark" size={13} color="#7A3E00" />
      </View>
      <Text style={styles.premiumBenefitText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: Colors.cream },
  topBar: {
    minHeight: 58,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.line,
    justifyContent: "center",
    alignItems: "center",
  },
  stepDots: {
    flex: 1,
    marginHorizontal: 18,
    flexDirection: "row",
    gap: 6,
  },
  stepDot: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#EADDC8",
  },
  stepDotActive: { backgroundColor: Colors.primary },
  stepCount: { color: Colors.muted, fontSize: 11, fontWeight: "900" },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 34 },
  welcomeContent: { justifyContent: "center" },
  welcome: { paddingVertical: 30 },
  logoMark: {
    width: 84,
    height: 84,
    marginBottom: 24,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ rotate: "0deg" }],
    ...Shadow.streak,
  },
  welcomeEyebrow: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  welcomeTitle: {
    maxWidth: 345,
    marginTop: 7,
    color: Colors.ink,
    fontSize: 39,
    lineHeight: 43,
    fontWeight: "900",
    letterSpacing: -1.5,
  },
  welcomeBody: {
    maxWidth: 340,
    marginTop: 13,
    color: Colors.muted,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
  },
  valueCards: { marginVertical: 27, gap: 10 },
  welcomeValue: {
    minHeight: 67,
    padding: 12,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  welcomeValueIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFF0D3",
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeValueText: {
    flex: 1,
    color: Colors.ink,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },
  welcomeFootnote: {
    marginTop: 11,
    color: Colors.muted,
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },
  stepContent: { paddingTop: 20 },
  stepHeading: { marginBottom: 25 },
  stepEyebrow: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.35,
  },
  stepTitle: {
    maxWidth: 355,
    marginTop: 6,
    color: Colors.ink,
    fontSize: 32,
    lineHeight: 37,
    fontWeight: "900",
    letterSpacing: -1,
  },
  stepBody: {
    maxWidth: 350,
    marginTop: 9,
    color: Colors.muted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
  },
  formCard: {
    padding: 18,
    marginBottom: 18,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.line,
    ...Shadow.card,
  },
  inputLabel: {
    marginBottom: 7,
    color: Colors.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  fieldSpacing: { marginTop: 18 },
  input: {
    height: 55,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#FFF9EF",
    borderWidth: 1,
    borderColor: Colors.line,
    color: Colors.ink,
    fontSize: 16,
    fontWeight: "800",
  },
  reassuranceRow: {
    marginTop: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reassuranceText: {
    color: Colors.muted,
    fontSize: 10,
    fontWeight: "700",
  },
  sittingOptions: { flexDirection: "row", gap: 8 },
  sittingOption: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: "#F4EBDD",
    borderWidth: 1,
    borderColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  sittingOptionActive: {
    backgroundColor: "#FFF0D3",
    borderColor: Colors.primary,
  },
  sittingOptionText: {
    color: Colors.muted,
    fontSize: 10,
    fontWeight: "900",
  },
  sittingOptionTextActive: { color: Colors.primary },
  primaryButton: {
    minHeight: 56,
    paddingHorizontal: 21,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    ...Shadow.streak,
  },
  primaryButtonDisabled: { opacity: 0.55 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  buttonPressed: { transform: [{ scale: 0.985 }] },
  signedInCard: {
    padding: 17,
    marginBottom: 17,
    borderRadius: 22,
    backgroundColor: "#E9F7F0",
    borderWidth: 1,
    borderColor: "#BCE7D0",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  signedInIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  signedInBody: { flex: 1 },
  signedInTitle: { color: "#205F42", fontSize: 14, fontWeight: "900" },
  signedInText: {
    marginTop: 3,
    color: "#4E7A65",
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "700",
  },
  premiumCard: {
    padding: 19,
    overflow: "hidden",
    borderRadius: 28,
    backgroundColor: "#2D2824",
    borderWidth: 2,
    borderColor: "transparent",
  },
  premiumCardSelected: { borderColor: Colors.primary },
  bestValuePill: {
    alignSelf: "flex-start",
    marginBottom: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 13,
    backgroundColor: "#FFD98F",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  bestValueText: {
    color: "#7A3E00",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  planHeadingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 13,
  },
  premiumEyebrow: {
    color: "#FFD98F",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  premiumTitle: {
    maxWidth: 270,
    marginTop: 5,
    color: "#FFFFFF",
    fontSize: 21,
    lineHeight: 26,
    fontWeight: "900",
  },
  planCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#CDBEAF",
    justifyContent: "center",
    alignItems: "center",
  },
  planCheckActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  premiumBenefits: { marginTop: 19, gap: 11 },
  premiumBenefit: { flexDirection: "row", alignItems: "center", gap: 9 },
  premiumBenefitIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFD98F",
    justifyContent: "center",
    alignItems: "center",
  },
  premiumBenefitText: {
    flex: 1,
    color: "rgba(255,255,255,0.84)",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
  },
  premiumPromise: {
    marginTop: 19,
    padding: 12,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.09)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  premiumPromiseText: {
    flex: 1,
    color: "rgba(255,255,255,0.72)",
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "700",
  },
  freeCard: {
    marginTop: 11,
    marginBottom: 17,
    padding: 17,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: Colors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  freeCardSelected: { borderColor: Colors.primary },
  freePlanBody: { flex: 1 },
  freeTitle: { color: Colors.ink, fontSize: 15, fontWeight: "900" },
  freeText: {
    marginTop: 3,
    color: Colors.muted,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "700",
  },
  planFootnote: {
    marginTop: 11,
    paddingHorizontal: 12,
    color: Colors.muted,
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
