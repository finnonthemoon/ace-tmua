import { useMemo, useRef, useState } from "react";
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

import ConceptScreenView from "./ConceptScreen";
import LessonSummaryScreenView from "./LessonSummaryScreen";
import MilestoneScreenView from "./MilestoneScreen";
import MultipleChoiceScreenView from "./MultipleChoiceScreen";
import RevealScreenView from "./RevealScreen";
import TopBar from "./TopBar";
import TrueFalseScreenView from "./TrueFalseScreen";
import WorkedExampleScreenView from "./WorkedExampleScreen";
import shared, { C } from "./shared";
import type { Lesson } from "./types";

interface Props {
  lesson: Lesson;
  onExit: () => void;
  onComplete?: (lesson: Lesson) => void | Promise<void>;
}
const COMPLETED_LESSONS_KEY = "completedLessonIds";

export default function LessonPlayer(props: Props) {
  return <LessonPlayerSession key={props.lesson.id} {...props} />;
}

function LessonPlayerSession({ lesson, onExit, onComplete }: Props) {
  const [screenIndex, setScreenIndex] = useState(0);
  const [revealIndex, setRevealIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const completionRecorded = useRef(false);

  const progressPercent = useMemo(() => {
    if (lesson.screens.length === 0) {
      return 0;
    }

    if (isComplete) {
      return 100;
    }

    return ((screenIndex + 1) / lesson.screens.length) * 100;
  }, [isComplete, lesson.screens.length, screenIndex]);

  function recordAnswer(isCorrect: boolean) {
    setTotalAnswers((current) => current + 1);

    if (isCorrect) {
      setCorrectAnswers((current) => current + 1);
    }
  }

  function revealNext() {
    setRevealIndex((current) => current + 1);
  }
  function resetLessonSession() {
    setScreenIndex(0);
    setRevealIndex(0);
    setCorrectAnswers(0);
    setTotalAnswers(0);
    setIsComplete(false);
    completionRecorded.current = false;
  }

  function leaveCompletedLesson() {
    resetLessonSession();
    onExit();
  }

  function next() {
    const nextIndex = screenIndex + 1;

    if (nextIndex >= lesson.screens.length) {
      finish();
      return;
    }

    setScreenIndex(nextIndex);
    setRevealIndex(0);
  }

  async function saveLessonCompletion() {
    try {
      const storedValue = await AsyncStorage.getItem(
        COMPLETED_LESSONS_KEY
      );

      const parsedValue = storedValue
        ? JSON.parse(storedValue)
        : [];

      const completedLessonIds: string[] = Array.isArray(parsedValue)
        ? parsedValue
        : [];

      if (!completedLessonIds.includes(lesson.id)) {
        await AsyncStorage.setItem(
          COMPLETED_LESSONS_KEY,
          JSON.stringify([...completedLessonIds, lesson.id])
        );
      }

      await onComplete?.(lesson);
    } catch (error) {
      console.error("Could not save lesson completion:", error);
    }
  }

  function finish() {
    if (!completionRecorded.current) {
      completionRecorded.current = true;
      void saveLessonCompletion();
    }

    setIsComplete(true);
  }


  if (lesson.screens.length === 0) {
    return (
      <MessageScreen
        title="Lesson coming soon"
        body={`${lesson.title} does not have any lesson screens yet.`}
        buttonText="Back to roadmap"
        onPress={onExit}
      />
    );
  }

  if (isComplete) {
    return (
      <SafeAreaView style={shared.safeArea} edges={["top", "bottom"]}>
        <View style={shared.screen}>
          <TopBar progressPercent={100} onExit={onExit} />

          <ScrollView
            style={shared.content}
            contentContainerStyle={styles.completeContent}
          >
            <View style={shared.iconBox}>
              <Ionicons name="checkmark-circle" size={32} color={C.primary} />
            </View>

            <Text style={shared.eyebrow}>LESSON COMPLETE</Text>
            <Text style={shared.title}>Nice work.</Text>

            <Text style={styles.completeBody}>
              You completed {lesson.title}.
            </Text>

            {totalAnswers > 0 && (
              <Text style={styles.completeScore}>
                {correctAnswers}/{totalAnswers} correct
              </Text>
            )}
          </ScrollView>

          <TouchableOpacity
            style={shared.primaryButton}
            onPress={leaveCompletedLesson}
            activeOpacity={0.85}
          >
            <Text style={shared.primaryButtonText}>Back to roadmap</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const screen = lesson.screens[screenIndex];
  const screenKey = `${lesson.id}-${screenIndex}`;
  const commonProps = {
    progressPercent,
    onNext: next,
    onExit,
  };

  switch (screen.type) {
    case "concept":
      return (
        <ConceptScreenView
          key={screenKey}
          {...commonProps}
          screen={screen}
        />
      );

    case "reveal":
      return (
        <RevealScreenView
          key={screenKey}
          {...commonProps}
          screen={screen}
          revealIndex={revealIndex}
          onRevealNext={revealNext}
        />
      );

    case "trueFalse":
      return (
        <TrueFalseScreenView
          key={screenKey}
          {...commonProps}
          screen={screen}
          onAnswer={recordAnswer}
        />
      );

    case "multipleChoice":
      return (
        <MultipleChoiceScreenView
          key={screenKey}
          {...commonProps}
          screen={screen}
          onAnswer={recordAnswer}
        />
      );

    case "workedExample":
      return (
        <WorkedExampleScreenView
          key={screenKey}
          {...commonProps}
          screen={screen}
          revealIndex={revealIndex}
          onRevealNext={revealNext}
        />
      );

    case "milestone":
      return (
        <MilestoneScreenView
          key={screenKey}
          {...commonProps}
          screen={screen}
        />
      );

    case "lessonSummary":
      return (
        <LessonSummaryScreenView
          key={screenKey}
          screen={screen}
          progressPercent={progressPercent}
          onNext={finish}
          onExit={onExit}
          correctAnswers={correctAnswers}
          totalAnswers={totalAnswers}
        />
      );
  }
}

interface MessageScreenProps {
  title: string;
  body: string;
  buttonText: string;
  onPress: () => void;
}

function MessageScreen({
  title,
  body,
  buttonText,
  onPress,
}: MessageScreenProps) {
  return (
    <SafeAreaView style={shared.safeArea} edges={["top", "bottom"]}>
      <View style={shared.screen}>
        <ScrollView
          style={shared.content}
          contentContainerStyle={styles.completeContent}
        >
          <Text style={shared.title}>{title}</Text>
          <Text style={styles.completeBody}>{body}</Text>
        </ScrollView>

        <TouchableOpacity
          style={shared.primaryButton}
          onPress={onPress}
          activeOpacity={0.85}
        >
          <Text style={shared.primaryButtonText}>{buttonText}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  completeContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 24,
  },

  completeBody: {
    color: C.muted,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
  },

  completeScore: {
    marginTop: 16,
    color: C.primary,
    fontSize: 18,
    fontWeight: "900",
  },
});
