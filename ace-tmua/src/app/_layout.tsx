import { useEffect, useRef, useState, type ComponentProps } from "react";
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";
import { Tabs, useRouter, useSegments } from "expo-router";
import * as Notifications from "expo-notifications";
import {
  GlassContainer,
  GlassView,
  isGlassEffectAPIAvailable,
} from "expo-glass-effect";
import { Ionicons } from "@expo/vector-icons";
import {
  Animated,
  ActivityIndicator,
  type ColorValue,
  type GestureResponderEvent,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "../constants/theme";
import { AccountProvider, useAccount } from "../contexts/AccountContext";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface TabIconProps {
  name: IoniconName;
  color: ColorValue;
  focused: boolean;
}

function TabIcon({ name, color, focused }: TabIconProps) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons name={name} size={24} color={color} />
    </View>
  );
}

const tabIcons: Record<string, IoniconName> = {
  index: "home-outline",
  learn: "git-network-outline",
  leaderboard: "medal-outline",
  questions: "help-circle-outline",
  profile: "person-outline",
};

const GLASS_BEAD_SIZE = 58;

function getBeadPosition(index: number, itemWidth: number) {
  return itemWidth * index + (itemWidth - GLASS_BEAD_SIZE) / 2;
}

function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const tabBarRef = useRef<View>(null);
  const barPageX = useRef(0);
  const [beadX] = useState(() => new Animated.Value(0));
  const isDragging = useRef(false);
  const focusedRoute = state.routes[state.index];
  const canUseLiquidGlass =
    Platform.OS === "ios" && isGlassEffectAPIAvailable();
  const visibleRoutes = state.routes.filter((route) => tabIcons[route.name]);

  const focusedVisibleIndex = Math.max(
    0,
    visibleRoutes.findIndex((route) => route.key === focusedRoute.key),
  );
  const itemWidth = barWidth / visibleRoutes.length;

  useEffect(() => {
    if (!barWidth || isDragging.current) {
      return;
    }

    Animated.spring(beadX, {
      toValue: getBeadPosition(focusedVisibleIndex, itemWidth),
      damping: 19,
      stiffness: 210,
      mass: 0.7,
      useNativeDriver: true,
    }).start();
  }, [barWidth, beadX, focusedVisibleIndex, itemWidth]);

  if (!tabIcons[focusedRoute.name]) {
    return null;
  }

  const moveBead = (event: GestureResponderEvent) => {
    if (!itemWidth) {
      return;
    }

    const localX = event.nativeEvent.pageX - barPageX.current;
    const nextX = Math.min(
      barWidth - GLASS_BEAD_SIZE,
      Math.max(0, localX - GLASS_BEAD_SIZE / 2),
    );
    beadX.setValue(nextX);
  };

  const finishDragging = (event: GestureResponderEvent) => {
    isDragging.current = false;

    if (!itemWidth) {
      return;
    }

    const localX = event.nativeEvent.pageX - barPageX.current;
    const nextIndex = Math.min(
      visibleRoutes.length - 1,
      Math.max(0, Math.floor(localX / itemWidth)),
    );
    const route = visibleRoutes[nextIndex];

    Animated.spring(beadX, {
      toValue: getBeadPosition(nextIndex, itemWidth),
      damping: 17,
      stiffness: 230,
      mass: 0.65,
      useNativeDriver: true,
    }).start();

    if (route && route.key !== focusedRoute.key) {
      const tabEvent = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });

      if (!tabEvent.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    }
  };

  return (
    <View
      ref={tabBarRef}
      style={[
        styles.tabBar,
        {
          bottom: Math.max(insets.bottom - 18, 10),
        },
      ]}
    >
      <GlassContainer
        spacing={14}
        onLayout={(event) => {
          setBarWidth(event.nativeEvent.layout.width);
          tabBarRef.current?.measureInWindow((x) => {
            barPageX.current = x;
          });
        }}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) => {
          isDragging.current = true;
          beadX.stopAnimation();
          moveBead(event);
        }}
        onResponderMove={moveBead}
        onResponderRelease={finishDragging}
        onResponderTerminate={() => {
          isDragging.current = false;
          Animated.spring(beadX, {
            toValue: getBeadPosition(focusedVisibleIndex, itemWidth),
            damping: 19,
            stiffness: 210,
            mass: 0.7,
            useNativeDriver: true,
          }).start();
        }}
        onResponderTerminationRequest={() => false}
        style={styles.tabBarSurface}
      >
        {canUseLiquidGlass ? (
            <GlassView
              colorScheme="light"
              glassEffectStyle="regular"
              style={styles.tabBarGlass}
              tintColor="rgba(255, 247, 234, 0.42)"
            />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.tabBarFallback]} />
        )}

        {visibleRoutes.map((route, visibleIndex) => {
          const { options } = descriptors[route.key];
          const focused = focusedRoute.key === route.key;
          const color = focused ? Colors.primary : "#9B8D81";

          return (
            <Pressable
              key={route.key}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : undefined}
              onPress={() => {
                Animated.spring(beadX, {
                  toValue: getBeadPosition(visibleIndex, itemWidth),
                  damping: 19,
                  stiffness: 210,
                  mass: 0.7,
                  useNativeDriver: true,
                }).start();

                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              }}
              style={styles.tabBarItem}
            >
              <TabIcon
                name={tabIcons[route.name]}
                color={color}
                focused={focused && !canUseLiquidGlass}
              />
            </Pressable>
          );
        })}

        {canUseLiquidGlass ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.glassBead,
              { transform: [{ translateX: beadX }] },
            ]}
          >
            <GlassView
              colorScheme="light"
              glassEffectStyle="regular"
              isInteractive
              style={styles.glassBeadFill}
              tintColor="rgba(255, 244, 224, 0.2)"
            />
            <View style={styles.glassBeadRim} />
          </Animated.View>
        ) : null}
      </GlassContainer>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AccountProvider>
      <RootNavigator />
    </AccountProvider>
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
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: "#9B8D81",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarAccessibilityLabel: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home-outline" color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="learn"
        options={{
          title: "Learn",
          tabBarAccessibilityLabel: "Learn",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="git-network-outline"
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Leaderboard",
          tabBarAccessibilityLabel: "Leaderboard",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="medal-outline" color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="questions"
        options={{
          title: "Questions",
          tabBarAccessibilityLabel: "Questions",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="help-circle-outline"
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarAccessibilityLabel: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person-outline" color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="lesson/[lessonId]"
        options={{
          href: null,
          headerShown: false,
          tabBarStyle: styles.hiddenTabBar,
        }}
      />

      <Tabs.Screen
        name="practice"
        options={{
          href: null,
          headerShown: false,
          tabBarStyle: styles.hiddenTabBar,
        }}
      />

      <Tabs.Screen name="onboarding" options={{ href: null }} />
      <Tabs.Screen name="sign-in" options={{ href: null }} />
      <Tabs.Screen name="premium" options={{ href: null }} />
      <Tabs.Screen name="auth" options={{ href: null }} />
      <Tabs.Screen name="reset-password" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  accountLoading: {
    flex: 1,
    backgroundColor: Colors.cream,
    justifyContent: "center",
    alignItems: "center",
  },
  tabBar: {
    position: "absolute",
    left: 24,
    right: 24,
    height: 72,
    borderRadius: 36,
    shadowColor: "#6F4619",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.16,
    shadowRadius: 26,
    elevation: 14,
  },

  tabBarSurface: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 36,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: "rgba(255, 219, 153, 0.72)",
    backgroundColor: "rgba(255, 255, 255, 0.58)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },

  tabBarFallback: {
    borderRadius: 36,
    backgroundColor: "rgba(255, 255, 255, 0.82)",
  },

  tabBarGlass: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 36,
    overflow: "hidden",
  },

  glassBead: {
    position: "absolute",
    left: 0,
    top: 6,
    width: GLASS_BEAD_SIZE,
    height: GLASS_BEAD_SIZE,
    borderRadius: GLASS_BEAD_SIZE / 2,
    zIndex: 10,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.72,
    shadowRadius: 9,
  },

  glassBeadFill: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: GLASS_BEAD_SIZE / 2,
    overflow: "hidden",
  },

  glassBeadRim: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: GLASS_BEAD_SIZE / 2,
    borderWidth: 1.25,
    borderColor: "rgba(255, 255, 255, 0.78)",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },

  hiddenTabBar: {
    display: "none",
  },

  tabBarItem: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  iconWrapActive: {
    backgroundColor: "rgba(255, 240, 211, 0.86)",
  },
});
