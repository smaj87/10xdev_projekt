import {
  closeDeleteConfirm,
  deleteCategoryThunk,
  selectAdminCategoriesDeleteConfirmCategory,
  selectAdminCategoriesDeletingId,
} from 'components/store/adminCategories/adminCategoriesSlice';
import { FC } from 'components/utils/react';
import { useSelector } from 'components/utils/react-redux';
import { dispatch } from 'components/utils/store';

const DeleteCategoryConfirmModal: FC = () => {
  const category = useSelector(selectAdminCategoriesDeleteConfirmCategory);
  const deletingId = useSelector(selectAdminCategoriesDeletingId);

  if (!category) {
    return null;
  }

  const isDeleting = deletingId === category.id;

  const onCancel = () => dispatch(closeDeleteConfirm() as any);
  const onConfirm = () => dispatch(deleteCategoryThunk(category.id) as any);

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Potwierdź usunięcie</h2>
        <p className="text-sm text-gray-600">
          Czy na pewno chcesz usunąć kategorię <strong>{category.name}</strong>?
          Ta operacja jest nieodwracalna.
        </p>
        <div className="flex justify-end gap-2 mt-2">
          <button
            className="px-3 py-1 rounded border"
            disabled={isDeleting}
            onClick={onCancel}
            type="button"
          >
            Anuluj
          </button>
          <button
            className="px-3 py-1 rounded border bg-red-600 text-white disabled:opacity-60"
            disabled={isDeleting}
            onClick={onConfirm}
            type="button"
          >
            {isDeleting ? 'Usuwanie...' : 'Usuń kategorię'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCategoryConfirmModal;
