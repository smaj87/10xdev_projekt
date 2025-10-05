/* eslint-disable import/no-import-module-exports */
/**
 * Create the store with dynamic reducers
 */

import { RootState } from 'initRedux';

import {
  applyMiddleware,
  compose,
  createStore,
  Middleware,
  ReducersMapObject,
} from 'components/utils/redux';
import { thunk } from 'components/utils/redux-thunk';

import createReducer from './createReducer';

export default function configureStore<T>(
  initialState: RootState,
  appReducers: ReducersMapObject<T, any>,
  customMiddlewares: Middleware[] = [],
) {
  let composeEnhancers = compose;

  // If Redux Dev Tools Extensions is installed, enable them
  /* istanbul ignore next */
  if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
    /* eslint-disable no-underscore-dangle */
    if (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) {
      composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({});
    }
  }

  // Create the store with two middlewares
  // 1. thunk: Makes redux-thunk work
  // 2. routerMiddleware: Syncs the location/URL path to the state
  const middlewares = [thunk, ...customMiddlewares];

  const enhancers = [applyMiddleware(...middlewares)];

  const store = createStore(
    createReducer(appReducers) as any,
    initialState,
    composeEnhancers(...enhancers) as any,
  );

  // Extensions
  // @ts-ignore todo
  store.injectedReducers = {}; // Reducer registry
  // @ts-ignore todo
  store.injectReducer = (key, reducer) => {
    // @ts-ignore todo
    if (!store.injectedReducers[key]) {
      // @ts-ignore todo
      store.injectedReducers[key] = reducer;
      // @ts-ignore todo
      store.replaceReducer(createReducer(appReducers, store.injectedReducers));
    }
  };

  // Make reducers hot reloadable, see http://mxs.is/googmo
  /* istanbul ignore next */
  // @ts-ignore
  if (module.hot) {
    // @ts-ignore
    module.hot.accept('initRedux', () => {
      // @ts-ignore todo
      store.replaceReducer(createReducer(appReducers, store.injectedReducers));
    });
  }

  return store;
}
