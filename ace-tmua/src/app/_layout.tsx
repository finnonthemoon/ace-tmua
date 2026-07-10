import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors } from "../constants/theme";
import { StyleSheet, View } from "react-native";

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: "#9b8d81",
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor:
                    color === Colors.primary ? "#fff0d3" : "transparent",
                },
              ]}
            >
              {/* Note: Expo doesn't natively bundle RemixIcon. You might need to use Ionicons or import custom fonts. Using a generic icon component here for structure. */}
              <Ionicons name="home-outline" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: "Learn",
          tabBarIcon: ({ color }) => (
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor:
                    color === Colors.primary ? "#fff0d3" : "transparent",
                },
              ]}
            >
              <Ionicons name="git-network-outline" size={24} color="black" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Leaderboard",
          tabBarIcon: ({ color }) => (
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor:
                    color === Colors.primary ? "#fff0d3" : "transparent",
                },
              ]}
            >
              <Ionicons name="trophy-outline" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="questions"
        options={{
          title: "Questions",
          tabBarIcon: ({ color }) => (
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor:
                    color === Colors.primary ? "#fff0d3" : "transparent",
                },
              ]}
            >
              <Ionicons name="help-circle-outline" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor:
                    color === Colors.primary ? "#fff0d3" : "transparent",
                },
              ]}
            >
              <Ionicons name="person-outline" size={24} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 20,
    left: "6%",
    right: "6%",
    elevation: 0,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: 32,
    height: 65,
    borderWidth: 1,
    borderColor: "rgba(255, 210, 128, 0.7)",
    shadowColor: "#6f4619",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
  },
  tabBarItem: {
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 14,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
});
