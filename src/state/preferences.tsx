/**
 * The user's current choices, shared by every screen and remembered on the phone.
 *
 * React concept: a *context* makes a value available to every component below
 * the provider, without passing it through props. `usePreferences()` reads it.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { loadJSON, saveJSON, storageKeys } from '@/services/storage';
import type { Activity, Budget, RadiusKm, SearchArea } from '@/types';

interface Preferences {
  activity: Activity;
  budget: Budget;
  radiusKm: RadiusKm;
  area?: SearchArea;
}

const DEFAULTS: Preferences = { activity: 'anything', budget: 'moderate', radiusKm: 3 };
export const RADIUS_STEPS: RadiusKm[] = [1, 3, 5, 10];

interface PreferencesContextValue extends Preferences {
  loaded: boolean;
  setActivity: (activity: Activity) => void;
  setBudget: (budget: Budget) => void;
  setRadius: (radiusKm: RadiusKm) => void;
  setArea: (area: SearchArea) => void;
  /** "Start over": activity and budget back to defaults; location and distance stay. */
  resetChoices: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  // Load once at startup.
  useEffect(() => {
    loadJSON<Preferences>(storageKeys.preferences).then((stored) => {
      if (stored) setPrefs({ ...DEFAULTS, ...stored });
      setLoaded(true);
    });
  }, []);

  // Save after every change (but not before the stored values have loaded).
  useEffect(() => {
    if (loaded) saveJSON(storageKeys.preferences, prefs);
  }, [prefs, loaded]);

  const update = (patch: Partial<Preferences>) => setPrefs((current) => ({ ...current, ...patch }));

  const value: PreferencesContextValue = {
    ...prefs,
    loaded,
    setActivity: (activity) => update({ activity }),
    setBudget: (budget) => update({ budget }),
    setRadius: (radiusKm) => update({ radiusKm }),
    setArea: (area) => update({ area }),
    resetChoices: () => update({ activity: DEFAULTS.activity, budget: DEFAULTS.budget }),
  };

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error('usePreferences must be used inside <PreferencesProvider>');
  return value;
}
