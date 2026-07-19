import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Purchases from "react-native-purchases";

import type { StudyDay } from "./account-storage";
import { REVENUECAT_ENTITLEMENT_ID } from "./revenuecat";

const STUDY_NOTIFICATION_IDS_KEY = "@ace-tmua/notifications/study-ids/v1";
const TRIAL_NOTIFICATION_ID_KEY = "@ace-tmua/notifications/trial-id/v1";
const STUDY_CHANNEL_ID = "study-reminders";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function hasNotificationPermission(
  permissions: Notifications.NotificationPermissionsStatus,
) {
  if (Platform.OS !== "ios") return permissions.granted;
  const status = permissions.ios?.status;
  return (
    status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    status === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
}

export async function requestNotificationPermission() {
  if (Platform.OS === "web") return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(STUDY_CHANNEL_ID, {
      name: "Study reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (hasNotificationPermission(current)) return true;
  if (!current.canAskAgain) return false;
  return hasNotificationPermission(
    await Notifications.requestPermissionsAsync(),
  );
}

async function storedIdentifiers(key: string) {
  const value = await AsyncStorage.getItem(key);
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

async function cancelStoredNotifications(key: string) {
  const identifiers = await storedIdentifiers(key);
  await Promise.all(
    identifiers.map((identifier) =>
      Notifications.cancelScheduledNotificationAsync(identifier),
    ),
  );
  await AsyncStorage.removeItem(key);
}

export async function scheduleStudyReminders(
  days: StudyDay[],
  time: string,
) {
  await cancelStoredNotifications(STUDY_NOTIFICATION_IDS_KEY);
  if (!(await requestNotificationPermission())) return false;

  const [hour, minute] = time.split(":").map(Number);
  const identifiers = await Promise.all(
    days.map((day) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: "Your TMUA session is ready",
          body: "A focused session today is one more step towards your target score.",
          sound: true,
          data: { route: "/" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          // App days use Monday=1; Expo notification days use Sunday=1.
          weekday: day === 7 ? 1 : day + 1,
          hour,
          minute,
          channelId: Platform.OS === "android" ? STUDY_CHANNEL_ID : undefined,
        },
      }),
    ),
  );

  await AsyncStorage.setItem(
    STUDY_NOTIFICATION_IDS_KEY,
    JSON.stringify(identifiers),
  );
  return true;
}

export async function disableStudyReminders() {
  await cancelStoredNotifications(STUDY_NOTIFICATION_IDS_KEY);
}

export async function scheduleTrialEndingReminder() {
  await cancelStoredNotifications(TRIAL_NOTIFICATION_ID_KEY);
  if (!(await requestNotificationPermission())) return false;

  const customerInfo = await Purchases.getCustomerInfo();
  const entitlement =
    customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID];
  if (
    entitlement?.periodType.toUpperCase() !== "TRIAL" ||
    !entitlement.expirationDateMillis
  ) {
    return false;
  }

  const remaining = entitlement.expirationDateMillis - Date.now();
  if (remaining <= 2 * 60 * 1000) return false;

  const leadTime = Math.min(24 * 60 * 60 * 1000, remaining / 2);
  const isDayBefore = leadTime >= 20 * 60 * 60 * 1000;
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Your Premium trial ends soon",
      body: isDayBefore
        ? "Your trial is due to end tomorrow. Review your plan in Profile whenever you’re ready."
        : "Your trial is due to end soon. Review your plan in Profile whenever you’re ready.",
      sound: true,
      data: { route: "/profile" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(entitlement.expirationDateMillis - leadTime),
      channelId: Platform.OS === "android" ? STUDY_CHANNEL_ID : undefined,
    },
  });

  await AsyncStorage.setItem(
    TRIAL_NOTIFICATION_ID_KEY,
    JSON.stringify([identifier]),
  );
  return true;
}

export async function disableTrialEndingReminder() {
  await cancelStoredNotifications(TRIAL_NOTIFICATION_ID_KEY);
}
