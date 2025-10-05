import langs from './index';
import pl from './langs/pl';

export type TranslationsByLanguage = typeof langs;

export type Lang = keyof TranslationsByLanguage;

export type TranslationKeyWithCommons<AppTranslationKey> =
  | keyof typeof pl
  | AppTranslationKey;

export type CommonsTranslations = typeof pl;

export type TranslationsWithCommons<AppTranslations> = typeof pl &
  AppTranslations;

export type TranslationFunction = <Key extends TranslationKey>(
  key: Key,
  ...params: Translations[Key] extends string | JSX.Element
    ? [void?]
    : [Parameters<Exclude<Translations[Key], string | JSX.Element>>[0]]
) => string;
