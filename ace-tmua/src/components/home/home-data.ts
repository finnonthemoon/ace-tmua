import AsyncStorage from "@react-native-async-storage/async-storage";

import lessonsData from "@/data/lessons.json";

import {
  getActiveSessions,
  getPracticeResults,
} from "../practice/practice-storage";
import { practiceTests } from "../practice/practice-data";
import type {
  PracticeResult,
  PracticeSession,
} from "../practice/types";
import type { Lesson } from "../lesson/types";
import {
  COMPLETED_LESSONS_KEY,
  getLessonActivities,
} from "../../services/study-activity";
import type { LessonActivity } from "../../services/study-activity";

export const DAILY_GOAL_MINUTES = 15;
export const WEEKLY_GOAL_MINUTES = 75;

export interface TopicMeta {
  id: string;
  title: string;
  color: string;
  softColor: string;
}

export const TOPICS: TopicMeta[] = [
  {
    id: "topic-1",
    title: "Algebra and Functions",
    color: "#FF6F1A",
    softColor: "#FFF0D3",
  },
  {
    id: "topic-2",
    title: "Sequences and Series",
    color: "#F3A82C",
    softColor: "#FFF2D5",
  },
  {
    id: "topic-3",
    title: "Coordinate Geometry",
    color: "#9B7BE6",
    softColor: "#F0EAFF",
  },
  {
    id: "topic-4",
    title: "Trigonometry",
    color: "#62ACE4",
    softColor: "#E7F5FF",
  },
  {
    id: "topic-5",
    title: "Exponentials and Logarithms",
    color: "#55C59A",
    softColor: "#E7F9F1",
  },
  {
    id: "topic-6",
    title: "Calculus",
    color: "#ED7D92",
    softColor: "#FDECF0",
  },
  {
    id: "topic-7",
    title: "Geometry and Data",
    color: "#4F91D4",
    softColor: "#E9F3FD",
  },
  {
    id: "topic-8",
    title: "Logic and Proof",
    color: "#E9B738",
    softColor: "#FFF6D7",
  },
];

export interface TopicProgress extends TopicMeta {
  completed: number;
  total: number;
  nextLesson: Lesson | null;
}

export interface WeakArea {
  title: string;
  percentage: number;
  lesson: Lesson | null;
  topic: TopicMeta | null;
}

export interface HomeDashboardData {
  completedLessonIds: string[];
  completedLessonCount: number;
  totalLessonCount: number;
  courseProgressPercent: number;
  lessonActivities: LessonActivity[];
  practiceResults: PracticeResult[];
  activeSessions: PracticeSession[];
  primarySession: PracticeSession | null;
  primarySessionTitle: string | null;
  primarySessionQuestionCount: number | null;
  nextLesson: Lesson | null;
  nextLessonTopic: TopicMeta | null;
  topicProgress: TopicProgress[];
  weakArea: WeakArea | null;
  latestResult: PracticeResult | null;
  bestPracticePercent: number | null;
  totalPracticeQuestions: number;
  todayMinutes: number;
  dailyGoalPercent: number;
  weeklyMinutes: number;
  weeklySessions: number;
  dailyMinutes: number[];
  streak: number;
  activeWeekdays: boolean[];
}

const LESSONS = lessonsData.lessons as Lesson[];

function parseCompletedLessonIds(storedValue: string | null) {
  if (!storedValue) return [];

  try {
    const parsedValue: unknown = JSON.parse(storedValue);
    return Array.isArray(parsedValue)
      ? parsedValue.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfWeek(date: Date) {
  const next = startOfDay(date);
  const day = next.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + mondayOffset);
  return next;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFrom(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getStreak(activityDates: Date[], now: Date) {
  const activeDates = new Set(activityDates.map(dateKey));
  const cursor = startOfDay(now);

  if (!activeDates.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (activeDates.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function topicForLesson(lesson: Lesson | null) {
  return lesson
    ? TOPICS.find((topic) => topic.id === lesson.topicId) ?? null
    : null;
}

function buildTopicProgress(completedIds: Set<string>) {
  return TOPICS.map<TopicProgress>((topic) => {
    const topicLessons = LESSONS.filter((lesson) => lesson.topicId === topic.id);
    const completed = topicLessons.filter((lesson) =>
      completedIds.has(lesson.id),
    ).length;
    const nextLesson =
      topicLessons.find((lesson, index) => {
        if (completedIds.has(lesson.id) || lesson.screens.length === 0) {
          return false;
        }

        return index === 0 || completedIds.has(topicLessons[index - 1].id);
      }) ?? null;

    return {
      ...topic,
      completed,
      total: topicLessons.length,
      nextLesson,
    };
  });
}

function chooseNextLesson(topicProgress: TopicProgress[]) {
  const startedTopic = topicProgress
    .filter((topic) => topic.completed > 0 && topic.nextLesson)
    .sort((a, b) => b.completed - a.completed)[0];

  return (
    startedTopic?.nextLesson ??
    topicProgress.find((topic) => topic.nextLesson)?.nextLesson ??
    null
  );
}

function topicIdForPracticeTitle(title: string) {
  const normalised = title.toLowerCase();

  if (normalised.includes("sequence")) return "topic-2";
  if (normalised.includes("coordinate")) return "topic-3";
  if (normalised.includes("trig")) return "topic-4";
  if (normalised.includes("exponential") || normalised.includes("log")) {
    return "topic-5";
  }
  if (normalised.includes("calculus")) return "topic-6";
  if (
    normalised.includes("probability") ||
    normalised.includes("geometry") ||
    normalised.includes("data")
  ) {
    return "topic-7";
  }
  if (
    normalised.includes("logic") ||
    normalised.includes("proof") ||
    normalised.includes("number theory")
  ) {
    return "topic-8";
  }
  if (normalised.includes("algebra") || normalised.includes("number")) {
    return "topic-1";
  }

  return null;
}

function getWeakArea(
  results: PracticeResult[],
  topicProgress: TopicProgress[],
): WeakArea | null {
  const totals = new Map<string, { correct: number; total: number }>();

  results.forEach((result) => {
    result.topicResults.forEach((topicResult) => {
      const current = totals.get(topicResult.topicTitle) ?? {
        correct: 0,
        total: 0,
      };
      current.correct += topicResult.correct;
      current.total += topicResult.total;
      totals.set(topicResult.topicTitle, current);
    });
  });

  const weakest = [...totals.entries()]
    .filter(([, score]) => score.total > 0)
    .sort(
      ([, a], [, b]) => a.correct / a.total - b.correct / b.total,
    )[0];

  if (!weakest) return null;

  const [title, score] = weakest;
  const topicId = topicIdForPracticeTitle(title);
  const topic = topicProgress.find((item) => item.id === topicId) ?? null;

  return {
    title,
    percentage: Math.round((score.correct / score.total) * 100),
    lesson: topic?.nextLesson ?? null,
    topic,
  };
}

function percentage(result: PracticeResult) {
  return result.maxScore > 0
    ? Math.round((result.score / result.maxScore) * 100)
    : 0;
}

export async function loadHomeDashboard(
  now = new Date(),
): Promise<HomeDashboardData> {
  const [storedCompletedIds, lessonActivities, practiceResults, activeSessions] =
    await Promise.all([
      AsyncStorage.getItem(COMPLETED_LESSONS_KEY),
      getLessonActivities(),
      getPracticeResults(),
      getActiveSessions(practiceTests.map((test) => test.id)),
    ]);

  const completedLessonIds = parseCompletedLessonIds(storedCompletedIds);
  const completedIds = new Set(completedLessonIds);
  const topicProgress = buildTopicProgress(completedIds);
  const nextLesson = chooseNextLesson(topicProgress);
  const sortedResults = [...practiceResults].sort(
    (a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  );
  const sortedSessions = [...activeSessions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  const primarySession = sortedSessions[0] ?? null;
  const primarySessionTitle = primarySession
    ? practiceTests.find((test) => test.id === primarySession.testId)?.title ??
      "Practice attempt"
    : null;
  const primarySessionQuestionCount = primarySession
    ? practiceTests.find((test) => test.id === primarySession.testId)
        ?.questionCount ??
      primarySession.questionIds?.length ??
      null
    : null;

  const weekStart = startOfWeek(now);
  const tomorrow = startOfDay(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayStart = startOfDay(now);
  const dailySeconds = Array.from({ length: 7 }, () => 0);
  const weeklyActivityIds = new Set<string>();
  const activityDates: Date[] = [];

  lessonActivities.forEach((activity) => {
    const completedAt = dateFrom(activity.completedAt);
    if (!completedAt) return;

    activityDates.push(completedAt);
    const dayIndex = (completedAt.getDay() + 6) % 7;
    if (
      completedAt >= weekStart &&
      completedAt < tomorrow &&
      dayIndex >= 0 &&
      dayIndex < 7
    ) {
      dailySeconds[dayIndex] += activity.durationSeconds;
      weeklyActivityIds.add(activity.id);
    }
  });

  sortedResults.forEach((result) => {
    const completedAt = dateFrom(result.completedAt);
    if (!completedAt) return;

    activityDates.push(completedAt);
    const dayIndex = (completedAt.getDay() + 6) % 7;
    if (
      completedAt >= weekStart &&
      completedAt < tomorrow &&
      dayIndex >= 0 &&
      dayIndex < 7
    ) {
      dailySeconds[dayIndex] += result.elapsedSeconds;
      weeklyActivityIds.add(result.id);
    }
  });

  const todayIndex = (todayStart.getDay() + 6) % 7;
  const todaySeconds = dailySeconds[todayIndex];
  const weeklySeconds = dailySeconds.reduce(
    (total, seconds) => total + seconds,
    0,
  );
  const completedLessonCount = LESSONS.filter((lesson) =>
    completedIds.has(lesson.id),
  ).length;

  return {
    completedLessonIds,
    completedLessonCount,
    totalLessonCount: LESSONS.length,
    courseProgressPercent: Math.round(
      (completedLessonCount / Math.max(1, LESSONS.length)) * 100,
    ),
    lessonActivities,
    practiceResults: sortedResults,
    activeSessions: sortedSessions,
    primarySession,
    primarySessionTitle,
    primarySessionQuestionCount,
    nextLesson,
    nextLessonTopic: topicForLesson(nextLesson),
    topicProgress,
    weakArea: getWeakArea(sortedResults, topicProgress),
    latestResult: sortedResults[0] ?? null,
    bestPracticePercent:
      sortedResults.length > 0
        ? Math.max(...sortedResults.map(percentage))
        : null,
    totalPracticeQuestions: sortedResults.reduce(
      (total, result) => total + Object.keys(result.answers).length,
      0,
    ),
    todayMinutes: Math.round(todaySeconds / 60),
    dailyGoalPercent: Math.min(
      100,
      Math.round((todaySeconds / (DAILY_GOAL_MINUTES * 60)) * 100),
    ),
    weeklyMinutes: Math.round(weeklySeconds / 60),
    weeklySessions: weeklyActivityIds.size,
    dailyMinutes: dailySeconds.map((seconds) => Math.round(seconds / 60)),
    streak: getStreak(activityDates, now),
    activeWeekdays: dailySeconds.map((seconds) => seconds > 0),
  };
}
