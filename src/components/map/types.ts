import type { StyleProp, ViewStyle } from 'react-native';
import type { LatLng } from '@/types';

/** The same props for every version of the map (phone, web preview, Expo Go). */
export interface PlaceMapProps {
  /** Where the pin goes. */
  destination: LatLng;
  /** Where the trip starts, shown as a dot. */
  origin?: LatLng;
  /** The route line, as [longitude, latitude] pairs. */
  line?: [number, number][];
  /** False for small previews: no dragging or zooming. */
  interactive?: boolean;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}

/** Route line and markers, shared so both map versions look the same. */
export const ROUTE_LINE_WIDTH = 5;
export const ROUTE_CASING_WIDTH = 8;
export const SINGLE_PLACE_ZOOM = 15;
export const FIT_PADDING = 48;
