import * as AppleAuthentication from "expo-apple-authentication";
import { makeRedirectUri } from "expo-auth-session";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";

import { requireSupabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export const authRedirectUri = makeRedirectUri({
  scheme: "acetmua",
  path: "auth/callback",
});

export const passwordResetRedirectUri = makeRedirectUri({
  scheme: "acetmua",
  path: "reset-password",
});

function getAuthParams(url: string) {
  const parsedUrl = new URL(url);
  const query = new URLSearchParams(parsedUrl.search);
  const hash = new URLSearchParams(parsedUrl.hash.replace(/^#/, ""));

  return {
    code: query.get("code") ?? hash.get("code"),
    error: query.get("error") ?? hash.get("error"),
    errorDescription:
      query.get("error_description") ?? hash.get("error_description"),
    accessToken: query.get("access_token") ?? hash.get("access_token"),
    refreshToken: query.get("refresh_token") ?? hash.get("refresh_token"),
  };
}

function randomNonce(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export async function completeSupabaseAuthUrl(url: string) {
  const client = requireSupabase();
  const params = getAuthParams(url);

  if (params.error) {
    throw new Error(
      params.errorDescription ?? "Authentication was not completed.",
    );
  }

  if (params.code) {
    const { data, error } = await client.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return data.session;
  }

  if (params.accessToken && params.refreshToken) {
    const { data, error } = await client.auth.setSession({
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
    });
    if (error) throw error;
    return data.session;
  }

  throw new Error("The authentication response did not include a session.");
}

export async function signInWithGoogle() {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: authRedirectUri,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error("Google sign-in did not return an authorization URL.");

  const result = await WebBrowser.openAuthSessionAsync(data.url, authRedirectUri);
  if (result.type === "cancel" || result.type === "dismiss") return null;
  if (result.type !== "success") {
    throw new Error("Google sign-in was not completed.");
  }

  return completeSupabaseAuthUrl(result.url);
}

export async function signInWithApple() {
  const client = requireSupabase();
  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    throw new Error("Sign in with Apple is only available on supported Apple devices.");
  }

  const rawNonce = randomNonce(await Crypto.getRandomBytesAsync(32));
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );
  const credential = await AppleAuthentication.signInAsync({
    nonce: hashedNonce,
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error("Apple did not return an identity token.");
  }

  const { data, error } = await client.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error) throw error;

  const fullName = credential.fullName
    ? AppleAuthentication.formatFullName(credential.fullName).trim()
    : "";
  if (fullName) {
    const { error: updateError } = await client.auth.updateUser({
      data: { full_name: fullName },
    });
    if (updateError) throw updateError;
  }

  return data.session;
}
