import {
  loadCategoriesThunk,
  selectAdminCategoriesError,
  selectAdminCategoriesLoading,
} from 'components/store/adminCategories/adminCategoriesSlice';
import { FC, useEffect } from 'components/utils/react';
import { useSelector } from 'components/utils/react-redux';
import { dispatch } from 'components/utils/store';
import AdminCategoriesView from 'containers/AdminCategories';

const AdminCategoriesPage: FC = () => {
  const loading = useSelector(selectAdminCategoriesLoading);
  const error = useSelector(selectAdminCategoriesError);

  useEffect(() => {
    dispatch(loadCategoriesThunk() as any);
  }, []);

  return (
    <>
      {error && (
        <div
          className="mb-4 p-3 rounded border border-red-300 bg-red-50 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}
      <AdminCategoriesView />
      {loading && null}
    </>
  );
};

export default AdminCategoriesPage;
