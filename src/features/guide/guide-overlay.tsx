import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Button } from '@/components/button';
import { OnboardingDecideArt } from '@/components/illustrations';
import { ProgressIndicator } from '@/components/progress-indicator';
import { Text } from '@/components/text';
import { useCopy } from '@/localization';
import { borderWidth, colors, motion, radius, size, spacing } from '@/theme';
import { dimRects, GUIDE_STEPS, scrollOffsetFor, tooltipTop, type GuideStep, type Rect } from './steps';

/** A first guess at the tooltip's height, until it has been measured. */
const TOOLTIP_ESTIMATE = 200;
const RING_GAP = 4;

/** What a `ref` on a View gives you: the on-screen element, which can report where it is. */
export type ViewHandle = ComponentRef<typeof View>;

/** Where a view is on screen. React Native reports this through a callback, so it's wrapped in a promise. */
const measure = (view: ViewHandle) => new Promise<Rect>((resolve) => view.measureInWindow((x, y, width, height) => resolve({ x, y, width, height })));
/** Long enough for a scroll to be drawn, so the measurement sees the element in its new place. */
const SCROLL_SETTLE_MS = 32;
const afterScroll = () => new Promise<void>((resolve) => setTimeout(resolve, SCROLL_SETTLE_MS));

export interface GuideScroller {
  getY: () => number;
  scrollTo: (y: number) => void;
}

interface GuideOverlayProps {
  /** The views each step highlights. A step whose view is missing simply shows without a highlight. */
  getTarget: (step: GuideStep) => ViewHandle | null | undefined;
  /** Steps whose element is pinned on screen don't need to scroll to it. */
  pinned: GuideStep[];
  scroller: GuideScroller;
  topInset: number;
  onFinish: () => void;
}

/**
 * The first-use guide: dims the page around one real element at a time and
 * explains it in a small tooltip. The element stays usable, so people can try
 * it while they read. It sits inside the Home screen, so the tab bar stays usable too.
 */
export function GuideOverlay({ getTarget, pinned, scroller, topInset, onFinish }: GuideOverlayProps) {
  const copy = useCopy();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [area, setArea] = useState({ width: 0, height: 0 });
  const [tooltipHeight, setTooltipHeight] = useState(TOOLTIP_ESTIMATE);
  // The measured spot belongs to one step, so moving on hides the old highlight by itself.
  const [spot, setSpot] = useState<{ step: GuideStep; hole: Rect | null } | undefined>();
  const root = useRef<ViewHandle>(null);
  const nextButton = useRef<ViewHandle>(null);

  const step = GUIDE_STEPS[index];
  const hole = spot?.step === step ? spot.hole : undefined;
  const last = index === GUIDE_STEPS.length - 1;
  const { title, body } = copy.guide.steps[step];
  const stepLabel = copy.guide.step(index + 1, GUIDE_STEPS.length);

  // Find the element, scroll it into view, then measure it where it ended up.
  useEffect(() => {
    let cancelled = false;
    const locate = async () => {
      const overlay = root.current;
      const target = getTarget(step);
      if (!overlay || !target) return setSpot({ step, hole: null });
      if (!pinned.includes(step)) {
        const before = await measure(target);
        scroller.scrollTo(scrollOffsetFor(before, scroller.getY(), topInset));
        await afterScroll();
      }
      const [origin, rect] = await Promise.all([measure(overlay), measure(target)]);
      if (cancelled) return;
      // An element with no size isn't on screen: carry on without a highlight instead of breaking.
      const found = rect.width > 0 && rect.height > 0;
      setSpot({ step, hole: found ? { ...rect, x: rect.x - origin.x, y: rect.y - origin.y } : null });
    };
    locate();
    return () => {
      cancelled = true;
    };
    // `getTarget` and `scroller` read from refs; only these values should trigger a new measurement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, windowWidth, windowHeight]);

  // Say each step out loud, and on a keyboard keep the focus in the tooltip.
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`${stepLabel}. ${title}. ${body}`);
    if (Platform.OS === 'web') (nextButton.current as unknown as HTMLElement | null)?.focus();
  }, [stepLabel, title, body]);

  // On a keyboard, Escape leaves the guide.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onFinish();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onFinish]);

  const rects = hole && area.width > 0 ? dimRects(hole, area.width, area.height) : undefined;

  return (
    <View
      ref={root}
      collapsable={false}
      pointerEvents="box-none"
      onLayout={(event) => setArea({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
      style={StyleSheet.absoluteFill}
    >
      {/* The dim area ignores taps and hides the page from screen readers while the tooltip is open. */}
      {rects ? (
        rects.map((rect, i) => <Pressable key={i} accessible={false} tabIndex={-1} style={[styles.dim, { left: rect.x, top: rect.y, width: rect.width, height: rect.height }]} />)
      ) : (
        <Pressable accessible={false} tabIndex={-1} style={[styles.dim, StyleSheet.absoluteFill]} />
      )}
      {hole ? (
        <View
          pointerEvents="none"
          style={[styles.ring, { left: hole.x - RING_GAP, top: hole.y - RING_GAP, width: hole.width + 2 * RING_GAP, height: hole.height + 2 * RING_GAP }]}
        />
      ) : null}

      {/* Wait for the measurement, so the tooltip never jumps from one place to another. */}
      {hole !== undefined && area.height > 0 ? (
        <Animated.View
          key={step}
          entering={FadeIn.duration(motion.fast)}
          accessibilityViewIsModal
          onLayout={(event) => setTooltipHeight(event.nativeEvent.layout.height)}
          style={[styles.tooltip, { top: tooltipTop(hole, area.height, tooltipHeight) }]}
        >
          {/* Skip sits up here, so Back and Next fit on one line in every language and at every width. */}
          <View style={styles.progressRow}>
            <ProgressIndicator step={index} total={GUIDE_STEPS.length} label={stepLabel} />
            {last ? null : <Button variant="ghost" title={copy.guide.skip} onPress={onFinish} style={styles.skip} />}
          </View>
          {step === 'explore' ? (
            <View style={styles.art} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <OnboardingDecideArt width={160} />
            </View>
          ) : null}
          <Text variant="h4" accessibilityRole="header">
            {title}
          </Text>
          <Text variant="body" color="inkSecondary">
            {body}
          </Text>
          <View style={styles.actions}>
            {index > 0 ? <Button variant="secondary" title={copy.guide.back} onPress={() => setIndex(index - 1)} /> : null}
            <Button ref={nextButton} variant="dark" title={last ? copy.guide.done : copy.guide.next} onPress={last ? onFinish : () => setIndex(index + 1)} style={styles.flex} />
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  dim: { position: 'absolute', backgroundColor: colors.overlay, cursor: 'auto' },
  ring: {
    position: 'absolute',
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: borderWidth.strong,
    borderColor: colors.surface,
  },
  tooltip: {
    position: 'absolute',
    left: size.screenPadding,
    right: size.screenPadding,
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xxs,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderCurve: 'continuous',
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs, minHeight: size.touchMin },
  art: { alignItems: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xxs },
  // Lines the words up with the tooltip's edge; the padding is only a bigger tap area.
  skip: { marginRight: -spacing.xs },
});
