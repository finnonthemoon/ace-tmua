/**
 * RevealScreen
 * Mirrors renderReveal() in lesson-runner.js.
 *
 * Shows steps one at a time. Button says "Show next step" until the last
 * step is visible, then changes to the screen's buttonText.
 *
 * HTML structure per step (.reveal-step):
 *   <span>  ← step number, orange circle
 *   <div>
 *     <strong>  title
 *     <p>       body
 */
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TopBar from './TopBar';
import { PlainOrHtml } from './MathText';
import shared, { C } from './shared';
import type { RevealScreen } from './types';

interface Props {
  screen: RevealScreen;
  progressPercent: number;
  revealIndex: number;
  onRevealNext: () => void;
  onNext: () => void;
  onExit: () => void;
}

export default function RevealScreenView({
  screen, progressPercent, revealIndex, onRevealNext, onNext, onExit,
}: Props) {
  const visibleSteps = screen.steps.slice(0, revealIndex + 1);
  const isLastReveal = revealIndex === screen.steps.length - 1;

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
          <Text style={shared.title}>{screen.title}</Text>

          {/* .reveal-steps */}
          <View style={styles.steps}>
            {visibleSteps.map((step, i) => (
              <View key={i} style={styles.step}>
                {/* Orange number circle */}
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <PlainOrHtml
                    html={step.body}
                    style={{ color: C.muted, fontSize: 13, fontWeight: '700', lineHeight: 20 }}
                  />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={shared.primaryButton}
          onPress={isLastReveal ? onNext : onRevealNext}
          activeOpacity={0.85}
        >
          <Text style={shared.primaryButtonText}>
            {isLastReveal ? (screen.buttonText || 'Continue') : 'Show next step'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // .reveal-steps
  steps: {
    gap: 10,
    marginTop: 20,
  },
  // .reveal-step
  step: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
    shadowColor: '#6f4619',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  // .reveal-step > span — orange filled circle
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '900',
  },
  // .reveal-step strong
  stepTitle: {
    color: C.ink,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
});
