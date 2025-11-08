import {
  loadAdminUsersThunk,
  selectAdminUsers,
  selectAdminUsersError,
  selectAdminUsersFilters,
  selectAdminUsersLoading,
  selectAdminUsersTotalPages,
  setFilters,
  setPage,
} from 'components/store/adminUsers/adminUsersSlice';
import { FC, useEffect } from 'components/utils/react';
import { useSelector } from 'components/utils/react-redux';
import { dispatch } from 'components/utils/store';
import AdminUsersView from 'containers/AdminUsers';

const AdminUsersPage: FC = () => {
  const users = useSelector(selectAdminUsers);
  const loading = useSelector(selectAdminUsersLoading);
  const error = useSelector(selectAdminUsersError);
  const filters = useSelector(selectAdminUsersFilters);
  const totalPages = useSelector(selectAdminUsersTotalPages);

  // Fetch on mount & when filters change
  useEffect(() => {
    dispatch(loadAdminUsersThunk() as any);
  }, [filters.role, filters.is_blocked, filters.page, filters.limit]);

  const handleRoleChange = (value: '' | 'user' | 'admin') => {
    dispatch(setFilters({ role: value === '' ? undefined : value }) as any);
  };

  const handleBlockedChange = (value: '' | 'true' | 'false') => {
    dispatch(
      setFilters({
        is_blocked: value === '' ? undefined : value === 'true',
      }) as any,
    );
  };

  const handlePageChange = (page: number) => {
    dispatch(setPage(page) as any);
  };

  return (
    <AdminUsersView
      blockedFilter={filters.is_blocked}
      error={error}
      loading={loading}
      onBlockedChange={handleBlockedChange}
      onPageChange={handlePageChange}
      onRoleChange={handleRoleChange}
      page={filters.page}
      roleFilter={filters.role}
      totalPages={totalPages}
      users={users}
    />
  );
};

export default AdminUsersPage;
