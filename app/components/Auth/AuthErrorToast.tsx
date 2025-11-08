import { FC } from 'components/utils/react';

import type { AuthErrorState } from '../../types/auth.types';

interface AuthErrorToastProps {
  error: AuthErrorState | null;
  onDismiss: () => void;
  onRetry: () => void;
}

const AuthErrorToast: FC<AuthErrorToastProps> = ({
  error,
  onDismiss,
  onRetry,
}) => {
  if (!error) {
    return null;
  }

  return (
    <div
      aria-live="assertive"
      className="fixed bottom-4 right-4 w-80 bg-white border border-red-300 shadow-lg rounded-md p-4 z-50"
      role="alert"
    >
      <div className="flex justify-between items-start">
        <div className="text-sm text-red-700">
          <p className="font-semibold mb-1">Błąd logowania</p>
          <p>{error.message}</p>
        </div>
        <button
          aria-label="Zamknij"
          className="text-gray-500 hover:text-gray-700 ml-2"
          onClick={onDismiss}
          type="button"
        >
          ×
        </button>
      </div>
      {error.retryable && (
        <button
          className="mt-3 w-full bg-blue-600 text-white text-sm py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          onClick={onRetry}
          type="button"
        >
          Spróbuj ponownie
        </button>
      )}
    </div>
  );
};

export default AuthErrorToast;
