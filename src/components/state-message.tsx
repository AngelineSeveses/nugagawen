import { useEffect, type ReactNode } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { spacing } from '@/theme';
import { ErrorArt, OfflineArt } from './illustrations';
import { Text } from './text';

interface StateMessageProps {
  /** An illustration: decorative, because the words below say everything. */
  art?: ReactNode;
  title: string;
  body?: string;
  /** Buttons (usually one primary or secondary). */
  children?: ReactNode;
}

/**
 * Empty, error and "nothing found" states: say what happened and what to do.
 * The message is announced to screen readers when it appears.
 */
function StateMessage({ art, title, body, children }: StateMessageProps) {
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility([title, body].filter(Boolean).join(' '));
  }, [title, body]);

  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      {art ? (
        <View style={styles.art} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {art}
        </View>
      ) : null}
      <Text variant="h3" accessibilityRole="header">
        {title}
      </Text>
      {body ? (
        <Text variant="bodyLarge" color="inkSecondary">
          {body}
        </Text>
      ) : null}
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

/** Nothing to show yet: no saved places, no matches, no location. */
export const EmptyState = StateMessage;

interface ErrorStateProps extends Omit<StateMessageProps, 'art'> {
  /** Shows the "no connection" illustration. */
  offline?: boolean;
}

/** Something went wrong: says what, and how to try again. */
export function ErrorState({ offline = false, ...rest }: ErrorStateProps) {
  return <StateMessage art={offline ? <OfflineArt size={120} /> : <ErrorArt size={120} />} {...rest} />;
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs, paddingVertical: spacing.lg },
  art: { marginBottom: spacing.xs },
  actions: { marginTop: spacing.sm, gap: spacing.xs, alignItems: 'flex-start' },
});
