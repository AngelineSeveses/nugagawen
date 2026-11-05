/**
 * Shared data shapes. A TypeScript `type`/`interface` describes what an object
 * looks like; the compiler then checks every place that creates or reads one.
 */

export type Activity = 'eat' | 'goOut' | 'anything';
export type Budget = 'thrifty' | 'moderate' | 'splurge';
export type RadiusKm = 1 | 3 | 5 | 10;

/** Price levels as reported by the place data source. */
export type PriceLevel = 'free' | 'inexpensive' | 'moderate' | 'expensive' | 'veryExpensive';

export interface LatLng {
  latitude: number;
  longitude: number;
}

/** Where to search: from GPS or picked by hand. */
export interface SearchArea {
  label: string;
  location: LatLng;
  source: 'gps' | 'manual';
}

export interface PlacePhoto {
  uri: string;
  /** Photographer credit the source requires us to show. */
  attribution?: string;
  /** Licence short name, e.g. "CC BY-SA 4.0" (Wikimedia Commons). */
  license?: string;
  /** Page with the photo's full credits and licence. */
  sourceUrl?: string;
}

/** What a nearby search returns for each place: enough to rank and list it. */
export interface Place {
  id: string;
  name: string;
  category: string;
  /** Which activity this place belongs to. */
  group: 'eat' | 'goOut';
  location: LatLng;
  address?: string;
  rating?: number;
  reviewCount?: number;
  priceLevel?: PriceLevel;
  /** A real price range in pesos, when the data source has one. */
  priceRange?: { min: number; max?: number };
  /** true = open, false = closed, undefined = unknown. */
  openNow?: boolean;
  /** ISO time of the next closing (when open) or opening (when closed). */
  nextChange?: string;
  photo?: PlacePhoto;
  /** Wikimedia link(s) for photos, e.g. "Category:Rizal Park|wikidata:Q123" (OpenStreetMap places). */
  photoRef?: string;
  /** Category key such as 'cafe' or 'beach' (picks the icon). */
  kind?: string;
  /** What we know when there are no ratings (OpenStreetMap data). */
  signals?: PlaceSignals;
  website?: string;
}

/**
 * Facts about a listing that stand in for ratings: OpenStreetMap has no reviews,
 * so ranking uses how well-known and well-documented a place is.
 */
export interface PlaceSignals {
  /** A well-known chain, e.g. "Jollibee". */
  brand?: string;
  /** Has a Wikipedia/Wikidata entry: a landmark or notable place. */
  notable: boolean;
  /** Opening hours are listed (and readable). */
  hasHours: boolean;
  /** Phone or website is listed. */
  hasContact: boolean;
  /** e.g. "Filipino", from the cuisine tag. */
  cuisine?: string;
}

/** Extra fields fetched for the details screen. */
export interface PlaceDetails extends Place {
  photos: PlacePhoto[];
  description?: string;
  /** Readable weekly hours (OpenStreetMap); day names are added at display time. */
  week?: WeekSchedule;
  /** Hours as text lines from the data source (Google), Monday first. */
  weekdayHours?: string[];
  wheelchairAccessibleEntrance?: boolean;
  /** Opening hours exactly as listed, when we couldn't read them into weekday lines. */
  hoursText?: string;
}

export type PickKind = 'safe' | 'surprise' | 'gem';

/** Facts behind a pick's one-line reason; the sentence is written at display time, in the current language. */
export interface ReasonFacts {
  distance: number;
  nearestThirdDistance: number;
  differsFromSafe: boolean;
}

/** One of the three answers. (Not named `Pick`: that would hide TypeScript's built-in `Pick` type.) */
export interface Recommendation {
  kind: PickKind;
  place: Place;
  distanceMeters: number;
  facts: ReasonFacts;
}

/** Opening hours per weekday (0 = Monday): [start, end] in minutes; end can pass 1440 (after midnight). */
export type WeekSchedule = [number, number][][];

/** What we keep on the phone for a saved place: no copied place data beyond what the list shows. */
export interface SavedPlace {
  id: string;
  name: string;
  category: string;
  group: 'eat' | 'goOut';
  kind?: string;
  cuisine?: string;
  priceLevel?: PriceLevel;
  priceRange?: { min: number; max?: number };
  /** Older saves only: the price as text, before prices were formatted per language. */
  priceText?: string;
  photoUri?: string;
  savedAt: number;
}
