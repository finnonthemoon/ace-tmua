import AsyncStorage from "@react-native-async-storage/async-storage";

import { requireSupabase } from "@/lib/supabase";
import {
  disableStudyReminders,
  disableTrialEndingReminder,
} from "@/services/study-notifications";

export type AppleRevocationStatus =
  | "not-applicable"
  | "revoked"
  | "manual-required";

export type RevenueCatDeletionStatus =
  | "deleted"
  | "not-found"
  | "queued";

export interface AccountDeletionResult {
  deleted: true;
  appleRevocation: AppleRevocationStatus;
  revenueCatDeletion: RevenueCatDeletionStatus;
}

async function functionErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "context" in error &&
    error.context instanceof Response
  ) {
    try {
      const body = (await error.context.clone().json()) as { error?: unknown };
      if (typeof body.error === "string") return body.error;
    } catch {
      // Fall back to the SDK error below if the response is not JSON.
    }
  }

  if (error instanceof Error) return error.message;
  return "The account could not be deleted. Please try again.";
}

export async function requestAccountDeletion(
  appleAuthorizationCode?: string | null,
) {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke<AccountDeletionResult>(
    "delete-account",
    {
      body: {
        confirmation: "DELETE",
        appleAuthorizationCode: appleAuthorizationCode || undefined,
      },
    },
  );

  if (error) throw new Error(await functionErrorMessage(error));
  if (!data?.deleted) {
    throw new Error("The server did not confirm account deletion.");
  }

  return data;
}

export async function clearDeletedAccountFromDevice() {
  await Promise.allSettled([
    disableStudyReminders(),
    disableTrialEndingReminder(),
  ]);

  const keys = await AsyncStorage.getAllKeys();
  const accountKeys = keys.filter(
    (key) => key === "completedLessonIds" || key.startsWith("@ace-tmua/"),
  );
  if (accountKeys.length) await AsyncStorage.multiRemove(accountKeys);
}
