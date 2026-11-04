/**
 * Saved places, stored on the phone. Only what the Saved list displays is kept;
 * full details are fetched again when a saved place is opened.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { loadJSON, saveJSON, storageKeys } from '@/services/storage';
import type { Place, SavedPlace } from '@/types';

interface SavedContextValue {
  items: SavedPlace[];
  loaded: boolean;
  isSaved: (id: string) => boolean;
  save: (place: Place) => void;
  /** Returns the removed item so the caller can offer Undo. */
  remove: (id: string) => SavedPlace | undefined;
  restore: (item: SavedPlace) => void;
  clear: () => void;
}

const SavedContext = createContext<SavedContextValue | null>(null);

export function SavedProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SavedPlace[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadJSON<SavedPlace[]>(storageKeys.saved).then((stored) => {
      if (Array.isArray(stored)) setItems(stored);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) saveJSON(storageKeys.saved, items);
  }, [items, loaded]);

  const value: SavedContextValue = {
    items,
    loaded,
    isSaved: (id) => items.some((item) => item.id === id),
    save: (place) =>
      setItems((current) =>
        current.some((item) => item.id === place.id)
          ? current
          : [
              {
                id: place.id,
                name: place.name,
                category: place.category,
                group: place.group,
                kind: place.kind,
                cuisine: place.signals?.cuisine,
                priceLevel: place.priceLevel,
                priceRange: place.priceRange,
                photoUri: place.photo?.uri,
                savedAt: Date.now(),
              },
              ...current,
            ],
      ),
    remove: (id) => {
      const removed = items.find((item) => item.id === id);
      setItems((current) => current.filter((item) => item.id !== id));
      return removed;
    },
    restore: (item) =>
      setItems((current) =>
        current.some((existing) => existing.id === item.id)
          ? current
          : [...current, item].sort((a, b) => b.savedAt - a.savedAt),
      ),
    clear: () => setItems([]),
  };

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved(): SavedContextValue {
  const value = useContext(SavedContext);
  if (!value) throw new Error('useSaved must be used inside <SavedProvider>');
  return value;
}
