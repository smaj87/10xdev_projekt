import { useNavigate } from 'react-router-dom';

import { logout, selectAuthUser } from 'components/store/auth/authSlice';
import { FC, useCallback } from 'components/utils/react';
import { useSelector } from 'components/utils/react-redux';
import request from 'components/utils/request';
import { dispatch } from 'components/utils/store';

interface NavbarProps {
  loading: boolean;
}

const Navbar: FC<NavbarProps> = ({ loading }) => {
  const user = useSelector(selectAuthUser);
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    try {
      await request('/api/auth/logout', { method: 'GET' });
    } catch (_err) {
      // Ignorujemy błąd – i tak czyścimy lokalny stan
    } finally {
      dispatch(logout());
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const isAuthenticated = !!user && !loading;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex h-14 select-none items-center bg-gray-800 px-4 text-white shadow">
      {isAuthenticated ? (
        <div className="flex w-full items-center justify-between">
          <span className="truncate text-sm font-medium sm:text-base">
            Cześć{' '}
            <span className="text-emerald-400 font-semibold">{user.email}</span>{' '}
            ({user.role})
          </span>
          <button
            aria-label="Wyloguj"
            className="flex items-center gap-2 rounded bg-gray-700 px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-600 active:bg-gray-500 sm:text-base"
            onClick={handleLogout}
            type="button"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
            <span>Wyloguj</span>
          </button>
        </div>
      ) : null}
    </nav>
  );
};

export default Navbar;
