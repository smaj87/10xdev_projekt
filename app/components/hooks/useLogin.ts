import { loginSuccess, selectAuthUser } from 'components/store/auth/authSlice';
import { useCallback, useState } from 'components/utils/react';
import { useSelector } from 'components/utils/react-redux';
import request, { FETCH_FAILURE_CAUSE_CODE } from 'components/utils/request';
import { dispatch } from 'components/utils/store';

import type {
  LoginCommand,
  LoginResponseDTO,
  UserAuthDTO,
} from '../../../types/ai-types';
import type {
  AuthErrorState,
  LoginFormValues,
  LoginStatus,
  UseLoginResult,
} from '../../types/auth.types';

const mapError = (status?: number, cause?: string): AuthErrorState => {
  if (cause === FETCH_FAILURE_CAUSE_CODE) {
    return {
      kind: 'NETWORK',
      message: 'Brak połączenia. Spróbuj ponownie.',
      retryable: true,
    };
  }
  switch (status) {
    case 401:
    case 461: // dodatkowy kod dla: nieprawidłowy email lub hasło
      return {
        kind: 'INVALID_CREDENTIALS',
        message: 'Nieprawidłowy email lub hasło.',
        statusCode: status,
        retryable: false,
      };
    case 403:
      return {
        kind: 'ACCOUNT_BLOCKED',
        message: 'Konto jest zablokowane. Skontaktuj się z administratorem.',
        statusCode: status,
        retryable: false,
      };
    case 500:
      return {
        kind: 'SERVER',
        message: 'Wystąpił błąd serwera. Spróbuj ponownie.',
        statusCode: status,
        retryable: true,
      };
    default:
      return {
        kind: 'UNKNOWN',
        message: 'Wystąpił nieznany błąd.',
        statusCode: status,
        retryable: true,
      };
  }
};

export const useLogin = (): UseLoginResult & {
  retry: () => Promise<UserAuthDTO | null>;
} => {
  useSelector(selectAuthUser); // sprawdzenie czy użytkownik istnieje (na przyszłość hydratacja)

  const [status, setStatus] = useState<LoginStatus>('idle');
  const [error, setError] = useState<AuthErrorState | null>(null);
  const [lastValues, setLastValues] = useState<LoginFormValues | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const perform = useCallback(
    async (values: LoginFormValues): Promise<UserAuthDTO | null> => {
      if (status === 'submitting') {
        return null;
      }

      setStatus('validating');

      const trimmed: LoginFormValues = {
        email: values.email.trim(),
        password: values.password,
      };

      if (!trimmed.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed.email)) {
        setError({
          kind: 'INVALID_CREDENTIALS',
          message: 'Podaj poprawny email.',
          retryable: false,
        });
        setStatus('error');
        return null;
      }

      // Usunięto walidację długości hasła; wymagamy tylko aby nie było puste.
      if (!trimmed.password) {
        setError({
          kind: 'INVALID_CREDENTIALS',
          message: 'Hasło nie może być puste.',
          retryable: false,
        });
        setStatus('error');
        return null;
      }

      setStatus('submitting');
      setLastValues(trimmed);
      clearError();

      try {
        const body: LoginCommand = {
          email: trimmed.email,
          password: trimmed.password,
        };

        const data = (await request('/api/auth/login', {
          method: 'POST',
          body,
        })) as LoginResponseDTO;

        dispatch(loginSuccess(data.user));
        setStatus('success');

        return data.user;
      } catch (err: any) {
        const mapped = mapError(err.status, err.cause);

        setError(mapped);
        setStatus('error');

        return null;
      }
    },
    [status, clearError],
  );

  const retry = useCallback(async () => {
    if (error?.retryable && lastValues) {
      return perform(lastValues);
    }

    return null;
  }, [error, lastValues, perform]);

  return {
    login: perform,
    status,
    error,
    clearError,
    retry,
  };
};

export default useLogin;
