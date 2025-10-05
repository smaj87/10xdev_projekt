import langs from 'components/translations';
import { Lang } from 'components/translations/types';

import { DEFAULT_LANGUAGE } from './constants';

export const getLang = (lang: Lang) => (langs[lang] ? lang : DEFAULT_LANGUAGE);
