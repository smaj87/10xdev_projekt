import { isFunction } from 'components/utils/tinyLodash';

import commonLangs from './index';
import { Lang, TranslationFunction } from './types';

let translations = commonLangs;

/**
 * Initialize translations
 * @param appTranslations
 */
export const initTranslations = (
  appTranslations: Record<
    string,
    Record<string, string | ((...params: any) => string)>
  >,
) => {
  // Merges provided translations object with common translations.
  translations = Object.entries(appTranslations).reduce(
    (prev, [lang, appLangTrans]) => ({
      ...prev,
      [lang]: {
        ...commonLangs[lang as Lang],
        ...appLangTrans,
      },
    }),
    {},
  ) as any;
};

const t: TranslationFunction & { lang?: string } = (key, ...params) => {
  const lang = document.documentElement.getAttribute('lang') as Lang; // nie robimy getState i selector bo to funckja ktora moze byc poza componentem reactom
  // @ts-ignore
  const trans = translations?.[lang]?.[key] ?? '#NO TRANSLATIONS#';

  return isFunction(trans) ? (trans as any)(params[0]) : trans;
};

export default t;
