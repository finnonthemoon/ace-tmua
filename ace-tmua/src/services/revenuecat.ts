import type { CustomerInfo } from "react-native-purchases";
import { Platform } from "react-native";

export const REVENUECAT_ENTITLEMENT_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID?.trim() || "AceTMUA Pro";

interface RevenueCatConfiguration {
  apiKey: string;
  error: null;
}

interface MissingRevenueCatConfiguration {
  apiKey: null;
  error: string;
}

export function getRevenueCatConfiguration():
  | RevenueCatConfiguration
  | MissingRevenueCatConfiguration {
  const testKey = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY?.trim();

  if (__DEV__ && testKey) {
    return { apiKey: testKey, error: null };
  }

  const platformKey =
    Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim()
      : Platform.OS === "android"
        ? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim()
        : process.env.EXPO_PUBLIC_REVENUECAT_WEB_API_KEY?.trim();

  if (!platformKey) {
    return {
      apiKey: null,
      error: __DEV__
        ? "RevenueCat is not configured for this platform. Add the appropriate EXPO_PUBLIC_REVENUECAT key and restart Expo."
        : "Purchases are temporarily unavailable.",
    };
  }

  if (!__DEV__ && platformKey.startsWith("test_")) {
    return {
      apiKey: null,
      error: "A RevenueCat Test Store key cannot be used in a release build.",
    };
  }

  return { apiKey: platformKey, error: null };
}

export function hasPremiumEntitlement(customerInfo: CustomerInfo) {
  return Boolean(
    customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID],
  );
}

export function isAnonymousRevenueCatUser(appUserId: string) {
  return appUserId.startsWith("$RCAnonymousID:");
}

export function revenueCatErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "The purchase service could not be reached. Please try again.";
}
