import { UserAuthDTO } from '../../../../types/ai-types';
import { RootState } from '../../../initRedux';

export const AUTH_LOGIN_SUCCESS = 'auth/loginSuccess' as const;
export const AUTH_LOGOUT = 'auth/logout' as const;

export interface AuthState {
  user: UserAuthDTO | null;
  isAuthenticated: boolean;
  lastLoginAt?: string;
}

export type AuthAction =
  | { type: typeof AUTH_LOGIN_SUCCESS; payload: UserAuthDTO }
  | { type: typeof AUTH_LOGOUT };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  lastLoginAt: undefined,
};

export default function authReducer(
  state: AuthState = initialState,
  action: AuthAction,
): AuthState {
  switch (action.type) {
    case AUTH_LOGIN_SUCCESS:
      return {
        user: action.payload,
        isAuthenticated: true,
        lastLoginAt: new Date().toISOString(),
      };
    case AUTH_LOGOUT:
      return { ...initialState };
    default:
      return state;
  }
}

export const loginSuccess = (user: UserAuthDTO): AuthAction => ({
  type: AUTH_LOGIN_SUCCESS,
  payload: user,
});
export const logout = (): AuthAction => ({ type: AUTH_LOGOUT });

// Selectors
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const selectAuthUser = (state: RootState) => state.auth.user;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;
