import fr from './fr';
import en from './en';
import type { Dictionary } from './types';

export type { Dictionary } from './types';

export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'fr';

export const dictionaries: Record<Locale, Dictionary> = { fr, en };

let currentLocale: Locale = defaultLocale;

export function setLocale(locale: string) {
  if (locale === 'fr' || locale === 'en') {
    currentLocale = locale;
  }
}

export function getLocale(): Locale {
  if (typeof window !== 'undefined') {
    const l = (window as { __LOCALE__?: string }).__LOCALE__;
    if (l === 'fr' || l === 'en') return l;
  }
  return currentLocale;
}

export function t(): Dictionary {
  return dictionaries[getLocale()];
}

export function localizedPath(path: string): string {
  const locale = getLocale();
  if (locale === defaultLocale) return path;
  return `/${locale}${path}`;
}

export function getStaticPaths() {
  return locales.map((lang) => ({ params: { lang } }));
}

export {
  trExercise,
  trMuscle,
  trCategory,
  trTemplateName,
  trTemplateDesc,
} from './exercise-translations';

export default { t, setLocale, getLocale, localizedPath, getStaticPaths };