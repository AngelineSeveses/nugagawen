import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useCopy } from '@/localization';
import { colors, radius, spacing } from '@/theme';
import type { PlacePhoto as Photo } from '@/types';
import { CategoryIcon } from './category-icon';
import { Text } from './text';

interface PlacePhotoProps {
  photo?: Photo;
  placeName: string;
  group: 'eat' | 'goOut';
  kind?: string;
  aspectRatio?: number;
  borderRadius?: number;
  /** Required by the data source wherever a photo is shown large. */
  showAttribution?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * A real place photo, or a quiet placeholder with the category icon when there
 * is none or it fails to load. Never a stock or generated image.
 */
export function PlacePhoto({
  photo,
  placeName,
  group,
  kind,
  aspectRatio = 16 / 9,
  borderRadius = radius.lg,
  showAttribution = false,
  style,
}: PlacePhotoProps) {
  const copy = useCopy();
  // Remembers which photo failed, so a different photo gets its own chance to load.
  const [failedUri, setFailedUri] = useState<string | undefined>();
  const frame = [styles.frame, { aspectRatio, borderRadius }, style];
  if (!photo || failedUri === photo.uri) {
    return (
      <View style={[frame, styles.placeholder]} accessible={false}>
        <CategoryIcon kind={kind} group={group} size={26} />
      </View>
    );
  }
  return (
    <View style={frame}>
      <Image
        source={{ uri: photo.uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={150}
        accessibilityLabel={copy.place.photoLabel(placeName)}
        onError={() => setFailedUri(photo.uri)}
      />
      {showAttribution && (photo.attribution || photo.license) ? (
        <View style={styles.attribution}>
          <Text variant="caption" style={styles.attributionText} numberOfLines={2}>
            {copy.place.photoCredit(photo.attribution, photo.license)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', overflow: 'hidden', borderCurve: 'continuous', backgroundColor: colors.skeleton },
  placeholder: { backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center' },
  attribution: {
    position: 'absolute',
    left: spacing.xs,
    bottom: spacing.xs,
    maxWidth: '80%',
    backgroundColor: colors.scrim,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  attributionText: { color: colors.onInk },
});
