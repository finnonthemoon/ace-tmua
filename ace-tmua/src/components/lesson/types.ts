// types.ts

export interface Lesson {
  id: string;
  topicId: string;
  title: string;
  screens: LessonScreen[];
}

export type LessonScreen =
  | ConceptScreen
  | RevealScreen
  | TrueFalseScreen
  | MultipleChoiceScreen
  | WorkedExampleScreen
  | MilestoneScreen
  | LessonSummaryScreen;

export interface ConceptScreen {
  type: "concept";
  eyebrow?: string;
  title: string;
  body: string;
  keyPoint?: string;
  buttonText?: string;
}

export interface RevealStep {
  title: string;
  body: string;
}

export interface RevealScreen {
  type: "reveal";
  eyebrow?: string;
  title: string;
  steps: RevealStep[];
  buttonText?: string;
}

export interface TrueFalseScreen {
  type: "trueFalse";
  eyebrow?: string;
  question: string;
  answer: boolean;
  correctFeedback: string;
  incorrectFeedback: string;
}

export interface MultipleChoiceScreen {
  type: "multipleChoice";
  eyebrow?: string;
  question: string;
  prompt?: string;
  options: string[];
  answerIndex: number;
  correctFeedback: string;
  incorrectFeedback: string;
}

export interface WorkedExampleScreen {
  type: "workedExample";
  eyebrow?: string;
  title: string;
  question: string;
  options?: string[];
  answerIndex: number;
  steps: RevealStep[];
  finalAnswer: string;
  buttonText?: string;
}

export interface MilestoneScreen {
  type: "milestone";
  eyebrow?: string;
  title: string;
  body: string;
  buttonText?: string;
}

export interface LessonSummaryScreen {
  type: "lessonSummary";
  eyebrow?: string;
  title?: string;
  keyPoints?: string[];
  reviewItems?: string[];
  buttonText?: string;
}