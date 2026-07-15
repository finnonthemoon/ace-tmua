import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { isSupabaseConfigured, requireSupabase, supabase } from "@/lib/supabase";
import {
  authRedirectUri,
  passwordResetRedirectUri,
  signInWithApple as authenticateWithApple,
  signInWithGoogle as authenticateWithGoogle,
} from "@/services/auth-service";
import {
  createEmptyProfile,
  getLocalAccountProfile,
  saveLocalAccountProfile,
} from "@/services/account-storage";
import type { AccountProfile } from "@/services/account-storage";
import { syncAccountForSession } from "@/services/account-sync";
import { upsertRemoteProfile } from "@/services/cloud-api";

interface EmailAuthResult {
  requiresEmailConfirmation: boolean;
}

interface AccountContextValue {
  profile: AccountProfile;
  session: Session | null;
  isLoading: boolean;
  isSyncing: boolean;
  isSignedIn: boolean;
  isPremium: boolean;
  isSupabaseConfigured: boolean;
  syncError: string | null;
  updateProfile: (patch: Partial<AccountProfile>) => Promise<AccountProfile>;
  finishOnboarding: (premiumInterest: boolean) => Promise<AccountProfile>;
  continueAsGuest: () => Promise<AccountProfile>;
  signUpWithEmail: (email: string, password: string) => Promise<EmailAuthResult>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<boolean>;
  signInWithApple: () => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAccount: () => Promise<void>;
}

const AccountContext = createContext<AccountContextValue | null>(null);

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Account sync failed.";
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<AccountProfile>(() =>
    createEmptyProfile(),
  );
  const profileRef = useRef(profile);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const commitProfile = useCallback(async (nextProfile: AccountProfile) => {
    const savedProfile = await saveLocalAccountProfile(nextProfile);
    profileRef.current = savedProfile;
    setProfile(savedProfile);
    return savedProfile;
  }, []);

  const hydrateSession = useCallback(
    async (nextSession: Session, localProfile = profileRef.current) => {
      setIsSyncing(true);
      try {
        const syncedProfile = await syncAccountForSession(
          localProfile,
          nextSession.user,
        );
        profileRef.current = syncedProfile;
        setProfile(syncedProfile);
        setSyncError(null);
      } catch (error) {
        console.error("Could not sync the account:", error);
        const fallbackProfile = await commitProfile({
          ...localProfile,
          id: nextSession.user.id,
          email: nextSession.user.email ?? localProfile.email,
          name:
            localProfile.name ||
            (nextSession.user.user_metadata.full_name as string | undefined) ||
            "TMUA student",
          accountType: "authenticated",
        });
        profileRef.current = fallbackProfile;
        setSyncError(errorMessage(error));
      } finally {
        setIsSyncing(false);
      }
    },
    [commitProfile],
  );

  useEffect(() => {
    let active = true;

    async function initialise() {
      const localProfile = (await getLocalAccountProfile()) ?? createEmptyProfile();
      if (!active) return;
      profileRef.current = localProfile;
      setProfile(localProfile);

      if (supabase) {
        const { data, error } = await supabase.auth.getSession();
        if (error) setSyncError(error.message);
        if (!active) return;
        setSession(data.session);
        if (data.session) await hydrateSession(data.session, localProfile);
      }

      if (active) setIsLoading(false);
    }

    void initialise().catch((error) => {
      console.error("Could not initialise the account:", error);
      if (active) {
        setSyncError(errorMessage(error));
        setIsLoading(false);
      }
    });

    const subscription = supabase?.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        setTimeout(() => void hydrateSession(nextSession), 0);
      }
    }).data.subscription;

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [hydrateSession]);

  const updateProfile = useCallback(
    async (patch: Partial<AccountProfile>) => {
      const nextProfile = await commitProfile({
        ...profileRef.current,
        ...patch,
        updatedAt: new Date().toISOString(),
      });

      if (session?.user.id) {
        try {
          await upsertRemoteProfile(session.user.id, nextProfile);
          setSyncError(null);
        } catch (error) {
          setSyncError(errorMessage(error));
        }
      }

      return nextProfile;
    },
    [commitProfile, session],
  );

  const finishOnboarding = useCallback(
    (premiumInterest: boolean) =>
      updateProfile({
        onboardingCompleted: true,
        premiumInterest,
      }),
    [updateProfile],
  );

  const continueAsGuest = useCallback(
    () => updateProfile({ accountType: "guest", premiumStatus: "free" }),
    [updateProfile],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      const client = requireSupabase();
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: authRedirectUri,
          data: {
            full_name: profileRef.current.name,
            target_university: profileRef.current.targetUniversity,
            target_score: profileRef.current.targetScore,
            exam_sitting: profileRef.current.examSitting,
          },
        },
      });
      if (error) throw error;

      await updateProfile({ email: email.trim() });
      if (data.session) {
        setSession(data.session);
        await hydrateSession(data.session);
      }

      return { requiresEmailConfirmation: !data.session };
    },
    [hydrateSession, updateProfile],
  );

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const client = requireSupabase();
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      setSession(data.session);
      await hydrateSession(data.session);
    },
    [hydrateSession],
  );

  const signInWithGoogle = useCallback(async () => {
    const nextSession = await authenticateWithGoogle();
    if (!nextSession) return false;
    setSession(nextSession);
    await hydrateSession(nextSession);
    return true;
  }, [hydrateSession]);

  const signInWithApple = useCallback(async () => {
    const nextSession = await authenticateWithApple();
    if (!nextSession) return false;
    setSession(nextSession);
    await hydrateSession(nextSession);
    return true;
  }, [hydrateSession]);

  const sendPasswordReset = useCallback(async (email: string) => {
    const client = requireSupabase();
    const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: passwordResetRedirectUri,
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const client = requireSupabase();
    const { error } = await client.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    setSession(null);
    setSyncError(null);
    await commitProfile({
      ...profileRef.current,
      accountType: "guest",
      premiumStatus: "free",
      email: null,
    });
  }, [commitProfile]);

  const refreshAccount = useCallback(async () => {
    if (!session) return;
    await hydrateSession(session);
  }, [hydrateSession, session]);

  return (
    <AccountContext.Provider
      value={{
        profile,
        session,
        isLoading,
        isSyncing,
        isSignedIn: Boolean(session),
        isPremium: profile.premiumStatus === "premium",
        isSupabaseConfigured,
        syncError,
        updateProfile,
        finishOnboarding,
        continueAsGuest,
        signUpWithEmail,
        signInWithEmail,
        signInWithGoogle,
        signInWithApple,
        sendPasswordReset,
        updatePassword,
        signOut,
        refreshAccount,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error("useAccount must be used inside AccountProvider.");
  }
  return context;
}
