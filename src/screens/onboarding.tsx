import { useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { ChoiceGroup } from '@/components/choice-group';
import { ActionBar, Logo } from '@/components/misc';
import { OnboardingSlide } from '@/components/onboarding-slide';
import { ProgressIndicator } from '@/components/progress-indicator';
import { LANGUAGE_NAMES, useLanguage, type Language } from '@/localization';
import { useFirstRun } from '@/state/first-run';
import { colors, size, spacing } from '@/theme';

const LANGUAGES: Language[] = ['en', 'fil'];

/**
 * The first-launch intro: what Nugagawen does, in three slides. It asks for
 * nothing. Location permission comes later, only if the person chooses to use
 * their current location.
 */
export function OnboardingScreen() {
  const { copy, language, setLanguage } = useLanguage();
  const { finishOnboarding } = useFirstRun();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const { slides, skip, back, next, done } = copy.onboarding;
  const last = step === slides.length - 1;

  const goTo = (target: number) => {
    setStep(target);
    AccessibilityInfo.announceForAccessibility(`${copy.onboarding.step(target + 1, slides.length)}. ${slides[target].title}`);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Logo height={18} />
        {/* Nothing left to skip on the last slide. */}
        {last ? null : <Button variant="ghost" title={skip} onPress={finishOnboarding} style={styles.skip} />}
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <OnboardingSlide key={step} index={step} title={slides[step].title} body={slides[step].body} artLabel={slides[step].art}>
          {/* Asked right away, so people can read the rest of the intro in their language. */}
          {step === 0 ? (
            <View style={styles.language}>
              <ChoiceGroup
                label={copy.settings.language}
                options={LANGUAGES.map((lang) => ({ value: lang, label: LANGUAGE_NAMES[lang] }))}
                value={language}
                onChange={setLanguage}
                minLabelWidth={56}
                compact
                showLabel={false}
              />
            </View>
          ) : null}
        </OnboardingSlide>
      </ScrollView>

      <View style={styles.progress}>
        <ProgressIndicator step={step} total={slides.length} label={copy.onboarding.step(step + 1, slides.length)} />
      </View>
      <ActionBar>
        {step > 0 ? <Button variant="secondary" size="lg" title={back} onPress={() => goTo(step - 1)} /> : null}
        <Button title={last ? done : next} onPress={last ? finishOnboarding : () => goTo(step + 1)} style={styles.flex} />
      </ActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: size.touchMin + spacing.xs,
    paddingHorizontal: size.screenPadding,
  },
  // Lines the word up with the screen padding; its own padding is only a bigger tap area.
  skip: { marginRight: -spacing.xs },
  content: { paddingHorizontal: size.screenPadding, paddingBottom: spacing.md },
  language: { marginTop: spacing.sm },
  progress: { alignItems: 'center', paddingVertical: spacing.sm },
});
