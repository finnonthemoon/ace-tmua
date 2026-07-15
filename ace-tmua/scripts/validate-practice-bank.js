const bankData = require("../src/data/practice-question-bank.json");
const testData = require("../src/data/practice-tests.json");

const validDifficulties = new Set(["foundation", "standard", "stretch"]);
const validPaperStyles = new Set(["paper-1", "paper-2"]);
const ids = new Set();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateMathMarkers(value, source) {
  const openings = value.match(/\[\[/g)?.length ?? 0;
  const closings = value.match(/\]\]/g)?.length ?? 0;
  assert(openings === closings, `${source} has unbalanced [[LaTeX]] markers.`);
}

function validateQuestion(question, source) {
  assert(question.id && !ids.has(question.id), `${source} has a duplicate id.`);
  ids.add(question.id);
  assert(question.topicId && question.topicTitle, `${question.id} needs a topic.`);
  assert(
    validDifficulties.has(question.difficulty),
    `${question.id} has an invalid difficulty.`,
  );
  assert(
    Array.isArray(question.options) &&
      question.options.length >= 4 &&
      question.options.length <= 8,
    `${question.id} must have 4 to 8 options.`,
  );
  assert(
    Number.isInteger(question.answerIndex) &&
      question.answerIndex >= 0 &&
      question.answerIndex < question.options.length,
    `${question.id} has an invalid answerIndex.`,
  );
  assert(
    new Set(question.options).size === question.options.length,
    `${question.id} contains duplicate option text.`,
  );

  [
    question.question,
    question.prompt ?? "",
    ...question.options,
    question.explanation,
  ].forEach((value) => validateMathMarkers(value, question.id));
}

bankData.questions.forEach((question) => {
  assert(
    validPaperStyles.has(question.paperStyle),
    `${question.id} has an invalid paperStyle.`,
  );
  validateQuestion(question, "question bank");
});

const testIds = new Set();

testData.tests.forEach((test) => {
  assert(test.id && !testIds.has(test.id), "Practice tests need unique ids.");
  testIds.add(test.id);

  if (test.questions) {
    test.questions.forEach((question) => validateQuestion(question, test.id));
    const expected = test.questionCount ?? test.questions.length;
    assert(
      test.questions.length === expected,
      `${test.id} has the wrong static question count.`,
    );
    return;
  }

  assert(
    Array.isArray(test.selectionBlueprint),
    `${test.id} needs a selection blueprint.`,
  );
  const selectedCount = test.selectionBlueprint.reduce(
    (total, slot) => total + slot.count,
    0,
  );
  assert(
    selectedCount === test.questionCount,
    `${test.id} blueprint selects ${selectedCount}, expected ${test.questionCount}.`,
  );

  test.selectionBlueprint.forEach((slot) => {
    const candidates = bankData.questions.filter(
      (question) =>
        question.paperStyle === test.paperStyle &&
        question.topicId === slot.topicId &&
        question.difficulty === slot.difficulty,
    );
    assert(
      candidates.length >= slot.count,
      `${test.id} needs ${slot.count} ${slot.topicId}/${slot.difficulty}, only ${candidates.length} available.`,
    );
  });
});

const bankCounts = bankData.questions.reduce((counts, question) => {
  counts[question.paperStyle] = (counts[question.paperStyle] ?? 0) + 1;
  return counts;
}, {});

console.log(
  `Practice bank valid: ${bankData.questions.length} bank questions ` +
    `(${bankCounts["paper-1"] ?? 0} Paper 1, ` +
    `${bankCounts["paper-2"] ?? 0} Paper 2), ${testData.tests.length} tests.`,
);
