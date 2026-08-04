import fr from './fr';

export type Locale = 'fr';
export type TranslationKey = typeof fr;

let currentLocale: Locale = 'fr';

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

export function t(): typeof fr {
  return fr;
}

export default { t, setLocale };
