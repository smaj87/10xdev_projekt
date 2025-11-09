import { Navigate } from 'react-router-dom';

import {
  selectAuthUser,
  selectIsAuthenticated,
} from 'components/store/auth/authSlice';
import { FC } from 'components/utils/react';
import { useSelector } from 'components/utils/react-redux';
import UserLayout from 'containers/UserLayout';

const ProtectedHome: FC = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectAuthUser);

  if (!isAuthenticated) {
    return <Navigate replace to="/login" />;
  }

  if (user?.role === 'admin') {
    return <Navigate replace to="/admin/users" />;
  }

  return <UserLayout></UserLayout>;
};

export default ProtectedHome;
