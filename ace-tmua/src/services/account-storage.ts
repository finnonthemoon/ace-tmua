import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCOUNT_PROFILE_KEY = "@ace-tmua/account/profile/v1";

export type ExamSitting = "october" | "january" | "undecided";
export type AccountType = "guest" | "authenticated";
export type PremiumStatus = "free" | "premium";

export interface AccountProfile {
  id: string;
  name: string;
  email: string | null;
  targetUniversity: string;
  targetScore: number;
  examSitting: ExamSitting;
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
    targetScore: 70,
    examSitting: "october",
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
    targetScore:
      typeof profile.targetScore === "number" ? profile.targetScore : 70,
    examSitting: isExamSitting(profile.examSitting)
      ? profile.examSitting
      : "undecided",
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
