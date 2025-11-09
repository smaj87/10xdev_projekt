import { Outlet } from 'react-router-dom';

import Sidebar, { SidebarItem } from 'components/commons/Sidebar';

import { FC } from 'components/utils/react';

const adminItems: SidebarItem[] = [
  { to: '/admin/users', label: 'Użytkownicy' },
  { to: '/admin/categories', label: 'Kategorie' },
];

const AdminLayout: FC = () => (
  <div className="min-h-screen flex bg-gray-50" data-layout="AdminLayout">
    <Sidebar ariaLabel="Admin Nawigacja" items={adminItems} />
    <main className="flex-1 p-6">
      <Outlet />
    </main>
  </div>
);

export default AdminLayout;
