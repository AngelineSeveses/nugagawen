/**
 * Short confirmation messages ("Saved", "Removed from Saved · Undo").
 * React context lets any screen call `useToast().show(...)` without passing props down.
 */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, motion, radius, spacing } from '@/theme';
import { Text } from './text';

interface ToastOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

const ToastContext = createContext<{ show: (options: ToastOptions) => void }>({ show: () => {} });

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const insets = useSafeAreaInsets();

  const show = (options: ToastOptions) => {
    setToast({ ...options, id: Date.now() });
    AccessibilityInfo.announceForAccessibility(
      options.actionLabel ? `${options.message}. ${options.actionLabel}.` : options.message,
    );
  };

  useEffect(() => {
    if (!toast) return;
    clearTimeout(timer.current);
    // Stay longer when a screen reader is on; undo is never the only way back.
    AccessibilityInfo.isScreenReaderEnabled().then((on) => {
      timer.current = setTimeout(() => setToast(null), on ? 10000 : 5000);
    });
    return () => clearTimeout(timer.current);
  }, [toast]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast ? (
        <Animated.View
          key={toast.id}
          entering={FadeIn.duration(motion.fast)}
          exiting={FadeOut.duration(motion.fast)}
          style={[styles.wrap, { bottom: insets.bottom + 96 }]}
          pointerEvents="box-none"
        >
          <View style={styles.toast}>
            <Text variant="label" style={styles.message}>
              {toast.message}
            </Text>
            {toast.actionLabel ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={toast.actionLabel}
                hitSlop={8}
                onPress={() => {
                  toast.onAction?.();
                  setToast(null);
                }}
                style={styles.action}
              >
                <Text variant="label" style={styles.actionText}>
                  {toast.actionLabel}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.lg, right: spacing.lg, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 48,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
  },
  message: { color: colors.onInk, flexShrink: 1, paddingVertical: spacing.sm },
  action: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.xs },
  actionText: { color: colors.onInk, textDecorationLine: 'underline' },
});
