import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, Shadow } from "@/constants/theme";
import { useAccount } from "@/contexts/AccountContext";
import { requireSupabase } from "@/lib/supabase";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { updatePassword } = useAccount();
  const params = useLocalSearchParams<{
    code?: string | string[];
    access_token?: string | string[];
    refresh_token?: string | string[];
    error_description?: string | string[];
  }>();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function establishRecoverySession() {
      const callbackError = first(params.error_description);
      if (callbackError) throw new Error(callbackError);

      const client = requireSupabase();
      const code = first(params.code);
      const accessToken = first(params.access_token);
      const refreshToken = first(params.refresh_token);

      if (code) {
        const { error: exchangeError } =
          await client.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
      } else if (accessToken && refreshToken) {
        const { error: sessionError } = await client.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) throw sessionError;
      } else {
        const { data, error: sessionError } = await client.auth.getSession();
        if (sessionError) throw sessionError;
        if (!data.session) {
          throw new Error("Open the latest password-reset link from your email.");
        }
      }

      if (active) setReady(true);
    }

    void establishRecoverySession().catch((nextError) => {
      if (active) {
        setError(
          nextError instanceof Error
            ? nextError.message
            : "This password-reset link is not valid.",
        );
      }
    });

    return () => {
      active = false;
    };
  }, [
    params.access_token,
    params.code,
    params.error_description,
    params.refresh_token,
  ]);

  const savePassword = async () => {
    if (password.length < 8) {
      setError("Choose a password with at least 8 characters.");
      return;
    }
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updatePassword(password);
      router.replace("/");
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Could not update your password.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.content}>
          <View style={styles.icon}>
            <Ionicons name="key-outline" size={29} color={Colors.primary} />
          </View>
          <Text style={styles.eyebrow}>ACCOUNT RECOVERY</Text>
          <Text style={styles.title}>Choose a new password</Text>
          <Text style={styles.body}>
            Use something memorable and unique to ACE TMUA.
          </Text>

          {!ready && !error ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.loadingText}>Checking your secure link…</Text>
            </View>
          ) : null}

          {ready ? (
            <View style={styles.form}>
              <TextInput
                autoCapitalize="none"
                autoComplete="new-password"
                onChangeText={setPassword}
                placeholder="New password"
                placeholderTextColor="#A89587"
                secureTextEntry
                style={styles.input}
                value={password}
              />
              <TextInput
                autoCapitalize="none"
                autoComplete="new-password"
                onChangeText={setConfirmation}
                onSubmitEditing={() => void savePassword()}
                placeholder="Confirm new password"
                placeholderTextColor="#A89587"
                secureTextEntry
                style={styles.input}
                value={confirmation}
              />
              <Pressable
                disabled={saving}
                onPress={() => void savePassword()}
                style={({ pressed }) => [
                  styles.button,
                  saving && styles.buttonDisabled,
                  pressed && styles.buttonPressed,
                ]}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Save new password</Text>
                    <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
                  </>
                )}
              </Pressable>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle-outline" size={19} color="#B34B3F" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {error && !ready ? (
            <Pressable onPress={() => router.replace("/sign-in")} style={styles.linkButton}>
              <Text style={styles.linkText}>Request another link</Text>
            </Pressable>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: Colors.cream },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: "center",
  },
  icon: {
    width: 58,
    height: 58,
    marginBottom: 20,
    borderRadius: 19,
    backgroundColor: "#FFF0D3",
    justifyContent: "center",
    alignItems: "center",
  },
  eyebrow: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  title: {
    marginTop: 6,
    color: Colors.ink,
    fontSize: 31,
    lineHeight: 36,
    fontWeight: "900",
    letterSpacing: -1,
  },
  body: {
    marginTop: 8,
    marginBottom: 22,
    color: Colors.muted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  loadingCard: {
    minHeight: 60,
    paddingHorizontal: 17,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  loadingText: { color: Colors.muted, fontSize: 12, fontWeight: "800" },
  form: { gap: 12 },
  input: {
    height: 53,
    paddingHorizontal: 16,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.line,
    color: Colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  button: {
    minHeight: 55,
    marginTop: 3,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    ...Shadow.streak,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonPressed: { transform: [{ scale: 0.985 }] },
  buttonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  errorCard: {
    marginTop: 14,
    padding: 13,
    borderRadius: 16,
    backgroundColor: "#FFF0EC",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  errorText: {
    flex: 1,
    color: "#8B3B32",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "800",
  },
  linkButton: { minHeight: 47, justifyContent: "center", alignItems: "center" },
  linkText: { color: Colors.primary, fontSize: 12, fontWeight: "900" },
});
