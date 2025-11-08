import { Navigate } from 'react-router-dom';

import {
  selectAuthUser,
  selectIsAuthenticated,
} from 'components/store/auth/authSlice';
import { FC } from 'components/utils/react';
import { useSelector } from 'components/utils/react-redux';

const ProtectedHome: FC = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectAuthUser);

  if (!isAuthenticated) {
    return <Navigate replace to="/login" />;
  }

  if (user?.role === 'admin') {
    return <Navigate replace to="/admin/users" />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">10xdev</h1>
        <p className="text-gray-600">Tailwind CSS is configured and working!</p>
      </div>
    </div>
  );
};

export default ProtectedHome;
