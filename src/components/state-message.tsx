import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';
import type { Icon } from './icons';
import { Text } from './text';

interface StateMessageProps {
  icon?: Icon;
  title: string;
  body?: string;
  /** Buttons (usually one primary or secondary). */
  children?: React.ReactNode;
}

/**
 * Empty, error and "fewer results" states: say what happened and what to do.
 * The message is announced to screen readers when it appears.
 */
export function StateMessage({ icon: MessageIcon, title, body, children }: StateMessageProps) {
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility([title, body].filter(Boolean).join(' '));
  }, [title, body]);

  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      {MessageIcon ? <MessageIcon size={28} color={colors.inkSecondary} weight="light" /> : null}
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

const styles = StyleSheet.create({
  container: { gap: spacing.xs, paddingVertical: spacing.lg },
  actions: { marginTop: spacing.md, gap: spacing.xs, alignItems: 'flex-start' },
});
