import request from 'components/utils/request';

import type { CategoryDTO } from '../../../../types/ai-types';
import { RootState } from '../../../initRedux';

// Action types
export const ADMIN_CATEGORIES_FETCH_START =
  'adminCategories/fetchStart' as const;
export const ADMIN_CATEGORIES_FETCH_SUCCESS =
  'adminCategories/fetchSuccess' as const;
export const ADMIN_CATEGORIES_FETCH_ERROR =
  'adminCategories/fetchError' as const;
export const ADMIN_CATEGORIES_OPEN_CREATE =
  'adminCategories/openCreate' as const;
export const ADMIN_CATEGORIES_OPEN_EDIT = 'adminCategories/openEdit' as const;
export const ADMIN_CATEGORIES_CLOSE_MODAL =
  'adminCategories/closeModal' as const;
export const ADMIN_CATEGORIES_SUBMIT_START =
  'adminCategories/submitStart' as const;
export const ADMIN_CATEGORIES_SUBMIT_SUCCESS =
  'adminCategories/submitSuccess' as const;
export const ADMIN_CATEGORIES_SUBMIT_ERROR =
  'adminCategories/submitError' as const;
export const ADMIN_CATEGORIES_DELETE_START =
  'adminCategories/deleteStart' as const;
export const ADMIN_CATEGORIES_DELETE_SUCCESS =
  'adminCategories/deleteSuccess' as const;
export const ADMIN_CATEGORIES_DELETE_ERROR =
  'adminCategories/deleteError' as const;
export const ADMIN_CATEGORIES_OPEN_DELETE_CONFIRM =
  'adminCategories/openDeleteConfirm' as const;
export const ADMIN_CATEGORIES_CLOSE_DELETE_CONFIRM =
  'adminCategories/closeDeleteConfirm' as const;

export interface AdminCategoriesState {
  items: CategoryDTO[];
  loading: boolean;
  error: string | null;
  formOpen?: boolean;
  formMode?: 'create' | 'edit';
  editingCategory?: CategoryDTO | null;
  submitting?: boolean;
  deletingId?: number | null;
  deleteConfirmCategory?: CategoryDTO | null;
  feedback?: string | null;
}

const initialState: AdminCategoriesState = {
  items: [],
  loading: false,
  error: null,
  formOpen: false,
  formMode: undefined,
  editingCategory: null,
  submitting: false,
  deletingId: null,
  deleteConfirmCategory: null,
  feedback: null,
};

export type AdminCategoriesAction =
  | { type: typeof ADMIN_CATEGORIES_FETCH_START }
  | { type: typeof ADMIN_CATEGORIES_FETCH_SUCCESS; payload: CategoryDTO[] }
  | { type: typeof ADMIN_CATEGORIES_FETCH_ERROR; payload: string }
  | { type: typeof ADMIN_CATEGORIES_OPEN_CREATE }
  | { type: typeof ADMIN_CATEGORIES_OPEN_EDIT; payload: CategoryDTO }
  | { type: typeof ADMIN_CATEGORIES_CLOSE_MODAL }
  | { type: typeof ADMIN_CATEGORIES_SUBMIT_START }
  | { type: typeof ADMIN_CATEGORIES_SUBMIT_SUCCESS; payload: CategoryDTO }
  | { type: typeof ADMIN_CATEGORIES_SUBMIT_ERROR; payload: string }
  | { type: typeof ADMIN_CATEGORIES_DELETE_START; payload: number }
  | { type: typeof ADMIN_CATEGORIES_DELETE_SUCCESS; payload: number }
  | { type: typeof ADMIN_CATEGORIES_DELETE_ERROR; payload: string }
  | { type: typeof ADMIN_CATEGORIES_OPEN_DELETE_CONFIRM; payload: CategoryDTO }
  | { type: typeof ADMIN_CATEGORIES_CLOSE_DELETE_CONFIRM };

export default function adminCategoriesReducer(
  state: AdminCategoriesState = initialState,
  action: AdminCategoriesAction,
): AdminCategoriesState {
  switch (action.type) {
    case ADMIN_CATEGORIES_FETCH_START:
      return { ...state, loading: true, error: null };
    case ADMIN_CATEGORIES_FETCH_SUCCESS:
      return { ...state, loading: false, items: action.payload };
    case ADMIN_CATEGORIES_FETCH_ERROR:
      return { ...state, loading: false, error: action.payload };
    case ADMIN_CATEGORIES_OPEN_CREATE:
      return {
        ...state,
        formOpen: true,
        formMode: 'create',
        editingCategory: null,
        feedback: null,
      };
    case ADMIN_CATEGORIES_OPEN_EDIT:
      return {
        ...state,
        formOpen: true,
        formMode: 'edit',
        editingCategory: action.payload,
        feedback: null,
      };
    case ADMIN_CATEGORIES_CLOSE_MODAL:
      return {
        ...state,
        formOpen: false,
        formMode: undefined,
        editingCategory: null,
        submitting: false,
      };
    case ADMIN_CATEGORIES_SUBMIT_START:
      return { ...state, submitting: true, feedback: null };
    case ADMIN_CATEGORIES_SUBMIT_SUCCESS: {
      const updated = action.payload;
      const exists = state.items.some((c) => c.id === updated.id);
      const items = exists
        ? state.items.map((c) => (c.id === updated.id ? updated : c))
        : [updated, ...state.items];
      return {
        ...state,
        submitting: false,
        items,
        formOpen: false,
        formMode: undefined,
        editingCategory: null,
        feedback: exists ? 'Zapisano kategorię' : 'Dodano kategorię',
      };
    }
    case ADMIN_CATEGORIES_SUBMIT_ERROR:
      return { ...state, submitting: false, feedback: action.payload };
    case ADMIN_CATEGORIES_DELETE_START:
      return { ...state, deletingId: action.payload, feedback: null };
    case ADMIN_CATEGORIES_DELETE_SUCCESS:
      return {
        ...state,
        deletingId: null,
        items: state.items.filter((c) => c.id !== action.payload),
        deleteConfirmCategory: null,
        feedback: 'Usunięto kategorię',
      };
    case ADMIN_CATEGORIES_DELETE_ERROR:
      return {
        ...state,
        deletingId: null,
        deleteConfirmCategory: null,
        feedback: action.payload,
      };
    case ADMIN_CATEGORIES_OPEN_DELETE_CONFIRM:
      return {
        ...state,
        deleteConfirmCategory: action.payload,
      };
    case ADMIN_CATEGORIES_CLOSE_DELETE_CONFIRM:
      return {
        ...state,
        deleteConfirmCategory: null,
      };
    default:
      return state;
  }
}

// Action creators
export const fetchCategoriesStart = (): AdminCategoriesAction => ({
  type: ADMIN_CATEGORIES_FETCH_START,
});
export const fetchCategoriesSuccess = (
  items: CategoryDTO[],
): AdminCategoriesAction => ({
  type: ADMIN_CATEGORIES_FETCH_SUCCESS,
  payload: items,
});
export const fetchCategoriesError = (msg: string): AdminCategoriesAction => ({
  type: ADMIN_CATEGORIES_FETCH_ERROR,
  payload: msg,
});
export const openCategoryCreate = (): AdminCategoriesAction => ({
  type: ADMIN_CATEGORIES_OPEN_CREATE,
});
export const openCategoryEdit = (
  category: CategoryDTO,
): AdminCategoriesAction => ({
  type: ADMIN_CATEGORIES_OPEN_EDIT,
  payload: category,
});
export const closeCategoryModal = (): AdminCategoriesAction => ({
  type: ADMIN_CATEGORIES_CLOSE_MODAL,
});
export const submitCategoryStart = (): AdminCategoriesAction => ({
  type: ADMIN_CATEGORIES_SUBMIT_START,
});
export const submitCategorySuccess = (
  category: CategoryDTO,
): AdminCategoriesAction => ({
  type: ADMIN_CATEGORIES_SUBMIT_SUCCESS,
  payload: category,
});
export const submitCategoryError = (msg: string): AdminCategoriesAction => ({
  type: ADMIN_CATEGORIES_SUBMIT_ERROR,
  payload: msg,
});
export const deleteCategoryStart = (id: number): AdminCategoriesAction => ({
  type: ADMIN_CATEGORIES_DELETE_START,
  payload: id,
});
export const deleteCategorySuccess = (id: number): AdminCategoriesAction => ({
  type: ADMIN_CATEGORIES_DELETE_SUCCESS,
  payload: id,
});
export const deleteCategoryError = (msg: string): AdminCategoriesAction => ({
  type: ADMIN_CATEGORIES_DELETE_ERROR,
  payload: msg,
});
export const openDeleteConfirm = (
  category: CategoryDTO,
): AdminCategoriesAction => ({
  type: ADMIN_CATEGORIES_OPEN_DELETE_CONFIRM,
  payload: category,
});
export const closeDeleteConfirm = (): AdminCategoriesAction => ({
  type: ADMIN_CATEGORIES_CLOSE_DELETE_CONFIRM,
});

// Thunks
export const loadCategoriesThunk = () => async (dispatch: any) => {
  dispatch(fetchCategoriesStart());
  try {
    const data = (await request('/api/categories')) as CategoryDTO[];
    dispatch(fetchCategoriesSuccess(data || []));
  } catch (e: any) {
    dispatch(fetchCategoriesError(e?.message || 'Błąd pobierania kategorii'));
  }
};

export interface SaveCategoryValues {
  name: string;
  color: string;
}

export const saveCategoryThunk =
  (values: SaveCategoryValues, id?: number) =>
  async (dispatch: any, getState: () => RootState) => {
    dispatch(submitCategoryStart());
    try {
      const editing = id
        ? (getState() as RootState).adminCategories.items.find(
            (c) => c.id === id,
          )
        : undefined;
      const categoryId = id ?? Date.now();
      const body: any = {};
      if (!editing) {
        body.name = values.name;
        body.color = values.color;
      } else {
        if (values.name && values.name !== editing.name) {
          body.name = values.name;
        }
        if (values.color && values.color !== editing.color) {
          body.color = values.color;
        }
      }
      if (Object.keys(body).length === 0) {
        dispatch(submitCategoryError('Brak zmian do zapisania'));
        return;
      }
      const saved = (await request(`/api/categories/${categoryId}`, {
        method: 'PUT',
        body,
      })) as CategoryDTO;
      dispatch(submitCategorySuccess(saved));
    } catch (e: any) {
      const rawMsg = String(e?.message || 'Błąd zapisu kategorii');
      const isNameExists = rawMsg.includes('409');
      dispatch(
        submitCategoryError(
          isNameExists ? 'Kategoria o tej nazwie już istnieje' : rawMsg,
        ),
      );
    }
  };

export const deleteCategoryThunk = (id: number) => async (dispatch: any) => {
  dispatch(deleteCategoryStart(id));
  try {
    await request(`/api/categories/${id}`, { method: 'DELETE' });
    dispatch(deleteCategorySuccess(id));
  } catch (e: any) {
    dispatch(
      deleteCategoryError(e?.message || 'Błąd podczas usuwania kategorii'),
    );
  }
};

// Selectors
export const selectAdminCategoriesItems = (state: RootState) =>
  state.adminCategories.items;
export const selectAdminCategoriesLoading = (state: RootState) =>
  state.adminCategories.loading;
export const selectAdminCategoriesError = (state: RootState) =>
  state.adminCategories.error;
export const selectAdminCategoriesFormOpen = (state: RootState) =>
  state.adminCategories.formOpen;
export const selectAdminCategoriesFormMode = (state: RootState) =>
  state.adminCategories.formMode;
export const selectAdminCategoriesEditing = (state: RootState) =>
  state.adminCategories.editingCategory;
export const selectAdminCategoriesSubmitting = (state: RootState) =>
  state.adminCategories.submitting;
export const selectAdminCategoriesFeedback = (state: RootState) =>
  state.adminCategories.feedback;
export const selectAdminCategoriesDeletingId = (state: RootState) =>
  state.adminCategories.deletingId;
export const selectAdminCategoriesDeleteConfirmCategory = (state: RootState) =>
  state.adminCategories.deleteConfirmCategory;
