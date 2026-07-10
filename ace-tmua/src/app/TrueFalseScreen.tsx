/**
 * TrueFalseScreen
 * Mirrors renderTrueFalse() in lesson-runner.js.
 *
 * Two buttons side by side (.true-false-options).
 * On tap: both buttons disabled, chosen gets .is-correct/.is-wrong,
 * feedback card appears with Continue button.
 *
 * HTML:
 *   .true-false-options
 *     button.true-false-option [data-answer="true"]   ✓ True
 *     button.true-false-option [data-answer="false"]  ✕ False
 *   .answer-feedback
 *     .answer-feedback__card.is-correct/.is-wrong
 *       strong
 *       p
 *       button.lesson-primary-button
 */
import { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TopBar from './TopBar';
import shared, { C } from './shared';
import type { TrueFalseScreen } from './types';

interface Props {
  screen: TrueFalseScreen;
  progressPercent: number;
  onNext: () => void;
  onExit: () => void;
  onAnswer: (correct: boolean) => void;
}

export default function TrueFalseScreenView({ screen, progressPercent, onNext, onExit, onAnswer }: Props) {
  const [chosen, setChosen] = useState<boolean | null>(null);

  function handleAnswer(answer: boolean) {
    if (chosen !== null) return;
    const isCorrect = answer === screen.answer;
    setChosen(answer);
    onAnswer(isCorrect);
  }

  const isCorrect = chosen !== null && chosen === screen.answer;
  const hasAnswered = chosen !== null;

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

          {/* The question is the h1 */}
          <Text style={shared.title}>{screen.question}</Text>

          {/* .true-false-options — two side-by-side buttons */}
          <View style={styles.options}>
            {/* True button */}
            <TouchableOpacity
              style={[
                styles.option,
                hasAnswered && chosen === true && (isCorrect ? styles.optionCorrect : styles.optionWrong),
                hasAnswered && chosen === false && true === screen.answer && styles.optionCorrect,
              ]}
              onPress={() => handleAnswer(true)}
              disabled={hasAnswered}
              activeOpacity={0.8}
            >
              <Ionicons
                name="checkmark"
                size={28}
                color={hasAnswered && chosen === true ? (isCorrect ? C.correctText : C.wrongText) : C.primary}
              />
              <Text style={[
                styles.optionText,
                hasAnswered && chosen === true && { color: isCorrect ? C.correctText : C.wrongText },
              ]}>
                True
              </Text>
            </TouchableOpacity>

            {/* False button */}
            <TouchableOpacity
              style={[
                styles.option,
                hasAnswered && chosen === false && (!isCorrect ? styles.optionCorrect : styles.optionWrong),
                hasAnswered && chosen === true && false === screen.answer && styles.optionCorrect,
              ]}
              onPress={() => handleAnswer(false)}
              disabled={hasAnswered}
              activeOpacity={0.8}
            >
              <Ionicons
                name="close"
                size={28}
                color={hasAnswered && chosen === false ? (!isCorrect ? C.correctText : C.wrongText) : C.primary}
              />
              <Text style={[
                styles.optionText,
                hasAnswered && chosen === false && { color: !isCorrect ? C.correctText : C.wrongText },
              ]}>
                False
              </Text>
            </TouchableOpacity>
          </View>

          {/* .answer-feedback — appears after answering */}
          {hasAnswered && (
            <View style={[shared.feedbackCard, isCorrect ? shared.feedbackCorrect : shared.feedbackWrong]}>
              <Text style={[shared.feedbackHeading, { color: isCorrect ? C.correctText : C.wrongText }]}>
                {isCorrect ? 'Correct.' : 'Not quite.'}
              </Text>
              <Text style={shared.feedbackBody}>
                {isCorrect ? screen.correctFeedback : screen.incorrectFeedback}
              </Text>
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
  // .true-false-options
  options: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
    marginBottom: 4,
  },
  // .true-false-option
  option: {
    flex: 1,
    minHeight: 112,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 20,
    shadowColor: '#6f4619',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  // .true-false-option.is-correct
  optionCorrect: {
    backgroundColor: '#e8f8ed',
    borderColor: '#75c88d',
  },
  // .true-false-option.is-wrong
  optionWrong: {
    backgroundColor: '#fff0ef',
    borderColor: '#f09a96',
  },
  optionText: {
    color: C.ink,
    fontSize: 17,
    fontWeight: '900',
  },
});
