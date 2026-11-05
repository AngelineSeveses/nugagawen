/**
 * Full-screen photo gallery: swipe between photos, see who took each one and
 * under which licence, close with the X or the system back gesture.
 */
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Linking, Modal, Pressable, StyleSheet, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCopy } from '@/localization';
import { colors, radius, size, spacing } from '@/theme';
import type { PlacePhoto } from '@/types';
import { XIcon } from './icons';
import { Text } from './text';

interface PhotoViewerProps {
  photos: PlacePhoto[];
  placeName: string;
  /** Index to open at; undefined = closed. */
  openAt: number | undefined;
  onClose: () => void;
}

export function PhotoViewer({ photos, placeName, openAt, onClose }: PhotoViewerProps) {
  const copy = useCopy();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(openAt ?? 0);
  const list = useRef<FlatList<PlacePhoto>>(null);

  useEffect(() => {
    if (openAt !== undefined) setIndex(openAt);
  }, [openAt]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index && next >= 0 && next < photos.length) setIndex(next);
  };

  const current = photos[index];
  return (
    <Modal visible={openAt !== undefined} animationType="fade" onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']} statusBarTranslucent>
      <View style={styles.viewer}>
        <FlatList
          ref={list}
          data={photos}
          horizontal
          pagingEnabled
          initialScrollIndex={openAt ?? 0}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          keyExtractor={(p) => p.uri}
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={64}
          renderItem={({ item, index: i }) => (
            <Image
              source={{ uri: item.uri }}
              style={{ width, height }}
              contentFit="contain"
              transition={150}
              accessibilityLabel={`${copy.place.photoLabel(placeName)}, ${copy.place.photoCount(i + 1, photos.length)}`}
            />
          )}
        />

        <View style={[styles.top, { paddingTop: insets.top + spacing.xs }]}>
          <Text variant="label" style={styles.light} accessibilityLiveRegion="polite">
            {copy.place.photoCount(index + 1, photos.length)}
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel={copy.place.closePhotos} onPress={onClose} hitSlop={8} style={styles.close}>
            <XIcon size={22} color={colors.onInk} weight="regular" />
          </Pressable>
        </View>

        {current ? (
          <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.md }]}>
            {current.attribution || current.license ? (
              <Text variant="body" style={styles.light}>
                {copy.place.photoCredit(current.attribution, current.license)}
              </Text>
            ) : null}
            {current.sourceUrl ? (
              <Text
                variant="body"
                accessibilityRole="link"
                onPress={() => Linking.openURL(current.sourceUrl!)}
                style={[styles.light, styles.link]}
              >
                {copy.place.viewSource}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  viewer: { flex: 1, backgroundColor: colors.ink },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: size.screenPadding,
  },
  close: { width: size.iconButton, height: size.iconButton, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: size.screenPadding, paddingTop: spacing.md, gap: spacing.xxs, backgroundColor: colors.scrim },
  light: { color: colors.onInk },
  link: { textDecorationLine: 'underline' },
});
