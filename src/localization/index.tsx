/**
 * App language: English (default) or Filipino.
 *
 * React concept: the current language lives in a context, so every screen that
 * calls `useCopy()` re-renders with the new words the moment it changes. No
 * restart needed. The choice is saved on the phone (AsyncStorage).
 *
 * Why no i18next: our copy already lives in typed objects, some entries are
 * small functions (`Near ${area}`), and TypeScript checks that fil.ts has every
 * key en.ts has. A context does the rest, without two extra libraries.
 */
import { getLocales } from 'expo-localization';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { loadJSON, saveJSON } from '@/services/storage';
import { en, type Copy } from './en';
import { fil } from './fil';

export type Language = 'en' | 'fil';
export type { Copy };
export { ACTIVITY_LABEL, BRAND_NAME } from './brand';

const COPY: Record<Language, Copy> = { en, fil };
export const LANGUAGE_NAMES: Record<Language, string> = { en: 'English', fil: 'Filipino' };

const STORAGE_KEY = 'nugagawen:language:v1';
interface Stored {
  language: Language;
}

/** True when the phone's preferred language is Filipino/Tagalog. */
function phonePrefersFilipino(): boolean {
  try {
    const code = getLocales()[0]?.languageCode;
    return code === 'fil' || code === 'tl';
  } catch {
    return false;
  }
}

interface LanguageContextValue {
  language: Language;
  copy: Copy;
  setLanguage: (language: Language) => void;
  /** Show the one-time "Use Filipino?" suggestion. */
  suggestFilipino: boolean;
  /** Answer the suggestion; either answer is remembered and it never shows again. */
  answerSuggestion: (useFilipino: boolean) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [hasChoice, setHasChoice] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadJSON<Stored>(STORAGE_KEY).then((stored) => {
      if (stored?.language === 'en' || stored?.language === 'fil') {
        setLanguageState(stored.language);
        setHasChoice(true);
      }
      setLoaded(true);
    });
  }, []);

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    setHasChoice(true);
    saveJSON(STORAGE_KEY, { language: next } satisfies Stored);
  };

  // Render nothing until the saved choice is known, so a Filipino user never sees an English flash.
  if (!loaded) return null;

  const value: LanguageContextValue = {
    language,
    copy: COPY[language],
    setLanguage,
    suggestFilipino: !hasChoice && phonePrefersFilipino(),
    answerSuggestion: (useFilipino) => setLanguage(useFilipino ? 'fil' : 'en'),
  };
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return value;
}

/** The words for the current language: `const copy = useCopy();` */
export const useCopy = (): Copy => useLanguage().copy;

/**
 * A place's category in the current language. OpenStreetMap places carry a
 * category key we can translate; Google places come with their own label.
 */
export function categoryName(place: { kind?: string; category: string; signals?: { cuisine?: string } }, copy: Copy): string {
  if (place.kind && copy.categories[place.kind]) {
    const cuisine = place.signals?.cuisine;
    return place.kind === 'restaurant' && cuisine ? copy.categoryWithCuisine(cuisine) : copy.categories[place.kind];
  }
  return place.category;
}

/** The one-time suggestion is about Filipino, so it's written in Filipino (with English beside it). */
export const FILIPINO_SUGGESTION = {
  title: 'Mas gusto mo ba sa Filipino?',
  body: 'Puwede mo itong palitan anumang oras sa Mga Setting.',
  accept: 'Gamitin ang Filipino',
  decline: 'Keep English',
};
