import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PracticeTestRunner from "@/components/practice/PracticeTestRunner";
import { getPracticeTest } from "@/components/practice/practice-data";
import { Colors } from "@/constants/theme";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function PracticeTestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ testId?: string | string[] }>();
  const test = getPracticeTest(firstParam(params.testId));

  if (!test) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorState}>
          <Text style={styles.title}>Practice set not found</Text>
          <Pressable onPress={() => router.replace("/questions")}>
            <Text style={styles.link}>Back to practice</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return <PracticeTestRunner test={test} />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  errorState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  title: {
    color: Colors.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  link: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "900",
  },
});
