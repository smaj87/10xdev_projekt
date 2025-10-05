/**
 * Combine all reducers in this file and export the combined reducers.
 */

import { combineReducers, ReducersMapObject } from 'components/utils/redux';

/**
 * Merges the main reducer with the router state and dynamically injected reducers
 */
export default function createReducer<T>(
  appReducers: ReducersMapObject<T, any>,
  injectedReducers?: ReducersMapObject<T, any>,
) {
  return combineReducers({
    ...appReducers,
    ...injectedReducers,
  });
}
