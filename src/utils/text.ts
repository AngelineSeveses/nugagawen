/**
 * Search-friendly text: lowercase, accents removed ("Parañaque" → "paranaque"),
 * punctuation turned into spaces. Uses an explicit table instead of
 * String.normalize so it behaves the same on every JavaScript engine.
 *
 * Must stay identical to `norm()` in scripts/osm/build.mjs, which prepares the
 * stored search keys.
 */
const FOLD: Record<string, string> = {
  á: 'a', à: 'a', â: 'a', ä: 'a', ã: 'a', å: 'a',
  é: 'e', è: 'e', ê: 'e', ë: 'e',
  í: 'i', ì: 'i', î: 'i', ï: 'i',
  ó: 'o', ò: 'o', ô: 'o', ö: 'o', õ: 'o',
  ú: 'u', ù: 'u', û: 'u', ü: 'u',
  ñ: 'n', ç: 'c',
};

export function foldForSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\u0000-\u007f]/g, (ch) => FOLD[ch] ?? ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "filipino;seafood" → "Filipino", "coffee_shop" → "Coffee shop". */
export function prettyTagValue(value: string): string {
  const first = value.split(/[;,]/)[0].trim().replace(/_/g, ' ');
  return first.charAt(0).toUpperCase() + first.slice(1);
}
