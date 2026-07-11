import { useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import LessonPlayer from "../../components/lesson/LessonPlayer";
import type { Lesson } from "../../components/lesson/types";
import lessonData from "../../data/lessons.json";

export default function LessonRoute() {
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();

  const lesson = useMemo(() => {
    return (lessonData.lessons as Lesson[]).find(
      (candidate) => candidate.id === lessonId,
    );
  }, [lessonId]);

  if (!lesson) {
    return null;
  }

  return (
    <LessonPlayer
      lesson={lesson}
      onExit={() => router.back()}
      onComplete={(completedLesson) => {
        // Replace this with AsyncStorage or your eventual account API.
        console.log("Lesson completed:", completedLesson.id);
      }}
    />
  );
}
