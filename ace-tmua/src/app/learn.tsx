import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// --- DATA ---
const TOPICS = [
  {
    id: "algebra",
    title: "Algebra and\nFunctions",
    color: "#FF7324",
    icon: "calculator-outline",
  },
  {
    id: "sequences",
    title: "Sequences and\nSeries",
    color: "#F6B33C",
    icon: "list-outline",
  },
  {
    id: "coordinate",
    title: "Coordinate\nGeometry",
    color: "#9B7AE8",
    icon: "git-network-outline",
  },
  {
    id: "trigonometry",
    title: "Trigonometry",
    color: "#6AB4E8",
    icon: "shapes-outline",
  },
  {
    id: "logs",
    title: "Exponentials and\nLogarithms",
    color: "#62CFB2",
    icon: "trending-up-outline",
  },
  {
    id: "calculus",
    title: "Calculus",
    color: "#E67B97",
    icon: "code-working-outline",
  },
  {
    id: "geometry",
    title: "Geometry and\nData",
    color: "#5D9FDF",
    icon: "pie-chart-outline",
  },
  {
    id: "logic",
    title: "Logic and Proof",
    color: "#F2C343",
    icon: "checkmark-circle-outline",
  },
];

export default function LearnScreen() {
  const [activeTopic, setActiveTopic] = useState<any | null>(null);

  // If a topic is selected, we show the detail view
  if (activeTopic) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => setActiveTopic(null)}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#2d241f" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {activeTopic.title.replace("\n", " ")}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={styles.roadmapContainer}>
          <Text>Roadmap content for {activeTopic.title} goes here...</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Main Grid View
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.learnTitle}>Learn</Text>
        <View style={styles.grid}>
          {TOPICS.map((topic) => (
            <TouchableOpacity
              key={topic.id}
              style={[styles.learnCard, { backgroundColor: topic.color }]}
              onPress={() => setActiveTopic(topic)}
            >
              <Text style={styles.learnCardTitle}>{topic.title}</Text>
              <Text style={styles.progress}>0% complete</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8EFD9",
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  learnTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: "#2D211C",
    textAlign: "center",
    marginBottom: 24,
    marginTop: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  learnCard: {
    width: "48%", // two per row
    height: 150, // fixed height for uniformity
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    padding: 10,
    shadowColor: "#D9B06A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  learnCardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  progress: {
    marginTop: 8,
    color: "#fff",
    fontSize: 12,
  },
  // Roadmap specific styles
  headerRow: { flexDirection: "row", alignItems: "center", padding: 20 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2d241f",
    marginLeft: 15,
  },
  roadmapContainer: { paddingHorizontal: 20, paddingBottom: 100 },
});
