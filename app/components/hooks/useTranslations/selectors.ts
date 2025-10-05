import { KEY } from 'components/hooks/useTranslations/constants';
import { LanguageRootState } from 'components/hooks/useTranslations/types';
import { createSelector } from 'components/utils/reselect';

import { initialState } from './reducer';

export const getState = createSelector(
  (state: LanguageRootState) => state,
  (state) => state?.[KEY] || initialState,
);

export const getLang = createSelector(getState, (state) => state.lang);
