/**
 * English copy: the reference language. `Copy` (the type of this object) is what
 * every other language file must match exactly, so TypeScript reports a missing
 * or misspelled key in fil.ts as an error.
 *
 * Voice: plain, warm, specific. Sentence case. Buttons say what happens.
 * Brand words (Nugagawen, Kain, Gala, Kahit Ano) are not here: see brand.ts.
 */
import type { Compass, RouteStep, StepModifier, TravelMode } from '@/services/routing/types';
import type { Activity, Budget, PickKind, RadiusKm } from '@/types';

const COMPASS_EN: Record<Compass, string> = {
  n: 'north',
  ne: 'northeast',
  e: 'east',
  se: 'southeast',
  s: 'south',
  sw: 'southwest',
  w: 'west',
  nw: 'northwest',
};

function turnEn(modifier: StepModifier | undefined): string {
  switch (modifier) {
    case 'left':
      return 'Turn left';
    case 'right':
      return 'Turn right';
    case 'slight left':
      return 'Bear left';
    case 'slight right':
      return 'Bear right';
    case 'sharp left':
      return 'Turn sharply left';
    case 'sharp right':
      return 'Turn sharply right';
    case 'uturn':
      return 'Make a U-turn';
    default:
      return 'Continue straight';
  }
}

/** One written direction. Works with or without a road name, because many roads have none listed. */
function instructionEn(step: RouteStep, destination?: string): string {
  const onto = step.road ? ` onto ${step.road}` : '';
  const side = step.modifier?.includes('left') ? 'left' : 'right';
  switch (step.type) {
    case 'depart':
      return `Head ${COMPASS_EN[step.compass]}${step.road ? ` on ${step.road}` : ''}`;
    case 'arrive':
      return destination ? `Arrive at ${destination}` : 'You have arrived';
    case 'turn':
      return `${turnEn(step.modifier)}${onto}`;
    case 'merge':
      return `Merge${onto}`;
    case 'ramp-on':
      return `Take the ramp${onto}`;
    case 'ramp-off':
      return `Take the exit${onto}`;
    case 'fork':
      return `Keep ${side}${onto}`;
    case 'end-of-road':
      return `At the end of the road, turn ${side}${onto}`;
    case 'roundabout':
      return step.exit ? `At the roundabout, take exit ${step.exit}${onto}` : `Go through the roundabout${onto}`;
    case 'exit-roundabout':
      return `Leave the roundabout${onto}`;
    case 'ferry':
      return `Take the ferry${step.road ? `: ${step.road}` : ''}`;
    default:
      return step.road ? `Continue on ${step.road}` : 'Continue straight';
  }
}

export const en = {
  tagline: 'Less deciding. More doing.',
  tabs: {
    discover: 'Discover',
    saved: 'Saved',
    settings: 'Settings',
  },
  discover: {
    headline: 'No plans yet?',
    support: "Let's find something for you.",
    activityQuestion: 'What are you in the mood for?',
    budgetQuestion: 'Budget per person',
    cta: 'Find my three',
    locationSet: (label: string) => `Near ${label}`,
    locationRadius: (km: number) => `Within ${km} km`,
    locationUnset: 'Set your location',
    locationUnsetHint: 'Needed to find places near you',
    changeLocation: 'Change location',
    surpriseTitle: 'Feeling spontaneous?',
    surpriseBody: 'Skip the planning. Let us surprise you.',
    surpriseCta: 'Surprise me',
  },
  /** Shown under the brand labels Kain, Gala and Kahit Ano. */
  activityDescription: {
    eat: 'Food & dining',
    goOut: 'Places & activities',
    anything: 'Anything goes',
  } satisfies Record<Activity, string>,
  budget: {
    thrifty: { label: 'Budget-friendly', symbol: '₱', range: 'Under ₱250', a11y: 'Budget-friendly, under 250 pesos per person' },
    moderate: { label: 'Moderate', symbol: '₱₱', range: '₱250–600', a11y: 'Moderate, 250 to 600 pesos per person' },
    splurge: { label: 'Premium', symbol: '₱₱₱', range: '₱600+', a11y: 'Premium, 600 pesos or more per person' },
  } satisfies Record<Budget, { label: string; symbol: string; range: string; a11y: string }>,
  radius: (km: RadiusKm) => `${km} km`,
  location: {
    title: 'Where are you?',
    cancel: 'Cancel',
    useCurrent: 'Use my current location',
    useCurrentHint: 'Only used to find places near you.',
    locating: 'Finding you…',
    denied: 'Location is off for Nugagawen. You can turn it on in Settings, or search below.',
    openSettings: 'Open Settings',
    gpsError: "We couldn't find you right now. Try again or search below.",
    searchPlaceholder: 'Search a city, town or barangay',
    searchLabel: 'Search for an area',
    clearSearch: 'Clear search',
    noMatches: (q: string) => `Nothing matched "${q}". Try a city, town or barangay name.`,
    searchError: "Search isn't working right now. Try again.",
    distance: 'How far?',
    selected: (label: string) => `Selected: ${label}`,
    nothingSelected: 'Choose your location above',
    confirm: 'Use this location',
  },
  results: {
    title: 'Just pick one.',
    subtitle: (area: string, budget: Budget) =>
      `Near ${area}, ${{ thrifty: 'budget-friendly', moderate: 'moderate budget', splurge: 'premium' }[budget]}.`,
    loading: (area: string) => `Searching near ${area}…`,
    shuffle: 'Show others',
    change: 'Change',
    startOver: 'Start over',
    fewTitle: (n: number): string => (n === 1 ? 'Only one found.' : 'Only two found.'),
    fewBody: (km: number) => `Within ${km} km. Widen the search to see more.`,
    noneTitle: 'Nothing nearby yet.',
    noneBody: (km: number) => `We couldn't find a match within ${km} km.`,
    noneAtMax: 'Try a different budget or activity.',
    widen: (km: number) => `Widen to ${km} km`,
    exhausted: "That's everything nearby. Widen the search to see more.",
    shuffled: 'Three new options',
    errorTitle: "Couldn't load places.",
    offlineBody: 'No internet connection. Check it and try again.',
    errorBody: 'Something went wrong with the search. Try again.',
    retry: 'Try again',
  },
  surprise: {
    loading: (area: string) => `Picking something near ${area}…`,
    noneTitle: 'Nothing to pick nearby.',
    noneBody: 'Try a wider search or a different budget.',
  },
  pick: {
    safe: 'Safe choice',
    surprise: 'Surprise me',
    gem: 'Hidden gem',
  } satisfies Record<PickKind, string>,
  reasons: {
    safeRatedClose: 'Highly rated and close by.',
    safeRated: (rating: string, count: string) => `Rated ${rating} by ${count} people.`,
    safeClose: 'Close by and a good match for what you picked.',
    safeBrand: 'A familiar name, so you know what to expect.',
    safeNotable: 'A well-known spot in the area.',
    safeListed: 'Listed with opening hours and contact details.',
    gem: (rating: string, count: number) => `Loved by the few who know it: ${rating} from ${count} reviews.`,
    gemLocal: 'A local, independent spot.',
    gemLocalCuisine: (cuisine: string) => `A local, independent spot for ${cuisine} food.`,
    surpriseDifferent: 'A different kind of place from your other picks.',
    surpriseGeneric: 'Something you might not have picked yourself.',
  },
  /** The "Why this?" sentence on place details, built from the facts we have. */
  why: {
    compose: (parts: { budget?: { budget: Budget; estimate: boolean }; rating?: string; openNow: boolean; distance?: string }) => {
      const out: string[] = [];
      if (parts.budget) {
        const { budget, estimate } = parts.budget;
        const phrases = {
          thrifty: estimate ? 'is usually budget-friendly' : 'is budget-friendly',
          moderate: estimate ? 'usually fits a moderate budget' : 'fits a moderate budget',
          splurge: estimate ? 'usually fits a premium budget' : 'fits a premium budget',
        };
        out.push(phrases[budget]);
      }
      if (parts.rating) out.push(`is rated ${parts.rating}`);
      if (parts.openNow) out.push('is open now');
      if (parts.distance) out.push(`is ${parts.distance} from you`);
      if (out.length === 0) return undefined;
      const last = out.pop();
      return `It ${out.length ? `${out.join(', ')} and ${last}` : last}.`;
    },
  },
  place: {
    back: 'Back',
    openNow: 'Open now.',
    closesAt: (time: string) => `Closes ${time}.`,
    closedNow: 'Closed now.',
    opensAt: (time: string) => `Opens ${time}.`,
    hoursUnknown: 'No hours listed',
    perPerson: 'per person',
    estimate: '(estimate)',
    ratingLine: (rating: string, count: string, fromGoogle: boolean) =>
      `${rating} from ${count} ${fromGoogle ? 'Google reviews' : 'reviews'}`,
    accessible: 'Wheelchair-accessible entrance',
    website: 'Website',
    listedHours: (raw: string) => `Listed hours: ${raw}`,
    whyTitle: 'Why this?',
    aboutTitle: 'About',
    hoursTitle: 'Hours',
    photosTitle: 'Photos',
    photoCredit: (author?: string, license?: string) => `Photo: ${[author, license].filter(Boolean).join(', ')}`,
    photoCount: (i: number, n: number) => `${i} of ${n}`,
    openPhoto: (i: number, n: number) => `Open photo ${i} of ${n}`,
    closePhotos: 'Close photos',
    viewSource: 'View on Wikimedia Commons',
    photosFrom: 'Photos from Wikimedia Commons, credited to each photographer.',
    seePhotosOnGoogle: 'See photos on Google Maps',
    photoLabel: (name: string) => `Photo of ${name}`,
    save: 'Save',
    saveA11y: 'Save place',
    saved: 'Saved',
    directions: 'Get directions',
    savedToast: 'Saved',
    removedToast: 'Removed from Saved',
    undo: 'Undo',
    unavailable: 'This place is no longer available.',
  },
  hours: {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    closed: 'Closed',
    open24: 'Open 24 hours',
  },
  price: {
    free: 'Free',
    unknown: 'No price listed',
  },
  /** Place categories (keys from scripts/osm/build.mjs). */
  categories: {
    restaurant: 'Restaurant',
    cafe: 'Café',
    fast_food: 'Fast food',
    food_court: 'Food court',
    ice_cream: 'Ice cream',
    bakery: 'Bakery',
    museum: 'Museum',
    gallery: 'Art gallery',
    viewpoint: 'Viewpoint',
    zoo: 'Zoo',
    aquarium: 'Aquarium',
    theme_park: 'Theme park',
    park: 'Park',
    garden: 'Garden',
    cinema: 'Cinema',
    bowling: 'Bowling alley',
    mall: 'Shopping mall',
    arts_centre: 'Arts centre',
    beach: 'Beach',
    waterfall: 'Waterfall',
    hot_spring: 'Hot spring',
    attraction: 'Attraction',
  } as Record<string, string>,
  categoryWithCuisine: (cuisine: string) => `${cuisine} restaurant`,
  directions: {
    title: 'Directions',
    fromHere: 'From your location',
    fromArea: (area: string) => `From ${area}.`,
    fromAreaHint: 'Turn on location for directions from where you are.',
    modeQuestion: 'How are you getting there?',
    mode: { walking: 'Walk', driving: 'Drive', cycling: 'Bike' } satisfies Record<TravelMode, string>,
    duration: (seconds: number) => {
      const minutes = Math.max(1, Math.round(seconds / 60));
      if (minutes < 60) return `${minutes} min`;
      const hours = Math.floor(minutes / 60);
      return minutes % 60 ? `${hours} hr ${minutes % 60} min` : `${hours} hr`;
    },
    summary: (distance: string, place: string) => `${distance} to ${place}`,
    noTraffic: "Travel times don't include traffic.",
    noTransit: "Jeepney and bus routes aren't available here. Google Maps can help with public transport.",
    loading: 'Finding the way…',
    noOriginTitle: 'Where are you starting from?',
    noOriginBody: 'Set your location to get directions.',
    stepsTitle: 'Step by step',
    instruction: instructionEn,
    openGoogle: 'Open in Google Maps',
    errorTitle: "Couldn't get directions.",
    errorBody: "The route service didn't respond. Try again, or use Google Maps.",
    noRouteTitle: 'No route found.',
    noRouteBody: 'There may be no road to this place this way. Try another way of getting there, or use Google Maps.',
    credit: 'Routes by OSRM. Map data © OpenStreetMap contributors.',
    fixMap: 'Fix the map',
    mapLabel: (place: string) => `Map showing the way to ${place}`,
    mapPreviewLabel: (place: string) => `Map of ${place}. Opens directions.`,
    mapNeedsBuild: 'The map appears in the full app build. Directions below still work.',
  },
  saved: {
    title: 'Saved',
    emptyTitle: 'Nothing saved yet.',
    emptyBody: 'Tap Save on a place to keep it here for later.',
    emptyAction: 'Find something to do',
    remove: (name: string) => `Remove ${name} from Saved`,
  },
  settings: {
    title: 'Settings',
    language: 'Language',
    searchSection: 'Search',
    distance: 'Search distance',
    location: 'Location',
    locationNone: 'Not set',
    privacySection: 'Privacy',
    storedTitle: "What's stored on this phone",
    storedBody:
      'Your choices (activity, budget, distance, area, language) and your saved places. Nothing is stored anywhere else, and there is no account.',
    permission: 'Location permission',
    permissionGranted: 'Allowed',
    permissionDenied: 'Not allowed',
    permissionUndetermined: 'Not asked yet',
    clearSaved: 'Clear saved places',
    clearConfirmTitle: 'Clear all saved places?',
    clearConfirmBody: "This can't be undone.",
    clearConfirmAction: 'Clear',
    cancel: 'Cancel',
    aboutSection: 'About',
    dataSource: 'Place data',
    dataGoogle: 'Google Places',
    dataOsm: 'OpenStreetMap, offline',
    dataUpdated: (date: string) => `Updated ${date}`,
    photosSource: 'Photos',
    osmLicence:
      'Place data © OpenStreetMap contributors, available under the Open Database License (ODbL). Works without internet; no account or API key.',
    accessibility:
      'Text size and motion follow your phone settings. Turn on larger text or Reduce Motion there and Nugagawen adapts.',
    version: 'Version',
  },
  data: {
    /** Required by the OpenStreetMap licence (ODbL) wherever its data is shown. */
    osmAttribution: 'Place data © OpenStreetMap contributors',
    osmDetails: 'Details from OpenStreetMap. Listings are added by volunteers and may be out of date.',
  },
  /** Date format for this language (used with toLocaleDateString). */
  locale: 'en-PH',
};

export type Copy = typeof en;
