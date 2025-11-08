import { loginSuccess, selectAuthUser } from 'components/store/auth/authSlice';
import { useEffect, useState } from 'components/utils/react';
import { useSelector } from 'components/utils/react-redux';
import request from 'components/utils/request';
import { dispatch } from 'components/utils/store';

import type { LoginResponseDTO } from '../../../types/ai-types';

/**
 * Hook wykonujący hydratację stanu auth przy starcie aplikacji.
 * Jeśli istnieje ważna sesja (ciastko sessionId) backend zwróci użytkownika.
 * Zwraca flagę loading do wyświetlenia ekranu ładowania zamiast widoków aplikacji.
 */
export const useHydrateAuth = (): { loading: boolean } => {
  useSelector(selectAuthUser); // subskrypcja dla ewentualnej re-renderacji
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = (await request('/api/auth/session', {
          method: 'GET',
        })) as LoginResponseDTO | { statusCode?: number } | null;

        if (!cancelled && data && (data as LoginResponseDTO).user) {
          dispatch(loginSuccess((data as LoginResponseDTO).user));
        }
      } catch (_err) {
        // Brak sesji lub błąd – ignorujemy
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { loading };
};
