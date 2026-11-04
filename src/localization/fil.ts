/**
 * Filipino (Tagalog) copy. Typed as `Copy`, so it must have exactly the same keys
 * as en.ts: a missing translation is a TypeScript error, not a blank screen.
 *
 * Voice: conversational, everyday Filipino, as people actually talk ("Pumili ka
 * na lang."), not textbook-formal. Common loanwords stay where Filipinos use them
 * (mall, website, km). Brand words live in brand.ts and never change.
 */
import type { Copy } from './en';

export const fil: Copy = {
  tagline: 'Bawas isip, dagdag gawa.',
  tabs: {
    discover: 'Tuklasin',
    saved: 'Naka-save',
    settings: 'Mga Setting',
  },
  discover: {
    headline: 'Wala pang plano?',
    support: 'Hanapan ka natin ng puwedeng gawin.',
    activityQuestion: 'Ano ang gusto mo?',
    budgetQuestion: 'Badyet bawat tao',
    cta: 'Hanapan ako',
    locationSet: (label) => `Malapit sa ${label}`,
    locationRadius: (km) => `Sa loob ng ${km} km`,
    locationUnset: 'Itakda ang lokasyon',
    locationUnsetHint: 'Kailangan para makahanap ng malapit sa iyo',
    changeLocation: 'Palitan ang lokasyon',
    surpriseTitle: 'Biglaang gala?',
    surpriseBody: 'Huwag nang mag-isip nang matagal. Kami na ang pipili para sa iyo.',
    surpriseCta: 'Sorpresahin ako',
  },
  activityDescription: {
    eat: 'Pagkain at kainan',
    goOut: 'Mga lugar at aktibidad',
    anything: 'Kahit anong trip',
  },
  budget: {
    thrifty: { label: 'Tipid', symbol: '₱', range: '₱250 pababa', a11y: 'Tipid, 250 piso pababa bawat tao' },
    moderate: { label: 'Sakto', symbol: '₱₱', range: '₱250–600', a11y: 'Sakto, 250 hanggang 600 piso bawat tao' },
    splurge: { label: 'Sosyal', symbol: '₱₱₱', range: '₱600 pataas', a11y: 'Sosyal, 600 piso pataas bawat tao' },
  },
  radius: (km) => `${km} km`,
  location: {
    title: 'Nasaan ka?',
    cancel: 'Kanselahin',
    useCurrent: 'Gamitin ang kasalukuyang lokasyon',
    useCurrentHint: 'Gagamitin lang ito para maghanap ng malapit sa iyo.',
    locating: 'Hinahanap ka…',
    denied: 'Naka-off ang lokasyon para sa Nugagawen. Puwede mo itong buksan sa Mga Setting, o maghanap sa ibaba.',
    openSettings: 'Buksan ang Mga Setting',
    gpsError: 'Hindi ka namin mahanap ngayon. Subukan muli o maghanap sa ibaba.',
    searchPlaceholder: 'Maghanap ng lungsod, bayan o barangay',
    searchLabel: 'Maghanap ng lugar',
    clearSearch: 'Burahin ang hinahanap',
    noMatches: (q) => `Walang tumugma sa "${q}". Subukan ang pangalan ng lungsod, bayan o barangay.`,
    searchError: 'Hindi gumagana ang paghahanap ngayon. Subukan muli.',
    distance: 'Gaano kalayo?',
    selected: (label) => `Napili: ${label}`,
    nothingSelected: 'Pumili ng lokasyon sa itaas',
    confirm: 'Gamitin ang lokasyong ito',
  },
  results: {
    title: 'Pumili ka na lang.',
    subtitle: (area, budget) =>
      `Malapit sa ${area}, ${{ thrifty: 'pasok sa tipid na badyet', moderate: 'pasok sa saktong badyet', splurge: 'pang-sosyal' }[budget]}.`,
    loading: (area) => `Naghahanap malapit sa ${area}…`,
    shuffle: 'Iba pa',
    change: 'Baguhin',
    startOver: 'Magsimula ulit',
    fewTitle: (n) => (n === 1 ? 'Isa lang ang nahanap.' : 'Dalawa lang ang nahanap.'),
    fewBody: (km) => `Sa loob ng ${km} km. Palawakin ang paghahanap para makakita pa.`,
    noneTitle: 'Wala pang nahanap sa malapit.',
    noneBody: (km) => `Walang tumugma sa loob ng ${km} km.`,
    noneAtMax: 'Subukan ang ibang badyet o gusto.',
    widen: (km) => `Palawakin sa ${km} km`,
    exhausted: 'Wala nang iba sa malapit. Palawakin ang paghahanap para makakita pa.',
    shuffled: 'Tatlong bagong pagpipilian',
    errorTitle: 'Hindi ma-load ang mga lugar.',
    offlineBody: 'Walang internet. Tingnan ang koneksyon at subukan muli.',
    errorBody: 'May problema sa paghahanap. Subukan muli.',
    retry: 'Subukan muli',
  },
  surprise: {
    loading: (area) => `Pumipili ng puwede malapit sa ${area}…`,
    noneTitle: 'Walang mapili sa malapit.',
    noneBody: 'Subukang palawakin ang paghahanap o pumili ng ibang badyet.',
  },
  pick: {
    safe: 'Subok na',
    surprise: 'Sorpresa',
    gem: 'Tagong hiyas',
  },
  reasons: {
    safeRatedClose: 'Mataas ang rating at malapit lang.',
    safeRated: (rating, count) => `${rating} ang rating mula sa ${count} na tao.`,
    safeClose: 'Malapit at tugma sa pinili mo.',
    safeBrand: 'Kilalang pangalan, alam mo na ang aasahan.',
    safeNotable: 'Kilalang lugar sa paligid.',
    safeListed: 'May nakalistang oras at numero o website.',
    gem: (rating, count) => `Gusto ng mga nakakaalam: ${rating} mula sa ${count} na review.`,
    gemLocal: 'Lokal at hindi chain.',
    gemLocalCuisine: (cuisine) => `Lokal na kainan para sa pagkaing ${cuisine}.`,
    surpriseDifferent: 'Ibang klase ng lugar kumpara sa iba mong pagpipilian.',
    surpriseGeneric: 'Isang pagpipiliang baka hindi mo naisip.',
  },
  why: {
    compose: (parts) => {
      const out: string[] = [];
      if (parts.budget) {
        const { budget, estimate } = parts.budget;
        const band = { thrifty: 'tipid', moderate: 'sakto', splurge: 'sosyal' }[budget];
        out.push(`${estimate ? 'karaniwang pasok' : 'pasok'} sa ${band} na badyet`);
      }
      if (parts.rating) out.push(`may ${parts.rating} na rating`);
      if (parts.openNow) out.push('bukas ngayon');
      if (parts.distance) out.push(`${parts.distance} lang mula sa iyo`);
      if (out.length === 0) return undefined;
      const last = out.pop();
      const sentence = out.length ? `${out.join(', ')} at ${last}` : (last ?? '');
      return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`;
    },
  },
  place: {
    back: 'Bumalik',
    openNow: 'Bukas ngayon.',
    closesAt: (time) => `Sasara ng ${time}.`,
    closedNow: 'Sarado ngayon.',
    opensAt: (time) => `Magbubukas ng ${time}.`,
    hoursUnknown: 'Walang nakalistang oras',
    perPerson: 'bawat tao',
    estimate: '(tantya)',
    ratingLine: (rating, count, fromGoogle) => `${rating} mula sa ${count} na review${fromGoogle ? ' sa Google' : ''}`,
    accessible: 'May pasukang pang-wheelchair',
    website: 'Website',
    listedHours: (raw) => `Nakalistang oras: ${raw}`,
    whyTitle: 'Bakit ito?',
    aboutTitle: 'Tungkol dito',
    hoursTitle: 'Oras',
    photosTitle: 'Mga larawan',
    photoBy: (name) => `Larawan: ${name}`,
    photoLabel: (name) => `Larawan ng ${name}`,
    save: 'I-save',
    saveA11y: 'I-save ang lugar',
    saved: 'Naka-save',
    directions: 'Pumunta dito',
    savedToast: 'Na-save',
    removedToast: 'Inalis sa naka-save',
    undo: 'Ibalik',
    unavailable: 'Wala na ang lugar na ito.',
  },
  hours: {
    days: ['Lunes', 'Martes', 'Miyerkules', 'Huwebes', 'Biyernes', 'Sabado', 'Linggo'],
    closed: 'Sarado',
    open24: 'Bukas 24 oras',
  },
  price: {
    free: 'Libre',
    unknown: 'Walang nakalistang presyo',
  },
  categories: {
    restaurant: 'Restawran',
    cafe: 'Kapihan',
    fast_food: 'Fast food',
    food_court: 'Food court',
    ice_cream: 'Sorbetes',
    bakery: 'Panaderya',
    museum: 'Museo',
    gallery: 'Galeriya ng sining',
    viewpoint: 'Tanawin',
    zoo: 'Zoo',
    aquarium: 'Akwaryum',
    theme_park: 'Theme park',
    park: 'Parke',
    garden: 'Hardin',
    cinema: 'Sinehan',
    bowling: 'Bowling',
    mall: 'Mall',
    arts_centre: 'Sentro ng sining',
    beach: 'Dalampasigan',
    waterfall: 'Talon',
    hot_spring: 'Mainit na bukal',
    attraction: 'Pasyalan',
  },
  categoryWithCuisine: (cuisine) => `Restawrang ${cuisine}`,
  saved: {
    title: 'Naka-save',
    emptyTitle: 'Wala ka pang naka-save.',
    emptyBody: 'I-tap ang I-save sa isang lugar para mabalikan mo ito dito.',
    emptyAction: 'Maghanap ng puwedeng gawin',
    remove: (name) => `Alisin ang ${name} sa naka-save`,
  },
  settings: {
    title: 'Mga Setting',
    language: 'Wika',
    searchSection: 'Paghahanap',
    distance: 'Layo ng paghahanap',
    location: 'Lokasyon',
    locationNone: 'Hindi pa nakatakda',
    privacySection: 'Pagkapribado',
    storedTitle: 'Ano ang naka-save sa teleponong ito',
    storedBody:
      'Ang mga pinili mo (gusto, badyet, layo, lugar, wika) at ang mga naka-save mong lugar. Wala itong ibang pinagtataguan, at walang account.',
    permission: 'Pahintulot sa lokasyon',
    permissionGranted: 'Pinapayagan',
    permissionDenied: 'Hindi pinapayagan',
    permissionUndetermined: 'Hindi pa naitatanong',
    clearSaved: 'Burahin ang mga naka-save',
    clearConfirmTitle: 'Burahin lahat ng naka-save?',
    clearConfirmBody: 'Hindi na ito maibabalik.',
    clearConfirmAction: 'Burahin',
    cancel: 'Kanselahin',
    aboutSection: 'Tungkol sa app',
    dataSource: 'Datos ng mga lugar',
    dataGoogle: 'Google Places',
    dataOsm: 'OpenStreetMap, offline',
    dataUpdated: (date) => `Na-update noong ${date}`,
    osmLicence:
      'Datos ng lugar © mga nag-ambag sa OpenStreetMap, sa ilalim ng Open Database License (ODbL). Gumagana kahit walang internet; walang account o API key.',
    accessibility:
      'Sumusunod sa telepono mo ang laki ng teksto at ang galaw sa screen. Buksan doon ang mas malaking teksto o Reduce Motion at aangkop ang Nugagawen.',
    version: 'Bersyon',
  },
  data: {
    osmAttribution: 'Datos ng lugar © mga nag-ambag sa OpenStreetMap',
    osmDetails: 'Mula sa OpenStreetMap ang mga detalye. Mga boluntaryo ang nagdadagdag nito, kaya maaaring luma na ang ilan.',
  },
  locale: 'fil-PH',
};
