/**
 * Google Places API (New): the only external API the app uses.
 * Endpoints: Nearby Search, Place Details, Place Photos, Autocomplete.
 * Field masks list exactly the fields we show, because Google bills by field tier.
 */
import type { LatLng, Place, PlaceDetails, PlacePhoto, PriceLevel, SearchArea } from '@/types';
import { EAT_TYPES, PlacesError, typesFor, type AreaSuggestion, type NearbyQuery, type PlacesProvider } from './types';

const BASE = 'https://places.googleapis.com/v1';

const PLACE_FIELDS = [
  'id',
  'displayName',
  'primaryType',
  'primaryTypeDisplayName',
  'types',
  'location',
  'shortFormattedAddress',
  'rating',
  'userRatingCount',
  'priceLevel',
  'priceRange',
  'currentOpeningHours',
  'businessStatus',
  'photos',
];
const DETAIL_FIELDS = [...PLACE_FIELDS, 'formattedAddress', 'regularOpeningHours', 'editorialSummary', 'accessibilityOptions'];

/* ---------- Response shapes (only the parts we read) ---------- */
interface GText {
  text?: string;
}
interface GMoney {
  currencyCode?: string;
  units?: string;
}
interface GPhoto {
  name: string;
  authorAttributions?: { displayName?: string }[];
}
interface GPlace {
  id: string;
  displayName?: GText;
  primaryType?: string;
  primaryTypeDisplayName?: GText;
  types?: string[];
  location?: LatLng;
  shortFormattedAddress?: string;
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  priceRange?: { startPrice?: GMoney; endPrice?: GMoney };
  currentOpeningHours?: { openNow?: boolean; nextCloseTime?: string; nextOpenTime?: string };
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  businessStatus?: string;
  photos?: GPhoto[];
  editorialSummary?: GText;
  accessibilityOptions?: { wheelchairAccessibleEntrance?: boolean };
}

const PRICE_LEVELS: Record<string, PriceLevel> = {
  PRICE_LEVEL_FREE: 'free',
  PRICE_LEVEL_INEXPENSIVE: 'inexpensive',
  PRICE_LEVEL_MODERATE: 'moderate',
  PRICE_LEVEL_EXPENSIVE: 'expensive',
  PRICE_LEVEL_VERY_EXPENSIVE: 'veryExpensive',
};

const eatTypes = new Set<string>(EAT_TYPES);

function prettifyType(type?: string): string {
  if (!type) return 'Place';
  const words = type.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function createGoogleProvider(apiKey: string): PlacesProvider {
  async function request<T>(path: string, init: { method: 'GET' | 'POST'; fields?: string; body?: unknown }): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${BASE}/${path}`, {
        method: init.method,
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          ...(init.fields ? { 'X-Goog-FieldMask': init.fields } : {}),
        },
        body: init.body ? JSON.stringify(init.body) : undefined,
      });
    } catch {
      throw new PlacesError('offline');
    }
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
      const message = body.error?.message;
      if (response.status === 404) throw new PlacesError('notFound', message);
      if (response.status === 429) throw new PlacesError('quota', message);
      if (response.status === 400 || response.status === 403) throw new PlacesError('config', message);
      throw new PlacesError('unknown', message);
    }
    return (await response.json()) as T;
  }

  function photoUri(photo: GPhoto, maxWidthPx: number): PlacePhoto {
    return {
      uri: `${BASE}/${photo.name}/media?maxWidthPx=${maxWidthPx}&key=${encodeURIComponent(apiKey)}`,
      attribution: photo.authorAttributions?.[0]?.displayName,
    };
  }

  function toPlace(g: GPlace): Place | undefined {
    if (!g.location || !g.displayName?.text) return undefined;
    const start = g.priceRange?.startPrice;
    const end = g.priceRange?.endPrice;
    const pesos = start?.currencyCode === 'PHP' && start.units !== undefined;
    const isEat = (g.types ?? []).some((t) => eatTypes.has(t)) || eatTypes.has(g.primaryType ?? '');
    return {
      id: g.id,
      name: g.displayName.text,
      category: g.primaryTypeDisplayName?.text ?? prettifyType(g.primaryType),
      group: isEat ? 'eat' : 'goOut',
      location: g.location,
      address: g.shortFormattedAddress,
      rating: g.rating,
      reviewCount: g.userRatingCount,
      priceLevel: g.priceLevel ? PRICE_LEVELS[g.priceLevel] : undefined,
      priceRange: pesos
        ? { min: Number(start.units), max: end?.currencyCode === 'PHP' && end.units ? Number(end.units) : undefined }
        : undefined,
      openNow: g.currentOpeningHours?.openNow,
      nextChange: g.currentOpeningHours?.openNow
        ? g.currentOpeningHours?.nextCloseTime
        : g.currentOpeningHours?.nextOpenTime,
      photo: g.photos?.[0] ? photoUri(g.photos[0], 800) : undefined,
    };
  }

  return {
    kind: 'google',

    async searchNearby({ center, radiusMeters, activity }: NearbyQuery) {
      const data = await request<{ places?: GPlace[] }>('places:searchNearby', {
        method: 'POST',
        fields: PLACE_FIELDS.map((f) => `places.${f}`).join(','),
        body: {
          includedTypes: typesFor(activity),
          maxResultCount: 20,
          rankPreference: 'POPULARITY',
          locationRestriction: { circle: { center, radius: Math.min(radiusMeters, 50000) } },
        },
      });
      return (data.places ?? [])
        .filter((g) => g.businessStatus === undefined || g.businessStatus === 'OPERATIONAL')
        .map(toPlace)
        .filter((p): p is Place => p !== undefined);
    },

    async getDetails(id: string): Promise<PlaceDetails> {
      const g = await request<GPlace>(`places/${encodeURIComponent(id)}`, { method: 'GET', fields: DETAIL_FIELDS.join(',') });
      const base = toPlace(g);
      if (!base) throw new PlacesError('notFound');
      return {
        ...base,
        address: g.formattedAddress ?? base.address,
        photos: (g.photos ?? []).slice(0, 10).map((p) => photoUri(p, 1200)),
        description: g.editorialSummary?.text,
        weekdayHours: g.regularOpeningHours?.weekdayDescriptions,
        wheelchairAccessibleEntrance: g.accessibilityOptions?.wheelchairAccessibleEntrance,
      };
    },

    async searchAreas(input: string, near?: LatLng): Promise<AreaSuggestion[]> {
      const data = await request<{
        suggestions?: {
          placePrediction?: {
            placeId: string;
            text?: GText;
            structuredFormat?: { mainText?: GText; secondaryText?: GText };
          };
        }[];
      }>('places:autocomplete', {
        method: 'POST',
        body: {
          input,
          ...(near ? { locationBias: { circle: { center: near, radius: 50000 } } } : {}),
        },
      });
      return (data.suggestions ?? [])
        .map((s) => s.placePrediction)
        .filter((p): p is NonNullable<typeof p> => p !== undefined)
        .map((p) => ({
          id: p.placeId,
          title: p.structuredFormat?.mainText?.text ?? p.text?.text ?? '',
          subtitle: p.structuredFormat?.secondaryText?.text,
        }));
    },

    async resolveArea(id: string): Promise<SearchArea> {
      const g = await request<GPlace>(`places/${encodeURIComponent(id)}`, {
        method: 'GET',
        fields: 'id,displayName,location,shortFormattedAddress',
      });
      if (!g.location) throw new PlacesError('notFound');
      return { label: g.displayName?.text ?? g.shortFormattedAddress ?? 'Selected area', location: g.location, source: 'manual' };
    },
  };
}
