import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "@supabase/supabase-js";

import { practiceTests } from "@/components/practice/practice-data";
import {
  ACTIVE_SESSION_PREFIX,
  RESULTS_KEY,
  getActiveSessions,
  getPracticeResults,
  mergePracticeResults,
} from "@/components/practice/practice-storage";
import type {
  PracticeResult,
  PracticeSession,
} from "@/components/practice/types";
import { supabase } from "@/lib/supabase";

import type {
  AccountProfile,
  ExamSitting,
  StudyDay,
} from "./account-storage";
import { saveLocalAccountProfile } from "./account-storage";
import {
  fetchPremiumEntitlement,
  fetchRemoteProfile,
  pushLessonActivity,
  pushPracticeResult,
  pushPracticeSession,
  upsertRemoteProfile,
} from "./cloud-api";
import {
  COMPLETED_LESSONS_KEY,
  LESSON_ACTIVITY_KEY,
  getLessonActivities,
  mergeLessonActivities,
} from "./study-activity";
import type { LessonActivity } from "./study-activity";

const LAST_SYNCED_USER_KEY = "@ace-tmua/account/last-synced-user/v1";

function parseStringArray(value: string | null) {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function isExamSitting(value: string): value is ExamSitting {
  return value === "october" || value === "january" || value === "undecided";
}

function remoteStudyDays(value: StudyDay[] | undefined, fallback: StudyDay[]) {
  if (!Array.isArray(value)) return fallback;
  const days = value.filter(
    (day): day is StudyDay =>
      Number.isInteger(day) && day >= 1 && day <= 7,
  );
  return days.length ? days : fallback;
}

function remoteTargetScore(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  const score = value! > 9 ? value! / 10 : value!;
  return Math.round(Math.min(9, Math.max(1, score)) * 10) / 10;
}

async function clearProgressFromPreviousUser() {
  await AsyncStorage.multiRemove([
    COMPLETED_LESSONS_KEY,
    LESSON_ACTIVITY_KEY,
    RESULTS_KEY,
    ...practiceTests.map((test) => `${ACTIVE_SESSION_PREFIX}${test.id}`),
  ]);
}

async function uploadLocalProgress(userId: string) {
  if (!supabase) return;
  const [completedValue, activities, results, sessions] = await Promise.all([
    AsyncStorage.getItem(COMPLETED_LESSONS_KEY),
    getLessonActivities(),
    getPracticeResults(),
    getActiveSessions(practiceTests.map((test) => test.id)),
  ]);
  const completedLessonIds = parseStringArray(completedValue);
  const activityLessonIds = new Set(
    activities.map((activity) => activity.lessonId),
  );
  const completionsWithoutActivity = completedLessonIds.filter(
    (lessonId) => !activityLessonIds.has(lessonId),
  );

  if (completionsWithoutActivity.length > 0) {
    const { error } = await supabase.from("lesson_progress").upsert(
      completionsWithoutActivity.map((lessonId) => ({
        user_id: userId,
        lesson_id: lessonId,
        completed_at: new Date().toISOString(),
      })),
      { ignoreDuplicates: true, onConflict: "user_id,lesson_id" },
    );
    if (error) throw error;
  }

  await Promise.all([
    ...activities.map(pushLessonActivity),
    ...results.map(pushPracticeResult),
    ...sessions.map(pushPracticeSession),
  ]);
}

async function downloadRemoteProgress(userId: string) {
  if (!supabase) return;
  const [lessonsResponse, activitiesResponse, resultsResponse, sessionsResponse] =
    await Promise.all([
      supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId),
      supabase
        .from("study_activities")
        .select(
          "client_event_id, reference_id, occurred_at, duration_seconds, correct_answers, total_answers",
        )
        .eq("user_id", userId)
        .eq("activity_type", "lesson"),
      supabase
        .from("practice_results")
        .select("payload")
        .eq("user_id", userId),
      supabase
        .from("practice_sessions")
        .select("payload")
        .eq("user_id", userId),
    ]);

  const firstError =
    lessonsResponse.error ??
    activitiesResponse.error ??
    resultsResponse.error ??
    sessionsResponse.error;
  if (firstError) throw firstError;

  const localCompleted = parseStringArray(
    await AsyncStorage.getItem(COMPLETED_LESSONS_KEY),
  );
  const completedIds = new Set(localCompleted);
  lessonsResponse.data?.forEach((row) => completedIds.add(row.lesson_id));
  await AsyncStorage.setItem(
    COMPLETED_LESSONS_KEY,
    JSON.stringify([...completedIds]),
  );

  const activities = (activitiesResponse.data ?? []).map<LessonActivity>(
    (row) => ({
      id: row.client_event_id,
      lessonId: row.reference_id,
      completedAt: row.occurred_at,
      durationSeconds: row.duration_seconds,
      correctAnswers: row.correct_answers,
      totalAnswers: row.total_answers,
    }),
  );
  await mergeLessonActivities(activities);

  const results = (resultsResponse.data ?? [])
    .map((row) => row.payload as PracticeResult)
    .filter((result) => Boolean(result?.id));
  await mergePracticeResults(results);

  const remoteSessions = (sessionsResponse.data ?? [])
    .map((row) => row.payload as PracticeSession)
    .filter((session) => Boolean(session?.id));
  const localSessions = await getActiveSessions(
    practiceTests.map((test) => test.id),
  );
  const localByTest = new Map(localSessions.map((session) => [session.testId, session]));

  await Promise.all(
    remoteSessions.map(async (remoteSession) => {
      const localSession = localByTest.get(remoteSession.testId);
      if (
        !localSession ||
        new Date(remoteSession.updatedAt).getTime() >
          new Date(localSession.updatedAt).getTime()
      ) {
        await AsyncStorage.setItem(
          `${ACTIVE_SESSION_PREFIX}${remoteSession.testId}`,
          JSON.stringify(remoteSession),
        );
      }
    }),
  );
}

export async function syncAccountForSession(
  localProfile: AccountProfile,
  user: User,
) {
  if (!supabase) return localProfile;
  const previousUserId = await AsyncStorage.getItem(LAST_SYNCED_USER_KEY);
  const isDifferentUser = Boolean(
    previousUserId && previousUserId !== user.id,
  );

  if (isDifferentUser) {
    await clearProgressFromPreviousUser();
  } else {
    await uploadLocalProgress(user.id);
  }

  const [remoteProfile, premium] = await Promise.all([
    fetchRemoteProfile(user.id),
    fetchPremiumEntitlement(user.id),
  ]);
  const remoteUpdatedAt = remoteProfile
    ? new Date(remoteProfile.updated_at).getTime()
    : 0;
  const localUpdatedAt = new Date(localProfile.updatedAt).getTime();
  const preferRemote =
    Boolean(remoteProfile) &&
    (isDifferentUser ||
      (remoteProfile?.onboarding_completed === true &&
        !localProfile.onboardingCompleted) ||
      (remoteProfile?.onboarding_completed === true &&
        localProfile.onboardingCompleted &&
        remoteUpdatedAt > localUpdatedAt));
  const remoteName =
    remoteProfile?.display_name.trim() ||
    (user.user_metadata.full_name as string | undefined) ||
    "";

  const nextProfile: AccountProfile = {
    ...localProfile,
    id: user.id,
    name: preferRemote
      ? remoteName || (isDifferentUser ? "TMUA student" : localProfile.name)
      : localProfile.name ||
        remoteName ||
        "TMUA student",
    email: user.email ?? localProfile.email,
    targetUniversity: preferRemote
      ? remoteProfile?.target_university ?? ""
      : localProfile.targetUniversity || remoteProfile?.target_university || "",
    targetScore: preferRemote
      ? remoteTargetScore(remoteProfile?.target_score, localProfile.targetScore)
      : localProfile.targetScore,
    examSitting:
      preferRemote &&
      remoteProfile &&
      isExamSitting(remoteProfile.exam_sitting)
        ? remoteProfile.exam_sitting
        : localProfile.examSitting,
    studyDays:
      preferRemote && remoteProfile
        ? remoteStudyDays(remoteProfile.study_days, localProfile.studyDays)
        : localProfile.studyDays,
    studyTime:
      preferRemote && remoteProfile?.study_time
        ? remoteProfile.study_time.slice(0, 5)
        : localProfile.studyTime,
    studyRemindersEnabled: preferRemote
      ? remoteProfile?.study_reminders_enabled === true
      : localProfile.studyRemindersEnabled,
    trialReminderEnabled: preferRemote
      ? remoteProfile?.trial_reminder_enabled !== false
      : localProfile.trialReminderEnabled,
    onboardingCompleted: preferRemote
      ? remoteProfile?.onboarding_completed ?? localProfile.onboardingCompleted
      : localProfile.onboardingCompleted ||
        remoteProfile?.onboarding_completed === true,
    accountType: "authenticated",
    premiumStatus: premium ? "premium" : "free",
    premiumInterest: preferRemote
      ? remoteProfile?.premium_interest === true
      : localProfile.premiumInterest || remoteProfile?.premium_interest === true,
    createdAt: remoteProfile?.created_at ?? localProfile.createdAt,
    updatedAt: preferRemote
      ? remoteProfile?.updated_at ?? localProfile.updatedAt
      : localProfile.updatedAt,
  };

  const savedProfile = await saveLocalAccountProfile(nextProfile);
  await upsertRemoteProfile(user.id, savedProfile);
  await downloadRemoteProgress(user.id);
  await AsyncStorage.setItem(LAST_SYNCED_USER_KEY, user.id);
  return savedProfile;
}
