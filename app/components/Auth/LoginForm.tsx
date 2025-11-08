import type { JSX } from 'preact';

import useLogin from 'components/hooks/useLogin';
import {
  FC,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'components/utils/react';

import type { LoginFormErrors, LoginFormValues } from '../../types/auth.types';

interface LoginFormProps {
  autoFocusEmail?: boolean;
  onSuccess?: () => void;
}

const initialValues: LoginFormValues = { email: '', password: '' };

const validate = (values: LoginFormValues): LoginFormErrors => {
  const errors: LoginFormErrors = {};
  if (!values.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Podaj poprawny email.';
  }
  if (!values.password) {
    errors.password = 'Hasło nie może być puste.';
  }
  return errors;
};

const LoginForm: FC<LoginFormProps> = ({
  autoFocusEmail = true,
  onSuccess,
}) => {
  const { clearError, error, login, retry, status } = useLogin();
  const [values, setValues] = useState<LoginFormValues>(initialValues);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const emailRef = useRef<HTMLInputElement | null>(null);

  const isSubmitting = status === 'submitting';

  useEffect(() => {
    if (autoFocusEmail && emailRef.current) {
      emailRef.current.focus();
    }
  }, [autoFocusEmail]);

  const onFieldChange: JSX.GenericEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      clearError();
      const { name, value } = e.currentTarget as HTMLInputElement;
      setValues((prev: LoginFormValues) => ({ ...prev, [name]: value }));
    },
    [clearError],
  );

  const handleSubmit: JSX.SubmitEventHandler<HTMLFormElement> = useCallback(
    (e) => {
      e.preventDefault();

      const vErrors = validate(values);
      setErrors(vErrors);
      if (Object.keys(vErrors).length) {
        return;
      }

      (async () => {
        const user = await login(values);
        if (user) {
          onSuccess?.();
        }
      })();
    },
    [values, login, onSuccess],
  );

  return (
    <form
      aria-describedby={errors._form ? 'form-error' : undefined}
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="space-y-4">
        <div>
          <label
            className="block text-sm font-medium text-gray-700"
            htmlFor="email"
          >
            Email
          </label>
          <input
            ref={emailRef}
            aria-describedby={errors.email ? 'email-error' : undefined}
            aria-invalid={!!errors.email}
            autoComplete="username"
            className="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
            id="email"
            name="email"
            onChange={onFieldChange}
            type="email"
            value={values.email}
          />
          {errors.email && (
            <p
              className="mt-1 text-xs text-red-600"
              id="email-error"
              role="alert"
            >
              {errors.email}
            </p>
          )}
        </div>
        <div>
          <label
            className="block text-sm font-medium text-gray-700"
            htmlFor="password"
          >
            Hasło
          </label>
          <input
            aria-describedby={errors.password ? 'password-error' : undefined}
            aria-invalid={!!errors.password}
            autoComplete="current-password"
            className="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
            id="password"
            name="password"
            onChange={onFieldChange}
            type="password"
            value={values.password}
          />
          {errors.password && (
            <p
              className="mt-1 text-xs text-red-600"
              id="password-error"
              role="alert"
            >
              {errors.password}
            </p>
          )}
        </div>
        <button
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Logowanie...' : 'Zaloguj'}
        </button>
        {error && (
          <p className="text-xs text-red-600" id="form-error" role="alert">
            {error.message}
            {error.retryable && (
              <button
                className="ml-2 underline text-blue-600"
                onClick={() => retry()}
                type="button"
              >
                Ponów
              </button>
            )}
          </p>
        )}
      </div>
    </form>
  );
};

export default LoginForm;
