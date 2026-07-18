import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCOUNT_PROFILE_KEY = "@ace-tmua/account/profile/v1";

export type ExamSitting = "october" | "january" | "undecided";
export type AccountType = "guest" | "authenticated";
export type PremiumStatus = "free" | "premium";
export type StudyDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface AccountProfile {
  id: string;
  name: string;
  email: string | null;
  targetUniversity: string;
  targetScore: number;
  examSitting: ExamSitting;
  studyDays: StudyDay[];
  studyTime: string;
  studyRemindersEnabled: boolean;
  trialReminderEnabled: boolean;
  onboardingCompleted: boolean;
  accountType: AccountType;
  premiumStatus: PremiumStatus;
  premiumInterest: boolean;
  createdAt: string;
  updatedAt: string;
}

function makeGuestId() {
  return `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyProfile(): AccountProfile {
  const now = new Date().toISOString();

  return {
    id: makeGuestId(),
    name: "",
    email: null,
    targetUniversity: "",
    targetScore: 7,
    examSitting: "october",
    studyDays: [1, 3, 5],
    studyTime: "18:00",
    studyRemindersEnabled: false,
    trialReminderEnabled: true,
    onboardingCompleted: false,
    accountType: "guest",
    premiumStatus: "free",
    premiumInterest: false,
    createdAt: now,
    updatedAt: now,
  };
}

function isExamSitting(value: unknown): value is ExamSitting {
  return value === "october" || value === "january" || value === "undecided";
}

function normaliseTargetScore(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 7;

  // Profiles created before the TMUA scale migration stored percentages.
  const migratedValue = value > 9 ? Math.min(9, value / 10) : value;
  return Math.round(Math.min(9, Math.max(1, migratedValue)) * 10) / 10;
}

function normaliseStudyDays(value: unknown): StudyDay[] {
  if (!Array.isArray(value)) return [1, 3, 5];
  const days = [...new Set(value)]
    .filter(
      (day): day is StudyDay =>
        typeof day === "number" && Number.isInteger(day) && day >= 1 && day <= 7,
    )
    .sort((a, b) => a - b);
  return days.length ? days : [1, 3, 5];
}

function normaliseStudyTime(value: unknown) {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
    ? value
    : "18:00";
}

function normaliseProfile(value: unknown): AccountProfile | null {
  if (!value || typeof value !== "object") return null;

  const profile = value as Partial<AccountProfile>;
  if (typeof profile.id !== "string") return null;

  const now = new Date().toISOString();
  return {
    id: profile.id,
    name: typeof profile.name === "string" ? profile.name : "",
    email: typeof profile.email === "string" ? profile.email : null,
    targetUniversity:
      typeof profile.targetUniversity === "string"
        ? profile.targetUniversity
        : "",
    targetScore: normaliseTargetScore(profile.targetScore),
    examSitting: isExamSitting(profile.examSitting)
      ? profile.examSitting
      : "undecided",
    studyDays: normaliseStudyDays(profile.studyDays),
    studyTime: normaliseStudyTime(profile.studyTime),
    studyRemindersEnabled: profile.studyRemindersEnabled === true,
    trialReminderEnabled: profile.trialReminderEnabled !== false,
    onboardingCompleted: profile.onboardingCompleted === true,
    accountType:
      profile.accountType === "authenticated" ? "authenticated" : "guest",
    premiumStatus:
      profile.premiumStatus === "premium" ? "premium" : "free",
    premiumInterest: profile.premiumInterest === true,
    createdAt:
      typeof profile.createdAt === "string" ? profile.createdAt : now,
    updatedAt:
      typeof profile.updatedAt === "string" ? profile.updatedAt : now,
  };
}

export async function getLocalAccountProfile() {
  const storedValue = await AsyncStorage.getItem(ACCOUNT_PROFILE_KEY);
  if (!storedValue) return null;

  try {
    return normaliseProfile(JSON.parse(storedValue));
  } catch {
    return null;
  }
}

export async function saveLocalAccountProfile(profile: AccountProfile) {
  const nextProfile = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(ACCOUNT_PROFILE_KEY, JSON.stringify(nextProfile));
  return nextProfile;
}
