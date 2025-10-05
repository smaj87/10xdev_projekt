import {
  Action as reduxAction,
  applyMiddleware as reduxApplyMiddleware,
  combineReducers as reduxCombineReducers,
  compose as reduxCompose,
  legacy_createStore as reduxCreateStore,
  Middleware as reduxMiddleware,
  Reducer as reduxReducer,
  ReducersMapObject as reduxReducersMapObject,
  UnknownAction as reduxUnknownAction,
} from 'redux';

export const createStore = reduxCreateStore;
export const applyMiddleware = reduxApplyMiddleware;
export const compose = reduxCompose;
export const combineReducers = reduxCombineReducers;

export type Middleware = reduxMiddleware;
export type AppMiddleware = Middleware;
export type UnknownAction = reduxUnknownAction;
export type Action = reduxAction;
export type Reducer<S = any, A extends Action = UnknownAction> = reduxReducer<
  S,
  A
>;
export type ReducersMapObject<
  S = any,
  A extends Action = Action,
> = reduxReducersMapObject<S, A>;
