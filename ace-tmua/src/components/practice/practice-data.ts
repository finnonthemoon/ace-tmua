import practiceQuestionBankData from "@/data/practice-question-bank.json";
import practiceTestData from "@/data/practice-tests.json";

import type {
  PracticeBankQuestionData,
  PracticeBlueprintSlot,
  PracticeQuestionData,
  PracticeTestData,
  PracticeTestDefinition,
} from "./types";

function assertQuestion(
  question: PracticeQuestionData,
  source: string,
  questionIds: Set<string>,
) {
  if (!question.id || questionIds.has(question.id)) {
    throw new Error(`Duplicate or missing question id in ${source}.`);
  }

  questionIds.add(question.id);

  if (question.options.length < 4 || question.options.length > 8) {
    throw new Error(`${question.id} must have between 4 and 8 options.`);
  }

  if (
    !Number.isInteger(question.answerIndex) ||
    question.answerIndex < 0 ||
    question.answerIndex >= question.options.length
  ) {
    throw new Error(`${question.id} has an invalid answerIndex.`);
  }
}

function normaliseTests(
  rawTests: (PracticeTestDefinition & { questionCount?: number })[],
) {
  return rawTests.map((test) => ({
    ...test,
    questionCount: test.questionCount ?? test.questions?.length ?? 0,
  })) as PracticeTestDefinition[];
}

function questionsForSlot(
  slot: PracticeBlueprintSlot,
  paperStyle: PracticeTestDefinition["paperStyle"],
  bank: PracticeBankQuestionData[],
) {
  return bank.filter(
    (question) =>
      question.paperStyle === paperStyle &&
      question.topicId === slot.topicId &&
      question.difficulty === slot.difficulty,
  );
}

function validateData(
  tests: PracticeTestDefinition[],
  bank: PracticeBankQuestionData[],
) {
  const testIds = new Set<string>();
  const questionIds = new Set<string>();

  bank.forEach((question) =>
    assertQuestion(question, "practice question bank", questionIds),
  );

  tests.forEach((test) => {
    if (!test.id || testIds.has(test.id)) {
      throw new Error("Practice tests must have unique ids.");
    }

    testIds.add(test.id);

    if (test.durationMinutes <= 0 || test.questionCount <= 0) {
      throw new Error(`${test.id} must have a duration and question count.`);
    }

    const hasStaticQuestions = !!test.questions?.length;
    const hasBlueprint = !!test.selectionBlueprint?.length;

    if (hasStaticQuestions === hasBlueprint) {
      throw new Error(
        `${test.id} must define either static questions or a selection blueprint.`,
      );
    }

    if (test.questions) {
      if (test.questions.length !== test.questionCount) {
        throw new Error(`${test.id} questionCount does not match its questions.`);
      }

      test.questions.forEach((question) =>
        assertQuestion(question, test.id, questionIds),
      );
    }

    if (test.selectionBlueprint) {
      const blueprintCount = test.selectionBlueprint.reduce(
        (total, slot) => total + slot.count,
        0,
      );

      if (blueprintCount !== test.questionCount) {
        throw new Error(`${test.id} blueprint must select ${test.questionCount}.`);
      }

      test.selectionBlueprint.forEach((slot) => {
        if (!Number.isInteger(slot.count) || slot.count <= 0) {
          throw new Error(`${test.id} has an invalid blueprint count.`);
        }

        const candidates = questionsForSlot(slot, test.paperStyle, bank);
        if (candidates.length < slot.count) {
          throw new Error(
            `${test.id} needs ${slot.count} ${slot.topicId}/${slot.difficulty} questions but only has ${candidates.length}.`,
          );
        }
      });
    }
  });

  return { tests, bank };
}

function shuffled<T>(values: T[]) {
  const copy = [...values];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

const validated = validateData(
  normaliseTests(
    practiceTestData.tests as (PracticeTestDefinition & {
      questionCount?: number;
    })[],
  ),
  practiceQuestionBankData.questions as PracticeBankQuestionData[],
);

export const practiceTests = validated.tests;
export const practiceQuestionBank = validated.bank;

const questionById = new Map<string, PracticeQuestionData>();

practiceQuestionBank.forEach((question) => questionById.set(question.id, question));
practiceTests.forEach((test) =>
  test.questions?.forEach((question) => questionById.set(question.id, question)),
);

export function getPracticeTest(testId: string | undefined) {
  return practiceTests.find((test) => test.id === testId);
}

export function selectQuestionIdsForTest(test: PracticeTestDefinition) {
  if (test.questions) {
    return test.questions.map((question) => question.id);
  }

  if (!test.selectionBlueprint) {
    throw new Error(`${test.id} has no question selection strategy.`);
  }

  const selected = test.selectionBlueprint.flatMap((slot) =>
    shuffled(questionsForSlot(slot, test.paperStyle, practiceQuestionBank))
      .slice(0, slot.count)
      .map((question) => question.id),
  );

  return shuffled(selected);
}

export function resolvePracticeTest(
  definition: PracticeTestDefinition,
  selectedQuestionIds?: string[],
): PracticeTestData {
  const ids = selectedQuestionIds ?? definition.questions?.map(({ id }) => id);

  if (
    !ids ||
    ids.length !== definition.questionCount ||
    new Set(ids).size !== ids.length
  ) {
    throw new Error(`${definition.id} does not have a complete question selection.`);
  }

  const questions = ids.map((id) => {
    const question = questionById.get(id);
    if (!question) {
      throw new Error(`Question ${id} is not available for ${definition.id}.`);
    }
    return question;
  });

  if (definition.questions) {
    const allowedIds = new Set(definition.questions.map(({ id }) => id));
    if (ids.some((id) => !allowedIds.has(id))) {
      throw new Error(`${definition.id} contains an invalid static question.`);
    }
  }

  if (definition.selectionBlueprint) {
    definition.selectionBlueprint.forEach((slot) => {
      const selectedForSlot = ids.filter((id) => {
        const bankQuestion = practiceQuestionBank.find(
          (question) => question.id === id,
        );
        return (
          bankQuestion?.paperStyle === definition.paperStyle &&
          bankQuestion.topicId === slot.topicId &&
          bankQuestion.difficulty === slot.difficulty
        );
      });

      if (selectedForSlot.length !== slot.count) {
        throw new Error(`${definition.id} contains an invalid topic distribution.`);
      }
    });
  }

  return {
    id: definition.id,
    title: definition.title,
    subtitle: definition.subtitle,
    description: definition.description,
    paperStyle: definition.paperStyle,
    durationMinutes: definition.durationMinutes,
    marksPerQuestion: definition.marksPerQuestion,
    calculatorAllowed: definition.calculatorAllowed,
    formulaBookletAllowed: definition.formulaBookletAllowed,
    negativeMarking: definition.negativeMarking,
    premium: definition.premium,
    questionCount: definition.questionCount,
    questions,
  };
}
