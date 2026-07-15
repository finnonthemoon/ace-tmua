import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AuthPanel from "@/components/auth/AuthPanel";
import { Colors } from "@/constants/theme";

export default function SignInScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Close account screen"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="close" size={23} color={Colors.ink} />
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.icon}>
            <Ionicons name="cloud-done-outline" size={29} color={Colors.primary} />
          </View>
          <Text style={styles.eyebrow}>YOUR ACE TMUA ACCOUNT</Text>
          <Text style={styles.title}>Keep your preparation with you</Text>
          <Text style={styles.body}>
            Sign in to restore progress, scores and saved practice attempts on another device.
          </Text>

          <View style={styles.mergeNote}>
            <Ionicons name="git-merge-outline" size={19} color={Colors.primary} />
            <Text style={styles.mergeText}>
              Progress already stored on this device will be merged into your account the first time you connect it.
            </Text>
          </View>

          <AuthPanel
            defaultMode="sign-in"
            onComplete={() => router.replace("/")}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: Colors.cream },
  header: { minHeight: 54, paddingHorizontal: 18, justifyContent: "center" },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.line,
    justifyContent: "center",
    alignItems: "center",
  },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 15, paddingBottom: 35 },
  icon: {
    width: 58,
    height: 58,
    marginBottom: 20,
    borderRadius: 19,
    backgroundColor: "#FFF0D3",
    justifyContent: "center",
    alignItems: "center",
  },
  eyebrow: { color: Colors.primary, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  title: {
    maxWidth: 340,
    marginTop: 6,
    color: Colors.ink,
    fontSize: 32,
    lineHeight: 37,
    fontWeight: "900",
    letterSpacing: -1,
  },
  body: {
    maxWidth: 345,
    marginTop: 9,
    marginBottom: 18,
    color: Colors.muted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
  },
  mergeNote: {
    marginBottom: 21,
    padding: 13,
    borderRadius: 17,
    backgroundColor: "#FFF0D3",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  mergeText: { flex: 1, color: Colors.ink, fontSize: 10, lineHeight: 15, fontWeight: "700" },
});
