import type { ComponentProps } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { type ColorValue, Platform, StyleSheet, View } from "react-native";

import { Colors } from "../constants/theme";

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

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: "#9B8D81",
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
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
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 18,
    left: "6%",
    right: "6%",
    height: 70,
    paddingBottom: 0,
    borderRadius: 36,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: "rgba(255, 210, 128, 0.7)",
    backgroundColor: "rgba(255, 255, 255, 0.97)",

    shadowColor: "#6F4619",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.14,
    shadowRadius: 26,
    elevation: 14,
  },

  hiddenTabBar: {
    display: "none",
  },

  tabBarItem: {
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 12 : 9,
  },

  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },

  iconWrapActive: {
    backgroundColor: "#FFF0D3",
  },
});
