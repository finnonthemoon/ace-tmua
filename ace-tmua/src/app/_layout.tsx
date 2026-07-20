import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import {
  DefaultTheme,
  Stack,
  ThemeProvider,
  useRouter,
  useSegments,
} from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { Colors } from "@/constants/theme";
import { AccountProvider, useAccount } from "@/contexts/AccountContext";

const aceTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.cream,
    card: Colors.cream,
    text: Colors.ink,
    border: Colors.line,
    notification: Colors.primary,
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={aceTheme}>
      <AccountProvider>
        <RootNavigator />
      </AccountProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { isLoading, profile } = useAccount();

  useEffect(() => {
    const openNotificationRoute = (
      notification: Notifications.Notification,
    ) => {
      const route = notification.request.content.data?.route;
      if (route === "/" || route === "/profile") {
        router.push(route);
      }
    };

    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse?.notification) {
      openNotificationRoute(lastResponse.notification);
    }

    const subscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        openNotificationRoute(response.notification);
      });

    return () => subscription.remove();
  }, [router]);

  useEffect(() => {
    if (isLoading) return;

    const rootSegment = segments[0];
    const isOnboardingRoute = rootSegment === "onboarding";
    const isPublicAccountRoute =
      rootSegment === "sign-in" ||
      rootSegment === "auth" ||
      rootSegment === "reset-password";

    if (
      !profile.onboardingCompleted &&
      !isOnboardingRoute &&
      !isPublicAccountRoute
    ) {
      router.replace("/onboarding");
    } else if (profile.onboardingCompleted && isOnboardingRoute) {
      router.replace("/");
    }
  }, [isLoading, profile.onboardingCompleted, router, segments]);

  if (isLoading) {
    return (
      <View style={styles.accountLoading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ animation: "none" }} />
      <Stack.Screen name="lesson/[lessonId]" />
      <Stack.Screen name="practice" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="premium" />
      <Stack.Screen name="auth/callback" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  accountLoading: {
    flex: 1,
    backgroundColor: Colors.cream,
    justifyContent: "center",
    alignItems: "center",
  },
});
