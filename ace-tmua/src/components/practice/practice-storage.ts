import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
  PracticeMode,
  PracticeResult,
  PracticeSession,
  PracticeTestData,
  PracticeTestDefinition,
  TopicResult,
} from "./types";

const ACTIVE_SESSION_PREFIX = "@ace-tmua/practice/session/v1/";
const RESULTS_KEY = "@ace-tmua/practice/results/v1";

function activeSessionKey(testId: string) {
  return `${ACTIVE_SESSION_PREFIX}${testId}`;
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createPracticeSession(
  test: PracticeTestDefinition,
  mode: PracticeMode,
  questionIds: string[],
): PracticeSession {
  const now = new Date().toISOString();

  return {
    id: makeId("session"),
    testId: test.id,
    mode,
    startedAt: now,
    updatedAt: now,
    currentIndex: 0,
    answers: {},
    flaggedQuestionIds: [],
    questionIds,
  };
}

export function getElapsedSeconds(
  session: Pick<PracticeSession, "startedAt">,
  now = Date.now(),
) {
  return Math.max(
    0,
    Math.floor((now - new Date(session.startedAt).getTime()) / 1000),
  );
}

export function getRemainingSeconds(
  session: PracticeSession,
  test: Pick<PracticeTestDefinition, "durationMinutes">,
  now = Date.now(),
) {
  return Math.max(
    0,
    test.durationMinutes * 60 - getElapsedSeconds(session, now),
  );
}

export async function getActiveSession(testId: string) {
  const value = await AsyncStorage.getItem(activeSessionKey(testId));
  return value ? (JSON.parse(value) as PracticeSession) : null;
}

export async function getActiveSessions(testIds: string[]) {
  const sessions = await Promise.all(testIds.map(getActiveSession));
  return sessions.filter((session): session is PracticeSession => !!session);
}

export async function saveActiveSession(session: PracticeSession) {
  await AsyncStorage.setItem(
    activeSessionKey(session.testId),
    JSON.stringify(session),
  );
}

export async function clearActiveSession(testId: string) {
  await AsyncStorage.removeItem(activeSessionKey(testId));
}

export async function getPracticeResults() {
  const value = await AsyncStorage.getItem(RESULTS_KEY);
  return value ? (JSON.parse(value) as PracticeResult[]) : [];
}

export async function getPracticeResult(resultId: string) {
  const results = await getPracticeResults();
  return results.find((result) => result.id === resultId) ?? null;
}

export async function savePracticeResult(result: PracticeResult) {
  const results = await getPracticeResults();
  const withoutDuplicate = results.filter((item) => item.id !== result.id);
  const nextResults = [result, ...withoutDuplicate].slice(0, 100);
  await AsyncStorage.setItem(RESULTS_KEY, JSON.stringify(nextResults));
}

function buildTopicResults(
  test: PracticeTestData,
  answers: Record<string, number>,
) {
  const topics = new Map<string, TopicResult>();

  test.questions.forEach((question) => {
    const current = topics.get(question.topicId) ?? {
      topicId: question.topicId,
      topicTitle: question.topicTitle,
      correct: 0,
      total: 0,
    };

    current.total += 1;
    if (answers[question.id] === question.answerIndex) {
      current.correct += 1;
    }

    topics.set(question.topicId, current);
  });

  return [...topics.values()];
}

export function createPracticeResult(
  session: PracticeSession,
  test: PracticeTestData,
  timeExpired: boolean,
): PracticeResult {
  const completedAt = new Date().toISOString();
  const score = test.questions.reduce(
    (total, question) =>
      total +
      (session.answers[question.id] === question.answerIndex
        ? test.marksPerQuestion
        : 0),
    0,
  );
  const elapsedSeconds = getElapsedSeconds(session);

  return {
    id: makeId("result"),
    sessionId: session.id,
    testId: test.id,
    mode: session.mode,
    startedAt: session.startedAt,
    completedAt,
    elapsedSeconds:
      session.mode === "timed"
        ? Math.min(elapsedSeconds, test.durationMinutes * 60)
        : elapsedSeconds,
    timeExpired,
    answers: session.answers,
    flaggedQuestionIds: session.flaggedQuestionIds,
    questionIds: session.questionIds ?? test.questions.map(({ id }) => id),
    score,
    maxScore: test.questions.length * test.marksPerQuestion,
    topicResults: buildTopicResults(test, session.answers),
  };
}
