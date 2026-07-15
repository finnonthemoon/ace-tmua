import { Ionicons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAccount } from "@/contexts/AccountContext";
import { Colors } from "@/constants/theme";

type AuthMode = "create" | "sign-in";

interface Props {
  defaultMode?: AuthMode;
  showGuest?: boolean;
  onComplete: (requiresEmailConfirmation?: boolean) => void;
  onGuest?: () => void;
}

function messageFrom(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    if (error.code === "ERR_REQUEST_CANCELED") return null;
  }
  return error instanceof Error ? error.message : "Authentication failed.";
}

export default function AuthPanel({
  defaultMode = "create",
  showGuest = false,
  onComplete,
  onGuest,
}: Props) {
  const {
    isSupabaseConfigured,
    sendPasswordReset,
    signInWithApple,
    signInWithEmail,
    signInWithGoogle,
    signUpWithEmail,
  } = useAccount();
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    if (Platform.OS === "ios") {
      void AppleAuthentication.isAvailableAsync().then((available) => {
        if (active) setAppleAvailable(available);
      });
    }
    return () => {
      active = false;
    };
  }, []);

  const run = async (action: string, callback: () => Promise<void>) => {
    setBusyAction(action);
    setError(null);
    try {
      await callback();
    } catch (nextError) {
      const message = messageFrom(nextError);
      if (message) setError(message);
    } finally {
      setBusyAction(null);
    }
  };

  const submitEmail = () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Your password needs at least 6 characters.");
      return;
    }

    void run("email", async () => {
      if (mode === "create") {
        const result = await signUpWithEmail(email, password);
        onComplete(result.requiresEmailConfirmation);
      } else {
        await signInWithEmail(email, password);
        onComplete(false);
      }
    });
  };

  const requestPasswordReset = () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Enter your email address first, then try again.");
      return;
    }

    void run("reset", async () => {
      await sendPasswordReset(email);
      Alert.alert(
        "Check your inbox",
        "We sent a secure password-reset link. Open it on a device with ACE TMUA installed.",
      );
    });
  };

  const disabled = Boolean(busyAction);

  return (
    <View style={styles.panel}>
      {!isSupabaseConfigured ? (
        <View style={styles.setupNote}>
          <Ionicons name="construct-outline" size={18} color={Colors.primary} />
          <Text style={styles.setupNoteText}>
            Account buttons are ready. Add your Supabase keys to enable them.
          </Text>
        </View>
      ) : null}

      {appleAvailable ? (
        <View style={!isSupabaseConfigured ? styles.disabledSocial : undefined}>
          <AppleAuthentication.AppleAuthenticationButton
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            cornerRadius={14}
            onPress={() => {
              if (!isSupabaseConfigured || disabled) return;
              void run("apple", async () => {
                const completed = await signInWithApple();
                if (completed) onComplete(false);
              });
            }}
            style={styles.appleButton}
          />
          {busyAction === "apple" ? (
            <ActivityIndicator style={styles.socialSpinner} color="#FFFFFF" />
          ) : null}
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        disabled={disabled || !isSupabaseConfigured}
        onPress={() =>
          void run("google", async () => {
            const completed = await signInWithGoogle();
            if (completed) onComplete(false);
          })
        }
        style={({ pressed }) => [
          styles.googleButton,
          (!isSupabaseConfigured || disabled) && styles.disabledSocial,
          pressed && styles.buttonPressed,
        ]}
      >
        {busyAction === "google" ? (
          <ActivityIndicator color={Colors.ink} />
        ) : (
          <Ionicons name="logo-google" size={20} color="#4285F4" />
        )}
        <Text style={styles.googleButtonText}>Continue with Google</Text>
      </Pressable>

      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>OR USE EMAIL</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.modeSwitch}>
        <Pressable
          onPress={() => setMode("create")}
          style={[styles.modeButton, mode === "create" && styles.modeButtonActive]}
        >
          <Text
            style={[
              styles.modeButtonText,
              mode === "create" && styles.modeButtonTextActive,
            ]}
          >
            Create account
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMode("sign-in")}
          style={[styles.modeButton, mode === "sign-in" && styles.modeButtonActive]}
        >
          <Text
            style={[
              styles.modeButtonText,
              mode === "sign-in" && styles.modeButtonTextActive,
            ]}
          >
            Sign in
          </Text>
        </Pressable>
      </View>

      <TextInput
        autoCapitalize="none"
        autoComplete="email"
        editable={!disabled}
        inputMode="email"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="Email address"
        placeholderTextColor="#A89587"
        style={styles.input}
        value={email}
      />
      <TextInput
        autoCapitalize="none"
        autoComplete={mode === "create" ? "new-password" : "current-password"}
        editable={!disabled}
        onChangeText={setPassword}
        onSubmitEditing={submitEmail}
        placeholder="Password"
        placeholderTextColor="#A89587"
        secureTextEntry
        style={styles.input}
        value={password}
      />

      {mode === "sign-in" ? (
        <Pressable
          disabled={disabled || !isSupabaseConfigured}
          onPress={requestPasswordReset}
          style={styles.forgotButton}
        >
          {busyAction === "reset" ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.forgotButtonText}>Forgot password?</Text>
          )}
        </Pressable>
      ) : null}

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={17} color="#B34B3F" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        disabled={disabled || !isSupabaseConfigured}
        onPress={submitEmail}
        style={({ pressed }) => [
          styles.primaryButton,
          (!isSupabaseConfigured || disabled) && styles.primaryButtonDisabled,
          pressed && styles.buttonPressed,
        ]}
      >
        {busyAction === "email" ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.primaryButtonText}>
              {mode === "create" ? "Create my account" : "Sign in securely"}
            </Text>
            <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
          </>
        )}
      </Pressable>

      {showGuest && onGuest ? (
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={onGuest}
          style={styles.guestButton}
        >
          <Text style={styles.guestButtonText}>Continue without an account</Text>
        </Pressable>
      ) : null}

      <Text style={styles.privacyNote}>
        Account data is used to save your study profile and progress. Terms and Privacy links must be added before release.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: 12,
  },
  setupNote: {
    padding: 13,
    borderRadius: 16,
    backgroundColor: "#FFF0D3",
    borderWidth: 1,
    borderColor: "#F5D5A0",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  setupNoteText: {
    flex: 1,
    color: Colors.ink,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "800",
  },
  appleButton: {
    width: "100%",
    height: 52,
  },
  socialSpinner: {
    position: "absolute",
    right: 18,
    top: 15,
  },
  googleButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDD4CB",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  googleButtonText: {
    color: Colors.ink,
    fontSize: 14,
    fontWeight: "900",
  },
  disabledSocial: {
    opacity: 0.45,
  },
  forgotButton: {
    minHeight: 30,
    alignSelf: "flex-end",
    justifyContent: "center",
  },
  forgotButtonText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "900",
  },
  dividerRow: {
    marginVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.line,
  },
  dividerText: {
    color: Colors.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.9,
  },
  modeSwitch: {
    padding: 4,
    borderRadius: 15,
    backgroundColor: "#F4EBDD",
    flexDirection: "row",
  },
  modeButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modeButtonActive: {
    backgroundColor: "#FFFFFF",
  },
  modeButtonText: {
    color: Colors.muted,
    fontSize: 11,
    fontWeight: "900",
  },
  modeButtonTextActive: {
    color: Colors.ink,
  },
  input: {
    height: 54,
    paddingHorizontal: 16,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.line,
    color: Colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  errorBox: {
    padding: 11,
    borderRadius: 13,
    backgroundColor: "#FFF0EC",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },
  errorText: {
    flex: 1,
    color: "#934339",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
  },
  primaryButton: {
    minHeight: 54,
    paddingHorizontal: 20,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  guestButton: {
    minHeight: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  guestButtonText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  privacyNote: {
    paddingHorizontal: 12,
    color: Colors.muted,
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  buttonPressed: {
    transform: [{ scale: 0.985 }],
  },
});
