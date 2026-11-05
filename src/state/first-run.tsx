/**
 * What a new person has already been shown: the onboarding and the Home guide.
 * The two are separate, and each is remembered on the phone once it's finished
 * or skipped, so neither comes back unless the person replays it from Settings.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { loadJSON, saveJSON, storageKeys } from '@/services/storage';

interface Stored {
  onboardingDone: boolean;
  guideDone: boolean;
}

const DEFAULTS: Stored = { onboardingDone: false, guideDone: false };

interface FirstRunContextValue {
  loaded: boolean;
  /** True on the first launch, and while replaying from Settings. */
  showOnboarding: boolean;
  finishOnboarding: () => void;
  replayOnboarding: () => void;
  /** Offer the guide on Home: the person hasn't taken or dismissed it yet. */
  offerGuide: boolean;
  guideRunning: boolean;
  startGuide: () => void;
  /** Finished, skipped or dismissed: all three mean "don't offer it again". */
  finishGuide: () => void;
}

const FirstRunContext = createContext<FirstRunContextValue | null>(null);

export function FirstRunProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<Stored>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  // Replaying and running are only for now: they aren't remembered between launches.
  const [replaying, setReplaying] = useState(false);
  const [guideRunning, setGuideRunning] = useState(false);

  useEffect(() => {
    loadJSON<Stored>(storageKeys.firstRun).then((value) => {
      if (value) setStored({ ...DEFAULTS, ...value });
      setLoaded(true);
    });
  }, []);

  const remember = (patch: Partial<Stored>) => {
    const next = { ...stored, ...patch };
    setStored(next);
    saveJSON(storageKeys.firstRun, next);
  };

  const value: FirstRunContextValue = {
    loaded,
    showOnboarding: !stored.onboardingDone || replaying,
    finishOnboarding: () => {
      setReplaying(false);
      remember({ onboardingDone: true });
    },
    replayOnboarding: () => setReplaying(true),
    offerGuide: !stored.guideDone && !guideRunning,
    guideRunning,
    startGuide: () => setGuideRunning(true),
    finishGuide: () => {
      setGuideRunning(false);
      remember({ guideDone: true });
    },
  };

  return <FirstRunContext.Provider value={value}>{children}</FirstRunContext.Provider>;
}

export function useFirstRun(): FirstRunContextValue {
  const value = useContext(FirstRunContext);
  if (!value) throw new Error('useFirstRun must be used inside <FirstRunProvider>');
  return value;
}
