import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { requireSupabase } from "@/lib/supabase";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    code?: string | string[];
    access_token?: string | string[];
    refresh_token?: string | string[];
    error_description?: string | string[];
  }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function complete() {
      const callbackError = first(params.error_description);
      if (callbackError) throw new Error(callbackError);

      const client = requireSupabase();
      const code = first(params.code);
      if (code) {
        const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
      } else {
        const accessToken = first(params.access_token);
        const refreshToken = first(params.refresh_token);
        if (!accessToken || !refreshToken) {
          throw new Error("The confirmation link did not contain a valid session.");
        }
        const { error: sessionError } = await client.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) throw sessionError;
      }

      if (active) router.replace("/");
    }

    void complete().catch((nextError) => {
      if (active) {
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Account confirmation failed.",
        );
      }
    });

    return () => {
      active = false;
    };
  }, [params.access_token, params.code, params.error_description, params.refresh_token, router]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.state}>
        {error ? (
          <>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle-outline" size={29} color="#B34B3F" />
            </View>
            <Text style={styles.title}>We could not confirm that link</Text>
            <Text style={styles.body}>{error}</Text>
            <Pressable onPress={() => router.replace("/sign-in")} style={styles.button}>
              <Text style={styles.buttonText}>Back to sign in</Text>
            </Pressable>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.title}>Connecting your account…</Text>
            <Text style={styles.body}>Your saved progress will appear automatically.</Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.cream },
  state: { flex: 1, paddingHorizontal: 28, justifyContent: "center", alignItems: "center" },
  errorIcon: {
    width: 58,
    height: 58,
    marginBottom: 15,
    borderRadius: 20,
    backgroundColor: "#FFF0EC",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { marginTop: 16, color: Colors.ink, fontSize: 21, fontWeight: "900", textAlign: "center" },
  body: { maxWidth: 310, marginTop: 8, color: Colors.muted, fontSize: 13, lineHeight: 19, fontWeight: "700", textAlign: "center" },
  button: { minHeight: 50, marginTop: 18, paddingHorizontal: 23, borderRadius: 17, backgroundColor: Colors.primary, justifyContent: "center" },
  buttonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
});
