import type { UserAuthDTO } from '../../types/ai-types';

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface LoginFormErrors {
  email?: string;
  password?: string;
  _form?: string;
}

export type LoginStatus =
  | 'idle'
  | 'validating'
  | 'submitting'
  | 'success'
  | 'error';

export type AuthErrorKind =
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_BLOCKED'
  | 'NETWORK'
  | 'SERVER'
  | 'UNKNOWN';

export interface AuthErrorState {
  kind: AuthErrorKind;
  message: string;
  statusCode?: number;
  retryable: boolean;
}

export interface UseLoginResult {
  login: (values: LoginFormValues) => Promise<UserAuthDTO | null>;
  status: LoginStatus;
  error: AuthErrorState | null;
  clearError: () => void;
}
