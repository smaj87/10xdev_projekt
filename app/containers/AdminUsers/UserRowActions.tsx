import {
  changeUserRoleThunk,
  openEdit,
  toggleBlockUserThunk,
} from 'components/store/adminUsers/adminUsersSlice';
import { FC } from 'components/utils/react';
import { dispatch } from 'components/utils/store';

import type { AdminUserDTO } from '../../../types/admin-users.types';

interface Props {
  user: AdminUserDTO;
  currentAdminId?: number;
}

const UserRowActions: FC<Props> = ({ currentAdminId, user }) => {
  const isSelf = currentAdminId === user.id;

  const toggleBlock = () => {
    dispatch(toggleBlockUserThunk(user) as any);
  };
  const onRoleChange = (e: any) => {
    dispatch(changeUserRoleThunk(user, e.target.value) as any);
  };
  const onEdit = () => dispatch(openEdit(user) as any);

  const getBlockTitle = () => {
    if (isSelf) {
      return 'Nie możesz blokować własnego konta';
    }
    if (user.is_blocked) {
      return 'Odblokuj';
    }
    return 'Zablokuj';
  };

  const blockTitle = getBlockTitle();

  return (
    <div className="flex items-center gap-2">
      <button
        className={`px-2 py-1 rounded text-xs border ${user.is_blocked ? 'bg-red-100 border-red-300' : 'bg-green-100 border-green-300'} ${isSelf ? 'opacity-40 cursor-not-allowed' : ''}`}
        disabled={isSelf}
        onClick={toggleBlock}
        title={blockTitle}
        type="button"
      >
        {user.is_blocked ? 'Odblokuj' : 'Zablokuj'}
      </button>
      <select
        className="px-2 py-1 rounded text-xs border"
        disabled={isSelf}
        onChange={onRoleChange}
        title={isSelf ? 'Nie możesz zmieniać własnej roli' : 'Zmień rolę'}
        value={user.role}
      >
        <option value="user">user</option>
        <option value="admin">admin</option>
      </select>
      <button
        className="px-2 py-1 rounded text-xs border bg-blue-100 border-blue-300"
        onClick={onEdit}
        type="button"
      >
        Edytuj
      </button>
    </div>
  );
};

export default UserRowActions;
