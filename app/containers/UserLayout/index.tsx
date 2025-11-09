import Sidebar, { type SidebarItem } from 'components/commons/Sidebar';

import { FC, ReactNode } from 'components/utils/react';

interface UserLayoutProps {
  children?: ReactNode;
  showSidebar?: boolean;
}

const userItems: SidebarItem[] = [{ to: '/', label: 'Listy' }];

const UserLayout: FC<UserLayoutProps> = ({ children, showSidebar = true }) => (
  <div className="min-h-screen flex bg-gray-50" data-layout="UserLayout">
    {showSidebar && <Sidebar ariaLabel="User Nawigacja" items={userItems} />}
    <main className="flex-1 p-6">{children}</main>
  </div>
);

export default UserLayout;
