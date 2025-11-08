import { Navigate } from 'react-router-dom';

import AuthErrorToast from 'components/Auth/AuthErrorToast';
import LoginForm from 'components/Auth/LoginForm';
import useLogin from 'components/hooks/useLogin';
import {
  selectAuthUser,
  selectIsAuthenticated,
} from 'components/store/auth/authSlice';
import { FC } from 'components/utils/react';
import { useSelector } from 'components/utils/react-redux';

const LoginPage: FC = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authUser = useSelector(selectAuthUser);
  const { clearError, error, retry } = useLogin();

  if (isAuthenticated) {
    return (
      <Navigate
        replace
        to={authUser?.role === 'admin' ? '/admin/users' : '/'}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-2xl font-semibold mb-6 text-center">Logowanie</h1>
        <LoginForm />
      </div>
      <AuthErrorToast error={error} onDismiss={clearError} onRetry={retry} />
    </div>
  );
};

export default LoginPage;
