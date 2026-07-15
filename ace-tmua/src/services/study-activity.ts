import AsyncStorage from "@react-native-async-storage/async-storage";

export const COMPLETED_LESSONS_KEY = "completedLessonIds";
export const LESSON_ACTIVITY_KEY = "@ace-tmua/lesson-activity/v1";

export interface LessonActivity {
  id: string;
  lessonId: string;
  completedAt: string;
  durationSeconds: number;
  correctAnswers: number;
  totalAnswers: number;
}

export interface RecordLessonActivityInput {
  lessonId: string;
  durationSeconds: number;
  correctAnswers: number;
  totalAnswers: number;
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isLessonActivity(value: unknown): value is LessonActivity {
  if (!value || typeof value !== "object") return false;

  const activity = value as Partial<LessonActivity>;
  return (
    typeof activity.id === "string" &&
    typeof activity.lessonId === "string" &&
    typeof activity.completedAt === "string" &&
    typeof activity.durationSeconds === "number" &&
    typeof activity.correctAnswers === "number" &&
    typeof activity.totalAnswers === "number"
  );
}

export async function getLessonActivities() {
  const storedValue = await AsyncStorage.getItem(LESSON_ACTIVITY_KEY);
  if (!storedValue) return [];

  try {
    const parsedValue: unknown = JSON.parse(storedValue);
    return Array.isArray(parsedValue)
      ? parsedValue.filter(isLessonActivity)
      : [];
  } catch {
    return [];
  }
}

export async function recordLessonActivity(
  input: RecordLessonActivityInput,
) {
  const activities = await getLessonActivities();
  const activity: LessonActivity = {
    id: makeId("lesson"),
    lessonId: input.lessonId,
    completedAt: new Date().toISOString(),
    durationSeconds: Math.max(1, Math.round(input.durationSeconds)),
    correctAnswers: Math.max(0, input.correctAnswers),
    totalAnswers: Math.max(0, input.totalAnswers),
  };

  await AsyncStorage.setItem(
    LESSON_ACTIVITY_KEY,
    JSON.stringify([activity, ...activities].slice(0, 200)),
  );

  return activity;
}

export async function mergeLessonActivities(
  incomingActivities: LessonActivity[],
) {
  const existingActivities = await getLessonActivities();
  const byId = new Map<string, LessonActivity>();

  [...existingActivities, ...incomingActivities].forEach((activity) => {
    if (isLessonActivity(activity)) byId.set(activity.id, activity);
  });

  const merged = [...byId.values()]
    .sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
    )
    .slice(0, 200);
  await AsyncStorage.setItem(LESSON_ACTIVITY_KEY, JSON.stringify(merged));
  return merged;
}
