import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Lesson } from "@/components/lesson/types";
import lessonsData from "@/data/lessons.json";
import { COMPLETED_LESSONS_KEY } from "@/services/study-activity";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

interface Topic {
  id: string;
  lessonTopicId: string;
  title: string;
  displayTitle: string;
  intro: string;
  color: string;
  softColor: string;
  icon: IconName;
  fullWidth?: boolean;
}

const TOPICS: Topic[] = [
  {
    id: "algebra",
    lessonTopicId: "topic-1",
    title: "Algebra and Functions",
    displayTitle: "Algebra and\nFunctions",
    intro: "Work through the core skills in order, then finish with exam-style practice.",
    color: "#FF6F1A",
    softColor: "#FFF0D3",
    icon: "calculator-outline",
  },
  {
    id: "sequences",
    lessonTopicId: "topic-2",
    title: "Sequences and Series",
    displayTitle: "Sequences and\nSeries",
    intro: "Arithmetic progressions, geometric series and binomial expansion.",
    color: "#F3A82C",
    softColor: "#FFF2D5",
    icon: "list-outline",
  },
  {
    id: "coordinate",
    lessonTopicId: "topic-3",
    title: "Coordinate Geometry",
    displayTitle: "Coordinate\nGeometry",
    intro: "Lines, circles, intersections and coordinate proofs.",
    color: "#9B7BE6",
    softColor: "#F0EAFF",
    icon: "git-network-outline",
  },
  {
    id: "trigonometry",
    lessonTopicId: "topic-4",
    title: "Trigonometry",
    displayTitle: "Trigonometry",
    intro: "Triangles, radians, exact values and trigonometric equations.",
    color: "#62ACE4",
    softColor: "#E7F5FF",
    icon: "shapes-outline",
  },
  {
    id: "logs",
    lessonTopicId: "topic-5",
    title: "Exponentials and Logarithms",
    displayTitle: "Exponentials and\nLogarithms",
    intro: "Log laws, exponential graphs and equation solving.",
    color: "#55C59A",
    softColor: "#E7F9F1",
    icon: "trending-up-outline",
  },
  {
    id: "calculus",
    lessonTopicId: "topic-6",
    title: "Calculus",
    displayTitle: "Calculus",
    intro: "Differentiation, integration and numerical reasoning.",
    color: "#ED7D92",
    softColor: "#FDECF0",
    icon: "code-working-outline",
  },
  {
    id: "graphs",
    lessonTopicId: "topic-7",
    title: "Graphs and Transformations",
    displayTitle: "Graphs and\nTransformations",
    intro: "Recognise, sketch, transform and interpret common functions.",
    color: "#4F91D4",
    softColor: "#E9F3FD",
    icon: "analytics-outline",
  },
  {
    id: "geometry",
    lessonTopicId: "topic-8",
    title: "Geometry, Measures and Vectors",
    displayTitle: "Geometry, Measures\nand Vectors",
    intro: "Angles, transformations, similarity, circles, measures and vectors.",
    color: "#49A78E",
    softColor: "#E7F7F2",
    icon: "scan-outline",
  },
  {
    id: "statistics",
    lessonTopicId: "topic-9",
    title: "Statistics",
    displayTitle: "Statistics",
    intro: "Represent, summarise and compare numerical and categorical data.",
    color: "#7C73D6",
    softColor: "#EFEDFF",
    icon: "bar-chart-outline",
  },
  {
    id: "probability",
    lessonTopicId: "topic-10",
    title: "Probability",
    displayTitle: "Probability",
    intro: "Outcomes, expected frequencies, trees and conditional probability.",
    color: "#E8895D",
    softColor: "#FCECE4",
    icon: "git-branch-outline",
  },
  {
    id: "logic",
    lessonTopicId: "topic-11",
    title: "Logic and Proof",
    displayTitle: "Logic and Proof",
    intro: "Statements, proof methods, counterexamples and logical reasoning.",
    color: "#E9B738",
    softColor: "#FFF6D7",
    icon: "checkmark-circle-outline",
    fullWidth: true,
  },
];

const LESSON_SUBTITLES: Record<string, string> = {
  "indices-surds-polynomials-1": "Core algebra rules and manipulation",
  "quadratic-and-inequalities": "Forms, hidden quadratics and regions",
  "functions-simultaneous-systems": "Mappings and linked equations",
  "algebra-modulus-functions": "Graphs, equations and inequalities",
  "algebra-exam-style-questions": "Bring the whole topic together",
  "arithmetic-geometric-progressions": "Sequences, sums and common ratios",
  "binomial-expansion-factorials": "Expanding and counting",
  "advanced-series-logic": "Convergence and harder reasoning",
  "sequences-series-exam-style-questions": "Bring the whole topic together",
  "lines-gradients": "Equations, parallel lines and perpendicular bisectors",
  "circle-equations-intersections": "Centres, radii and simultaneous solutions",
  "circle-theorems-axes": "Tangents, chords and subtended angles",
  "coordinate-geometry-exam-style-questions": "Bring the whole topic together",
  "triangles-radians": "Triangle rules, 3D reasoning and sectors",
  "values-graphs-identities": "Exact values, periodicity and core identities",
  "solving-equations": "Intervals, transformations and quadratic forms",
  "trigonometry-exam-style-questions": "Bring the whole topic together",
  "log-laws-exponential-graphs": "Inverse functions, graphs and log laws",
  "solving-exponential-log-equations": "Common bases, substitutions and domains",
  "exponentials-logarithms-exam-style-questions": "Bring the whole topic together",
  "differentiation-gradients-rates-rules":
    "Gradients, rates of change, tangents and normals",
  "stationary-points-curve-behaviour":
    "Turning points, classification and curve behaviour",
  "integration-area": "Antiderivatives, definite integrals and signed area",
  "trapezium-rule-integration-logic": "Estimation, total change and initial values",
  "calculus-exam-style-questions": "Bring the whole topic together",
  "recognising-sketching-common-graphs":
    "Parent shapes, key features and accurate sketches",
  "graph-transformations":
    "Translations, stretches, reflections and compositions",
  "graph-parameters-composite-functions":
    "Line and quadratic families, function notation and composition",
  "sketching-roots-intersections":
    "Roots, intersections and curve behaviour",
  "graphs-transformations-exam-style-questions":
    "Bring the whole topic together",
  "geometry-proportion": "Scale, shape, circles and vectors",
  "transformations-similarity-scale":
    "Geometric transformations, similar figures and scale factors",
  "circle-geometry-theorems":
    "Circle theorems, tangents, chords and multi-stage deductions",
  "statistics-data": "Charts, grouped data and comparisons",
  "probability": "Expected frequencies, trees and conditional probability",
  "logic-of-arguments": "Implication, converse and necessary conditions",
  "methods-of-proof-quantifiers": "Quantifiers, direct proof, cases and contradiction",
  "disproving-statements": "Counterexamples and finding invalid steps",
  "logic-proof-exam-style-questions": "Bring the whole topic together",
};

const LESSONS = lessonsData.lessons as Lesson[];
export default function LearnScreen() {
  const router = useRouter();
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadCompletedLessons() {
        try {
          const storedValue = await AsyncStorage.getItem(
            COMPLETED_LESSONS_KEY
          );

          const parsedValue = storedValue
            ? JSON.parse(storedValue)
            : [];

          if (isActive) {
            setCompletedLessonIds(
              Array.isArray(parsedValue) ? parsedValue : []
            );
          }
        } catch (error) {
          console.error("Could not load lesson progress:", error);

          if (isActive) {
            setCompletedLessonIds([]);
          }
        }
      }

      void loadCompletedLessons();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const topicLessons = useMemo(
    () =>
      activeTopic
        ? LESSONS.filter((lesson) => lesson.topicId === activeTopic.lessonTopicId)
        : [],
    [activeTopic],
  );

  function openLesson(lesson: Lesson) {
    router.push({
      pathname: "/lesson/[lessonId]",
      params: { lessonId: lesson.id },
    });
  }

  if (activeTopic) {
    return (
      <SafeAreaView collapsable={false} style={styles.safeArea} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.topicContainer}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={() => setActiveTopic(null)}
            style={styles.backButton}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Back to Learn"
          >
            <Ionicons name="arrow-back" size={25} color={activeTopic.color} />
          </TouchableOpacity>

          <Text style={[styles.topicEyebrow, { color: activeTopic.color }]}>
            TMUA FOUNDATION
          </Text>
          <Text style={styles.topicTitle}>{activeTopic.title}</Text>
          <Text style={styles.topicIntro}>{activeTopic.intro}</Text>

          <View style={styles.roadmap}>
            {topicLessons.map((lesson, index) => {
              const isFirst = index === 0;
              const isLast = index === topicLessons.length - 1;
              const isAvailable = lesson.screens.length > 0;
              const isCompleted = completedLessonIds.includes(lesson.id);

              const previousLesson =
                index > 0 ? topicLessons[index - 1] : null;

              const isLocked =
                !isAvailable ||
                (!isFirst &&
                  (!previousLesson ||
                    !completedLessonIds.includes(previousLesson.id)));

              const isCurrent = !isLocked && !isCompleted;
              const subtitle =
                LESSON_SUBTITLES[lesson.id] ??
                (isLast
                  ? "Bring the whole topic together"
                  : "Lesson coming soon");

              return (
                <View
                  key={lesson.id}
                  style={[
                    styles.roadmapItem,
                    isLocked && styles.lockedItem,
                  ]}
                >
                  <View style={styles.nodeColumn}>
                    {!isLast && <View style={styles.roadmapLine} />}

                    <View
                      style={[
                        styles.roadmapNode,
                        {
                          borderColor: isLocked
                            ? "#EADCC8"
                            : activeTopic.color,
                          backgroundColor: isLocked
                            ? "#FFFAF0"
                            : activeTopic.softColor,
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          isCompleted
                            ? "checkmark"
                            : isLocked
                              ? "lock-closed-outline"
                              : isLast
                                ? "flag-outline"
                                : "play"
                        }
                        size={21}
                        color={
                          isLocked
                            ? "#A89788"
                            : activeTopic.color
                        }
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.roadmapCard,
                      { borderColor: activeTopic.color },
                      isCurrent && styles.currentCard,
                    ]}
                    onPress={() => openLesson(lesson)}
                    disabled={isLocked}
                    activeOpacity={0.82}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isLocked }}
                  >
                    <Text
                      style={[
                        styles.roadmapMeta,
                        { color: activeTopic.color },
                      ]}
                    >
                      {isCompleted
                        ? `STEP ${index + 1} · COMPLETE`
                        : isCurrent
                          ? `STEP ${index + 1} · START HERE`
                          : isLast && topicLessons.length > 1
                            ? "FINAL STEP"
                            : `STEP ${index + 1}`}
                    </Text>

                    <Text style={styles.roadmapTitle}>
                      {lesson.title}
                    </Text>

                    <Text style={styles.roadmapSubtitle}>
                      {subtitle}
                    </Text>

                    {!isLocked && (
                      <View style={styles.startRow}>
                        <Text
                          style={[
                            styles.startText,
                            { color: activeTopic.color },
                          ]}
                        >
                          {isCompleted ? "Review lesson" : "Start lesson"}
                        </Text>

                        <Ionicons
                          name="arrow-forward"
                          size={17}
                          color={activeTopic.color}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
          <View style={styles.topicBottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView collapsable={false} style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.learnContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.learnTitle}>Learn</Text>
        <Text style={styles.learnSubtitle}>
          Choose a topic and work through its lessons.
        </Text>

        <View style={styles.grid}>
          {TOPICS.map((topic) => {
            const lessonsForTopic = LESSONS.filter(
              (lesson) =>
                lesson.topicId === topic.lessonTopicId &&
                lesson.screens.length > 0
            );
            const completedForTopic = lessonsForTopic.filter((lesson) =>
              completedLessonIds.includes(lesson.id)
            ).length;
            const progress =
              lessonsForTopic.length === 0
                ? 0
                : Math.round(
                  (completedForTopic / lessonsForTopic.length) * 100
                );

            return (
              <TouchableOpacity
                key={topic.id}
                style={[
                  styles.topicCard,
                  topic.fullWidth && styles.fullWidthTopicCard,
                  { backgroundColor: topic.color },
                ]}
                onPress={() => setActiveTopic(topic)}
                activeOpacity={0.84}
                accessibilityRole="button"
                accessibilityLabel={`Open ${topic.title}`}
              >
                <View style={styles.topicIcon}>
                  <Ionicons name={topic.icon} size={27} color="#FFFFFF" />
                </View>
                <Text style={styles.topicCardTitle}>{topic.displayTitle}</Text>
                <Text style={styles.topicProgress}>{progress}% complete</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.learnBottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF7E6" },
  learnContainer: { paddingHorizontal: 16, paddingTop: 18 },
  learnTitle: {
    color: "#2D241F",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1,
    textAlign: "center",
  },
  learnSubtitle: {
    marginTop: 7,
    marginBottom: 24,
    color: "#7D6D62",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  topicCard: {
    width: "48%",
    minHeight: 158,
    marginBottom: 16,
    padding: 16,
    borderRadius: 22,
    justifyContent: "space-between",
    shadowColor: "#6F4619",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.15,
    shadowRadius: 13,
    elevation: 5,
  },
  fullWidthTopicCard: {
    width: "100%",
    minHeight: 132,
  },
  topicIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  topicCardTitle: {
    marginTop: 14,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 21,
  },
  topicProgress: {
    marginTop: 10,
    color: "rgba(255,255,255,0.88)",
    fontSize: 11,
    fontWeight: "800",
  },
  learnBottomSpacing: { height: 110 },
  topicContainer: { paddingHorizontal: 20, paddingTop: 8 },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFF7E6",
    borderWidth: 1,
    borderColor: "#F1DFBD",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6F4619",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  topicEyebrow: {
    marginTop: 26,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  topicTitle: {
    marginTop: 28,
    color: "#2D241F",
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 38,
    letterSpacing: -1.2,
    textAlign: "center",
  },
  topicIntro: {
    marginTop: 22,
    color: "#7D6D62",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
  },
  roadmap: { marginTop: 28 },
  roadmapItem: {
    minHeight: 144,
    flexDirection: "row",
    gap: 14,
  },
  lockedItem: { opacity: 0.72 },
  nodeColumn: { width: 58, alignItems: "center" },
  roadmapLine: {
    position: "absolute",
    top: 52,
    bottom: -4,
    width: 3,
    backgroundColor: "#F1DFBD",
  },
  roadmapNode: {
    zIndex: 1,
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6F4619",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 2,
  },
  roadmapCard: {
    flex: 1,
    minHeight: 112,
    marginBottom: 24,
    paddingVertical: 17,
    paddingHorizontal: 18,
    backgroundColor: "#FFFDF9",
    borderWidth: 1,
    borderRadius: 20,
    justifyContent: "center",
  },
  currentCard: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#6F4619",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  roadmapMeta: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  roadmapTitle: {
    marginTop: 7,
    color: "#2D241F",
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 21,
  },
  roadmapSubtitle: {
    marginTop: 5,
    color: "#7D6D62",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  startRow: {
    marginTop: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  startText: { fontSize: 13, fontWeight: "900" },
  topicBottomSpacing: { height: 110 },
});