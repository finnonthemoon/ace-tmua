import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import TestResults from "@/components/practice/TestResults";
import {
  getPracticeTest,
  resolvePracticeTest,
} from "@/components/practice/practice-data";
import { getPracticeResult } from "@/components/practice/practice-storage";
import type { PracticeResult } from "@/components/practice/types";
import { Colors } from "@/constants/theme";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function PracticeResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    testId?: string | string[];
    attemptId?: string | string[];
  }>();
  const testId = firstParam(params.testId);
  const attemptId = firstParam(params.attemptId);
  const test = getPracticeTest(testId);
  const [result, setResult] = useState<PracticeResult | null | undefined>(
    undefined,
  );

  useEffect(() => {
    let active = true;

    if (!attemptId) {
      setTimeout(() => {
        if (active) setResult(null);
      }, 0);
    } else {
      void getPracticeResult(attemptId).then((savedResult) => {
        if (active) setResult(savedResult);
      });
    }

    return () => {
      active = false;
    };
  }, [attemptId]);

  if (result === undefined) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.state}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!test || !result || result.testId !== test.id) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.state}>
          <Text style={styles.title}>Result not found</Text>
          <Pressable onPress={() => router.replace("/questions")}>
            <Text style={styles.link}>Back to practice</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const attemptTest = resolvePracticeTest(test, result.questionIds);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <TestResults
        result={result}
        test={attemptTest}
        onDone={() => router.replace("/questions")}
        onRetake={() =>
          router.replace({
            pathname: "/practice/[testId]/instructions",
            params: { testId: test.id },
          })
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  state: {
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
