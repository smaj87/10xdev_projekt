import { NavLink } from 'react-router-dom';

import { FC } from 'components/utils/react';

export interface SidebarItem {
  to: string;
  label: string;
  // przyszłościowo można dodać ikonę, uprawnienia itd.
}

export interface SidebarProps {
  ariaLabel?: string;
  className?: string;
  items: SidebarItem[];
}

const Sidebar: FC<SidebarProps> = ({
  ariaLabel = 'Nawigacja boczna',
  className = '',
  items,
}) => (
  <aside
    aria-label={ariaLabel}
    className={`w-48 shrink-0 bg-white border-r border-gray-200 p-4 flex flex-col gap-2 ${className}`.trim()}
    data-component="Sidebar"
  >
    {items.map((item) => (
      <NavLink
        key={item.to}
        className={({ isActive }) =>
          `text-sm px-2 py-1 rounded ${
            isActive
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`
        }
        to={item.to}
      >
        {item.label}
      </NavLink>
    ))}
  </aside>
);

export default Sidebar;
