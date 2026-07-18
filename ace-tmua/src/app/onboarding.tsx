import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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
import {
  OTHER_UNIVERSITY,
  TMUA_UNIVERSITIES,
} from "@/data/tmua-universities";
import type { ExamSitting, StudyDay } from "@/services/account-storage";
import {
  disableStudyReminders,
  requestNotificationPermission,
  scheduleStudyReminders,
  scheduleTrialEndingReminder,
} from "@/services/study-notifications";

const TOTAL_STEPS = 6;
const STUDY_DAYS: { day: StudyDay; short: string; full: string }[] = [
  { day: 1, short: "M", full: "Monday" },
  { day: 2, short: "T", full: "Tuesday" },
  { day: 3, short: "W", full: "Wednesday" },
  { day: 4, short: "T", full: "Thursday" },
  { day: 5, short: "F", full: "Friday" },
  { day: 6, short: "S", full: "Saturday" },
  { day: 7, short: "S", full: "Sunday" },
];
const STUDY_TIMES = Array.from({ length: 31 }, (_, index) => {
  const totalMinutes = 7 * 60 + index * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
});

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
  const [customUniversity, setCustomUniversity] = useState(
    profile.targetUniversity &&
      !TMUA_UNIVERSITIES.includes(
        profile.targetUniversity as (typeof TMUA_UNIVERSITIES)[number],
      )
      ? profile.targetUniversity
      : "",
  );
  const [usingOtherUniversity, setUsingOtherUniversity] = useState(
    Boolean(
      profile.targetUniversity &&
        !TMUA_UNIVERSITIES.includes(
          profile.targetUniversity as (typeof TMUA_UNIVERSITIES)[number],
        ),
    ),
  );
  const [universityPickerVisible, setUniversityPickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [targetScore, setTargetScore] = useState(profile.targetScore);
  const [examSitting, setExamSitting] = useState<ExamSitting>(
    profile.examSitting,
  );
  const [studyDays, setStudyDays] = useState<StudyDay[]>(profile.studyDays);
  const [studyTime, setStudyTime] = useState(profile.studyTime);
  const [studyRemindersEnabled, setStudyRemindersEnabled] = useState(
    profile.studyRemindersEnabled,
  );
  const [trialReminderEnabled, setTrialReminderEnabled] = useState(
    profile.trialReminderEnabled,
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
    const university = usingOtherUniversity
      ? customUniversity.trim()
      : targetUniversity.trim();
    if (!university) {
      Alert.alert(
        "Choose your university",
        "Select a university or enter your own target to continue.",
      );
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        targetUniversity: university,
        targetScore,
        examSitting,
      });
      setStep(3);
    } finally {
      setSaving(false);
    }
  };

  const toggleStudyDay = (day: StudyDay) => {
    setStudyDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day].sort((a, b) => a - b),
    );
  };

  const saveStudyPlan = async () => {
    if (!studyDays.length) {
      Alert.alert(
        "Choose at least one day",
        "A small repeatable commitment is more useful than a perfect plan you cannot keep.",
      );
      return;
    }

    setSaving(true);
    try {
      let studyNotifications = studyRemindersEnabled;
      let trialNotifications = trialReminderEnabled;

      if (studyNotifications || trialNotifications) {
        const permissionGranted = await requestNotificationPermission();
        if (!permissionGranted) {
          studyNotifications = false;
          trialNotifications = false;
          setStudyRemindersEnabled(false);
          setTrialReminderEnabled(false);
          Alert.alert(
            "Reminders are off",
            "Your timetable is saved. You can enable notifications later from your device settings.",
          );
        }
      }

      if (studyNotifications) {
        await scheduleStudyReminders(studyDays, studyTime);
      } else {
        await disableStudyReminders();
      }

      await updateProfile({
        studyDays,
        studyTime,
        studyRemindersEnabled: studyNotifications,
        trialReminderEnabled: trialNotifications,
      });
      setStep(4);
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
          if (
            (result === "purchased" || result === "restored") &&
            trialReminderEnabled
          ) {
            await scheduleTrialEndingReminder();
          }
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
                title="Picture the result you’re working towards"
                body="A clear target turns practice into progress. You can change any of this later."
              />

              <View style={styles.formCard}>
                <Text style={styles.inputLabel}>TARGET UNIVERSITY</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setUniversityPickerVisible(true)}
                  style={styles.dropdown}
                >
                  <View style={styles.dropdownBody}>
                    <Text
                      numberOfLines={1}
                      style={
                        targetUniversity || usingOtherUniversity
                          ? styles.dropdownText
                          : styles.dropdownPlaceholder
                      }
                    >
                      {usingOtherUniversity
                        ? OTHER_UNIVERSITY
                        : targetUniversity || "Choose a university"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={19} color={Colors.primary} />
                </Pressable>

                {usingOtherUniversity ? (
                  <TextInput
                    autoCapitalize="words"
                    onChangeText={setCustomUniversity}
                    placeholder="Enter your target university"
                    placeholderTextColor="#A89587"
                    style={[styles.input, styles.otherUniversityInput]}
                    value={customUniversity}
                  />
                ) : null}

                <Text style={styles.courseNote}>
                  TMUA requirements vary by course and admissions year, so always check the official course page.
                </Text>

                <Text style={[styles.inputLabel, styles.fieldSpacing]}>
                  TARGET TMUA SCORE
                </Text>
                <View style={styles.scorePicker}>
                  <Pressable
                    accessibilityLabel="Reduce target score"
                    disabled={targetScore <= 1}
                    onPress={() =>
                      setTargetScore((score) =>
                        Math.max(1, Math.round((score - 0.1) * 10) / 10),
                      )
                    }
                    style={styles.scoreButton}
                  >
                    <Ionicons name="remove" size={23} color={Colors.primary} />
                  </Pressable>
                  <View style={styles.scoreValueWrap}>
                    <Text style={styles.scoreValue}>{targetScore.toFixed(1)}</Text>
                    <Text style={styles.scoreScale}>OUT OF 9.0</Text>
                  </View>
                  <Pressable
                    accessibilityLabel="Increase target score"
                    disabled={targetScore >= 9}
                    onPress={() =>
                      setTargetScore((score) =>
                        Math.min(9, Math.round((score + 0.1) * 10) / 10),
                      )
                    }
                    style={styles.scoreButton}
                  >
                    <Ionicons name="add" size={23} color={Colors.primary} />
                  </Pressable>
                </View>
                <View style={styles.scoreQuickRow}>
                  {[6, 7, 8, 9].map((score) => (
                    <Pressable
                      key={score}
                      onPress={() => setTargetScore(score)}
                      style={[
                        styles.scoreQuickOption,
                        targetScore === score && styles.scoreQuickOptionActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.scoreQuickText,
                          targetScore === score && styles.scoreQuickTextActive,
                        ]}
                      >
                        {score.toFixed(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.scoreEncouragement}>
                  {scoreEncouragement(targetScore)}
                </Text>

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
                label="Make this my target"
                onPress={() => void saveGoals()}
              />
            </View>
          ) : null}

          {step === 3 ? (
            <View style={styles.stepContent}>
              <StepHeading
                eyebrow="YOUR ROUTINE"
                title="Make your goal part of the week"
                body="Choose a rhythm you can keep. Short, regular sessions beat occasional marathon revision."
              />

              <View style={styles.formCard}>
                <Text style={styles.inputLabel}>STUDY DAYS</Text>
                <View style={styles.dayRow}>
                  {STUDY_DAYS.map(({ day, short, full }) => {
                    const active = studyDays.includes(day);
                    return (
                      <Pressable
                        accessibilityLabel={full}
                        accessibilityState={{ selected: active }}
                        key={day}
                        onPress={() => toggleStudyDay(day)}
                        style={[styles.dayButton, active && styles.dayButtonActive]}
                      >
                        <Text style={[styles.dayText, active && styles.dayTextActive]}>
                          {short}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={[styles.inputLabel, styles.fieldSpacing]}>START TIME</Text>
                <Pressable
                  onPress={() => setTimePickerVisible(true)}
                  style={styles.dropdown}
                >
                  <View style={styles.dropdownBody}>
                    <Text style={styles.dropdownText}>{formatTime(studyTime)}</Text>
                  </View>
                  <Ionicons name="time-outline" size={20} color={Colors.primary} />
                </Pressable>

                <View style={styles.commitmentSummary}>
                  <View style={styles.commitmentIcon}>
                    <Ionicons name="calendar" size={19} color={Colors.primary} />
                  </View>
                  <View style={styles.commitmentBody}>
                    <Text style={styles.commitmentTitle}>Your weekly commitment</Text>
                    <Text style={styles.commitmentText}>
                      {studyPlanSummary(studyDays, studyTime)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.reminderList}>
                <ReminderChoice
                  body="A gentle prompt on each study day."
                  enabled={studyRemindersEnabled}
                  icon="notifications-outline"
                  onPress={() => setStudyRemindersEnabled((value) => !value)}
                  title="Study reminders"
                />
                <ReminderChoice
                  body="If you start an eligible 7-day trial, we’ll remind you before its real expiry time."
                  enabled={trialReminderEnabled}
                  icon="shield-checkmark-outline"
                  onPress={() => setTrialReminderEnabled((value) => !value)}
                  title="Trial-ending reminder"
                />
              </View>
              <Text style={styles.permissionNote}>
                Your device will ask for notification permission after you continue. You stay in control and can turn reminders off at any time.
              </Text>

              <PrimaryButton
                busy={saving}
                label="Commit to my plan"
                onPress={() => void saveStudyPlan()}
              />
            </View>
          ) : null}

          {step === 4 ? (
            <View style={styles.stepContent}>
              <StepHeading
                eyebrow="KEEP YOUR PROGRESS"
                title="Keep every step towards your target"
                body="Create an account to protect lessons, mock results and your streak across devices. Guest mode still works here."
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
                    setStep(5);
                  }}
                  onGuest={() =>
                    void continueAsGuest().then(() => setStep(5))
                  }
                  showGuest
                />
              )}

              {isSignedIn ? (
                <PrimaryButton label="Continue" onPress={() => setStep(5)} />
              ) : null}
            </View>
          ) : null}

          {step === 5 ? (
            <View style={styles.stepContent}>
              <StepHeading
                eyebrow="CHOOSE YOUR EXPERIENCE"
                title={`${name.trim() || "You"}, your ${targetScore.toFixed(1)} plan is ready`}
                body="You have a target and a routine. Premium gives that commitment the complete lesson and mock-paper system."
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
                  <Text style={styles.bestValueText}>START WITH 7 DAYS FREE</Text>
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

                <View style={styles.trialBanner}>
                  <View>
                    <Text style={styles.trialEyebrow}>TRY THE COMPLETE PLAN</Text>
                    <Text style={styles.trialTitle}>Explore everything for 7 days</Text>
                  </View>
                  <Text style={styles.trialPrice}>£0 today</Text>
                </View>

                <View style={styles.premiumPromise}>
                  <Ionicons name="notifications-outline" size={17} color="#FFFFFF" />
                  <Text style={styles.premiumPromiseText}>
                    {trialReminderEnabled
                      ? "If your plan includes the trial, we’ll remind you before it ends."
                      : "Secure Apple or Google checkout. Cancel through your store account."}
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
                    ? "Start my 7-day free trial"
                    : "Start learning free"
                }
                onPress={() => void finish()}
              />
              <Text style={styles.planFootnote}>
                Trial availability and the price after trial are shown in the secure store paywall before you confirm. Cancel at least 24 hours before renewal to avoid being charged.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <OptionPickerModal
        onClose={() => setUniversityPickerVisible(false)}
        title="Target university"
        visible={universityPickerVisible}
      >
        {[...TMUA_UNIVERSITIES, OTHER_UNIVERSITY].map((university) => (
          <OptionPickerRow
            active={
              university === OTHER_UNIVERSITY
                ? usingOtherUniversity
                : !usingOtherUniversity && targetUniversity === university
            }
            key={university}
            label={university}
            onPress={() => {
              if (university === OTHER_UNIVERSITY) {
                setUsingOtherUniversity(true);
                setTargetUniversity("");
              } else {
                setUsingOtherUniversity(false);
                setTargetUniversity(university);
              }
              setUniversityPickerVisible(false);
            }}
          />
        ))}
      </OptionPickerModal>

      <OptionPickerModal
        onClose={() => setTimePickerVisible(false)}
        title="Study start time"
        visible={timePickerVisible}
      >
        <View style={styles.timeGrid}>
          {STUDY_TIMES.map((time) => (
            <Pressable
              key={time}
              onPress={() => {
                setStudyTime(time);
                setTimePickerVisible(false);
              }}
              style={[
                styles.timeOption,
                time === studyTime && styles.timeOptionActive,
              ]}
            >
              <Text
                style={[
                  styles.timeOptionText,
                  time === studyTime && styles.timeOptionTextActive,
                ]}
              >
                {formatTime(time)}
              </Text>
            </Pressable>
          ))}
        </View>
      </OptionPickerModal>
    </SafeAreaView>
  );
}

function scoreEncouragement(score: number) {
  if (score >= 8) return "An exceptional target. We’ll help you build the accuracy and composure it demands.";
  if (score >= 7) return "An ambitious target—and a realistic one to work towards with consistent, focused practice.";
  if (score >= 6) return "A strong target. Every topic you master gives you more room to perform on exam day.";
  return "A worthwhile target. Start with the foundations and let each small improvement build confidence.";
}

function formatTime(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  const suffix = hour >= 12 ? "pm" : "am";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function studyPlanSummary(days: StudyDay[], time: string) {
  if (!days.length) return "Choose at least one day";
  const labels = days.map(
    (day) => STUDY_DAYS.find((item) => item.day === day)?.full.slice(0, 3) ?? "",
  );
  return `${labels.join(", ")} at ${formatTime(time)} · ${days.length} ${days.length === 1 ? "session" : "sessions"} each week`;
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

function ReminderChoice({
  body,
  enabled,
  icon,
  onPress,
  title,
}: {
  body: string;
  enabled: boolean;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  title: string;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: enabled }}
      onPress={onPress}
      style={[styles.reminderChoice, enabled && styles.reminderChoiceActive]}
    >
      <View style={styles.reminderIcon}>
        <Ionicons name={icon} size={21} color={Colors.primary} />
      </View>
      <View style={styles.reminderBody}>
        <Text style={styles.reminderTitle}>{title}</Text>
        <Text style={styles.reminderText}>{body}</Text>
      </View>
      <View style={[styles.toggleTrack, enabled && styles.toggleTrackActive]}>
        <View style={[styles.toggleThumb, enabled && styles.toggleThumbActive]} />
      </View>
    </Pressable>
  );
}

function OptionPickerModal({
  children,
  onClose,
  title,
  visible,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  visible: boolean;
}) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.modalBackdrop}>
        <SafeAreaView style={styles.modalSheet} edges={["bottom"]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable accessibilityLabel="Close" onPress={onClose} style={styles.modalClose}>
              <Ionicons name="close" size={21} color={Colors.ink} />
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function OptionPickerRow({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.optionPickerRow, active && styles.optionPickerRowActive]}
    >
      <Text style={styles.optionPickerText}>{label}</Text>
      <View style={[styles.optionRadio, active && styles.optionRadioActive]}>
        {active ? <View style={styles.optionRadioDot} /> : null}
      </View>
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
  dropdown: {
    minHeight: 55,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#FFF9EF",
    borderWidth: 1,
    borderColor: Colors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dropdownBody: { flex: 1 },
  dropdownText: { color: Colors.ink, fontSize: 14, fontWeight: "800" },
  dropdownPlaceholder: { color: "#A89587", fontSize: 14, fontWeight: "700" },
  otherUniversityInput: { marginTop: 10 },
  courseNote: {
    marginTop: 10,
    color: Colors.muted,
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "600",
  },
  scorePicker: {
    minHeight: 90,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#FFF5E2",
    borderWidth: 1,
    borderColor: "#FFD79B",
    flexDirection: "row",
    alignItems: "center",
  },
  scoreButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.line,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreValueWrap: { flex: 1, alignItems: "center" },
  scoreValue: {
    color: Colors.ink,
    fontSize: 39,
    lineHeight: 42,
    fontWeight: "900",
    letterSpacing: -1.4,
  },
  scoreScale: {
    color: Colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  scoreQuickRow: { marginTop: 9, flexDirection: "row", gap: 7 },
  scoreQuickOption: {
    flex: 1,
    minHeight: 36,
    borderRadius: 12,
    backgroundColor: "#F4EBDD",
    justifyContent: "center",
    alignItems: "center",
  },
  scoreQuickOptionActive: { backgroundColor: Colors.primary },
  scoreQuickText: { color: Colors.muted, fontSize: 10, fontWeight: "900" },
  scoreQuickTextActive: { color: "#FFFFFF" },
  scoreEncouragement: {
    marginTop: 10,
    color: Colors.muted,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "700",
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
  dayRow: { flexDirection: "row", justifyContent: "space-between", gap: 5 },
  dayButton: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 42,
    borderRadius: 15,
    backgroundColor: "#F4EBDD",
    borderWidth: 1,
    borderColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  dayButtonActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayText: { color: Colors.muted, fontSize: 11, fontWeight: "900" },
  dayTextActive: { color: "#FFFFFF" },
  commitmentSummary: {
    marginTop: 15,
    padding: 13,
    borderRadius: 17,
    backgroundColor: "#FFF0D3",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  commitmentIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  commitmentBody: { flex: 1 },
  commitmentTitle: { color: Colors.ink, fontSize: 11, fontWeight: "900" },
  commitmentText: {
    marginTop: 2,
    color: Colors.muted,
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "700",
  },
  reminderList: { marginBottom: 10, gap: 9 },
  reminderChoice: {
    minHeight: 74,
    padding: 12,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  reminderChoiceActive: { borderColor: "#F4B550", backgroundColor: "#FFFCF5" },
  reminderIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFF0D3",
    justifyContent: "center",
    alignItems: "center",
  },
  reminderBody: { flex: 1 },
  reminderTitle: { color: Colors.ink, fontSize: 12, fontWeight: "900" },
  reminderText: {
    marginTop: 2,
    color: Colors.muted,
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "700",
  },
  toggleTrack: {
    width: 42,
    height: 25,
    padding: 3,
    borderRadius: 13,
    backgroundColor: "#DED4C7",
  },
  toggleTrackActive: { backgroundColor: Colors.primary },
  toggleThumb: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  toggleThumbActive: { alignSelf: "flex-end" },
  permissionNote: {
    marginBottom: 15,
    paddingHorizontal: 6,
    color: Colors.muted,
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "600",
    textAlign: "center",
  },
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
  trialBanner: {
    marginTop: 18,
    padding: 13,
    borderRadius: 16,
    backgroundColor: "#FFF0D3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  trialEyebrow: {
    color: Colors.primary,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  trialTitle: { marginTop: 3, color: Colors.ink, fontSize: 11, fontWeight: "900" },
  trialPrice: { color: "#7A3E00", fontSize: 14, fontWeight: "900" },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(45,36,31,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    maxHeight: "82%",
    paddingTop: 9,
    paddingHorizontal: 18,
    backgroundColor: Colors.cream,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  modalHandle: {
    width: 42,
    height: 5,
    alignSelf: "center",
    borderRadius: 3,
    backgroundColor: "#D8CBBB",
  },
  modalHeader: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: { color: Colors.ink, fontSize: 22, fontWeight: "900" },
  modalClose: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: { paddingBottom: 18, gap: 8 },
  optionPickerRow: {
    minHeight: 60,
    paddingHorizontal: 15,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionPickerRowActive: { borderColor: Colors.primary, backgroundColor: "#FFF8EA" },
  optionPickerText: {
    flex: 1,
    color: Colors.ink,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },
  optionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CFC1B2",
    justifyContent: "center",
    alignItems: "center",
  },
  optionRadioActive: { borderColor: Colors.primary },
  optionRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timeOption: {
    width: "31%",
    minHeight: 45,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.line,
    justifyContent: "center",
    alignItems: "center",
  },
  timeOptionActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timeOptionText: { color: Colors.ink, fontSize: 10, fontWeight: "800" },
  timeOptionTextActive: { color: "#FFFFFF" },
});
