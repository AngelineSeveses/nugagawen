/**
 * Brand words that never change with the app language. They live outside the
 * translation files on purpose, so a translation can't change them by accident.
 * Every place they appear, a description in the current language goes with them.
 */
import type { Activity } from '@/types';

export const BRAND_NAME = 'Nugagawen';

/** The three signature activities: Filipino words, kept in every language. */
export const ACTIVITY_LABEL: Record<Activity, string> = {
  eat: 'Kain',
  goOut: 'Gala',
  anything: 'Kahit Ano',
};
