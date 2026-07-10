import { StyleSheet } from "react-native";

export const C = {
  cream: "#FFF9F1",
  primary: "#F59E0B",
  ink: "#1F2937",
  muted: "#6B7280",
  border: "#ECE6DA",
  card: "#FFFFFF",
};

const shared = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.cream,
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
  },

  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFF4D6",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 24,
    alignSelf: "center",
  },

  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: C.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: C.ink,
    marginBottom: 20,
  },

  keyPointBox: {
    marginTop: 28,
    padding: 18,
    backgroundColor: "#FFF4D6",
    borderRadius: 18,
  },

  keyPointLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: C.primary,
    marginBottom: 8,
  },

  primaryButton: {
    height: 58,
    margin: 20,
    borderRadius: 28,
    backgroundColor: C.primary,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },

  primaryButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
  },
});

export default shared;