import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View, Platform } from "react-native";
import { Colors } from "../constants/theme";

// Each tab icon gets a pill-shaped highlight when active,
// matching .nav__link.active-link { background: #fff0d3 } from the CSS.
function TabIcon({
  name,
  color,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
}) {
  const isActive = color === Colors.primary;
  return (
    <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        // Active = --primary, inactive = #9b8d81 (from .nav__link colour)
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: "#9b8d81",
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      {/* Matches: <a href="#home"> with ri-home-5-line */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <TabIcon name="home-outline" color={color} />
          ),
        }}
      />

      {/* Matches: <a href="#learn"> with ri-mind-map */}
      <Tabs.Screen
        name="learn"
        options={{
          title: "Learn",
          tabBarIcon: ({ color }) => (
            <TabIcon name="git-network-outline" color={color} />
          ),
        }}
      />

      {/* Matches: <a href="#leaderboard"> with ri-medal-line */}
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Leaderboard",
          tabBarIcon: ({ color }) => (
            <TabIcon name="medal-outline" color={color} />
          ),
        }}
      />

      {/* Matches: <a href="#questions"> with ri-questionnaire-line */}
      <Tabs.Screen
        name="questions"
        options={{
          title: "Questions",
          tabBarIcon: ({ color }) => (
            <TabIcon name="help-circle-outline" color={color} />
          ),
        }}
      />

      {/* Matches: <a href="#profile"> with ri-user-line */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <TabIcon name="person-outline" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // Mirrors .nav in CSS:
  //   position: fixed; bottom: 1.25rem; width: min(88%, 460px);
  //   background: rgba(255,255,255,0.94); border: 1px solid rgba(255,210,128,0.7);
  //   border-radius: 2rem; backdrop-filter: blur(12px);
  tabBar: {
    position: "absolute",
    bottom: 20,
    left: "6%",
    right: "6%",
    height: 64,
    borderRadius: 32,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: "rgba(255, 210, 128, 0.7)",
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    // iOS blur effect — approximate with white + opacity
    // (true blur needs @react-native-community/blur if needed later)
    shadowColor: "#6f4619",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 12, // Android
    paddingBottom: 0,
  },
  tabBarItem: {
    // Centres icon vertically in the 64-px bar
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 10 : 8,
  },
  // Mirrors .nav__link: width 2.6rem; height 2.6rem; border-radius 50%
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  // Mirrors .nav__link.active-link { background: #fff0d3 }
  iconWrapActive: {
    backgroundColor: "#fff0d3",
  },
});
