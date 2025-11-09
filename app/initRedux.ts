import { KEY as T_KEY } from 'components/hooks/useTranslations/constants';
import tReducer from 'components/hooks/useTranslations/reducer';
import adminCategoriesReducer from 'components/store/adminCategories/adminCategoriesSlice';
import adminUsersReducer from 'components/store/adminUsers/adminUsersSlice';
import authReducer from 'components/store/auth/authSlice';
import { ThunkDispatch } from 'components/utils/react-redux';
import { UnknownAction } from 'components/utils/redux';

export const reducers = {
  [T_KEY]: tReducer,
  auth: authReducer,
  adminUsers: adminUsersReducer,
  adminCategories: adminCategoriesReducer,
} as const;

export const middlewares = [];

/**
 * Reducers always have state as first argument, we can use that to make RootState without repetition.
 */
export type RootState = {
  [key in keyof typeof reducers]: NonNullable<
    Parameters<(typeof reducers)[key]>[0]
  >;
};

export type TypedDispatch = ThunkDispatch<RootState, unknown, UnknownAction>;
