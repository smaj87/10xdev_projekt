import { createCachedSelector as createCachedSelectorReselect } from 're-reselect';
import { createSelector as createSelectorReselect } from 'reselect';

export const createSelector = createSelectorReselect;
export const createCachedSelector = createCachedSelectorReselect;
