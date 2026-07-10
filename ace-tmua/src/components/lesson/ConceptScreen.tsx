/**
 * ConceptScreen
 * Mirrors renderConcept() in lesson-runner.js.
 *
 * HTML structure:
 *   .lesson-screen
 *     .lesson-screen__top  (TopBar)
 *     .lesson-screen__content
 *       .lesson-screen__icon  (lightbulb)
 *       .topic-page__eyebrow
 *       h1
 *       p  (body)
 *       .lesson-key-point  (optional)
 *     button.lesson-primary-button
 */
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TopBar from './TopBar';
import { PlainOrHtml } from './MathText';
import shared, { C } from './shared';
import type { ConceptScreen } from './types';

interface Props {
  screen: ConceptScreen;
  progressPercent: number;
  onNext: () => void;
  onExit: () => void;
}

export default function ConceptScreenView({ screen, progressPercent, onNext, onExit }: Props) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.cream }} edges={['top', 'bottom']}>
      <View style={shared.screen}>
        <TopBar progressPercent={progressPercent} onExit={onExit} />

        <ScrollView
          style={shared.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          {/* .lesson-screen__icon */}
          <View style={shared.iconBox}>
            <Ionicons name="bulb-outline" size={26} color={C.primary} />
          </View>

          {/* .topic-page__eyebrow */}
          {screen.eyebrow && (
            <Text style={shared.eyebrow}>{screen.eyebrow}</Text>
          )}

          {/* h1 */}
          <Text style={shared.title}>{screen.title}</Text>

          {/* body — may contain HTML */}
          <PlainOrHtml html={screen.body} style={{ color: C.muted, fontSize: 16, fontWeight: '700', lineHeight: 26 }} />

          {/* .lesson-key-point (optional) */}
          {screen.keyPoint && (
            <View style={shared.keyPointBox}>
              <Text style={shared.keyPointLabel}>Key idea</Text>
              <PlainOrHtml
                html={screen.keyPoint}
                style={{ color: C.ink, fontSize: 14, fontWeight: '700', lineHeight: 22 }}
              />
            </View>
          )}
        </ScrollView>

        {/* .lesson-primary-button */}
        <TouchableOpacity style={shared.primaryButton} onPress={onNext} activeOpacity={0.85}>
          <Text style={shared.primaryButtonText}>{screen.buttonText || 'Continue'}</Text>
          <Ionicons name="arrow-forward" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
