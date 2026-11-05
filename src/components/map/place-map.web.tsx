/**
 * The map in the web preview: MapLibre's browser version, with the same tiles
 * and route styling as the phone map. Only used for testing on a computer.
 */
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef, type ComponentRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { mapStyleUrl } from '@/config';
import { colors, radius } from '@/theme';
import { boundsOf } from './bounds';
import { FIT_PADDING, ROUTE_CASING_WIDTH, ROUTE_LINE_WIDTH, SINGLE_PLACE_ZOOM, type PlaceMapProps } from './types';

export const mapAvailable = true;

/** Phosphor's filled map pin, as the phone map's marker uses. */
const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 256 256" fill="${colors.ink}"><path d="M128 16a88.1 88.1 0 0 0-88 88c0 75.3 80 132.17 83.41 134.55a8 8 0 0 0 9.18 0C136 236.17 216 179.3 216 104a88.1 88.1 0 0 0-88-88m0 56a32 32 0 1 1-32 32 32 32 0 0 1 32-32"/></svg>`;

const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

export function PlaceMap({ destination, origin, line, interactive = true, accessibilityLabel, style }: PlaceMapProps) {
  const container = useRef<ComponentRef<typeof View>>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const loaded = useRef(false);
  /** Always the latest props, for the map's "load" event to read once it fires. */
  const latest = useRef({ destination, origin, line });

  const draw = () => {
    const instance = map.current;
    if (!instance || !loaded.current) return;
    const current = latest.current;
    const routeSource = instance.getSource('route') as maplibregl.GeoJSONSource | undefined;
    const originSource = instance.getSource('origin') as maplibregl.GeoJSONSource | undefined;
    routeSource?.setData(
      current.line && current.line.length > 1
        ? { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: current.line } }
        : EMPTY,
    );
    originSource?.setData(
      current.origin
        ? { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [current.origin.longitude, current.origin.latitude] } }
        : EMPTY,
    );
    marker.current?.setLngLat([current.destination.longitude, current.destination.latitude]);
    const bounds = boundsOf(current.destination, current.origin, current.line);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (bounds) {
      instance.fitBounds([[bounds[0], bounds[1]], [bounds[2], bounds[3]]], { padding: FIT_PADDING, duration: reduceMotion ? 0 : 400 });
    } else {
      instance.jumpTo({ center: [current.destination.longitude, current.destination.latitude], zoom: SINGLE_PLACE_ZOOM });
    }
  };

  // Create the map once, and remove it when this component leaves the screen.
  useEffect(() => {
    // On web, a React Native View's ref is the actual page element.
    const element = container.current as unknown as HTMLElement | null;
    if (!element) return;
    const start = latest.current.destination;
    const instance = new maplibregl.Map({
      container: element,
      style: mapStyleUrl,
      center: [start.longitude, start.latitude],
      zoom: SINGLE_PLACE_ZOOM,
      interactive,
      dragRotate: false,
      pitchWithRotate: false,
      attributionControl: { compact: true },
    });
    map.current = instance;

    const pin = document.createElement('div');
    pin.innerHTML = PIN_SVG;
    marker.current = new maplibregl.Marker({ element: pin, anchor: 'bottom' }).setLngLat([start.longitude, start.latitude]).addTo(instance);

    instance.on('load', () => {
      instance.addSource('route', { type: 'geojson', data: EMPTY });
      instance.addLayer({ id: 'route-casing', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': colors.surface, 'line-width': ROUTE_CASING_WIDTH } });
      instance.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': colors.accentInk, 'line-width': ROUTE_LINE_WIDTH } });
      instance.addSource('origin', { type: 'geojson', data: EMPTY });
      instance.addLayer({ id: 'origin-dot', type: 'circle', source: 'origin', paint: { 'circle-radius': 7, 'circle-color': colors.surface, 'circle-stroke-color': colors.ink, 'circle-stroke-width': 3 } });
      loaded.current = true;
      draw();
    });

    return () => {
      loaded.current = false;
      map.current = null;
      marker.current = null;
      instance.remove();
    };
    // `interactive` is fixed for a map's lifetime; the data below updates through draw().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw when the trip changes (for example a different travel mode).
  useEffect(() => {
    latest.current = { destination, origin, line };
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination.latitude, destination.longitude, origin?.latitude, origin?.longitude, line]);

  return <View ref={container} role="img" aria-label={accessibilityLabel} style={[styles.frame, style]} />;
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', borderRadius: radius.md, borderCurve: 'continuous', backgroundColor: colors.skeleton },
});
