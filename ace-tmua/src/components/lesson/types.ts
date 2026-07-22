
export interface Lesson {
  id: string;
  topicId: string;
  title: string;
  screens: LessonScreen[];
}

export type LessonDiagramKind =
  | "tangent-gradient"
  | "turning-points"
  | "cubic-stationary-points"
  | "signed-area"
  | "trapezium-rule"
  | "common-polynomial-graphs"
  | "root-modulus-graphs"
  | "reciprocal-graph"
  | "exponential-log-graphs"
  | "common-trig-graphs"
  | "graph-vertical-transformations"
  | "graph-horizontal-transformations"
  | "graph-scale-reflections"
  | "graph-combined-transformations"
  | "graph-transformations"
  | "function-intersections"
  | "similarity-scale"
  | "circle-theorems"
  | "mixed-circle-theorem"
  | "histogram-density"
  | "cumulative-frequency"
  | "scatter-correlation"
  | "probability-tree"
  | "line-gradient"
  | "parallel-perpendicular"
  | "coordinate-circle"
  | "line-circle-intersections"
  | "circle-chord-bisector"
  | "triangle-laws"
  | "ambiguous-sine"
  | "radians-sector"
  | "unit-circle-values"
  | "trig-graphs"
  | "trig-solutions"
  | "implication-flow"
  | "necessary-sufficient"
  | "quantifier-scope"
  | "proof-chain"
  | "proof-by-cases"
  | "counterexample-search";

export interface LessonDiagram {
  kind: LessonDiagramKind;
  caption?: string;
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
  diagram?: LessonDiagram;
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
  diagram?: LessonDiagram;
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
  diagram?: LessonDiagram;
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
  diagram?: LessonDiagram;
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