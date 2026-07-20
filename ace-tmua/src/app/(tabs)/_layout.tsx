import { NativeTabs } from "expo-router/unstable-native-tabs";

import { Colors } from "@/constants/theme";

export default function TabLayout() {
  return (
    <NativeTabs
      backBehavior="initialRoute"
      minimizeBehavior="automatic"
      tintColor={Colors.primary}
    >
      <NativeTabs.Trigger
        name="index"
        accessibilityLabel="Home"
        testID="home-tab"
      >
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md={{ default: "home", selected: "home" }}
        />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="learn"
        accessibilityLabel="Learn"
        testID="learn-tab"
      >
        <NativeTabs.Trigger.Icon
          sf={{
            default: "point.3.connected.trianglepath.dotted",
            selected: "point.3.connected.trianglepath.dotted",
          }}
          md={{ default: "route", selected: "route" }}
        />
        <NativeTabs.Trigger.Label>Learn</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="leaderboard"
        accessibilityLabel="Leaderboard"
        testID="leaderboard-tab"
      >
        <NativeTabs.Trigger.Icon
          sf={{ default: "medal", selected: "medal.fill" }}
          md={{ default: "military_tech", selected: "military_tech" }}
        />
        <NativeTabs.Trigger.Label>Ranked</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="questions"
        accessibilityLabel="Questions"
        testID="questions-tab"
      >
        <NativeTabs.Trigger.Icon
          sf={{
            default: "questionmark.bubble",
            selected: "questionmark.bubble.fill",
          }}
          md={{ default: "quiz", selected: "quiz" }}
        />
        <NativeTabs.Trigger.Label>Practice</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="profile"
        accessibilityLabel="Profile"
        testID="profile-tab"
      >
        <NativeTabs.Trigger.Icon
          sf={{ default: "person", selected: "person.fill" }}
          md={{ default: "person", selected: "person" }}
        />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
