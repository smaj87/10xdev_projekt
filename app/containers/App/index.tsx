import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { useHydrateAuth } from 'components/hooks/useHydrateAuth';
import LoadingScreen from 'components/Loading/LoadingScreen';
import { FC, memo } from 'components/utils/react';
import Forbidden403 from 'containers/Forbidden403';
import LoginPage from 'containers/LoginPage';
import ProtectedAdmin from 'containers/ProtectedAdmin';
import ProtectedHome from 'containers/ProtectedHome';

const App: FC = () => {
  const { loading } = useHydrateAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<LoginPage />} path="/login" />
        <Route element={<ProtectedHome />} path="/" />
        <Route element={<ProtectedAdmin />} path="/admin/*" />
        <Route element={<Forbidden403 />} path="/403" />
        <Route element={<Navigate replace to="/" />} path="*" />
      </Routes>
    </BrowserRouter>
  );
};

export default memo(App);
