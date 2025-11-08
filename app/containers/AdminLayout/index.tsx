import { NavLink, Outlet } from 'react-router-dom';

import { FC } from 'components/utils/react';

const AdminSidebar: FC = () => (
  <aside
    aria-label="Admin Nawigacja"
    className="w-48 shrink-0 bg-white border-r border-gray-200 p-4 flex flex-col gap-2"
  >
    <NavLink
      className={({ isActive }) =>
        `text-sm px-2 py-1 rounded ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`
      }
      to="/admin/users"
    >
      Użytkownicy
    </NavLink>
  </aside>
);

const AdminLayout: FC = () => (
  <div className="min-h-screen flex bg-gray-50" data-layout="AdminLayout">
    <AdminSidebar />
    <main className="flex-1 p-6">
      <Outlet />
    </main>
  </div>
);

export default AdminLayout;
