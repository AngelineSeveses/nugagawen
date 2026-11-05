/**
 * Turns rows from the bundled OpenStreetMap database into app `Place` objects.
 * Pure functions (no database, no React), so they're unit-tested directly.
 */
import type { Place, PlaceDetails, PriceLevel, SearchArea } from '@/types';
import { openState, parseOpeningHours } from '@/utils/opening-hours';
import { prettyTagValue } from '@/utils/text';

/** One row of the `places` table (see scripts/osm/build.mjs). */
export interface OsmPlaceRow {
  id: string;
  name: string;
  cat: number;
  lat: number;
  lng: number;
  cuisine: string | null;
  hours: string | null;
  brand: string | null;
  brand_price: string | null;
  addr: string | null;
  contact: number;
  website: string | null;
  fee: string | null;
  wheelchair: string | null;
  notable: number;
  photo: string | null;
  phone: string | null;
}

/** One row of the `categories` table. */
export interface OsmCategoryRow {
  code: number;
  key: string;
  label: string;
  grp: 'eat' | 'goOut';
  price: string | null;
}

/** One row of the `areas` table. */
export interface OsmAreaRow {
  id: string;
  name: string;
  norm: string;
  kind: string;
  rank: number;
  lat: number;
  lng: number;
  context: string | null;
}

const PRICE_LEVELS: PriceLevel[] = ['free', 'inexpensive', 'moderate', 'expensive', 'veryExpensive'];
const asPriceLevel = (v: string | null | undefined) => PRICE_LEVELS.find((p) => p === v);

/**
 * Typical price level: a known chain's level first, then an explicit "fee=no",
 * then the category's usual level. The app always shows these as estimates.
 */
export function estimatePrice(row: Pick<OsmPlaceRow, 'brand_price' | 'fee'>, category: OsmCategoryRow): PriceLevel | undefined {
  const brand = asPriceLevel(row.brand_price);
  if (brand) return brand;
  if (row.fee === 'no') return 'free';
  const usual = asPriceLevel(category.price);
  if (usual === 'free' && row.fee === 'yes') return 'inexpensive';
  return usual;
}

/** "Filipino restaurant", "Café", "Japanese restaurant"… */
export function categoryLabel(row: Pick<OsmPlaceRow, 'cuisine'>, category: OsmCategoryRow): string {
  if (category.key === 'restaurant' && row.cuisine) {
    const cuisine = prettyTagValue(row.cuisine);
    if (!/^(regional|local|international)$/i.test(cuisine)) return `${cuisine} restaurant`;
  }
  return category.label;
}

export function rowToPlace(row: OsmPlaceRow, category: OsmCategoryRow, now: Date = new Date()): Place {
  const week = parseOpeningHours(row.hours);
  const state = week ? openState(week, now) : undefined;
  const cuisine = row.cuisine ? prettyTagValue(row.cuisine) : undefined;
  return {
    id: row.id,
    name: row.name,
    category: categoryLabel(row, category),
    kind: category.key,
    group: category.grp,
    location: { latitude: row.lat, longitude: row.lng },
    address: row.addr ?? undefined,
    priceLevel: estimatePrice(row, category),
    openNow: state?.open,
    nextChange: state?.nextChange?.toISOString(),
    website: row.website ?? undefined,
    photoRef: row.photo ?? undefined,
    signals: {
      brand: row.brand ?? undefined,
      notable: row.notable === 1,
      hasHours: week !== undefined,
      hasContact: row.contact === 1,
      cuisine: cuisine && !/^(regional|local|international)$/i.test(cuisine) ? cuisine : undefined,
    },
  };
}

export function rowToDetails(row: OsmPlaceRow, category: OsmCategoryRow, now: Date = new Date()): PlaceDetails {
  const place = rowToPlace(row, category, now);
  const week = parseOpeningHours(row.hours);
  return {
    ...place,
    photos: [],
    week,
    phone: row.phone ?? undefined,
    hoursText: !week && row.hours ? row.hours : undefined,
    wheelchairAccessibleEntrance: row.wheelchair === 'yes' ? true : undefined,
  };
}

/** Title and subtitle for an area suggestion. */
export function areaLabel(row: OsmAreaRow): { title: string; subtitle?: string } {
  return { title: row.name, subtitle: row.context ?? undefined };
}

/** The label shown once an area is chosen: "Poblacion, Makati". */
export function rowToArea(row: OsmAreaRow): SearchArea {
  const admin = row.kind === 'province' || row.kind === 'region';
  const generic = row.context === 'City' || row.context === 'Town' || row.context === 'Island';
  const label = !admin && row.context && !generic ? `${row.name}, ${row.context}` : row.name;
  return { label, location: { latitude: row.lat, longitude: row.lng }, source: 'manual' };
}
