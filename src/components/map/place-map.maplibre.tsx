/**
 * The real map on phones: MapLibre React Native. Native code, so it only runs in
 * a development or store build, never in Expo Go. place-map.tsx decides whether
 * this file may load at all.
 */
import { Camera, GeoJSONSource, Layer, Map as MapLibreMap, Marker } from '@maplibre/maplibre-react-native';
import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { mapStyleUrl } from '@/config';
import { colors, radius } from '@/theme';
import { MapPinIcon } from '../icons';
import { boundsOf } from './bounds';
import { FIT_PADDING, ROUTE_CASING_WIDTH, ROUTE_LINE_WIDTH, SINGLE_PLACE_ZOOM, type PlaceMapProps } from './types';

const ROUND_LINE = { 'line-cap': 'round', 'line-join': 'round' } as const;

export function PlaceMapNative({ destination, origin, line, interactive = true, accessibilityLabel, style }: PlaceMapProps) {
  const reduceMotion = useReducedMotion();
  const bounds = boundsOf(destination, origin, line);
  const center: [number, number] = [destination.longitude, destination.latitude];
  const duration = reduceMotion ? 0 : 400;

  return (
    <View style={[styles.frame, style]} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <MapLibreMap
        style={StyleSheet.absoluteFill}
        mapStyle={mapStyleUrl}
        dragPan={interactive}
        touchZoom={interactive}
        doubleTapZoom={interactive}
        touchRotate={false}
        touchPitch={false}
        logo={false}
        compass={false}
        scaleBar={false}
      >
        {bounds ? (
          <Camera
            bounds={bounds}
            padding={{ top: FIT_PADDING, right: FIT_PADDING, bottom: FIT_PADDING, left: FIT_PADDING }}
            duration={duration}
          />
        ) : (
          <Camera center={center} zoom={SINGLE_PLACE_ZOOM} duration={duration} />
        )}

        {line && line.length > 1 ? (
          <GeoJSONSource id="route" data={{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: line } }}>
            <Layer id="route-casing" type="line" layout={ROUND_LINE} paint={{ 'line-color': colors.surface, 'line-width': ROUTE_CASING_WIDTH }} />
            <Layer id="route-line" type="line" layout={ROUND_LINE} paint={{ 'line-color': colors.accentInk, 'line-width': ROUTE_LINE_WIDTH }} />
          </GeoJSONSource>
        ) : null}

        {origin ? (
          <GeoJSONSource
            id="origin"
            data={{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [origin.longitude, origin.latitude] } }}
          >
            <Layer
              id="origin-dot"
              type="circle"
              paint={{ 'circle-radius': 7, 'circle-color': colors.surface, 'circle-stroke-color': colors.ink, 'circle-stroke-width': 3 }}
            />
          </GeoJSONSource>
        ) : null}

        <Marker id="destination" lngLat={center} anchor="bottom">
          <MapPinIcon size={36} color={colors.ink} weight="fill" />
        </Marker>
      </MapLibreMap>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: colors.skeleton },
});
