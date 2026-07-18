import type { AccountProfile, StudyDay } from "./account-storage";
import type { LessonActivity } from "./study-activity";
import type {
  PracticeResult,
  PracticeSession,
} from "@/components/practice/types";
import { supabase } from "@/lib/supabase";

export interface RemoteProfileRow {
  id: string;
  display_name: string;
  target_university: string;
  target_score: number;
  exam_sitting: string;
  study_days: StudyDay[];
  study_time: string;
  study_reminders_enabled: boolean;
  trial_reminder_enabled: boolean;
  onboarding_completed: boolean;
  premium_interest: boolean;
  created_at: string;
  updated_at: string;
}

async function currentUserId() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function fetchRemoteProfile(userId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  throwIfError(error);
  return data as RemoteProfileRow | null;
}

export async function fetchPremiumEntitlement(userId: string) {
  if (!supabase) return false;
  const { data, error } = await supabase
    .from("entitlements")
    .select("premium, expires_at")
    .eq("user_id", userId)
    .maybeSingle();
  throwIfError(error);

  if (!data?.premium) return false;
  return !data.expires_at || new Date(data.expires_at).getTime() > Date.now();
}

export async function upsertRemoteProfile(
  userId: string,
  profile: AccountProfile,
) {
  if (!supabase) return;
  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      display_name: profile.name,
      target_university: profile.targetUniversity,
      target_score: profile.targetScore,
      exam_sitting: profile.examSitting,
      study_days: profile.studyDays,
      study_time: profile.studyTime,
      study_reminders_enabled: profile.studyRemindersEnabled,
      trial_reminder_enabled: profile.trialReminderEnabled,
      onboarding_completed: profile.onboardingCompleted,
      premium_interest: profile.premiumInterest,
      updated_at: profile.updatedAt,
    },
    { onConflict: "id" },
  );
  throwIfError(error);
}

export async function pushLessonActivity(activity: LessonActivity) {
  if (!supabase) return;
  const userId = await currentUserId();
  if (!userId) return;

  const { error } = await supabase.from("study_activities").upsert(
    {
      user_id: userId,
      client_event_id: activity.id,
      activity_type: "lesson",
      reference_id: activity.lessonId,
      occurred_at: activity.completedAt,
      duration_seconds: activity.durationSeconds,
      correct_answers: activity.correctAnswers,
      total_answers: activity.totalAnswers,
    },
    { onConflict: "user_id,client_event_id" },
  );
  throwIfError(error);
}

export async function pushPracticeResult(result: PracticeResult) {
  if (!supabase) return;
  const userId = await currentUserId();
  if (!userId) return;

  const { error } = await supabase.from("practice_results").upsert(
    {
      user_id: userId,
      result_id: result.id,
      test_id: result.testId,
      completed_at: result.completedAt,
      score: result.score,
      max_score: result.maxScore,
      payload: result,
    },
    { onConflict: "user_id,result_id" },
  );
  throwIfError(error);
}

export async function pushPracticeSession(session: PracticeSession) {
  if (!supabase) return;
  const userId = await currentUserId();
  if (!userId) return;

  const { error } = await supabase.from("practice_sessions").upsert(
    {
      user_id: userId,
      test_id: session.testId,
      updated_at: session.updatedAt,
      payload: session,
    },
    { onConflict: "user_id,test_id" },
  );
  throwIfError(error);
}

export async function deleteRemotePracticeSession(testId: string) {
  if (!supabase) return;
  const userId = await currentUserId();
  if (!userId) return;

  const { error } = await supabase
    .from("practice_sessions")
    .delete()
    .eq("user_id", userId)
    .eq("test_id", testId);
  throwIfError(error);
}
