import { StyleSheet } from "react-native";

export const C = {
  cream: "#FFF9F1",
  primary: "#FF6F1A",
  primaryLight: "#FF9347",
  ink: "#2D241F",
  muted: "#7D6D62",
  line: "#F1DFBD",
  border: "#F1DFBD",
  surface: "#FFFFFF",
  card: "#FFFFFF",

  correctBackground: "#E8F8ED",
  correctBorder: "#75C88D",
  correctText: "#1D7D46",

  wrongBackground: "#FFF0EF",
  wrongBorder: "#F09A96",
  wrongText: "#B54242",
};

const shared = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.cream,
  },

  screen: {
    flex: 1,
    backgroundColor: C.cream,
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  contentContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 24,
  },

  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#FFF0D3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  eyebrow: {
    color: C.primary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  title: {
    color: C.ink,
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 35,
    letterSpacing: -1,
    marginBottom: 16,
  },

  keyPointBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#FFF7E8",
    borderWidth: 1,
    borderColor: "#FFE0AD",
    borderRadius: 16,
  },

  keyPointLabel: {
    color: C.primary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 7,
  },

  primaryButton: {
    minHeight: 56,
    marginHorizontal: 18,
    marginTop: 12,
    marginBottom: 20,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: C.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,

    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 5,
  },

  primaryButtonInline: {
    minHeight: 52,
    marginTop: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: C.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  feedbackCard: {
    marginTop: 16,
    padding: 16,
    borderWidth: 1,
    borderRadius: 18,
  },

  feedbackCorrect: {
    backgroundColor: C.correctBackground,
    borderColor: C.correctBorder,
  },

  feedbackWrong: {
    backgroundColor: C.wrongBackground,
    borderColor: C.wrongBorder,
  },

  feedbackHeading: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 6,
  },

  feedbackBody: {
    color: C.ink,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
  },

  cardShadow: {
    shadowColor: "#6F4619",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
});

export default shared;
