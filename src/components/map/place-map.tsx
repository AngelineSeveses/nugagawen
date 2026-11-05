/**
 * The map on phones. Platform files: on web the bundler picks place-map.web.tsx
 * instead, so screens simply `import { PlaceMap } from '@/components/map/place-map'`.
 *
 * Expo Go doesn't include MapLibre's native code, and importing it there would
 * crash the app. So it's loaded with `require` inside a condition rather than a
 * normal `import` (which always runs): in Expo Go that line never executes.
 */
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type { ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import { useCopy } from '@/localization';
import { colors, radius, size, spacing } from '@/theme';
import { MapTrifoldIcon } from '../icons';
import { Text } from '../text';
import type { PlaceMapProps } from './types';

const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const NativeMap: ComponentType<PlaceMapProps> | undefined = inExpoGo ? undefined : require('./place-map.maplibre').PlaceMapNative;

/** False in Expo Go. Lets a screen skip an optional map instead of showing a notice. */
export const mapAvailable = NativeMap !== undefined;

export function PlaceMap(props: PlaceMapProps) {
  const copy = useCopy();
  if (NativeMap) return <NativeMap {...props} />;
  return (
    <View style={[styles.notice, props.style]}>
      <MapTrifoldIcon size={size.icon} color={colors.ink} weight="light" />
      <Text variant="body" style={styles.text}>
        {copy.directions.mapNeedsBuild}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    backgroundColor: colors.sage,
  },
  text: { flexShrink: 1 },
});
