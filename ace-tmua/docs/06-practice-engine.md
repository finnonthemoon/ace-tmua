# 6. Practice-paper engine

## What the practice system must guarantee

The practice system is more than a list of questions. It must:

- support fixed and freshly generated tests;
- preserve an exact generated paper for the whole attempt;
- enforce topic/difficulty distributions;
- offer timed and untimed modes;
- save answers, flags, and current position;
- continue a timed clock while the user is away;
- prevent duplicate submission;
- mark answers and calculate topic breakdowns;
- show the exact questions attempted during review;
- restrict Premium mocks based on entitlement.

The implementation separates these responsibilities into data, selection,
storage, runner UI, and results.

## The data model

[`src/components/practice/types.ts`](../src/components/practice/types.ts)
defines the contracts.

A question has:

```ts
interface PracticeQuestionData {
  id: string;
  topicId: string;
  topicTitle: string;
  difficulty: "foundation" | "standard" | "stretch";
  question: string;
  prompt?: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}
```

`answerIndex` is zero-based: 0 is A, 1 is B, and so on.

A question-bank item also has `paperStyle: "paper-1" | "paper-2"`. A test
definition describes timing, rules, Premium access, and one of two selection
strategies.

## Static tests and blueprint tests

### Static test

The starter diagnostic embeds a fixed `questions` array in the test definition.
Every user receives the same ordered set.

### Blueprint test

Premium papers define `selectionBlueprint`, whose slots request counts by
topic and difficulty. Conceptually:

```json
{
  "topicId": "algebra",
  "difficulty": "standard",
  "count": 2
}
```

For every slot, the engine filters the bank by:

- the paper style of the test;
- matching `topicId`;
- matching difficulty.

It shuffles candidates, takes the required count, combines all selected IDs,
then shuffles the completed paper. This produces variety without losing the
designed distribution.

The current inventory is:

- one free 10-question starter diagnostic;
- one Premium 20-question Paper 1 blueprint;
- one Premium 20-question Paper 2 blueprint;
- 63 questions in the bank (32 Paper 1 and 31 Paper 2 at the last validation).

## Why the session stores question IDs

Random selection happens only when a new attempt starts. The resulting IDs are
stored in `PracticeSession.questionIds`:

```ts
return {
  id: makeId("session"),
  testId: test.id,
  mode,
  startedAt: now,
  currentIndex: 0,
  answers: {},
  flaggedQuestionIds: [],
  questionIds,
};
```

Without those IDs, reopening the runner could select a different random paper,
making saved answer IDs and the later result meaningless. The result stores the
IDs too, so historical review still knows exactly what was attempted.

`resolvePracticeTest` turns a definition plus IDs into a concrete
`PracticeTestData`. It refuses incomplete, duplicate, unknown, or
distribution-breaking selections.

## Validation happens in two places

[`practice-data.ts`](../src/components/practice/practice-data.ts) validates as
the data module loads. The standalone
[`scripts/validate-practice-bank.js`](../scripts/validate-practice-bank.js) runs
the same class of checks without starting the app.

Checks include:

- unique test and question IDs;
- 4–8 answer options;
- valid zero-based `answerIndex`;
- a positive question count and duration;
- exactly one selection strategy per test;
- blueprint counts adding to the test count;
- enough bank candidates for every blueprint slot;
- no duplicate answer option strings;
- balanced `[[LaTeX]]` markers.

Runtime validation is defensive; the script is faster feedback for authors and
CI.

## Starting and resuming an attempt

[`src/app/practice/[testId]/instructions.tsx`](../src/app/practice/[testId]/instructions.tsx)
loads any active session for the test.

The user may:

- resume it;
- choose timed or untimed for a new attempt;
- confirm before replacing an existing attempt.

For a new attempt the screen:

1. clears the previous local and remote session;
2. selects/stores the question IDs;
3. creates the session with an ISO `startedAt` time;
4. saves it locally and starts best-effort cloud sync;
5. replaces instructions with the runner route.

There is one active session per test ID, both locally and in Supabase.

## The timer is based on wall-clock time

The app does not store “74:59, 74:58, 74:57…” every second. It stores the
start timestamp and calculates:

```ts
Math.floor((now - new Date(session.startedAt).getTime()) / 1000)
```

For timed mode, remaining time is duration minus elapsed time. This is robust
across renders and app restarts. It also means that deliberately leaving the
test does not pause the real exam clock.

The runner updates a `now` state once per second only to refresh the display.
`startedAt`, not the interval count, is the source of truth.

For untimed mode, the same elapsed calculation counts upward.

## The runner state

[`PracticeTestRunner.tsx`](../src/components/practice/PracticeTestRunner.tsx)
loads the saved session. If none exists it redirects to instructions.

The session holds:

- current question index;
- answer map keyed by question ID;
- flagged question IDs;
- exact generated question IDs;
- timestamps and mode.

Every answer, navigation change, or flag produces an updated session and calls
`saveActiveSession`. This gives reliable resume behaviour even if the app is
closed unexpectedly.

`sessionRef.current` mirrors state so an asynchronous submit reads the latest
answers. `submittingRef.current` prevents two simultaneous submissions from a
timer expiry and a user tap.

## Question navigation

The runner provides:

- Previous and Next;
- a flag toggle;
- a grid overview showing answered/current/flagged states;
- a review step before submission;
- a warning when questions remain unanswered.

The last Next action opens the navigator instead of immediately submitting.
This supports the exam strategy encouraged in the instructions: move on, flag,
and return later.

## Submission and marking

Submission performs these operations in order:

1. reconstruct the exact concrete test from saved IDs;
2. compare each saved answer index with `question.answerIndex`;
3. multiply correct answers by `marksPerQuestion`;
4. group correct/total counts by topic;
5. cap timed elapsed seconds at the test duration;
6. save the result locally and begin cloud sync;
7. clear the active session locally and remotely;
8. replace the runner with the result route.

The result includes both raw answers and derived scores. Storing the raw answer
map makes future re-analysis possible, while storing summary fields makes
dashboard loading simple.

## Results and review

[`TestResults.tsx`](../src/components/practice/TestResults.tsx) displays:

- raw score and percentage;
- elapsed time and mode;
- how many questions were answered;
- topic-by-topic results;
- every question, the user's answer, correct answer, and explanation.

It uses the same `PlainOrHtml` component as lessons, so practice JSON follows
the same `[[LaTeX]]` convention.

Home later derives the weakest topic by aggregating `topicResults` across saved
attempts and mapping that title to an app topic and next lesson.

## Premium protection

Premium tests are gated in several places:

- Questions sends a free user to `/premium` instead of instructions;
- instructions reject a direct route to a Premium test;
- the runner also checks Premium before rendering.

Repeating the check protects against unusual navigation paths and state changes
during an attempt. It is still a client-side product gate because questions are
bundled in the app. If strict content secrecy became a requirement, Premium
questions would need authenticated server delivery instead of bundled JSON.

## Adding a bank question safely

1. Choose Paper 1 or Paper 2 according to the actual skills being assessed.
2. Use a globally unique, stable ID; never reuse an old ID for new content.
3. Match a `topicId` and difficulty that a blueprint needs.
4. Write 4–8 distinct options and a zero-based `answerIndex`.
5. Give a complete explanation, not only the final answer.
6. Use `[[LaTeX]]` for expressions and escaped backslashes in JSON.
7. Run `npm run validate:practice`.
8. Check whether every blueprint still has enough candidates.
9. Complete a generated attempt and verify marking/review visually.

Changing or deleting an existing question ID can break saved sessions and
historical results already on devices. Prefer additive content changes and
explicit migrations when published data evolves.

## Useful interview explanation

“Practice tests support either fixed questions or a distribution blueprint. A
new mock samples each topic/difficulty slot, shuffles the final IDs, and stores
those IDs in the session so resume and review use the exact same paper. Sessions
are local-first and updated after every action. Timers derive from the original
timestamp rather than interval ticks. Submission is guarded against duplicates,
marks by stable question ID, calculates topic aggregates, saves the result, and
then clears the active session.”
