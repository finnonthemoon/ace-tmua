export type PracticeMode = "timed" | "untimed";

export type PracticeDifficulty = "foundation" | "standard" | "stretch";

export type PracticePaperStyle = "paper-1" | "paper-2" | "mixed";

export interface PracticeQuestionData {
  id: string;
  topicId: string;
  topicTitle: string;
  difficulty: PracticeDifficulty;
  question: string;
  prompt?: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface PracticeBankQuestionData extends PracticeQuestionData {
  paperStyle: Exclude<PracticePaperStyle, "mixed">;
}

export interface PracticeBlueprintSlot {
  topicId: string;
  topicTitle: string;
  difficulty: PracticeDifficulty;
  count: number;
}

export interface PracticeTestDefinition {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  paperStyle: PracticePaperStyle;
  durationMinutes: number;
  marksPerQuestion: number;
  calculatorAllowed: boolean;
  formulaBookletAllowed: boolean;
  negativeMarking: boolean;
  premium: boolean;
  questionCount: number;
  questions?: PracticeQuestionData[];
  selectionBlueprint?: PracticeBlueprintSlot[];
}

export interface PracticeTestData
  extends Omit<
    PracticeTestDefinition,
    "questions" | "selectionBlueprint"
  > {
  questions: PracticeQuestionData[];
}

export interface PracticeSession {
  id: string;
  testId: string;
  mode: PracticeMode;
  startedAt: string;
  updatedAt: string;
  currentIndex: number;
  answers: Record<string, number>;
  flaggedQuestionIds: string[];
  /** Optional for backwards compatibility with saved static-test attempts. */
  questionIds?: string[];
}

export interface TopicResult {
  topicId: string;
  topicTitle: string;
  correct: number;
  total: number;
}

export interface PracticeResult {
  id: string;
  sessionId: string;
  testId: string;
  mode: PracticeMode;
  startedAt: string;
  completedAt: string;
  elapsedSeconds: number;
  timeExpired: boolean;
  answers: Record<string, number>;
  flaggedQuestionIds: string[];
  /** Optional for backwards compatibility with results saved before question banks. */
  questionIds?: string[];
  score: number;
  maxScore: number;
  topicResults: TopicResult[];
}

export const TMUA_PAPER_FORMAT = {
  questionsPerPaper: 20,
  durationMinutes: 75,
  marksPerQuestion: 1,
  negativeMarking: false,
  calculatorAllowed: false,
  formulaBookletAllowed: false,
} as const;
