import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, Shadow } from "@/constants/theme";
import { useAccount } from "@/contexts/AccountContext";

export default function PremiumScreen() {
  const router = useRouter();
  const { isPremium, updateProfile } = useAccount();

  const registerInterest = async () => {
    await updateProfile({ premiumInterest: true });
    Alert.alert(
      "Premium preference saved",
      "RevenueCat checkout will replace this message before launch. You have not been charged.",
      [{ text: "Continue", onPress: () => router.back() }],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={23} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>ACE TMUA Premium</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroIcon}>
          <Ionicons name="sparkles" size={31} color="#7A3E00" />
        </View>
        <Text style={styles.eyebrow}>PREPARE WITHOUT LIMITS</Text>
        <Text style={styles.title}>Make every remaining week count.</Text>
        <Text style={styles.body}>
          Premium connects the complete course, realistic mock papers and targeted feedback into one exam-ready plan.
        </Text>

        <View style={styles.benefitList}>
          <Benefit icon="library-outline" title="The full lesson pathway" body="Build every foundation, then finish each topic with exam-style questions." />
          <Benefit icon="documents-outline" title="Fresh full-length mocks" body="Balanced Paper 1 and Paper 2 attempts generated from the premium question bank." />
          <Benefit icon="analytics-outline" title="Know exactly what to fix" body="Use topic breakdowns, worked explanations and personalised recommendations." />
          <Benefit icon="infinite-outline" title="Practise until it feels automatic" body="Repeat lessons and mock attempts without arbitrary limits." />
        </View>

        <View style={styles.trustCard}>
          <Ionicons name="shield-checkmark-outline" size={22} color={Colors.primary} />
          <View style={styles.trustBody}>
            <Text style={styles.trustTitle}>Secure App Store billing comes next</Text>
            <Text style={styles.trustText}>
              RevenueCat is not connected yet, so this build records interest but never grants access or takes payment.
            </Text>
          </View>
        </View>

        <Pressable
          disabled={isPremium}
          onPress={() => void registerInterest()}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.primaryButtonText}>
            {isPremium ? "Premium is active" : "I want ACE TMUA Premium"}
          </Text>
          <Ionicons name={isPremium ? "checkmark" : "arrow-forward"} size={20} color="#7A3E00" />
        </Pressable>
        {!isPremium ? (
          <Pressable onPress={() => router.back()} style={styles.freeButton}>
            <Text style={styles.freeButtonText}>Continue with the free plan</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Benefit({
  icon,
  title,
  body,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  body: string;
}) {
  return (
    <View style={styles.benefit}>
      <View style={styles.benefitIcon}>
        <Ionicons name={icon} size={22} color={Colors.primary} />
      </View>
      <View style={styles.benefitBody}>
        <Text style={styles.benefitTitle}>{title}</Text>
        <Text style={styles.benefitText}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#2D2824" },
  header: { minHeight: 58, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", justifyContent: "center", alignItems: "center" },
  headerTitle: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  headerSpacer: { width: 40 },
  content: { paddingHorizontal: 20, paddingTop: 25, paddingBottom: 35 },
  heroIcon: { width: 62, height: 62, marginBottom: 20, borderRadius: 21, backgroundColor: "#FFD98F", justifyContent: "center", alignItems: "center" },
  eyebrow: { color: "#FFD98F", fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  title: { maxWidth: 350, marginTop: 6, color: "#FFFFFF", fontSize: 35, lineHeight: 40, fontWeight: "900", letterSpacing: -1.2 },
  body: { maxWidth: 355, marginTop: 11, color: "rgba(255,255,255,0.67)", fontSize: 14, lineHeight: 21, fontWeight: "700" },
  benefitList: { marginTop: 27, gap: 11 },
  benefit: { padding: 15, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", flexDirection: "row", alignItems: "center", gap: 12 },
  benefitIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: "#FFF0D3", justifyContent: "center", alignItems: "center" },
  benefitBody: { flex: 1 },
  benefitTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  benefitText: { marginTop: 3, color: "rgba(255,255,255,0.6)", fontSize: 10, lineHeight: 15, fontWeight: "700" },
  trustCard: { marginTop: 17, padding: 15, borderRadius: 20, backgroundColor: "#FFF0D3", flexDirection: "row", alignItems: "center", gap: 11 },
  trustBody: { flex: 1 },
  trustTitle: { color: Colors.ink, fontSize: 12, fontWeight: "900" },
  trustText: { marginTop: 3, color: Colors.muted, fontSize: 9, lineHeight: 14, fontWeight: "700" },
  primaryButton: { minHeight: 57, marginTop: 19, paddingHorizontal: 20, borderRadius: 19, backgroundColor: "#FFD98F", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, ...Shadow.streak },
  primaryButtonText: { color: "#7A3E00", fontSize: 14, fontWeight: "900" },
  freeButton: { minHeight: 48, justifyContent: "center", alignItems: "center" },
  freeButtonText: { color: "rgba(255,255,255,0.72)", fontSize: 11, fontWeight: "900" },
  buttonPressed: { transform: [{ scale: 0.985 }] },
});
