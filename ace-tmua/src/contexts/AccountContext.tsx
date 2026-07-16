import type { Session } from "@supabase/supabase-js";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type CustomerInfoUpdateListener,
} from "react-native-purchases";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";

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
import {
  getRevenueCatConfiguration,
  hasPremiumEntitlement,
  isAnonymousRevenueCatUser,
  REVENUECAT_ENTITLEMENT_ID,
  revenueCatErrorMessage,
} from "@/services/revenuecat";

interface EmailAuthResult {
  requiresEmailConfirmation: boolean;
}

export type PremiumPaywallResult =
  | "already-premium"
  | "cancelled"
  | "not-presented"
  | "purchased"
  | "restored";

interface AccountContextValue {
  profile: AccountProfile;
  session: Session | null;
  isLoading: boolean;
  isSyncing: boolean;
  isSignedIn: boolean;
  isPremium: boolean;
  isPurchasesConfigured: boolean;
  isPurchasesLoading: boolean;
  isSupabaseConfigured: boolean;
  purchasesError: string | null;
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
  refreshPremiumStatus: () => Promise<boolean>;
  presentPremiumPaywall: () => Promise<PremiumPaywallResult>;
  restorePremium: () => Promise<boolean>;
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
  const [revenueCatPremium, setRevenueCatPremium] = useState<boolean | null>(
    null,
  );
  const [isPurchasesConfigured, setIsPurchasesConfigured] = useState(false);
  const [isPurchasesLoading, setIsPurchasesLoading] = useState(true);
  const [purchasesError, setPurchasesError] = useState<string | null>(null);
  const purchasesInitialisedRef = useRef(false);
  const currentPurchasesUserIdRef = useRef<string | null>(null);
  const sessionRef = useRef(session);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const commitProfile = useCallback(async (nextProfile: AccountProfile) => {
    const savedProfile = await saveLocalAccountProfile(nextProfile);
    profileRef.current = savedProfile;
    setProfile(savedProfile);
    return savedProfile;
  }, []);

  const applyCustomerInfo = useCallback(
    async (customerInfo: CustomerInfo) => {
      const premiumIsActive = hasPremiumEntitlement(customerInfo);
      setRevenueCatPremium(premiumIsActive);

      const premiumStatus = premiumIsActive ? "premium" : "free";
      if (profileRef.current.premiumStatus !== premiumStatus) {
        await commitProfile({
          ...profileRef.current,
          premiumStatus,
          updatedAt: new Date().toISOString(),
        });
      }

      return premiumIsActive;
    },
    [commitProfile],
  );

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

  useEffect(() => {
    if (isLoading || purchasesInitialisedRef.current) return;
    purchasesInitialisedRef.current = true;

    let active = true;
    let customerInfoListener: CustomerInfoUpdateListener | null = null;
    const configuration = getRevenueCatConfiguration();

    async function initialisePurchases() {
      if (!configuration.apiKey) {
        setPurchasesError(configuration.error);
        setIsPurchasesLoading(false);
        return;
      }
      const apiKey = configuration.apiKey;

      if (__DEV__) await Purchases.setLogLevel(LOG_LEVEL.DEBUG);

      const alreadyConfigured = await Purchases.isConfigured();
      if (!alreadyConfigured) {
        Purchases.configure({
          apiKey,
          appUserID: sessionRef.current?.user.id,
        });
      }

      let currentUserId = await Purchases.getAppUserID();
      const signedInUserId = sessionRef.current?.user.id;

      if (signedInUserId && currentUserId !== signedInUserId) {
        const result = await Purchases.logIn(signedInUserId);
        currentUserId = signedInUserId;
        await applyCustomerInfo(result.customerInfo);
      } else if (
        !signedInUserId &&
        !isAnonymousRevenueCatUser(currentUserId)
      ) {
        const customerInfo = await Purchases.logOut();
        currentUserId = await Purchases.getAppUserID();
        await applyCustomerInfo(customerInfo);
      }

      if (!active) return;
      currentPurchasesUserIdRef.current = currentUserId;

      customerInfoListener = (customerInfo) => {
        if (active) void applyCustomerInfo(customerInfo);
      };
      Purchases.addCustomerInfoUpdateListener(customerInfoListener);

      const customerInfo = await Purchases.getCustomerInfo();
      if (!active) return;
      await applyCustomerInfo(customerInfo);
      setPurchasesError(null);
      setIsPurchasesConfigured(true);
      setIsPurchasesLoading(false);
    }

    void initialisePurchases().catch((error) => {
      console.error("Could not initialise RevenueCat:", error);
      if (active) {
        setPurchasesError(revenueCatErrorMessage(error));
        setIsPurchasesLoading(false);
      }
    });

    return () => {
      active = false;
      if (customerInfoListener) {
        Purchases.removeCustomerInfoUpdateListener(customerInfoListener);
      }
    };
  }, [applyCustomerInfo, isLoading]);

  useEffect(() => {
    if (!isPurchasesConfigured) return;

    let active = true;
    const signedInUserId = session?.user.id ?? null;

    async function synchronisePurchasesIdentity() {
      const currentUserId = currentPurchasesUserIdRef.current;
      if (signedInUserId && currentUserId !== signedInUserId) {
        setIsPurchasesLoading(true);
        setRevenueCatPremium(null);
        const result = await Purchases.logIn(signedInUserId);
        if (!active) return;
        currentPurchasesUserIdRef.current = signedInUserId;
        await applyCustomerInfo(result.customerInfo);
      } else if (
        !signedInUserId &&
        currentUserId &&
        !isAnonymousRevenueCatUser(currentUserId)
      ) {
        setIsPurchasesLoading(true);
        setRevenueCatPremium(null);
        const customerInfo = await Purchases.logOut();
        if (!active) return;
        currentPurchasesUserIdRef.current = await Purchases.getAppUserID();
        await applyCustomerInfo(customerInfo);
      }

      if (active) {
        setPurchasesError(null);
        setIsPurchasesLoading(false);
      }
    }

    void synchronisePurchasesIdentity().catch((error) => {
      console.error("Could not update the RevenueCat user:", error);
      if (active) {
        setPurchasesError(revenueCatErrorMessage(error));
        setIsPurchasesLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [applyCustomerInfo, isPurchasesConfigured, session?.user.id]);

  const refreshPremiumStatus = useCallback(async () => {
    if (!isPurchasesConfigured) return false;
    const customerInfo = await Purchases.getCustomerInfo();
    setPurchasesError(null);
    return applyCustomerInfo(customerInfo);
  }, [applyCustomerInfo, isPurchasesConfigured]);

  useEffect(() => {
    if (!isPurchasesConfigured) return;
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void refreshPremiumStatus().catch((error) => {
          setPurchasesError(revenueCatErrorMessage(error));
        });
      }
    });
    return () => subscription.remove();
  }, [isPurchasesConfigured, refreshPremiumStatus]);

  const presentPremiumPaywall = useCallback(async () => {
    if (revenueCatPremium) return "already-premium" as const;
    if (!isPurchasesConfigured) {
      throw new Error(
        purchasesError ?? "Purchases are still loading. Please try again.",
      );
    }

    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: REVENUECAT_ENTITLEMENT_ID,
      displayCloseButton: true,
    });

    if (result === PAYWALL_RESULT.PURCHASED) {
      const premiumIsActive = await refreshPremiumStatus();
      if (!premiumIsActive) {
        throw new Error(
          `The purchase completed, but the RevenueCat offering did not grant the “${REVENUECAT_ENTITLEMENT_ID}” entitlement. Check the product-to-entitlement connection in RevenueCat.`,
        );
      }
      return "purchased" as const;
    }
    if (result === PAYWALL_RESULT.RESTORED) {
      const premiumIsActive = await refreshPremiumStatus();
      if (!premiumIsActive) {
        throw new Error(
          `The restored purchase does not grant the “${REVENUECAT_ENTITLEMENT_ID}” entitlement. Check the RevenueCat dashboard configuration.`,
        );
      }
      return "restored" as const;
    }
    if (result === PAYWALL_RESULT.CANCELLED) return "cancelled" as const;
    if (result === PAYWALL_RESULT.NOT_PRESENTED) {
      return "not-presented" as const;
    }

    throw new Error("RevenueCat could not present the Premium paywall.");
  }, [
    isPurchasesConfigured,
    purchasesError,
    refreshPremiumStatus,
    revenueCatPremium,
  ]);

  const restorePremium = useCallback(async () => {
    if (!isPurchasesConfigured) {
      throw new Error(
        purchasesError ?? "Purchases are still loading. Please try again.",
      );
    }
    const customerInfo = await Purchases.restorePurchases();
    setPurchasesError(null);
    return applyCustomerInfo(customerInfo);
  }, [applyCustomerInfo, isPurchasesConfigured, purchasesError]);

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
        isPremium:
          revenueCatPremium ?? profile.premiumStatus === "premium",
        isPurchasesConfigured,
        isPurchasesLoading,
        isSupabaseConfigured,
        purchasesError,
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
        refreshPremiumStatus,
        presentPremiumPaywall,
        restorePremium,
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
