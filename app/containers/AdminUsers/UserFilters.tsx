import { FC } from 'components/utils/react';

interface UserFiltersProps {
  role?: 'user' | 'admin';
  is_blocked?: boolean;
  onRoleChange: (value: '' | 'user' | 'admin') => void;
  onBlockedChange: (value: '' | 'true' | 'false') => void;
}

const UserFilters: FC<UserFiltersProps> = ({
  is_blocked,
  onBlockedChange,
  onRoleChange,
  role,
}) => {
  const handleRole = (e: any) =>
    onRoleChange(e.currentTarget.value as '' | 'user' | 'admin');
  const handleBlocked = (e: any) =>
    onBlockedChange(e.currentTarget.value as '' | 'true' | 'false');
  return (
    <div
      aria-label="Filtry użytkowników"
      className="bg-white rounded shadow p-4 mb-4 flex flex-wrap gap-4 items-end"
      role="form"
    >
      <div className="flex flex-col">
        <label className="text-sm font-medium mb-1" htmlFor="roleFilter">
          Rola
        </label>
        <select
          className="border rounded px-2 py-1 text-sm"
          id="roleFilter"
          onChange={handleRole}
          value={role || ''}
        >
          <option value="">(wszystkie)</option>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-medium mb-1" htmlFor="blockedFilter">
          Status blokady
        </label>
        <select
          className="border rounded px-2 py-1 text-sm"
          id="blockedFilter"
          onChange={handleBlocked}
          value={is_blocked === undefined ? '' : String(is_blocked)}
        >
          <option value="">(wszystkie)</option>
          <option value="true">zablokowany</option>
          <option value="false">aktywny</option>
        </select>
      </div>
    </div>
  );
};

export default UserFilters;
