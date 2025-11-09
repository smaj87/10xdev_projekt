import LoadingScreen from 'components/Loading/LoadingScreen';
import {
  openCategoryCreate,
  selectAdminCategoriesEditing,
  selectAdminCategoriesFeedback,
  selectAdminCategoriesFormMode,
  selectAdminCategoriesItems,
  selectAdminCategoriesLoading,
} from 'components/store/adminCategories/adminCategoriesSlice';
import { FC } from 'components/utils/react';
import { useSelector } from 'components/utils/react-redux';
import { dispatch } from 'components/utils/store';

import CategoriesTable from './CategoriesTable';
import CategoryFormModal from './CategoryFormModal';
import DeleteCategoryConfirmModal from './DeleteCategoryConfirmModal';

const AdminCategoriesView: FC = () => {
  const items = useSelector(selectAdminCategoriesItems);
  const loading = useSelector(selectAdminCategoriesLoading);
  const feedback = useSelector(selectAdminCategoriesFeedback);
  const mode = useSelector(selectAdminCategoriesFormMode);
  const editing = useSelector(selectAdminCategoriesEditing);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div
      className="min-h-screen p-6 bg-gray-50 flex flex-col"
      data-view="AdminCategories"
    >
      <h1 className="text-2xl font-semibold mb-4 flex items-center justify-between">
        <span>Zarządzanie kategoriami</span>
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm shadow hover:bg-blue-500"
          onClick={() => dispatch(openCategoryCreate() as any)}
          type="button"
        >
          Dodaj kategorię
        </button>
      </h1>
      <CategoriesTable categories={items} />
      <CategoryFormModal editing={editing || undefined} mode={mode} />
      <DeleteCategoryConfirmModal />
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

export default AdminCategoriesView;
