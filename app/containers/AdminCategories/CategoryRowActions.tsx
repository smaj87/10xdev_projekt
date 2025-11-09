import {
  openCategoryEdit,
  openDeleteConfirm,
  selectAdminCategoriesDeletingId,
} from 'components/store/adminCategories/adminCategoriesSlice';
import { FC } from 'components/utils/react';
import { useSelector } from 'components/utils/react-redux';
import { dispatch } from 'components/utils/store';

import type { CategoryDTO } from '../../../types/ai-types';

interface Props {
  category: CategoryDTO;
}

const CategoryRowActions: FC<Props> = ({ category }) => {
  const deletingId = useSelector(selectAdminCategoriesDeletingId);
  const isDeleting = deletingId === category.id;

  const onEdit = () => dispatch(openCategoryEdit(category) as any);

  const onDelete = () => dispatch(openDeleteConfirm(category) as any);

  return (
    <div className="flex items-center gap-2">
      <button
        className="px-2 py-1 rounded text-xs border bg-blue-100 border-blue-300"
        onClick={onEdit}
        type="button"
      >
        Edytuj
      </button>
      <button
        className="px-2 py-1 rounded text-xs border bg-red-100 border-red-300 disabled:opacity-50"
        disabled={isDeleting}
        onClick={onDelete}
        type="button"
      >
        {isDeleting ? 'Usuwanie...' : 'Usuń'}
      </button>
    </div>
  );
};

export default CategoryRowActions;
