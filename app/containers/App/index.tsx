import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { useHydrateAuth } from 'components/hooks/useHydrateAuth';
import LoadingScreen from 'components/Loading/LoadingScreen';
import Navbar from 'components/Navbar';
import { FC, memo } from 'components/utils/react';
import Forbidden403 from 'containers/Forbidden403';
import LoginPage from 'containers/LoginPage';
import ProtectedAdmin from 'containers/ProtectedAdmin';
import ProtectedHome from 'containers/ProtectedHome';

const routerFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

const App: FC = () => {
  const { loading } = useHydrateAuth();

  return (
    <BrowserRouter future={routerFutureFlags}>
      <Navbar loading={loading} />
      <div className="pt-14">
        {loading ? (
          <LoadingScreen />
        ) : (
          <Routes>
            <Route element={<LoginPage />} path="/login" />
            <Route element={<ProtectedHome />} path="/" />
            <Route element={<ProtectedAdmin />} path="/admin/*" />
            <Route element={<Forbidden403 />} path="/403" />
            <Route element={<Navigate replace to="/" />} path="*" />
          </Routes>
        )}
      </div>
    </BrowserRouter>
  );
};

export default memo(App);
