/**
 * Place photos from Wikimedia Commons (the free media library behind Wikipedia).
 *
 * Free, no key, no account. Only places whose OpenStreetMap listing links to
 * Commons or Wikidata have photos (about 350 in the Philippines, mostly
 * landmarks). Every photo keeps its author and licence, because Commons
 * licences (e.g. CC BY-SA) require credit wherever the photo is shown.
 *
 * Photos are optional: any failure (offline, timeout) simply means "no photos".
 */
import type { PlacePhoto } from '@/types';

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export interface PhotoRefs {
  files: string[];
  categories: string[];
  wikidata: string[];
}

/** "Category:Rizal Park|File:X.jpg|wikidata:Q123" → its parts (stored by scripts/osm/build.mjs). */
export function parsePhotoRefs(ref: string): PhotoRefs {
  const refs: PhotoRefs = { files: [], categories: [], wikidata: [] };
  for (const part of ref.split('|').map((p) => p.trim()).filter(Boolean)) {
    if (/^File:/i.test(part)) refs.files.push(`File:${part.slice(5)}`);
    else if (/^Category:/i.test(part)) refs.categories.push(`Category:${part.slice(9)}`);
    else if (/^wikidata:Q\d+$/.test(part)) refs.wikidata.push(part.slice(9));
  }
  return refs;
}

/** Commons "Artist" is HTML (often a link); keep just the readable name. */
export function cleanArtist(html: string | undefined): string | undefined {
  if (!html) return undefined;
  const text = html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    // Wiki signature links such as "(talk)" or "(Uploads)" aren't part of the name.
    .replace(/\((talk|uploads?|contribs?|contributions)\b[^)]*\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return undefined;
  return text.length > 60 ? `${text.slice(0, 57)}…` : text;
}

async function getJson<T>(base: string, params: Record<string, string>): Promise<T> {
  // origin=* lets the API answer browser requests too (used by the web preview).
  const url = `${base}?${new URLSearchParams({ ...params, format: 'json', origin: '*' })}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Wikidata items → their main image (P18) and Commons category (P373). */
async function fromWikidata(ids: string[]): Promise<{ files: string[]; categories: string[] }> {
  if (ids.length === 0) return { files: [], categories: [] };
  type Claim = { mainsnak?: { datavalue?: { value?: unknown } } };
  const data = await getJson<{ entities?: Record<string, { claims?: Record<string, Claim[]> }> }>(WIKIDATA_API, {
    action: 'wbgetentities',
    ids: ids.join('|'),
    props: 'claims',
  });
  const files: string[] = [];
  const categories: string[] = [];
  for (const entity of Object.values(data.entities ?? {})) {
    for (const c of entity.claims?.P18 ?? []) {
      const v = c.mainsnak?.datavalue?.value;
      if (typeof v === 'string') files.push(`File:${v}`);
    }
    for (const c of entity.claims?.P373 ?? []) {
      const v = c.mainsnak?.datavalue?.value;
      if (typeof v === 'string') categories.push(`Category:${v}`);
    }
  }
  return { files, categories };
}

async function filesInCategory(category: string, limit: number): Promise<string[]> {
  const data = await getJson<{ query?: { categorymembers?: { title: string }[] } }>(COMMONS_API, {
    action: 'query',
    list: 'categorymembers',
    cmtitle: category,
    cmtype: 'file',
    cmlimit: String(limit),
  });
  return (data.query?.categorymembers ?? []).map((m) => m.title);
}

interface ImageInfo {
  thumburl?: string;
  url?: string;
  descriptionurl?: string;
  mime?: string;
  extmetadata?: { Artist?: { value?: string }; LicenseShortName?: { value?: string } };
}

async function describeFiles(titles: string[]): Promise<PlacePhoto[]> {
  if (titles.length === 0) return [];
  const data = await getJson<{ query?: { pages?: Record<string, { title: string; imageinfo?: ImageInfo[] }> } }>(COMMONS_API, {
    action: 'query',
    titles: titles.join('|'),
    prop: 'imageinfo',
    iiprop: 'url|mime|extmetadata',
    iiextmetadatafilter: 'Artist|LicenseShortName',
    iiurlwidth: '1200', // a resized copy: sharp on phones, far smaller than the original
  });
  const byTitle = new Map(Object.values(data.query?.pages ?? {}).map((p) => [p.title, p.imageinfo?.[0]]));
  // Keep the order we asked for (explicit photos first).
  return titles.flatMap((title) => {
    const info = byTitle.get(title.replace(/_/g, ' '));
    if (!info || !IMAGE_TYPES.has(info.mime ?? '') || !(info.thumburl ?? info.url)) return [];
    return [
      {
        uri: info.thumburl ?? info.url!,
        attribution: cleanArtist(info.extmetadata?.Artist?.value),
        license: info.extmetadata?.LicenseShortName?.value,
        sourceUrl: info.descriptionurl,
      },
    ];
  });
}

const cache = new Map<string, Promise<PlacePhoto[]>>();

/** Up to `limit` photos for a place's photo link, cached for the session. Never throws. */
export function fetchWikimediaPhotos(ref: string, limit = 10): Promise<PlacePhoto[]> {
  const cached = cache.get(ref);
  if (cached) return cached;
  const task = (async () => {
    const refs = parsePhotoRefs(ref);
    const wd = await fromWikidata(refs.wikidata).catch(() => ({ files: [], categories: [] }));
    const files = [...refs.files, ...wd.files];
    for (const category of [...refs.categories, ...wd.categories]) {
      if (files.length >= limit) break;
      files.push(...(await filesInCategory(category, limit).catch(() => [])));
    }
    const unique = [...new Set(files.map((f) => f.replace(/_/g, ' ')))].slice(0, limit);
    return describeFiles(unique);
  })().catch(() => {
    cache.delete(ref); // allow a retry later (e.g. when back online)
    return [] as PlacePhoto[];
  });
  cache.set(ref, task);
  return task;
}
