/**
 * Photos for a place, from whichever source has them:
 * Google (when that optional provider is on) or Wikimedia Commons (OpenStreetMap links).
 *
 * React concept: a custom hook (a function starting with "use") can hold state
 * and effects, so any component can say `const { photos } = usePlacePhotos(place)`.
 */
import { useEffect, useState } from 'react';
import { fetchWikimediaPhotos } from '@/services/photos/wikimedia';
import type { PlacePhoto } from '@/types';

export function usePlacePhotos(place: { photo?: PlacePhoto; photoRef?: string } | undefined, known: PlacePhoto[] = []) {
  const ref = place?.photoRef;
  const [wiki, setWiki] = useState<{ ref?: string; photos: PlacePhoto[] }>({ photos: [] });

  useEffect(() => {
    if (!ref) return;
    let cancelled = false;
    fetchWikimediaPhotos(ref).then((photos) => {
      if (!cancelled) setWiki({ ref, photos });
    });
    return () => {
      cancelled = true;
    };
  }, [ref]);

  const fromWiki = wiki.ref === ref ? wiki.photos : [];
  const photos = known.length > 0 ? known : place?.photo ? [place.photo] : fromWiki;
  return { photos, loading: Boolean(ref) && wiki.ref !== ref };
}
