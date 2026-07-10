import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "../constants/theme";

export default function QuestionsScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.iconBox}>
          <Ionicons
            name="document-text-outline"
            size={34}
            color={Colors.primary}
          />
        </View>

        <Text style={styles.eyebrow}>QUESTIONS</Text>
        <Text style={styles.title}>Exam practice coming soon</Text>
        <Text style={styles.body}>
          Timed TMUA question sets and full exam-style practice will appear
          here.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 90,
    justifyContent: "center",
    alignItems: "center",
  },
  iconBox: {
    width: 72,
    height: 72,
    marginBottom: 22,
    borderRadius: 22,
    backgroundColor: "#FFF0D3",
    borderWidth: 1,
    borderColor: "#FFD69C",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6F4619",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 3,
  },
  eyebrow: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  title: {
    marginTop: 8,
    color: Colors.ink,
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 34,
    letterSpacing: -1,
    textAlign: "center",
  },
  body: {
    maxWidth: 320,
    marginTop: 12,
    color: Colors.muted,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    textAlign: "center",
  },
});
