import LoadingScreen from 'components/Loading/LoadingScreen';
import {
  openCreate,
  selectAdminUsersFeedback,
} from 'components/store/adminUsers/adminUsersSlice';
import { selectAuthUser } from 'components/store/auth/authSlice';
import { FC } from 'components/utils/react';
import { useSelector } from 'components/utils/react-redux';
import { dispatch } from 'components/utils/store';

import type { AdminUserDTO } from '../../../types/admin-users.types';
import AdminUserTable from './AdminUserTable';
import Pagination from './Pagination';
import UserFilters from './UserFilters';
import UserFormModal from './UserFormModal';

export interface AdminUsersViewProps {
  users: AdminUserDTO[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  roleFilter?: 'user' | 'admin';
  blockedFilter?: boolean;
  onRoleChange: (value: '' | 'user' | 'admin') => void;
  onBlockedChange: (value: '' | 'true' | 'false') => void;
  onPageChange: (page: number) => void;
}

const AdminUsersView: FC<AdminUsersViewProps> = ({
  blockedFilter,
  error,
  loading,
  onBlockedChange,
  onPageChange,
  onRoleChange,
  page,
  roleFilter,
  totalPages,
  users,
}) => {
  const feedback = useSelector(selectAdminUsersFeedback);
  const currentUser = useSelector(selectAuthUser);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div
      className="min-h-screen p-6 bg-gray-50 flex flex-col"
      data-view="AdminUsers"
    >
      <h1 className="text-2xl font-semibold mb-4 flex items-center justify-between">
        <span>Zarządzanie użytkownikami</span>
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm shadow hover:bg-blue-500"
          onClick={() => dispatch(openCreate() as any)}
          type="button"
        >
          Dodaj użytkownika
        </button>
      </h1>
      {error && (
        <div
          className="mb-4 p-3 rounded border border-red-300 bg-red-50 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}
      <UserFilters
        is_blocked={blockedFilter}
        onBlockedChange={onBlockedChange}
        onRoleChange={onRoleChange}
        role={roleFilter}
      />
      <AdminUserTable currentAdminId={currentUser?.id} users={users} />
      <Pagination onChange={onPageChange} page={page} totalPages={totalPages} />
      <UserFormModal />
      {feedback && (
        <div
          className="fixed bottom-4 right-4 bg-white border shadow px-4 py-2 rounded text-sm"
          role="status"
        >
          {feedback}
        </div>
      )}
    </div>
  );
};

export default AdminUsersView;
