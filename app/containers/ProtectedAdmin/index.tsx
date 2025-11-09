import { Navigate, Route, Routes } from 'react-router-dom';

import {
  selectAuthUser,
  selectIsAuthenticated,
} from 'components/store/auth/authSlice';
import { FC } from 'components/utils/react';
import { useSelector } from 'components/utils/react-redux';
import AdminCategoriesPage from 'containers/AdminCategories/Page';
import AdminLayout from 'containers/AdminLayout';
import AdminUsersPage from 'containers/AdminUsers/Page';

const ProtectedAdmin: FC = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectAuthUser);

  if (!isAuthenticated) {
    return <Navigate replace to="/login" />;
  }
  if (user?.role !== 'admin') {
    return <Navigate replace to="/403" />;
  }

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route element={<AdminUsersPage />} path="users" />
        <Route element={<AdminCategoriesPage />} path="categories" />
        <Route element={<Navigate replace to="users" />} path="*" />
      </Route>
    </Routes>
  );
};

export default ProtectedAdmin;
