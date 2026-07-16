/**
 * MultipleChoiceScreen
 * Mirrors renderMultipleChoice() in lesson-runner.js.
 *
 * Options list (.multiple-choice-options).
 * Each option has a letter badge (.multiple-choice-option__letter).
 * On tap: all disabled, correct gets .is-correct, wrong gets .is-wrong.
 * Feedback card appears below.
 *
 * HTML per option:
 *   button.multiple-choice-option
 *     span.multiple-choice-option__letter   A / B / C / D
 *     span                                  option text (may contain HTML)
 */
import { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TopBar from './TopBar';
import { PlainOrHtml } from './MathText';
import LessonDiagramView from './LessonDiagram';
import shared, { C } from './shared';
import type { MultipleChoiceScreen } from './types';

interface Props {
  screen: MultipleChoiceScreen;
  progressPercent: number;
  onNext: () => void;
  onExit: () => void;
  onAnswer: (correct: boolean) => void;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export default function MultipleChoiceScreenView({ screen, progressPercent, onNext, onExit, onAnswer }: Props) {
  const [chosen, setChosen] = useState<number | null>(null);
  const questionLength = screen.question.replace(/<[^>]*>|\[\[|\]\]/g, '').length;
  const questionFontSize = questionLength > 140 ? 20 : questionLength > 90 ? 22 : 24;

  function handleAnswer(index: number) {
    if (chosen !== null) return;
    const isCorrect = index === screen.answerIndex;
    setChosen(index);
    onAnswer(isCorrect);
  }

  const hasAnswered = chosen !== null;
  const isCorrect = chosen === screen.answerIndex;

  function optionStyle(index: number) {
    if (!hasAnswered) return styles.option;
    if (index === screen.answerIndex) return [styles.option, styles.optionCorrect];
    if (index === chosen) return [styles.option, styles.optionWrong];
    return [styles.option, styles.optionDimmed];
  }

  function letterStyle(index: number) {
    if (!hasAnswered) return styles.letter;
    if (index === screen.answerIndex) return [styles.letter, styles.letterCorrect];
    if (index === chosen) return [styles.letter, styles.letterWrong];
    return styles.letter;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.cream }} edges={['top', 'bottom']}>
      <View style={shared.screen}>
        <TopBar progressPercent={progressPercent} onExit={onExit} />

        <ScrollView
          style={shared.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          {screen.eyebrow && (
            <Text style={shared.eyebrow}>{screen.eyebrow}</Text>
          )}

          {/* Question (may contain HTML like math-frac) */}
          <PlainOrHtml
            html={screen.question}
            style={{
              color: C.ink,
              fontSize: questionFontSize,
              fontWeight: '900',
              letterSpacing: -0.5,
              lineHeight: questionFontSize + 7,
              marginBottom: 8,
            }}
          />

          {screen.diagram && <LessonDiagramView diagram={screen.diagram} />}

          {/* .multiple-choice__prompt */}
          {screen.prompt && (
            <PlainOrHtml html={screen.prompt} style={styles.prompt} />
          )}

          {/* .multiple-choice-options */}
          <View style={styles.options}>
            {screen.options.map((option, i) => (
              <TouchableOpacity
                key={i}
                style={optionStyle(i)}
                onPress={() => handleAnswer(i)}
                disabled={hasAnswered}
                activeOpacity={0.8}
              >
                {/* .multiple-choice-option__letter */}
                <View style={letterStyle(i)}>
                  <Text style={styles.letterText}>{LETTERS[i]}</Text>
                </View>
                {/* Option text — may contain HTML */}
                <PlainOrHtml
                  html={option}
                  style={{
                    flex: 1,
                    color: C.ink,
                    fontSize: 15,
                    fontWeight: '800',
                    lineHeight: 21,
                  }}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* .answer-feedback */}
          {hasAnswered && (
            <View style={[shared.feedbackCard, isCorrect ? shared.feedbackCorrect : shared.feedbackWrong]}>
              <Text style={[shared.feedbackHeading, { color: isCorrect ? C.correctText : C.wrongText }]}>
                {isCorrect ? 'Correct.' : 'Not quite.'}
              </Text>
              <PlainOrHtml
                html={isCorrect ? screen.correctFeedback : screen.incorrectFeedback}
                style={{ color: C.ink, fontSize: 14, fontWeight: '700', lineHeight: 21, marginBottom: 14 }}
              />
              <TouchableOpacity style={shared.primaryButton} onPress={onNext} activeOpacity={0.85}>
                <Text style={shared.primaryButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // .multiple-choice__prompt
  prompt: {
    color: C.muted,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  // .multiple-choice-options
  options: {
    gap: 10,
    marginTop: 20,
    marginBottom: 4,
  },
  // .multiple-choice-option
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 67,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 18,
    shadowColor: '#6f4619',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  optionCorrect: {
    backgroundColor: '#e8f8ed',
    borderColor: '#75c88d',
  },
  optionWrong: {
    backgroundColor: '#fff0ef',
    borderColor: '#f09a96',
  },
  optionDimmed: {
    opacity: 0.55,
  },
  // .multiple-choice-option__letter
  letter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff0d3',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  letterCorrect: {
    backgroundColor: C.correctText,
  },
  letterWrong: {
    backgroundColor: C.wrongText,
  },
  letterText: {
    color: C.primary,
    fontSize: 13,
    fontWeight: '900',
  },
});
